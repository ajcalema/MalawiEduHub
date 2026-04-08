/**
 * MalawiEduHub — Duplicate Detection Service
 *
 * Runs 4 detection layers in sequence. Stops and rejects at the first positive.
 *
 * Layer 1 — SHA-256 file hash (exact byte match)
 * Layer 2 — Fuzzy metadata match (title + level + subject + year)
 * Layer 3 — Content cosine similarity (TF-IDF on extracted text)
 * Layer 4 — Image perceptual hash (first page of scanned PDFs)
 */

const crypto  = require('crypto');
const pdfParse = require('pdf-parse');
const mammoth  = require('mammoth');
const { query } = require('../config/db');
require('dotenv').config();

const REJECT_THRESHOLD = parseFloat(process.env.DUP_CONTENT_REJECT_THRESHOLD || '0.90');
const FLAG_THRESHOLD   = parseFloat(process.env.DUP_CONTENT_FLAG_THRESHOLD   || '0.75');

// ─────────────────────────────────────────────
// LAYER 1 — SHA-256 file hash
// ─────────────────────────────────────────────
const computeFileHash = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

const checkHashDuplicate = async (fileHash) => {
  const result = await query(
    `SELECT id, title, uploader_id, created_at
     FROM documents WHERE file_hash = $1 LIMIT 1`,
    [fileHash]
  );
  return result.rows[0] || null;
};

// ─────────────────────────────────────────────
// LAYER 2 — Fuzzy metadata match
// Uses PostgreSQL pg_trgm for fuzzy title matching
// ─────────────────────────────────────────────
const checkMetadataDuplicate = async ({ title, level, subjectId, year }) => {
  const result = await query(
    `SELECT id, title,
            similarity(LOWER(title), LOWER($1)) AS title_sim
     FROM documents
     WHERE status IN ('approved', 'pending', 'flagged')
       AND level      = $2
       AND subject_id = $3
       AND year       = $4
       AND similarity(LOWER(title), LOWER($1)) > 0.75
     ORDER BY title_sim DESC
     LIMIT 1`,
    [title, level, subjectId, year]
  );
  if (!result.rows[0]) return null;
  return {
    document: result.rows[0],
    score: Math.round(result.rows[0].title_sim * 100),
  };
};

// ─────────────────────────────────────────────
// LAYER 3 — Content cosine similarity (TF-IDF)
// ─────────────────────────────────────────────

// Extract text from PDF or DOCX buffer
const extractText = async (buffer, fileType) => {
  try {
    if (fileType === 'pdf') {
      const data = await pdfParse(buffer);
      return data.text || '';
    }
    if (fileType === 'docx') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    }
    return '';
  } catch {
    return '';
  }
};

// Build a simple term-frequency map from text
const buildTermFrequency = (text) => {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);

  const tf = {};
  for (const word of words) {
    tf[word] = (tf[word] || 0) + 1;
  }
  return tf;
};

// Cosine similarity between two TF maps
const cosineSimilarity = (vecA, vecB) => {
  const keysA = Object.keys(vecA);
  if (!keysA.length) return 0;

  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (const k of keysA) {
    dotProduct += (vecA[k] || 0) * (vecB[k] || 0);
    magA += (vecA[k] || 0) ** 2;
  }
  for (const k of Object.keys(vecB)) {
    magB += (vecB[k] || 0) ** 2;
  }

  const denominator = Math.sqrt(magA) * Math.sqrt(magB);
  return denominator === 0 ? 0 : dotProduct / denominator;
};

// Compare uploaded text against stored content vectors
const checkContentDuplicate = async (extractedText) => {
  if (!extractedText || extractedText.trim().length < 100) return null;

  const uploadedVec = buildTermFrequency(extractedText);

  // Fetch all approved/pending docs that have a content vector stored
  const result = await query(
    `SELECT id, title, content_vector
     FROM documents
     WHERE content_vector IS NOT NULL
       AND status IN ('approved', 'pending', 'flagged')
     LIMIT 2000`
  );

  let bestMatch = null;
  let bestScore = 0;

  for (const doc of result.rows) {
    try {
      const storedVec = typeof doc.content_vector === 'string'
        ? JSON.parse(doc.content_vector)
        : doc.content_vector;

      const sim = cosineSimilarity(uploadedVec, storedVec);
      if (sim > bestScore) {
        bestScore = sim;
        bestMatch = doc;
      }
    } catch {
      continue;
    }
  }

  if (bestScore >= REJECT_THRESHOLD) {
    return { document: bestMatch, score: Math.round(bestScore * 100), action: 'reject' };
  }
  if (bestScore >= FLAG_THRESHOLD) {
    return { document: bestMatch, score: Math.round(bestScore * 100), action: 'flag' };
  }
  return null;
};

// ─────────────────────────────────────────────
// LAYER 4 — Perceptual image hash (pHash)
// Lightweight version using pixel sampling
// For production replace with 'sharp' library
// ─────────────────────────────────────────────
const checkImageDuplicate = async (pHash) => {
  if (!pHash) return null;

  const result = await query(
    `SELECT id, title, image_phash FROM documents
     WHERE image_phash IS NOT NULL
       AND status IN ('approved', 'pending', 'flagged')`
  );

  for (const doc of result.rows) {
    const distance = hammingDistance(pHash, doc.image_phash);
    if (distance < 10) {
      return { document: doc, score: Math.round((1 - distance / 64) * 100) };
    }
  }
  return null;
};

