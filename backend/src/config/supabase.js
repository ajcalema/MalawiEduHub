const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const bucketName = process.env.SUPABASE_BUCKET || 'documents';

console.log('🔧 Supabase Config:', {
  url: supabaseUrl ? '✅ Set' : '❌ Missing',
  key: supabaseKey ? '✅ Set' : '❌ Missing',
  bucket: bucketName
});

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase credentials not configured. File uploads will fail.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

/**
 * Upload a file to Supabase Storage
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} fileName - The file name/path
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
const uploadFile = async (fileBuffer, fileName, contentType) => {
  const { data, error } = await supabase
    .storage
    .from(bucketName)
    .upload(fileName, fileBuffer, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase
    .storage
    .from(bucketName)
    .getPublicUrl(fileName);

  return publicUrl;
};

/**
 * Download a file from Supabase Storage
 * @param {string} fileName - The file name/path
 * @returns {Promise<Buffer>} - The file buffer
 */
const downloadFile = async (fileName) => {
  const { data, error } = await supabase
    .storage
    .from(bucketName)
    .download(fileName);

  if (error) {
    throw new Error(`Download failed: ${error.message}`);
  }

  return Buffer.from(await data.arrayBuffer());
};

/**
 * Delete a file from Supabase Storage
 * @param {string} fileName - The file name/path
 */
const deleteFile = async (fileName) => {
  const { error } = await supabase
    .storage
    .from(bucketName)
    .remove([fileName]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
};

/**
 * Get public URL for a file
 * @param {string} fileName - The file name/path
 * @returns {string} - The public URL
 */
const getPublicUrl = (fileName) => {
  const { data: { publicUrl } } = supabase
    .storage
    .from(bucketName)
    .getPublicUrl(fileName);

  return publicUrl;
};

// Test connection on startup
const testConnection = async () => {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
    } else {
      console.log('✅ Supabase connected. Buckets:', data.map(b => b.name).join(', '));
    }
  } catch (err) {
    console.error('❌ Supabase connection error:', err.message);
  }
};

// Run test if credentials are configured
if (supabaseUrl && supabaseKey) {
  testConnection();
}

module.exports = {
  supabase,
  bucketName,
  uploadFile,
  downloadFile,
  deleteFile,
  getPublicUrl,
};
