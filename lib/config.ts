// Centralized configuration for the Candidate Apply portal

export const config = {
  // API configuration
  runsApiUrl: process.env.RUNS_API_URL || process.env.NEXT_PUBLIC_RUNS_API_URL || 'https://api.test.smartytalent.eu/v1/runs',
  
  // Tenant configuration
  defaultTenant: process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'default',
  
  // Theme/CDN configuration
  themeBaseUrl: process.env.NEXT_PUBLIC_THEME_BASE_URL || 'https://cdn.smartytalent.eu',
  
  // CDN base URL for tenant logos
  // Logo pattern: {cdnBaseUrl}/tenant/{tenantName}/logo.jpeg
  cdnBaseUrl: process.env.NEXT_PUBLIC_CDN_BASE_URL || 'https://cdn.test-smartytalent.eu',
  
  // i18n configuration
  defaultLanguage: 'en' as const,
  supportedLanguages: ['en', 'pl'] as const,
  languageCookieName: 'st_lang',
  
  // File upload constraints
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ] as string[],
  allowedFileExtensions: ['.pdf', '.doc', '.docx'] as string[],
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