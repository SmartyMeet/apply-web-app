import { config, SupportedLanguage } from '@/lib/config';

export interface JobData {
  name: Record<string, string>;
  language: string;
  locations?: Record<string, { region: string; country: string; city: string }[]>;
  department?: Record<string, string>;
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
 * Find the value for a given language from a locale-keyed record.
 * Matches "it" against keys like "it-IT". Falls back to the first available key.
 */
function findLocalized<T>(record: Record<string, T> | undefined, language: SupportedLanguage): T | undefined {
  if (!record || typeof record !== 'object') return undefined;

  const keys = Object.keys(record);
  if (keys.length === 0) return undefined;

  const matchingKey = keys.find((k) => k.slice(0, 2).toLowerCase() === language);
  return matchingKey ? record[matchingKey] : record[keys[0]];
}

/**
 * Get localized job info (name, city, department) joined with " | ".
 * Matches "it" against locale keys like "it-IT". Falls back to the first available key.
 */
export function getLocalizedJobInfo(jobData: JobData, language: SupportedLanguage): string | null {
  const name = findLocalized(jobData.name, language);
  if (!name) return null;

  const city = findLocalized(jobData.locations, language)?.[0]?.city;
  const department = findLocalized(jobData.department, language);

  return [name, city, department].filter(Boolean).join(' | ');
}
