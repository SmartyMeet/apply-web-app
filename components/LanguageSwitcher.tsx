'use client';

import { config, SupportedLanguage } from '@/lib/config';
import { setLanguageCookie, TranslationDict, t } from '@/i18n';

interface LanguageSwitcherProps {
  currentLang: SupportedLanguage;
  translations: TranslationDict;
  onLanguageChange: (lang: SupportedLanguage) => void;
}

export function LanguageSwitcher({ 
  currentLang, 
  translations, 
  onLanguageChange 
}: LanguageSwitcherProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as SupportedLanguage;
    setLanguageCookie(newLang);
    onLanguageChange(newLang);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="language-select" className="sr-only">
        {t(translations, 'language.select')}
      </label>
      <select
        id="language-select"
        value={currentLang}
        onChange={handleChange}
        className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md shadow-sm 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                   cursor-pointer hover:border-gray-400 transition-colors"
        aria-label={t(translations, 'language.select')}
      >
        {config.supportedLanguages.map((lang) => (
          <option key={lang} value={lang}>
            {t(translations, `language.${lang}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
