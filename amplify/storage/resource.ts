import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'applyBucket',
  access: (allow) => ({
    'uploads/*': [
      allow.guest.to(['write']),
    ],
  }),
});
