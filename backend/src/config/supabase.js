const { createClient } = require('@supabase/supabase-js');
const fetch = require('cross-fetch');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const bucketName = process.env.SUPABASE_BUCKET || 'documents';

console.log('🔧 Supabase Config:', {
  url: supabaseUrl ? '✅ Set' : '❌ Missing',
  key: supabaseKey ? '✅ Set' : '❌ Missing',
  bucket: bucketName
});

let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: fetch,
    },
  });
  console.log('✅ Supabase Storage configured for bucket:', bucketName);
} else {
  console.warn('⚠️  Supabase credentials not configured. File uploads will fail.');
}

/**
 * Upload a file to Supabase Storage
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} fileName - The file name/path
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
const uploadFile = async (fileBuffer, fileName, contentType) => {
  if (!supabase) {
    throw new Error('Supabase not configured. Please add SUPABASE_URL and SUPABASE_ANON_KEY to your .env file.');
  }
  
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
  if (!supabase) {
    throw new Error('Supabase not configured.');
  }
  
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
  if (!supabase) {
    throw new Error('Supabase not configured.');
  }
  
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
  if (!supabase) {
    return null;
  }
  
  const { data: { publicUrl } } = supabase
    .storage
    .from(bucketName)
    .getPublicUrl(fileName);

  return publicUrl;
};

module.exports = {
  supabase,
  bucketName,
  uploadFile,
  downloadFile,
  deleteFile,
  getPublicUrl,
};
