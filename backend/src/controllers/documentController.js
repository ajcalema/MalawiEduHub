const { query, getClient } = require('../config/db');
const { getSignedDownloadUrl } = require('../config/storage');
const { runDuplicateDetection, computeFileHash } = require('../services/duplicateDetection');
const { resolveOrCreateSubjectId } = require('../services/subjectResolve');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const ALLOWED_DOC_STATUS = new Set(['pending', 'approved', 'rejected', 'flagged', 'unpublished']);

// ─── UPLOAD DOCUMENT ────────────────────────
const uploadDocument = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { title, subject_id, subject_name, level, doc_type, year, description } = req.body;
    const file = req.file;

    if (!file) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    let resolvedSubjectId;
    const nameTrim = subject_name != null ? String(subject_name).trim() : '';
    const idTrim = subject_id != null ? String(subject_id).trim() : '';

    if (nameTrim) {
      const resolved = await resolveOrCreateSubjectId(client, nameTrim);
      if (resolved.error) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: resolved.error });
      }
      resolvedSubjectId = resolved.subjectId;
    } else {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Enter a subject name.' });
    }

    const fileBuffer = file.buffer;
    const fileType   = file.originalname.split('.').pop().toLowerCase();
    const fileHash   = computeFileHash(fileBuffer);

    // Run all 4 duplicate detection layers
    const dupResult = await runDuplicateDetection({
      fileBuffer,
      fileType,
      fileHash,
      fileName: file.originalname,
      uploaderId: req.user.id,
      metadata: {
        title,
        level,
        subjectId: resolvedSubjectId,
        year: parseInt(year),
      },
      pHash: null, // pHash generation would go here with sharp library
    });

    // Duplicate found — reject or flag
    if (!dupResult.passed) {
      await client.query('ROLLBACK');

      if (dupResult.action === 'reject') {
        return res.status(409).json({
          error: 'duplicate_detected',
          message: dupResult.reason,
          matched_document: {
            id:    dupResult.matchedDoc?.id,
            title: dupResult.matchedDoc?.title,
          },
          layer: dupResult.layer,
          similarity_score: dupResult.score,
        });
      }
      // action === 'flag' — continue upload but mark as flagged
    }

    // Build the S3 file key
    const fileKey = `documents/${req.user.id}/${uuidv4()}.${fileType}`;
    const localFilePath = path.join(__dirname, '..', '..', 'uploads', fileKey);

    // Ensure uploads directory exists
    fs.mkdirSync(path.dirname(localFilePath), { recursive: true });

    // Save file to local storage
    fs.writeFileSync(localFilePath, fileBuffer);

    // In production: upload buffer to S3
    // const uploadParams = { Bucket: BUCKET, Key: fileKey, Body: fileBuffer };
    // await s3.send(new PutObjectCommand(uploadParams));

    const autoApprove = dupResult.passed === true;
    const docStatus = dupResult.action === 'flag' ? 'flagged' : 'pending';

    // Get default price from settings
    const priceResult = await client.query(
      `SELECT value FROM system_settings WHERE key = 'price_per_download_default'`
    );
    const defaultPrice = parseFloat(priceResult.rows[0]?.value || '200');

    // Insert document record
    const docResult = await client.query(
      `INSERT INTO documents
         (title, description, subject_id, level, doc_type, year,
          uploader_id, file_url, file_name_original, file_size_bytes,
          file_type, file_hash, extracted_text, content_vector,
          status, price_mwk)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING id, title, status, created_at`,
      [
        title, description || null,
        resolvedSubjectId, level, doc_type,
        parseInt(year), req.user.id,
        fileKey, file.originalname,
        file.size, fileType, fileHash,
        dupResult.extractedText || null,
        dupResult.contentVec ? JSON.stringify(dupResult.contentVec) : null,
        docStatus, defaultPrice,
      ]
    );

    const doc = docResult.rows[0];

    if (autoApprove) {
      const approvedResult = await client.query(
        `UPDATE documents
         SET status = 'approved', reviewed_at = NOW(), reviewed_by = $1
         WHERE id = $2
         RETURNING id, title, status`,
        [req.user.id, doc.id]
      );

      if (approvedResult.rows[0]) {
        Object.assign(doc, approvedResult.rows[0]);
      }
    }

    await client.query('COMMIT');

    // Fetch uploader's current upload count for progress feedback
    const userResult = await query(
      `SELECT approved_upload_count FROM users WHERE id = $1`, [req.user.id]
    );
    const settingResult = await query(
      `SELECT value FROM system_settings WHERE key = 'upload_pass_min_threshold'`
    );
    const passHoursResult = await query(
      `SELECT value FROM system_settings WHERE key = 'upload_pass_duration_hours'`
    );
    const threshold  = parseInt(settingResult.rows[0]?.value || '5');
    const passHours  = parseInt(passHoursResult.rows[0]?.value || '24');
    const count      = userResult.rows[0]?.approved_upload_count || 0;
    const subscriptionResult = await query(
      `SELECT id, plan, is_upload_pass, starts_at, expires_at
       FROM subscriptions
       WHERE user_id = $1 AND status = 'active' AND expires_at > NOW()
       ORDER BY expires_at DESC LIMIT 1`,
      [req.user.id]
    );
    const activeSubscription = subscriptionResult.rows[0] || null;

    // Grant upload pass if this upload would reach the threshold (assuming approval)
    let grantedPass = false;
    if (count + 1 >= threshold) {
      const existingPassResult = await query(
        `SELECT id FROM subscriptions
         WHERE user_id = $1 AND is_upload_pass = TRUE AND status = 'active' AND expires_at > NOW()
         LIMIT 1`,
        [req.user.id]
      );
      if (existingPassResult.rows.length === 0) {
        await query(
          `INSERT INTO subscriptions (user_id, plan, status, starts_at, expires_at, is_upload_pass)
           VALUES ($1, 'upload_pass', 'active', NOW(), NOW() + ($2 || ' hours')::INTERVAL, TRUE)`,
          [req.user.id, passHours]
        );
        grantedPass = true;
        // Refresh activeSubscription
        const newSubResult = await query(
          `SELECT id, plan, is_upload_pass, starts_at, expires_at
           FROM subscriptions
           WHERE user_id = $1 AND status = 'active' AND expires_at > NOW()
           ORDER BY expires_at DESC LIMIT 1`,
          [req.user.id]
        );
        activeSubscription = newSubResult.rows[0] || null;
      }
    }

    res.status(201).json({
      message: docStatus === 'flagged'
        ? 'Document submitted but flagged for admin review due to content similarity.'
        : doc.status === 'approved'
          ? 'Document submitted and approved automatically.'
          : 'Document submitted successfully. Pending admin review.',
      document: { id: doc.id, title: doc.title, status: doc.status },
      active_subscription: activeSubscription,
      upload_progress: {
        approved_count: grantedPass ? threshold : count,
        threshold,
        remaining: grantedPass ? 0 : Math.max(0, threshold - count),
        pct: grantedPass ? 100 : Math.min(100, Math.round((count / threshold) * 100)),
      },
      granted_upload_pass: grantedPass,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('uploadDocument error:', err);

    if (err.code === '23505' && err.constraint && err.constraint.includes('file_hash')) {
      return res.status(409).json({
        error: 'duplicate_detected',
        message: 'Exact duplicate file. This document has already been uploaded.',
      });
    }

    res.status(500).json({ error: 'Upload failed.' });
  } finally {
    client.release();
  }
};

