import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'applyBucket',
  access: (allow) => ({
    '*': [
      allow.guest.to(['write']),
    ],
  }),
});
