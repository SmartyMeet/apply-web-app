'use client';
import { Amplify } from 'aws-amplify';

let configured = false;

export function configureAmplify() {
  if (configured) return true;
  try {
    const outputs = require('../amplify_outputs.json');
    Amplify.configure(outputs);
    configured = true;
    return true;
  } catch {
    console.warn('[Amplify] amplify_outputs.json not found — run `npx ampx sandbox` to generate it.');
    return false;
  }
}
