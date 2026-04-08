const { S3Client } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET;

// Generate a signed download URL that expires in 5 minutes
const getSignedDownloadUrl = async (fileKey) => {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: fileKey });
  return getSignedUrl(s3, command, { expiresIn: 300 }); // 300s = 5 min
};

// Delete a file from S3
const deleteFile = async (fileKey) => {
  const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: fileKey });
  return s3.send(command);
};

module.exports = { s3, BUCKET, getSignedDownloadUrl, deleteFile };
