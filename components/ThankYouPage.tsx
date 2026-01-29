'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { config, SupportedLanguage } from '@/lib/config';
import { getTranslations, getLanguageFromCookie, detectLanguage } from '@/i18n';
import { Theme, defaultTheme, loadTheme } from '@/lib/theme';
import { LanguageSwitcher } from './LanguageSwitcher';
import { TenantLogo } from './TenantLogo';

interface ThankYouPageProps {
  tenant: string;
}

export function ThankYouPage({ tenant }: ThankYouPageProps) {
  const searchParams = useSearchParams();
  const referenceId = searchParams.get('ref');
  
  // Initialize language
  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    if (typeof window === 'undefined') {
      return config.defaultLanguage;
    }
    
    const queryLang = searchParams.get('lang');
    const cookieLang = getLanguageFromCookie();
    
    return detectLanguage(queryLang, cookieLang, null);
  });
  
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  
  const translations = getTranslations(language);
  
  // Load theme
  useEffect(() => {
    loadTheme(tenant).then(setTheme);
  }, [tenant]);
  
  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
  };
  
  const homePath = tenant === config.defaultTenant ? '/' : `/${tenant}`;

  return (
    <div 
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      {/* Header */}
      <header className="w-full px-4 py-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto flex justify-between items-center">
          {/* Logo/Brand - Uses TenantLogo component for CDN logo with text fallback */}
          <div className="flex items-center gap-2">
            <TenantLogo 
              tenant={tenant}
              className="h-8 sm:h-10"
              fallbackClassName="text-xl sm:text-2xl"
            />
          </div>
          
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
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 text-center">
            {/* Success Icon */}
            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
              <svg 
                className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
            
            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              {translations.thankYou.title}
            </h1>
            
            {/* Message */}
            <p className="text-gray-600 mb-6">
              {translations.thankYou.message}
            </p>
            
            {/* Reference ID (if available) */}
            {referenceId && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-500 mb-1">
                  {translations.thankYou.referenceLabel}
                </p>
                <p className="font-mono text-lg font-semibold text-gray-900">
                  {referenceId}
                </p>
              </div>
            )}
            
            {/* Back to form link */}
            <Link 
              href={homePath}
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-white font-medium transition-colors"
              style={{ 
                backgroundColor: theme.primaryColor,
                borderRadius: theme.buttonRadius 
              }}
            >
              {translations.thankYou.backHome}
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 py-6 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} SmartyTalent. All rights reserved.</p>
      </footer>
    </div>
  );
}