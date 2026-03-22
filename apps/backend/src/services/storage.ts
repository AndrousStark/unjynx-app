import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { env } from "../env.js";

const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  forcePathStyle: true, // Required for MinIO and S3-compatible services
});

/**
 * Upload a file to S3/MinIO and return the public URL.
 */
export async function uploadFile(
  buffer: Buffer,
  key: string,
  contentType: string,
): Promise<{ url: string }> {
  await s3.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  const url = `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${key}`;
  return { url };
}

/**
 * Delete a file from S3/MinIO by its key.
 */
export async function deleteFile(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
    }),
  );
}
