/**
 * Cleanup script to remove ghost documents
 * Ghost documents = documents in DB but files missing from Supabase Storage
 */

const { query } = require('../src/config/db');
const { supabase, bucketName } = require('../src/config/supabase');

const cleanupGhostDocuments = async () => {
  console.log('🔍 Starting ghost document cleanup...\n');

  try {
    // Get all documents from database
    const { rows: documents } = await query(
      `SELECT id, title, file_url, file_name_original, status, created_at 
       FROM documents 
       ORDER BY created_at DESC`
    );

    console.log(`📊 Found ${documents.length} documents in database\n`);

    let deleted = 0;
    let kept = 0;
    let errors = 0;

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
          console.log(`🗑️  Deleting ghost: "${doc.title}" (${doc.id})`);
          
          // Delete related records first (foreign key constraints)
          await query('DELETE FROM duplicate_log WHERE matched_document_id = $1', [doc.id]);
          await query('DELETE FROM payments WHERE document_id = $1', [doc.id]);
          await query('DELETE FROM downloads WHERE document_id = $1', [doc.id]);
          await query('DELETE FROM document_views WHERE document_id = $1', [doc.id]);
          
          // Delete the document
          await query('DELETE FROM documents WHERE id = $1', [doc.id]);
          
          deleted++;
        } else {
          console.log(`✅ Keeping: "${doc.title}" (${doc.id})`);
          kept++;
        }
      } catch (err) {
        console.error(`❌ Error checking "${doc.title}":`, err.message);
        errors++;
      }
    }

    console.log('\n📈 Cleanup Summary:');
    console.log(`   Deleted: ${deleted} ghost documents`);
    console.log(`   Kept: ${kept} valid documents`);
    console.log(`   Errors: ${errors}`);
    console.log('\n✨ Cleanup complete!');

  } catch (err) {
    console.error('❌ Cleanup failed:', err.message);
    process.exit(1);
  }

  process.exit(0);
};

// Run cleanup
cleanupGhostDocuments();

