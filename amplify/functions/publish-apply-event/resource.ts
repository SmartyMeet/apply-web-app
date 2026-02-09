import { defineFunction } from '@aws-amplify/backend';

export const publishApplyEvent = defineFunction({
  name: 'publish-apply-event',
  entry: './handler.ts',
  timeoutSeconds: 15,
  runtime: 18,
  environment: {
    SM_ENV: process.env.SM_ENV || 'dev',
  },
});