// Hamming distance between two hex hash strings
const hammingDistance = (hashA, hashB) => {
  if (!hashA || !hashB || hashA.length !== hashB.length) return 999;
  let dist = 0;
  for (let i = 0; i < hashA.length; i++) {
    const a = parseInt(hashA[i], 16);
    const b = parseInt(hashB[i], 16);
    const xor = a ^ b;
    dist += xor.toString(2).split('').filter(c => c === '1').length;
  }
  return dist;
};

// ─────────────────────────────────────────────
// LOG a duplicate attempt to the database
// ─────────────────────────────────────────────
const logDuplicateAttempt = async ({
  uploaderId,
  attemptedFileName,
  attemptedFileHash,
  matchedDocumentId,
  detectionLayer,
  similarityScore,
  isAutoRejected,
}) => {
  await query(
    `INSERT INTO duplicate_log
       (uploader_id, attempted_file_name, attempted_file_hash,
        matched_document_id, detection_layer, similarity_score, is_auto_rejected)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      uploaderId,
      attemptedFileName,
      attemptedFileHash,
      matchedDocumentId,
      detectionLayer,
      similarityScore,
      isAutoRejected,
    ]
  );
};

// ─────────────────────────────────────────────
// MAIN — run all 4 layers in sequence
// Returns { passed: true } or { passed: false, reason, layer, matchedDoc, score, action }
// ─────────────────────────────────────────────
const runDuplicateDetection = async ({
  fileBuffer,
  fileType,
  fileHash,
  fileName,
  uploaderId,
  metadata,   // { title, level, subjectId, year }
  pHash,
}) => {

  // Layer 1 — exact file hash
  const hashMatch = await checkHashDuplicate(fileHash);
  if (hashMatch) {
    await logDuplicateAttempt({
      uploaderId,
      attemptedFileName: fileName,
      attemptedFileHash: fileHash,
      matchedDocumentId: hashMatch.id,
      detectionLayer: 'hash',
      similarityScore: 100,
      isAutoRejected: true,
    });
    return {
      passed: false,
      action: 'reject',
      layer: 'hash',
      score: 100,
      matchedDoc: hashMatch,
      reason: 'Exact duplicate — this file already exists in the library.',
    };
  }

  // Layer 2 — fuzzy metadata
  const metaMatch = await checkMetadataDuplicate(metadata);
  if (metaMatch) {
    await logDuplicateAttempt({
      uploaderId,
      attemptedFileName: fileName,
      attemptedFileHash: fileHash,
      matchedDocumentId: metaMatch.document.id,
      detectionLayer: 'metadata',
      similarityScore: metaMatch.score,
      isAutoRejected: true,
    });
    return {
      passed: false,
      action: 'reject',
      layer: 'metadata',
      score: metaMatch.score,
      matchedDoc: metaMatch.document,
      reason: `A document with very similar metadata already exists (${metaMatch.score}% match).`,
    };
  }

  // Layer 3 — content similarity
  const extractedText = await extractText(fileBuffer, fileType);
  const contentVec    = buildTermFrequency(extractedText);
  const contentMatch  = await checkContentDuplicate(extractedText);

  if (contentMatch) {
    const isReject = contentMatch.action === 'reject';
    await logDuplicateAttempt({
      uploaderId,
      attemptedFileName: fileName,
      attemptedFileHash: fileHash,
      matchedDocumentId: contentMatch.document.id,
      detectionLayer: 'content',
      similarityScore: contentMatch.score,
      isAutoRejected: isReject,
    });
    return {
      passed: false,
      action: contentMatch.action,  // 'reject' or 'flag'
      layer: 'content',
      score: contentMatch.score,
      matchedDoc: contentMatch.document,
      reason: isReject
        ? `Document content is ${contentMatch.score}% similar to an existing document.`
        : `Document content flagged for admin review (${contentMatch.score}% similarity).`,
    };
  }

  // Layer 4 — perceptual image hash
  if (pHash) {
    const imageMatch = await checkImageDuplicate(pHash);
    if (imageMatch) {
      await logDuplicateAttempt({
        uploaderId,
        attemptedFileName: fileName,
        attemptedFileHash: fileHash,
        matchedDocumentId: imageMatch.document.id,
        detectionLayer: 'image',
        similarityScore: imageMatch.score,
        isAutoRejected: false,
      });
      return {
        passed: false,
        action: 'flag',
        layer: 'image',
        score: imageMatch.score,
        matchedDoc: imageMatch.document,
        reason: `Document visually matches an existing file (${imageMatch.score}% image similarity). Flagged for review.`,
      };
    }
  }

  // All layers passed
  return { passed: true, extractedText, contentVec };
};

module.exports = {
  runDuplicateDetection,
  computeFileHash,
  extractText,
  buildTermFrequency,
};
