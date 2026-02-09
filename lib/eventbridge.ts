import {
  LambdaClient,
  InvokeCommand,
} from '@aws-sdk/client-lambda';

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

const SM_ENV = process.env.SM_ENV || 'dev';
const FUNCTION_NAME = process.env.PUBLISH_APPLY_EVENT_FUNCTION_NAME || `sm-${SM_ENV}-publish-apply-event`;

let client: LambdaClient | null = null;

function getClient(): LambdaClient {
  if (!client) {
    client = new LambdaClient({
      region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
    });
  }
  return client;
}

/**
 * Publish an apply event by invoking the dedicated Lambda function.
 * Fire-and-forget: errors are logged but never thrown so that a failed
 * event does not break the user-facing response.
 */
export async function publishApplyEvent(
  detail: ApplyEventDetail,
): Promise<void> {
  try {
    const cmd = new InvokeCommand({
      FunctionName: FUNCTION_NAME,
      InvocationType: 'Event', // async / fire-and-forget
      Payload: new TextEncoder().encode(JSON.stringify(detail)),
    });

    const result = await getClient().send(cmd);

    if (result.StatusCode && result.StatusCode >= 200 && result.StatusCode < 300) {
      console.log(`[EventBridge] Lambda invoked successfully (status ${result.StatusCode})`);
    } else {
      console.error(`[EventBridge] Lambda invocation unexpected status: ${result.StatusCode}`);
    }
  } catch (error) {
    console.error('[EventBridge] Error invoking Lambda:', error);
  }
}
