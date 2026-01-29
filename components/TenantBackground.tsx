'use client';

import { useState, useEffect } from 'react';
import { config } from '@/lib/config';

/**
 * Build the CDN background URL for a tenant
 * Pattern: https://cdn.test-smartytalent.eu/tenant/{tenantName}/bg.jpg
 */
function getTenantBackgroundUrl(tenant: string): string {
  const baseUrl = config.cdnBaseUrl;
  return `${baseUrl}/tenant/${tenant}/bg.jpg`;
}

/**
 * Hook to load tenant background image from CDN
 * Returns the background URL if it exists, null otherwise
 */
export function useTenantBackground(tenant: string): string | null {
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  
  useEffect(() => {
    // Skip for default tenant
    if (!tenant || tenant === 'default') {
      setBackgroundUrl(null);
      return;
    }
    
    const url = getTenantBackgroundUrl(tenant);
    
    // Preload the image to check if it exists
    const img = new Image();
    
    img.onload = () => {
      setBackgroundUrl(url);
    };
    
    img.onerror = () => {
      console.debug(`Tenant background not found at ${url}, using default`);
      setBackgroundUrl(null);
    };
    
    img.src = url;
    
    // Cleanup
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [tenant]);
  
  return backgroundUrl;
}