// ─── ADMIN UPLOAD DOCUMENT ──────────────────
const uploadDocumentAdmin = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { title, subject_id, subject_name, level, doc_type, year, description, price_mwk } = req.body;
    const file = req.file;

    if (!file) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    let resolvedSubjectId;
    const nameTrim = subject_name != null ? String(subject_name).trim() : '';
    const idTrim = subject_id != null ? String(subject_id).trim() : '';

    if (nameTrim) {
      const resolved = await resolveOrCreateSubjectId(client, nameTrim);
      if (resolved.error) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: resolved.error });
      }
      resolvedSubjectId = resolved.subjectId;
    } else {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Enter a subject name.' });
    }

    const fileBuffer = file.buffer;
    const fileType   = file.originalname.split('.').pop().toLowerCase();
    const fileHash   = computeFileHash(fileBuffer);

    // Build the S3 file key
    const fileKey = `documents/${req.user.id}/${uuidv4()}.${fileType}`;
    const localFilePath = path.join(__dirname, '..', '..', 'uploads', fileKey);

    // Ensure uploads directory exists
    fs.mkdirSync(path.dirname(localFilePath), { recursive: true });

    // Save file to local storage
    fs.writeFileSync(localFilePath, fileBuffer);

    // In production: upload buffer to S3
    // const uploadParams = { Bucket: BUCKET, Key: fileKey, Body: fileBuffer };
    // await s3.send(new PutObjectCommand(uploadParams));

    // Get default price from settings or use provided price
    let finalPrice = parseFloat(price_mwk);
    if (isNaN(finalPrice)) {
      const priceResult = await client.query(
        `SELECT value FROM system_settings WHERE key = 'price_per_download_default'`
      );
      finalPrice = parseFloat(priceResult.rows[0]?.value || '200');
    }

    // Insert document record - auto-approved for admins
    const docResult = await client.query(
      `INSERT INTO documents
         (title, description, subject_id, level, doc_type, year,
          uploader_id, file_url, file_name_original, file_size_bytes,
          file_type, file_hash, extracted_text, content_vector,
          status, price_mwk, reviewed_at, reviewed_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING id, title, status, created_at`,
      [
        title, description || null,
        resolvedSubjectId, level, doc_type,
        parseInt(year), req.user.id,
        fileKey, file.originalname,
        file.size, fileType, fileHash,
        null, // extracted_text - skip for admin uploads
        null, // content_vector - skip for admin uploads
        'approved', finalPrice,
        new Date(), req.user.id, // reviewed_at, reviewed_by
      ]
    );

    const doc = docResult.rows[0];

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Document uploaded and approved successfully.',
      document: { id: doc.id, title: doc.title, status: doc.status },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('uploadDocumentAdmin error:', err);

    if (err.code === '23505' && err.constraint && err.constraint.includes('file_hash')) {
      return res.status(409).json({
        error: 'duplicate_detected',
        message: 'Exact duplicate file. This document has already been uploaded.',
      });
    }

    res.status(500).json({ error: 'Upload failed.' });
  } finally {
    client.release();
  }
};

