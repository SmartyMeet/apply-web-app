'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { config, SupportedLanguage } from '@/lib/config';
import { getTranslations, detectLanguage, getLanguageFromCookie, setLanguageCookie } from '@/i18n';
import { Theme, defaultTheme, loadTheme } from '@/lib/theme';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ApplyForm } from './ApplyForm';

interface ApplyPageProps {
  tenant: string;
  initialLanguage?: SupportedLanguage;
}

export function ApplyPage({ tenant, initialLanguage }: ApplyPageProps) {
  const searchParams = useSearchParams();
  
  // Initialize language from various sources
  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    if (typeof window === 'undefined') {
      return initialLanguage || config.defaultLanguage;
    }
    
    const queryLang = searchParams.get('lang');
    const cookieLang = getLanguageFromCookie();
    
    const detected = detectLanguage(queryLang, cookieLang, null);
    
    // Persist query param to cookie if present
    if (queryLang && queryLang !== cookieLang) {
      setLanguageCookie(detected);
    }
    
    return detected;
  });
  
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [, setIsLoading] = useState(true);
  
  // Get translations for current language
  const translations = getTranslations(language);
  
  // Load theme from CDN
  useEffect(() => {
    loadTheme(tenant).then((loadedTheme) => {
      setTheme(loadedTheme);
      setIsLoading(false);
    });
  }, [tenant]);
  
  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
  };

  return (
    <div 
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      {/* Header */}
      <header className="w-full px-4 py-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto flex justify-between items-center">
          {/* Logo/Brand */}
          <div className="flex items-center gap-2">
            {theme.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={theme.logoUrl} 
                alt={theme.brandName || 'Company Logo'} 
                className="h-8 sm:h-10 w-auto"
              />
            ) : (
              <span className="text-xl sm:text-2xl font-bold text-gray-900">
                {theme.brandName || 'SmartyTalent'}
              </span>
            )}
          </div>
          
          {/* Language Switcher */}
          <LanguageSwitcher 
            currentLang={language} 
            translations={translations}
            onLanguageChange={handleLanguageChange}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto">
          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {translations.form.title}
              </h1>
              <p className="text-gray-600">
                {translations.form.subtitle}
              </p>
            </div>
            
            {/* Form */}
            <ApplyForm 
              tenant={tenant}
              language={language}
              translations={translations}
              theme={theme}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 py-6 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} {theme.brandName || 'SmartyTalent'}. All rights reserved.</p>
      </footer>
    </div>
  );
}
