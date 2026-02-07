import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

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
    const cv = formData.get('cv') as File | null;
    
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
    
    // CV validation
    if (!cv || !(cv instanceof File)) {
      return NextResponse.json(
        { error: 'CV file is required' },
        { status: 400 }
      );
    }
    
    // File size check
    if (cv.size > config.maxFileSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }
    
    // File type check
    const extension = '.' + cv.name.split('.').pop()?.toLowerCase();
    if (!config.allowedFileTypes.includes(cv.type) && 
        !config.allowedFileExtensions.includes(extension || '')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, DOC, DOCX allowed' },
        { status: 400 }
      );
    }
    
    // Read the file buffer once to avoid double-consuming the stream
    const cvBuffer = Buffer.from(await cv.arrayBuffer());

    // Fire-and-forget S3 upload — dynamic import so the AWS SDK never blocks route loading
    import('@/lib/s3').then(({ uploadCvToS3 }) =>
      uploadCvToS3(tenant, cv.name, cvBuffer, cv.type)
    ).then(
      (key) => console.log(`[API] CV uploaded to S3: ${key}`),
      (err) => console.error('[API] S3 upload failed (non-blocking):', err),
    );

    // Mock mode: skip upstream API and return success (for dev/testing)
    if (process.env.MOCK_UPSTREAM_API === 'true') {
      console.log('[API] Mock mode: skipping upstream API, returning success');
      return NextResponse.json({
        success: true,
        referenceId: `mock-${Date.now()}`,
      });
    }

    // Build the upstream request using a Blob from the buffer
    const cvBlob = new Blob([cvBuffer], { type: cv.type });
    const upstreamFormData = new FormData();
    upstreamFormData.append('tenant', tenant);
    upstreamFormData.append('language', language);
    upstreamFormData.append('name', name);
    upstreamFormData.append('email', email);
    upstreamFormData.append('phone', phone);
    upstreamFormData.append('cv', cvBlob, cv.name);

    // Add metadata
    const sourceUrl = request.headers.get('referer') || request.headers.get('origin') || '';
    const userAgent = request.headers.get('user-agent') || '';
    upstreamFormData.append('sourceUrl', sourceUrl);
    upstreamFormData.append('userAgent', userAgent);

    // Forward to upstream API
    const upstreamUrl = config.runsApiUrl;

    console.log(`[API] Forwarding request to: ${upstreamUrl}`);

    const upstreamResponse = await fetch(upstreamUrl, {
      method: 'POST',
      body: upstreamFormData,
      // Don't set Content-Type - let fetch set it with boundary for multipart
    });

    // Parse upstream response
    let responseData: Record<string, unknown> = {};
    const contentType = upstreamResponse.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      try {
        responseData = await upstreamResponse.json();
      } catch {
        // Non-JSON response
      }
    }

    if (!upstreamResponse.ok) {
      console.error(`[API] Upstream error: ${upstreamResponse.status}`);
      return NextResponse.json(
        {
          error: 'Failed to submit application',
          // Don't expose internal error details to client
        },
        { status: upstreamResponse.status >= 500 ? 502 : upstreamResponse.status }
      );
    }

    // Extract reference ID if available
    const referenceId = responseData.id || responseData.runId || responseData.referenceId || null;

    return NextResponse.json({
      success: true,
      referenceId,
    });
    
  } catch (error) {
    console.error('[API] Error processing request:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
