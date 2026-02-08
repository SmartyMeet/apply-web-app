import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { publishApplyEvent } from '@/lib/eventbridge';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Get the form data from the request
    const formData = await request.formData();

    // Extract fields (validate basic presence)
    const tenant = formData.get('tenant') as string || config.defaultTenant;
    const language = formData.get('language') as string || config.defaultLanguage;
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const cvUrl = formData.get('cvUrl') as string;

    // Server-side validation
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Phone validation (basic - allows international formats)
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid phone format' },
        { status: 400 }
      );
    }

    if (!cvUrl) {
      return NextResponse.json(
        { error: 'CV upload path is required' },
        { status: 400 }
      );
    }

    // Tracking data from URL parameters
    const sourceUrl = formData.get('sourceUrl') as string || '';
    const referrer = formData.get('referrer') as string || '';
    const landingUrl = formData.get('landingUrl') as string || '';
    const urlParamsRaw = formData.get('urlParams') as string || '{}';
    let urlParams: Record<string, string> = {};
    try {
      urlParams = JSON.parse(urlParamsRaw);
    } catch {
      urlParams = {};
    }

    // Emit EventBridge event
    await publishApplyEvent({ tenant, language, name, email, phone, cvUrl, sourceUrl, referrer, landingUrl, urlParams });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[API] Error processing request:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
