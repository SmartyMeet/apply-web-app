import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config } from './config';

const s3Client = new S3Client({});

export function buildS3Key(tenant: string, filename: string): string {
  const sanitizedTenant = tenant.replace(/[^a-zA-Z0-9_-]/g, '_');
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');

  return `tenantName=${sanitizedTenant}/year=${year}/month=${month}/day=${day}/${sanitizedFilename}`;
}

export async function uploadCvToS3(
  tenant: string,
  filename: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const key = buildS3Key(tenant, filename);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: config.s3BucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return key;
}
