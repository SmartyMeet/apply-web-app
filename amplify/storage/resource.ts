import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'applyBucket',
  access: (allow) => ({
    'cv/*': [
      allow.guest.to(['write']),
    ],
  }),
});
