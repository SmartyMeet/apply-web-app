import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource.js';
import { storage } from './storage/resource.js';
import { publishApplyEvent } from './functions/publish-apply-event/resource.js';
import * as events from 'aws-cdk-lib/aws-events';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { CfnOutput } from 'aws-cdk-lib';

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

// Add a Function URL so the SSR Lambda (which has no IAM credentials) can
// invoke this function over HTTPS without needing AWS SDK credentials.
const publishFn = backend.publishApplyEvent.resources.lambda as lambda.Function;
const fnUrl = publishFn.addFunctionUrl({
  authType: lambda.FunctionUrlAuthType.NONE,
});

// Output the Function URL so it can be set as PUBLISH_APPLY_EVENT_URL
// in the Amplify app's environment variables.
new CfnOutput(eventsStack, 'PublishApplyEventUrl', {
  value: fnUrl.url,
  description: 'Function URL for the publish-apply-event Lambda',
});
