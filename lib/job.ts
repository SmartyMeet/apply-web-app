import { config, SupportedLanguage } from '@/lib/config';

export interface JobData {
  name: Record<string, string>;
  language: string;
  locations?: Record<string, unknown>[];
  [key: string]: unknown;
}

/**
 * Fetch job data from CDN: {cdnBaseUrl}/tenants/{tenant}/apply/{sourceJobId}.json
 */
export async function loadJobData(tenant: string, sourceJobId: string): Promise<JobData | null> {
  const url = `${config.cdnBaseUrl}/tenants/${tenant}/apply/${sourceJobId}.json`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data || typeof data !== 'object' || !data.name) {
      return null;
    }

    return data as JobData;
  } catch (error) {
    console.debug(`Failed to fetch job data from ${url}:`, error);
    return null;
  }
}

/**
 * Map a locale string like "it-IT" or "en-US" to a SupportedLanguage ("it", "en").
 * Falls back to config.defaultLanguage if the prefix isn't supported.
 */
export function mapLocaleToLanguage(locale: string): SupportedLanguage {
  const prefix = locale.slice(0, 2).toLowerCase();
  if ((config.supportedLanguages as readonly string[]).includes(prefix)) {
    return prefix as SupportedLanguage;
  }
  return config.defaultLanguage;
}

/**
 * Get the localized job name for a given language.
 * Matches "it" against locale keys like "it-IT". Falls back to the first available name.
 */
export function getLocalizedJobName(jobData: JobData, language: SupportedLanguage): string | null {
  const names = jobData.name;
  if (!names || typeof names !== 'object') return null;

  const keys = Object.keys(names);
  if (keys.length === 0) return null;

  // Find a locale key whose first two chars match the language
  const matchingKey = keys.find((k) => k.slice(0, 2).toLowerCase() === language);
  if (matchingKey) {
    return names[matchingKey];
  }

  // Fallback to the first available name
  return names[keys[0]];
}
