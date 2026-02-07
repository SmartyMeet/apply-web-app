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

    // --- TEMPORARY: S3 upload test mode (awaited, with debug output) ---
    let s3Result: string | null = null;
    let s3Error: string | null = null;
    try {
      const { uploadCvToS3 } = await import('@/lib/s3');
      s3Result = await uploadCvToS3(tenant, cv.name, cvBuffer, cv.type);
      console.log(`[API] CV uploaded to S3: ${s3Result}`);
    } catch (err) {
      s3Error = err instanceof Error ? err.message : String(err);
      console.error('[API] S3 upload failed:', s3Error);
    }

    // TEMPORARY: always return mock response — upstream API is bypassed
    return NextResponse.json({
      success: true,
      referenceId: `mock-${Date.now()}`,
      _debug: { s3Key: s3Result, s3Error },
    });
    // --- END TEMPORARY ---
    
  } catch (error) {
    console.error('[API] Error processing request:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
