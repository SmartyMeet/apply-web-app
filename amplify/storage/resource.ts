import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'applyBucket',
  access: (allow) => ({
    '{tenant}/*': [
      allow.guest.to(['write']),
    ],
  }),
});