// ─── BROWSE DOCUMENTS ───────────────────────
const browseDocuments = async (req, res) => {
  try {
    const {
      subject, level, doc_type, year,
      search, sort = 'newest',
      page = 1, limit = 20,
      scope, uploader,
    } = req.query;

    const wantsAdminList = scope === 'all' && req.user?.role === 'admin';

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conditions = [];
    if (!wantsAdminList) {
      conditions.push(`d.status = 'approved'`);
    }

    if (uploader === 'me' && req.user) {
      params.push(req.user.id);
      conditions.push(`d.uploader_id = $${params.length}`);
    }

    if (subject) {
      params.push(subject);
      conditions.push(`s.slug = $${params.length}`);
    }
    if (level) {
      params.push(level);
      conditions.push(`d.level = $${params.length}`);
    }
    if (doc_type) {
      params.push(doc_type);
      conditions.push(`d.doc_type = $${params.length}`);
    }
    if (year) {
      params.push(parseInt(year));
      conditions.push(`d.year = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(d.title ILIKE $${params.length} OR d.description ILIKE $${params.length})`);
    }

    const whereClause = conditions.length ? conditions.join(' AND ') : 'TRUE';

    const orderMap = wantsAdminList
      ? {
          newest:   'COALESCE(d.reviewed_at, d.created_at) DESC NULLS LAST',
          popular:  'd.download_count DESC',
          relevant: 'd.download_count DESC, d.view_count DESC',
        }
      : {
          newest:   'd.reviewed_at DESC',
          popular:  'd.download_count DESC',
          relevant: 'd.download_count DESC, d.view_count DESC',
        };
    const orderBy = orderMap[sort] || (wantsAdminList ? 'COALESCE(d.reviewed_at, d.created_at) DESC NULLS LAST' : 'd.reviewed_at DESC');

    params.push(parseInt(limit), offset);

    const [docsResult, countResult] = await Promise.all([
      query(
        `SELECT d.id, d.title, d.level, d.doc_type, d.year, d.status,
                d.price_mwk, d.is_free, d.download_count, d.view_count,
                d.reviewed_at AS published_at,
                s.name AS subject_name, s.slug AS subject_slug, s.icon_emoji,
                u.full_name AS uploader_name
         FROM documents d
         JOIN subjects s ON d.subject_id = s.id
         JOIN users u    ON d.uploader_id = u.id
         WHERE ${whereClause}
         ORDER BY ${orderBy}
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      ),
      query(
        `SELECT COUNT(*) FROM documents d
         JOIN subjects s ON d.subject_id = s.id
         WHERE ${whereClause}`,
        params.slice(0, -2)
      ),
    ]);

    res.json({
      documents: docsResult.rows,
      pagination: {
        total:       parseInt(countResult.rows[0].count),
        page:        parseInt(page),
        limit:       parseInt(limit),
        total_pages: Math.ceil(countResult.rows[0].count / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('browseDocuments error:', err);
    res.status(500).json({ error: 'Failed to fetch documents.' });
  }
};

// ─── GET SINGLE DOCUMENT ────────────────────
const getDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT d.id, d.title, d.description, d.level, d.doc_type, d.year,
              d.price_mwk, d.is_free, d.download_count, d.view_count,
              d.reviewed_at AS published_at,
              s.name AS subject_name, s.slug AS subject_slug,
              u.full_name AS uploader_name
       FROM documents d
       JOIN subjects s ON d.subject_id = s.id
       JOIN users u    ON d.uploader_id = u.id
       WHERE d.id = $1 AND d.status = 'approved'`,
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Document not found.' });

    // Record view
    await query(
      `INSERT INTO document_views (document_id, user_id, ip_address)
       VALUES ($1, $2, $3)`,
      [id, req.user?.id || null, req.ip]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch document.' });
  }
};

// ─── DOWNLOAD DOCUMENT ──────────────────────
// Requires active subscription OR a completed pay-per-download payment
const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.query.token

    const docResult = await query(
      `SELECT id, title, file_url, file_name_original, is_free, price_mwk FROM documents
       WHERE id = $1 AND status = 'approved'`,
      [id]
    );
    const doc = docResult.rows[0];
    if (!doc) return res.status(404).json({ error: 'Document not found.' });

    // Check if file exists locally
    const localFilePath = path.join(__dirname, '..', '..', 'uploads', doc.file_url);
    if (!fs.existsSync(localFilePath)) {
      return res.status(404).json({ error: 'File not available for download.' });
    }

    const directDownload = Boolean(token);

    if (directDownload) {
      const downloadEntry = await query(
        `SELECT id, downloaded_at FROM downloads
         WHERE document_id = $1 AND signed_url_used = $2
         AND downloaded_at > NOW() - INTERVAL '1 hour'
         LIMIT 1`,
        [id, token]
      );

      if (!downloadEntry.rows[0]) {
        return res.status(403).json({ error: 'invalid_or_expired_download_link' });
      }

      const downloadName = path.basename(doc.file_name_original || localFilePath);
      return res.download(localFilePath, downloadName);
    }

    if (!req.user) {
      return res.status(401).json({ error: 'No token provided.' });
    }

    let hasAccess = false;
    let subscriptionId = null;
    let paymentId = null;

    // Check 1: free document
    if (doc.is_free) hasAccess = true;

    // Check 2: active subscription
    if (!hasAccess) {
      const sub = await query(
        `SELECT id FROM subscriptions
         WHERE user_id = $1 AND status = 'active' AND expires_at > NOW()
         LIMIT 1`,
        [req.user.id]
      );
      if (sub.rows[0]) {
        hasAccess = true;
        subscriptionId = sub.rows[0].id;
      }
    }

    // Check 3: paid for this specific document
    if (!hasAccess) {
      const paid = await query(
        `SELECT id FROM payments
         WHERE user_id = $1 AND document_id = $2 AND status = 'completed'
         LIMIT 1`,
        [req.user.id, id]
      );
      if (paid.rows[0]) {
        hasAccess = true;
        paymentId = paid.rows[0].id;
      }
    }

    if (!hasAccess) {
      return res.status(403).json({
        error: 'no_access',
        message: 'Purchase this document or subscribe to download.',
        price_mwk: doc.price_mwk,
      });
    }

    const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`;
    const downloadToken = uuidv4();
    const downloadUrl = `${baseUrl}/api/documents/${id}/download?token=${downloadToken}`;

    // Log the download request as a signed one-time access token
    await query(
      `INSERT INTO downloads
         (user_id, document_id, payment_id, subscription_id, ip_address, signed_url_used)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, id, paymentId, subscriptionId, req.ip, downloadToken]
    );

    res.json({ download_url: downloadUrl, expires_in_seconds: 3600 }); // 1 hour for local
  } catch (err) {
    console.error('downloadDocument error:', err);
    res.status(500).json({ error: 'Download failed.' });
  }
};

