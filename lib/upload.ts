'use client';
import { uploadData } from 'aws-amplify/storage';

function uuidHex(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot !== -1 ? filename.slice(dot) : '';
}

function buildS3Path(tenant: string, extension: string): string {
  const t = tenant.replace(/[^a-zA-Z0-9_-]/g, '_');
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `uploads/tenantName=${t}/year=${y}/month=${m}/day=${d}/${uuidHex()}${extension}`;
}

export interface UploadedFile {
  fileUrl: string;
  originalFilename: string;
}

export async function uploadFileToS3(tenant: string, file: File): Promise<UploadedFile> {
  const ext = getExtension(file.name);
  const path = buildS3Path(tenant, ext);
  await uploadData({ path, data: file, options: { contentType: file.type } }).result;
  console.log(`[S3] File uploaded: ${path}`);
  return { fileUrl: path, originalFilename: file.name };
}
