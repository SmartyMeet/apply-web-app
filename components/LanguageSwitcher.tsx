'use client';

import { config, SupportedLanguage } from '@/lib/config';
import { Translations, setLanguageCookie } from '@/i18n';

interface LanguageSwitcherProps {
  currentLang: SupportedLanguage;
  translations: Translations;
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
        {translations.language.select}
      </label>
      <select
        id="language-select"
        value={currentLang}
        onChange={handleChange}
        className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
      >
        {config.supportedLanguages.map((lang) => (
          <option key={lang} value={lang}>
            {translations.language[lang]}
          </option>
        ))}
      </select>
    </div>
  );
}