// Centralized configuration for the Candidate Apply portal

export const config = {
  // Tenant configuration
  defaultTenant: process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'default',
  
  // CDN base URL for themes, logos, and backgrounds
  cdnBaseUrl: process.env.NEXT_PUBLIC_CDN_BASE_URL || 'https://cdn.smartytalent.eu',
  
  // i18n configuration
  defaultLanguage: 'en' as const,
  supportedLanguages: ['en', 'pl', 'it'] as const,
  languageCookieName: 'st_lang',
  
  // File upload constraints
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/rtf',
    'application/rtf',
    // Presentations
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Apple Pages
    'application/x-iwork-pages-sffpages',
    // Images
    'image/png',
    'image/jpeg',
  ] as string[],
  allowedFileExtensions: [
    '.pdf', '.doc', '.docx',
    '.txt', '.rtf',
    '.ppt', '.pptx',
    '.pages',
    '.png', '.jpg', '.jpeg',
  ] as string[],
};

export type SupportedLanguage = typeof config.supportedLanguages[number];

export function isValidFileType(file: File): boolean {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  return config.allowedFileTypes.includes(file.type) || 
         config.allowedFileExtensions.includes(extension);
}

export function isValidFileSize(file: File): boolean {
  return file.size <= config.maxFileSize;
}