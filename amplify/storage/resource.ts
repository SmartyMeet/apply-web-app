import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'applyBucket',
  access: (allow) => ({
    'tenantName=*/*': [
      allow.guest.to(['write']),
    ],
  }),
});
