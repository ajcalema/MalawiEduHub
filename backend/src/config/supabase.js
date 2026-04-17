const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const bucketName = process.env.SUPABASE_BUCKET || 'documents';

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase credentials not configured. File uploads will fail.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

module.exports = {
  supabase,
  bucketName,
  uploadFile,
  downloadFile,
  deleteFile,
  getPublicUrl,
};
