import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource.js';

// Note: Data/database removed per requirements - this is a stateless apply form
// that forwards submissions to an external API
defineBackend({
  auth,
});
