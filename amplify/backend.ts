import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource.js';
import { storage } from './storage/resource.js';
import * as events from 'aws-cdk-lib/aws-events';
import * as iam from 'aws-cdk-lib/aws-iam';

// Note: Data/database removed per requirements - this is a stateless apply form
// that forwards submissions to an external API
const backend = defineBackend({
  auth,
  storage,
});

// Custom EventBridge bus for application events
const smEnv = process.env.SM_ENV || 'dev';
const eventsStack = backend.createStack('EventsStack');

const applyEventBus = new events.EventBus(eventsStack, 'ApplyEventBus', {
  eventBusName: `sm-${smEnv}-app-apply-eventbus`,
});

// Allow any principal in the same account to publish events.
// This lets the Amplify Hosting SSR Lambda (whose role is managed by Amplify)
// put events without needing an explicit IAM role policy.
applyEventBus.addToResourcePolicy(new iam.PolicyStatement({
  sid: 'AllowAccountPutEvents',
  effect: iam.Effect.ALLOW,
  principals: [new iam.AccountPrincipal(eventsStack.account)],
  actions: ['events:PutEvents'],
  resources: [applyEventBus.eventBusArn],
}));
