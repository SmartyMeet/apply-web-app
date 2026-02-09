import {
  EventBridgeClient,
  PutEventsCommand,
} from '@aws-sdk/client-eventbridge';

const SM_ENV = process.env.SM_ENV || 'dev';
const EVENT_BUS_NAME = `sm-${SM_ENV}-app-apply-eventbus`;
const EVENT_SOURCE = `sm:${SM_ENV}:app`;
const EVENT_DETAIL_TYPE = 'apply:file:uploaded';

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

interface FunctionUrlEvent {
  body?: string;
  isBase64Encoded?: boolean;
}

const client = new EventBridgeClient({
  region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
});

export const handler = async (event: FunctionUrlEvent): Promise<{ statusCode: number; body: string }> => {
  try {
    // Parse the payload from the Function URL request body
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64').toString('utf-8')
      : event.body || '{}';
    const detail: ApplyEventDetail = JSON.parse(rawBody);

    const cmd = new PutEventsCommand({
      Entries: [
        {
          Source: EVENT_SOURCE,
          DetailType: EVENT_DETAIL_TYPE,
          EventBusName: EVENT_BUS_NAME,
          Detail: JSON.stringify(detail),
        },
      ],
    });

    const result = await client.send(cmd);

    if (result.FailedEntryCount && result.FailedEntryCount > 0) {
      console.error('[EventBridge] Failed entries:', JSON.stringify(result.Entries));
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to publish event', entries: result.Entries }) };
    }

    console.log(`[EventBridge] Event published: ${EVENT_DETAIL_TYPE}`);
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error('[EventBridge] Error publishing event:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal error publishing event' }) };
  }
};
