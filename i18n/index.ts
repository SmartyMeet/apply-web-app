import { config, SupportedLanguage } from '@/lib/config';
import en from './locales/en.json';
import pl from './locales/pl.json';
import it from './locales/it.json';

export type Translations = typeof en;

const translations: Record<SupportedLanguage, Translations> = {
  en,
  pl,
  it,
};

export function getTranslations(lang: SupportedLanguage): Translations {
  return translations[lang] || translations[config.defaultLanguage];
}

export function detectLanguage(
  queryParam: string | null,
  cookie: string | null,
  acceptLanguage: string | null
): SupportedLanguage {
  // Priority 1: Query parameter
  if (queryParam && isValidLanguage(queryParam)) {
    return queryParam as SupportedLanguage;
  }
  
  // Priority 2: Cookie
  if (cookie && isValidLanguage(cookie)) {
    return cookie as SupportedLanguage;
  }
  
  // Priority 3: Accept-Language header
  if (acceptLanguage) {
    const primaryLang = acceptLanguage.split(',')[0]?.split('-')[0]?.toLowerCase();
    if (primaryLang && isValidLanguage(primaryLang)) {
      return primaryLang as SupportedLanguage;
    }
  }
  
  // Priority 4: Default fallback
  return config.defaultLanguage;
}

function isValidLanguage(lang: string): boolean {
  return config.supportedLanguages.includes(lang as SupportedLanguage);
}

export function getLanguageFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === config.languageCookieName) {
      return value;
    }
  }
  return null;
}

export function setLanguageCookie(lang: SupportedLanguage): void {
  if (typeof document === 'undefined') return;
  
  // Set cookie for 1 year
  const maxAge = 365 * 24 * 60 * 60;
  document.cookie = `${config.languageCookieName}=${lang}; path=/; max-age=${maxAge}; SameSite=Lax`;
}