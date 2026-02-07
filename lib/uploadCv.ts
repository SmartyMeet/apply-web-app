'use client';
import { uploadData } from 'aws-amplify/storage';

function buildS3Path(tenant: string, filename: string): string {
  const t = tenant.replace(/[^a-zA-Z0-9_-]/g, '_');
  const f = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `cv/tenantName=${t}/year=${y}/month=${m}/day=${d}/${f}`;
}

export async function uploadCvToS3(tenant: string, file: File): Promise<string> {
  const path = buildS3Path(tenant, file.name);
  await uploadData({ path, data: file, options: { contentType: file.type } }).result;
  console.log(`[S3] CV uploaded: ${path}`);
  return path;
}
