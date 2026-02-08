'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { config, SupportedLanguage } from '@/lib/config';
import { getTranslations, detectLanguage, getLanguageFromCookie, setLanguageCookie } from '@/i18n';
import { Theme, defaultTheme, loadTheme } from '@/lib/theme';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ApplyForm } from './ApplyForm';
import { TenantLogo } from './TenantLogo';
import { useTenantBackground } from './TenantBackground';

export interface UrlTrackingData {
  referrer: string;
  params: Record<string, string>;
  landingUrl: string;
  redirectCount?: number;
  navigationType?: string;
}

interface ApplyPageProps {
  tenant: string;
  sourceJobId?: string;
  initialLanguage?: SupportedLanguage;
}

export function ApplyPage({ tenant, sourceJobId, initialLanguage }: ApplyPageProps) {
  const searchParams = useSearchParams();

  // Capture URL parameters and referrer on initial load.
  // Primary source: st_tracking cookie set by middleware (captures the original
  // server-side URL before Next.js routing can strip query params).
  // Fallback: useSearchParams (works when params survive to the client).
  const [trackingData, setTrackingData] = useState<UrlTrackingData | null>(null);

  useEffect(() => {
    const referrer = document.referrer || '(direct)';

    // Get navigation performance data (redirect count, type)
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const redirectCount = navEntry?.redirectCount ?? 0;
    const navigationType = navEntry?.type ?? 'unknown';

    // Try reading the middleware cookie first
    const cookieMatch = document.cookie
      .split('; ')
      .find((c) => c.startsWith('st_tracking='));

    if (cookieMatch) {
      try {
        const payload = JSON.parse(decodeURIComponent(cookieMatch.split('=').slice(1).join('=')));
        setTrackingData({
          // Prefer server-side referer (full URL), fall back to client-side
          referrer: payload.referer || referrer,
          params: payload.params || {},
          landingUrl: payload.landingUrl || window.location.href,
          redirectCount,
          navigationType,
        });
        // Clear the cookie so it doesn't leak into subsequent navigations
        document.cookie = 'st_tracking=; path=/; max-age=0';
        return;
      } catch {
        // Malformed cookie — fall through to client-side detection
      }
    }

    // Fallback: read from current URL (works when params are still present)
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    setTrackingData({
      referrer,
      params,
      landingUrl: window.location.href,
      redirectCount,
      navigationType,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize language — always start with a stable default to avoid hydration
  // mismatch, then detect the real language client-side in useEffect.
  const [language, setLanguage] = useState<SupportedLanguage>(
    initialLanguage || config.defaultLanguage
  );

  useEffect(() => {
    const queryLang = searchParams.get('lang');
    const cookieLang = getLanguageFromCookie();
    const detected = detectLanguage(queryLang, cookieLang, null);

    if (queryLang && queryLang !== cookieLang) {
      setLanguageCookie(detected);
    }

    setLanguage(detected);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [, setIsLoading] = useState(true);
  
  // Get translations for current language
  const translations = getTranslations(language);
  
  // Load background from CDN
  const backgroundUrl = useTenantBackground(tenant);
  
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

  // Background styles
  const backgroundStyles: React.CSSProperties = backgroundUrl
    ? {
        backgroundImage: `url(${backgroundUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }
    : {
        backgroundColor: theme.backgroundColor,
      };

  return (
    <div 
      className="min-h-screen transition-all duration-300"
      style={backgroundStyles}
    >
      {/* Optional overlay for better readability when background image is present */}
      <div className={backgroundUrl ? 'min-h-screen bg-black/30' : 'min-h-screen'}>
        {/* Header */}
        <header className="w-full px-4 py-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mx-auto flex justify-between items-center">
            {/* Logo/Brand - Uses TenantLogo component for CDN logo with text fallback */}
            <div className="flex items-center gap-2">
              <TenantLogo 
                tenant={tenant}
                className="h-[100px] sm:h-[60px]"
                fallbackClassName="text-2xl sm:text-3xl"
              />
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
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 sm:p-8">
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
                trackingData={trackingData}
                sourceJobId={sourceJobId}
              />
            </div>
          </div>
        </main>

        {/* Debug: URL Tracking Data */}
        {trackingData && (
          <div className="px-4 sm:px-6 lg:px-8 pb-4">
            <div className="max-w-xl mx-auto">
              <details className="bg-yellow-50 border border-yellow-300 rounded-lg overflow-hidden">
                <summary className="px-4 py-2 cursor-pointer text-sm font-medium text-yellow-800 hover:bg-yellow-100">
                  [DEBUG] URL Tracking Data
                </summary>
                <div className="px-4 pb-4 text-sm text-yellow-900 space-y-3">
                  {sourceJobId && (
                    <div>
                      <span className="font-semibold">Source Job ID:</span>{' '}
                      <span className="font-mono">{sourceJobId}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-semibold">Referrer:</span>{' '}
                    <span className="font-mono break-all">{trackingData.referrer}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Landing URL:</span>{' '}
                    <span className="font-mono break-all">{trackingData.landingUrl}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Navigation type:</span>{' '}
                    <span className="font-mono">{trackingData.navigationType}</span>
                    {' | '}
                    <span className="font-semibold">Redirects:</span>{' '}
                    <span className="font-mono">{trackingData.redirectCount}</span>
                  </div>
                  <div>
                    <span className="font-semibold">URL Parameters:</span>
                    {Object.keys(trackingData.params).length === 0 ? (
                      <span className="text-yellow-600 ml-1">(none)</span>
                    ) : (
                      <ul className="mt-1 ml-4 list-disc">
                        {Object.entries(trackingData.params).map(([key, value]) => (
                          <li key={key}>
                            <span className="font-mono">{key}</span> = <span className="font-mono">{value}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </details>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="px-4 py-6 text-center text-sm text-gray-500">
          <p className={backgroundUrl ? 'text-white/80' : ''}>
            © {new Date().getFullYear()} SmartyTalent. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}