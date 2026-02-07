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

    // Forward to upstream API
    const upstreamFormData = new FormData();
    upstreamFormData.append('tenant', tenant);
    upstreamFormData.append('language', language);
    upstreamFormData.append('name', name);
    upstreamFormData.append('email', email);
    upstreamFormData.append('phone', phone);
    upstreamFormData.append('cvUrl', cvUrl);
    upstreamFormData.append('sourceUrl', formData.get('sourceUrl') as string || '');

    const upstreamResponse = await fetch(config.runsApiUrl, {
      method: 'POST',
      body: upstreamFormData,
    });

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text();
      console.error('[API] Upstream error:', upstreamResponse.status, errorText);
      return NextResponse.json(
        { error: 'Failed to submit application' },
        { status: upstreamResponse.status }
      );
    }

    const result = await upstreamResponse.json();

    // Emit EventBridge event (fire-and-forget — errors are caught internally)
    const sourceUrl = formData.get('sourceUrl') as string || '';
    await publishApplyEvent({ tenant, language, name, email, phone, cvUrl, sourceUrl });

    return NextResponse.json(result);

  } catch (error) {
    console.error('[API] Error processing request:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
