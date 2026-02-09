import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource.js';
import { storage } from './storage/resource.js';
import { publishApplyEvent } from './functions/publish-apply-event/resource.js';
import * as events from 'aws-cdk-lib/aws-events';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';

// Note: Data/database removed per requirements - this is a stateless apply form
// that uploads CVs to S3 and emits EventBridge events
const backend = defineBackend({
  auth,
  storage,
  publishApplyEvent,
});

// Environment name (shared across all resources)
const smEnv = process.env.SM_ENV || 'dev';

// Override the bucket name
const cfnBucket = backend.storage.resources.cfnResources.cfnBucket;
cfnBucket.bucketName = `sm-${smEnv}-app-apply-bucket`;

// Custom EventBridge bus for application events
const eventsStack = backend.createStack('EventsStack');

const applyEventBus = new events.EventBus(eventsStack, 'ApplyEventBus', {
  eventBusName: `sm-${smEnv}-app-apply-eventbus`,
});

// Allow any principal in the same account to publish events.
applyEventBus.addToResourcePolicy(new iam.PolicyStatement({
  sid: 'AllowAccountPutEvents',
  effect: iam.Effect.ALLOW,
  principals: [new iam.AccountPrincipal(eventsStack.account)],
  actions: ['events:PutEvents'],
  resources: [applyEventBus.eventBusArn],
}));

// Grant the Lambda function permission to publish events
const publishFnRole = backend.publishApplyEvent.resources.lambda.role!;
publishFnRole.addToPrincipalPolicy(new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: ['events:PutEvents'],
  resources: [applyEventBus.eventBusArn],
}));

// Allow any principal in the same account to invoke the Lambda function.
// This lets the Amplify Hosting SSR Lambda (whose role is managed by Amplify)
// invoke this function without needing an explicit SSR Compute Role.
const publishFn = backend.publishApplyEvent.resources.lambda as lambda.Function;
publishFn.addPermission('AllowAccountInvoke', {
  principal: new iam.AccountPrincipal(eventsStack.account),
  action: 'lambda:InvokeFunction',
});
