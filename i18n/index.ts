import { config, SupportedLanguage } from '@/lib/config';
import en from './locales/en.json';
import pl from './locales/pl.json';

// Type for translation structure
export type TranslationDict = typeof en;

// Local translations
const translations: Record<SupportedLanguage, TranslationDict> = {
  en,
  pl,
};

// Get translation dictionary for a language
export function getTranslations(lang: SupportedLanguage): TranslationDict {
  return translations[lang] || translations[config.defaultLanguage];
}

// Helper to get nested translation value by path (e.g., "form.title")
export function t(dict: TranslationDict, path: string): string {
  const keys = path.split('.');
  let result: unknown = dict;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      console.warn(`Translation missing for path: ${path}`);
      return path;
    }
  }
  
  return typeof result === 'string' ? result : path;
}

// Validate if language is supported
export function isValidLanguage(lang: string): lang is SupportedLanguage {
  return config.supportedLanguages.includes(lang as SupportedLanguage);
}

// Get language from various sources (browser-side)
export function detectLanguage(
  queryLang?: string | null,
  cookieLang?: string | null,
  acceptLang?: string | null
): SupportedLanguage {
  // 1. Query param
  if (queryLang && isValidLanguage(queryLang)) {
    return queryLang;
  }
  
  // 2. Cookie
  if (cookieLang && isValidLanguage(cookieLang)) {
    return cookieLang;
  }
  
  // 3. Accept-Language header
  if (acceptLang) {
    const preferred = acceptLang.split(',')[0]?.split('-')[0]?.toLowerCase();
    if (preferred && isValidLanguage(preferred)) {
      return preferred;
    }
  }
  
  // 4. Fallback
  return config.defaultLanguage;
}

// Set language cookie
export function setLanguageCookie(lang: SupportedLanguage): void {
  if (typeof document !== 'undefined') {
    document.cookie = `${config.languageCookieName}=${lang};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
  }
}

// Get language from cookie (browser-side)
export function getLanguageFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  
  const match = document.cookie.match(new RegExp(`${config.languageCookieName}=([^;]+)`));
  return match ? match[1] : null;
}