// ─── GET USER DOWNLOADS ─────────────────────
const getUserDownloads = async (req, res) => {
  try {
    const result = await query(
      `SELECT d.id, d.title, d.level, d.doc_type, d.year, d.subject_id,
              s.name AS subject_name, dl.downloaded_at
       FROM downloads dl
       JOIN documents d ON dl.document_id = d.id
       JOIN subjects s ON d.subject_id = s.id
       WHERE dl.user_id = $1
       ORDER BY dl.downloaded_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getUserDownloads error:', err);
    res.status(500).json({ error: 'Failed to fetch downloads.' });
  }
};

// ─── ADMIN: GET REVIEW QUEUE ─────────────────
const getAdminQueue = async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM v_admin_review_queue LIMIT 100`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch queue.' });
  }
};

// ─── ADMIN: APPROVE DOCUMENT ─────────────────
const approveDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE documents
       SET status = 'approved', reviewed_by = $1, reviewed_at = NOW()
       WHERE id = $2 AND status IN ('pending','flagged')
       RETURNING id, title, uploader_id`,
      [req.user.id, id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Document not found or already reviewed.' });

    // Log admin action
    await query(
      `INSERT INTO admin_log (admin_id, action, target_type, target_id)
       VALUES ($1, 'approve_document', 'document', $2)`,
      [req.user.id, id]
    );

    res.json({ message: 'Document approved.', document: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Approval failed.' });
  }
};

// ─── ADMIN: REJECT DOCUMENT ──────────────────
const rejectDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const result = await query(
      `UPDATE documents
       SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW(),
           rejection_reason = $2
       WHERE id = $3 AND status IN ('pending','flagged')
       RETURNING id, title`,
      [req.user.id, reason || null, id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Document not found.' });

    await query(
      `INSERT INTO admin_log (admin_id, action, target_type, target_id, note)
       VALUES ($1, 'reject_document', 'document', $2, $3)`,
      [req.user.id, id, reason || null]
    );

    res.json({ message: 'Document rejected.', document: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Rejection failed.' });
  }
};

// ─── ADMIN: DELETE DOCUMENT ──────────────────
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    // First, get the document to check status and file_url
    const docResult = await query(
      `SELECT id, title, status, file_url FROM documents WHERE id = $1`,
      [id]
    );
    const doc = docResult.rows[0];
    if (!doc) return res.status(404).json({ error: 'Document not found.' });

    // Only allow deletion of unpublished or rejected documents
    if (!['unpublished', 'rejected'].includes(doc.status)) {
      return res.status(400).json({ error: 'Can only delete unpublished or rejected documents.' });
    }

    // Delete the file from local storage
    const localFilePath = path.join(__dirname, '..', '..', 'uploads', doc.file_url);
    try {
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    } catch (fileErr) {
      console.error('File deletion failed:', fileErr);
      // Continue with database deletion even if file deletion fails
    }

    // Delete related records to avoid foreign key constraints
    await query('DELETE FROM duplicate_log WHERE matched_document_id = $1', [id]);
    await query('DELETE FROM payments WHERE document_id = $1', [id]);
    await query('DELETE FROM downloads WHERE document_id = $1', [id]);
    await query('DELETE FROM document_views WHERE document_id = $1', [id]);

    // Delete from database
    await query(`DELETE FROM documents WHERE id = $1`, [id]);

    // Log admin action
    try {
      await query(
        `INSERT INTO admin_log (admin_id, action, target_type, target_id)
         VALUES ($1, 'delete_document', 'document', $2)`,
        [req.user.id, id]
      );
    } catch (logErr) {
      console.error('Admin log failed:', logErr);
      // Continue even if logging fails
    }

    res.json({ message: 'Document deleted successfully.' });
  } catch (err) {
    console.error('deleteDocument error:', err);
    res.status(500).json({ error: 'Deletion failed.', details: err.message });
  }
};

const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const b = req.body || {};
    console.log('UPDATE REQUEST:', id, JSON.stringify(b, null, 2));

    const assignments = [];
    const values = [];
    let n = 0;
    const push = (fragment, val) => {
      n += 1;
      values.push(val);
      assignments.push(`${fragment} = $${n}`);
    };

    if (b.title !== undefined) {
      const t = String(b.title).trim();
      if (!t) return res.status(400).json({ error: 'Title cannot be empty.' });
      push('title', t);
    }
    if (b.description !== undefined) push('description', b.description);
    if (b.subject_id !== undefined && b.subject_id !== null && b.subject_id !== '') {
      const sid = parseInt(b.subject_id, 10);
      if (!Number.isNaN(sid)) {
        const check = await query('SELECT id FROM subjects WHERE id = $1', [sid]);
        if (check.rows.length === 0) {
          return res.status(400).json({ error: 'Subject not found.' });
        }
        push('subject_id', sid);
      }
    }
    if (b.level !== undefined) push('level', b.level);
    if (b.doc_type !== undefined) push('doc_type', b.doc_type);
    if (b.year !== undefined && b.year !== null && b.year !== '') {
      const y = parseInt(b.year, 10);
      if (!Number.isNaN(y)) push('year', y);
    }
    if (b.status !== undefined) {
      const st = String(b.status);
      if (!ALLOWED_DOC_STATUS.has(st)) {
        return res.status(400).json({ error: 'Invalid document status.' });
      }
      push('status', st);
    }
    if (b.price_mwk !== undefined && b.price_mwk !== null && b.price_mwk !== '') {
      const p = parseFloat(b.price_mwk);
      if (!Number.isNaN(p)) push('price_mwk', p);
    }
    if (b.is_free !== undefined) push('is_free', Boolean(b.is_free));

    if (['approved', 'rejected'].includes(b.status)) {
      assignments.push('reviewed_at = NOW()');
      push('reviewed_by', req.user.id);
    }

    if (assignments.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }

    n += 1;
    values.push(id);

    const result = await query(
      `UPDATE documents SET ${assignments.join(', ')}
       WHERE id = $${n}
       RETURNING id, title, status, price_mwk, is_free, level, year, doc_type`,
      values
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Document not found.' });

    await query(
      `INSERT INTO admin_log (admin_id, action, target_type, target_id)
       VALUES ($1, 'edit_document', 'document', $2)`,
      [req.user.id, id]
    );

    res.json({ message: 'Document updated.', document: result.rows[0] });
  } catch (err) {
    console.error('updateDocument error:', err);
    res.status(500).json({ error: 'Update failed.' });
  }
};

// ─── ADMIN: DUPLICATE LOG ────────────────────
const getDuplicateLog = async (req, res) => {
  try {
    const result = await query(
      `SELECT dl.*, u.full_name AS uploader_name, u.email AS uploader_email,
              md.title AS matched_doc_title, md.level AS matched_doc_level
       FROM duplicate_log dl
       JOIN users u ON dl.uploader_id = u.id
       LEFT JOIN documents md ON dl.matched_document_id = md.id
       ORDER BY dl.blocked_at DESC
       LIMIT 200`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getDuplicateLog error:', err);
    res.status(500).json({ error: 'Failed to fetch duplicate log.' });
  }
};

module.exports = {
  uploadDocument,
  uploadDocumentAdmin,
  browseDocuments,
  getDocument,
  downloadDocument,
  getUserDownloads,
  getAdminQueue,
  approveDocument,
  rejectDocument,
  updateDocument,
  getDuplicateLog,
  deleteDocument,
};
