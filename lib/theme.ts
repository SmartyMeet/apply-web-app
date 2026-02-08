import { config } from '@/lib/config';

export interface Theme {
  logoUrl?: string;
  brandName?: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  buttonRadius: string;
}

// Default theme values (built-in fallback)
export const defaultTheme: Theme = {
  logoUrl: undefined,
  brandName: 'SmartyTalent',
  primaryColor: '#2563eb', // Blue-600
  secondaryColor: '#1e40af', // Blue-800
  backgroundColor: '#f8fafc', // Slate-50
  buttonRadius: '0.5rem',
};

// Validate and map theme JSON structure.
// Supports both the CDN customizer format ({ customizer: { primaryColor, ... } })
// and flat format ({ primaryColor, ... }).
function validateTheme(data: unknown): Partial<Theme> {
  if (!data || typeof data !== 'object') {
    return {};
  }

  // Unwrap customizer envelope if present
  const raw = data as Record<string, unknown>;
  const obj = (raw.customizer && typeof raw.customizer === 'object'
    ? raw.customizer
    : raw) as Record<string, unknown>;

  const theme: Partial<Theme> = {};
  const isColor = (v: unknown): v is string =>
    typeof v === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(v);

  if (typeof obj.logoUrl === 'string' && obj.logoUrl.startsWith('http')) {
    theme.logoUrl = obj.logoUrl;
  }
  if (typeof obj.brandName === 'string' && obj.brandName.length < 100) {
    theme.brandName = obj.brandName;
  }
  if (isColor(obj.primaryColor)) {
    theme.primaryColor = obj.primaryColor;
  }
  if (isColor(obj.secondaryColor)) {
    theme.secondaryColor = obj.secondaryColor;
  }
  if (isColor(obj.lightBackgroundColor)) {
    theme.backgroundColor = obj.lightBackgroundColor;
  } else if (isColor(obj.backgroundColor)) {
    theme.backgroundColor = obj.backgroundColor;
  }
  if (typeof obj.buttonRadius === 'string' && obj.buttonRadius.length < 20) {
    theme.buttonRadius = obj.buttonRadius;
  }

  return theme;
}

// Fetch theme from CDN
async function fetchThemeFromUrl(url: string): Promise<Partial<Theme> | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
    
    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store', // Get fresh theme
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return validateTheme(data);
  } catch (error) {
    // Silently fail - will use fallback
    console.debug(`Failed to fetch theme from ${url}:`, error);
    return null;
  }
}

// Load theme with cascading fallbacks
export async function loadTheme(tenant?: string): Promise<Theme> {
  const baseUrl = config.themeBaseUrl;
  
  // Try tenant-specific theme first
  if (tenant && tenant !== 'default') {
    const tenantTheme = await fetchThemeFromUrl(
      `${baseUrl}/tenants/${tenant}/apply/theme.json`
    );
    if (tenantTheme && Object.keys(tenantTheme).length > 0) {
      return { ...defaultTheme, ...tenantTheme };
    }
  }
  
  // Try default theme (smartytalent)
  const globalTheme = await fetchThemeFromUrl(`${baseUrl}/tenants/smartytalent/apply/theme.json`);
  if (globalTheme && Object.keys(globalTheme).length > 0) {
    return { ...defaultTheme, ...globalTheme };
  }
  
  // Use default theme
  return defaultTheme;
}

// Generate CSS variables from theme
export function generateThemeCSSVars(theme: Theme): Record<string, string> {
  return {
    '--primary-color': theme.primaryColor,
    '--secondary-color': theme.secondaryColor,
    '--background-color': theme.backgroundColor,
    '--button-radius': theme.buttonRadius,
  };
}
