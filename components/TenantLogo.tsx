'use client';

import { useState, useEffect } from 'react';
import { config } from '@/lib/config';

interface TenantLogoProps {
  tenant: string;
  className?: string;
  fallbackClassName?: string;
}

/**
 * Capitalize the first letter of a string
 */
function capitalizeFirst(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Build the CDN logo URL for a tenant
 * Pattern: {cdnBaseUrl}/tenants/{tenantName}/apply/logo.jpg
 */
function getTenantLogoUrl(tenant: string): string {
  const baseUrl = config.cdnBaseUrl;
  return `${baseUrl}/tenants/${tenant}/apply/logo.jpg`;
}

/**
 * TenantLogo component
 * 
 * Displays tenant logo from CDN if available, otherwise shows
 * the tenant name with first letter capitalized.
 * 
 * Logo URL pattern: {cdnBaseUrl}/tenants/{tenantName}/apply/logo.jpg
 * Minimum size: 100x100px
 */
export function TenantLogo({ tenant, className = '', fallbackClassName = '' }: TenantLogoProps) {
  const [logoStatus, setLogoStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [logoUrl, setLogoUrl] = useState<string>('');
  
  const displayName = capitalizeFirst(tenant);
  
  useEffect(() => {
    // Skip logo loading for default tenant
    if (!tenant || tenant === 'default') {
      setLogoStatus('error'); // Use text fallback for default tenant
      return;
    }
    
    const url = getTenantLogoUrl(tenant);
    setLogoUrl(url);
    
    // Preload the image to check if it exists
    const img = new Image();
    
    img.onload = () => {
      setLogoStatus('loaded');
    };
    
    img.onerror = () => {
      console.debug(`Tenant logo not found at ${url}, using text fallback`);
      setLogoStatus('error');
    };
    
    img.src = url;
    
    // Cleanup
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [tenant]);
  
  // Show text fallback while loading or if logo failed to load
  if (logoStatus === 'loading' || logoStatus === 'error') {
    return (
      <span className={`font-bold text-gray-900 ${fallbackClassName}`}>
        {displayName || 'SmartyTalent'}
      </span>
    );
  }
  
  // Show logo image - minimum 60x60px
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img 
      src={logoUrl}
      alt={`${displayName} Logo`}
      className={`w-auto object-contain ${className}`}
      style={{ minWidth: '60px', minHeight: '60px' }}
      onError={() => setLogoStatus('error')}
    />
  );
}