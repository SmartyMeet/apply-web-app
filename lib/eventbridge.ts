export interface ApplyEventDetail {
  tenant: string;
  language: string;
  name: string;
  email: string;
  phone: string;
  files: Array<{ fileUrl: string; originalFilename: string }>;
  consentCurrent: boolean;
  consentFuture: boolean;
  sourceUrl: string;
  referrer: string;
  landingUrl: string;
  urlParams: Record<string, string>;
  sourceJobId: string;
}

const PUBLISH_URL = process.env.PUBLISH_APPLY_EVENT_URL;

/**
 * Publish an apply event by calling the dedicated Lambda Function URL.
 * Fire-and-forget: errors are logged but never thrown so that a failed
 * event does not break the user-facing response.
 */
export async function publishApplyEvent(
  detail: ApplyEventDetail,
): Promise<void> {
  if (!PUBLISH_URL) {
    console.error('[EventBridge] PUBLISH_APPLY_EVENT_URL is not set — skipping event publish');
    return;
  }

  try {
    const response = await fetch(PUBLISH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(detail),
    });

    if (response.ok) {
      console.log(`[EventBridge] Lambda invoked successfully (status ${response.status})`);
    } else {
      const text = await response.text();
      console.error(`[EventBridge] Lambda returned status ${response.status}: ${text}`);
    }
  } catch (error) {
    console.error('[EventBridge] Error invoking Lambda:', error);
  }
}
