/**
 * Admin cleanup route for ghost documents
 */

const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { query } = require('../config/db');
const { supabase, bucketName } = require('../config/supabase');

// GET /api/cleanup/ghost-documents - Preview ghost documents (dry run)
router.get('/ghost-documents', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows: documents } = await query(
      `SELECT id, title, file_url, file_name_original, status, created_at 
       FROM documents 
       ORDER BY created_at DESC`
    );

    const ghosts = [];
    const valid = [];

    for (const doc of documents) {
      try {
        // Check if file exists in Supabase Storage
        const { data, error } = await supabase
          .storage
          .from(bucketName)
          .list(doc.file_url.split('/').slice(0, -1).join('/') || '', {
            search: doc.file_url.split('/').pop()
          });

        if (error || !data || data.length === 0) {
          ghosts.push({
            id: doc.id,
            title: doc.title,
            file_url: doc.file_url,
            created_at: doc.created_at
          });
        } else {
          valid.push({
            id: doc.id,
            title: doc.title
          });
        }
      } catch (err) {
        ghosts.push({
          id: doc.id,
          title: doc.title,
          error: err.message
        });
      }
    }

    res.json({
      total: documents.length,
      ghost_count: ghosts.length,
      valid_count: valid.length,
      ghosts: ghosts.slice(0, 50), // Limit to first 50
      valid: valid.slice(0, 10) // Sample of valid
    });
  } catch (err) {
    console.error('Ghost document check failed:', err);
    res.status(500).json({ error: 'Check failed', details: err.message });
  }
});

// DELETE /api/cleanup/ghost-documents - Delete ghost documents
router.delete('/ghost-documents', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows: documents } = await query(
      `SELECT id, title, file_url, file_name_original, status, created_at 
       FROM documents 
       ORDER BY created_at DESC`
    );

    let deleted = 0;
    let kept = 0;
    let errors = 0;
    const deletedDocs = [];

    for (const doc of documents) {
      try {
        // Check if file exists in Supabase Storage
        const { data, error } = await supabase
          .storage
          .from(bucketName)
          .list(doc.file_url.split('/').slice(0, -1).join('/') || '', {
            search: doc.file_url.split('/').pop()
          });

        if (error || !data || data.length === 0) {
          // File doesn't exist in storage - delete from DB
          
          // Delete related records first (foreign key constraints)
          await query('DELETE FROM duplicate_log WHERE matched_document_id = $1', [doc.id]);
          await query('DELETE FROM payments WHERE document_id = $1', [doc.id]);
          await query('DELETE FROM downloads WHERE document_id = $1', [doc.id]);
          await query('DELETE FROM document_views WHERE document_id = $1', [doc.id]);
          
          // Delete the document
          await query('DELETE FROM documents WHERE id = $1', [doc.id]);
          
          deletedDocs.push({ id: doc.id, title: doc.title });
          deleted++;
        } else {
          kept++;
        }
      } catch (err) {
        console.error(`Error deleting "${doc.title}":`, err.message);
        errors++;
      }
    }

    res.json({
      success: true,
      total: documents.length,
      deleted: deleted,
      kept: kept,
      errors: errors,
      deleted_documents: deletedDocs
    });
  } catch (err) {
    console.error('Ghost document cleanup failed:', err);
    res.status(500).json({ error: 'Cleanup failed', details: err.message });
  }
});

module.exports = router;
