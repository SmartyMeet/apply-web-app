import {
  EventBridgeClient,
  PutEventsCommand,
} from '@aws-sdk/client-eventbridge';

const SM_ENV = process.env.SM_ENV || 'dev';
const EVENT_BUS_NAME = `sm-${SM_ENV}-app-apply-eventbus`;
const EVENT_SOURCE = `sm.${SM_ENV}.app`;
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

let client: EventBridgeClient | null = null;

function getClient(): EventBridgeClient {
  if (!client) {
    client = new EventBridgeClient({
      region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION,
    });
  }
  return client;
}

/**
 * Publish an apply event to EventBridge. Fire-and-forget: errors are logged
 * but never thrown so that a failed event does not break the user-facing response.
 */
export async function publishApplyEvent(
  detail: ApplyEventDetail,
): Promise<void> {
  try {
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

    const result = await getClient().send(cmd);

    if (result.FailedEntryCount && result.FailedEntryCount > 0) {
      console.error(
        '[EventBridge] Failed entries:',
        JSON.stringify(result.Entries),
      );
    } else {
      console.log(
        `[EventBridge] Event published: ${EVENT_DETAIL_TYPE}`,
      );
    }
  } catch (error) {
    console.error('[EventBridge] Error publishing event:', error);
  }
}
