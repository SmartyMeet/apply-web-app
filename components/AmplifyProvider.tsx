'use client';
import { useRef } from 'react';
import { configureAmplify } from '@/lib/amplify';

export function AmplifyProvider({ children }: { children: React.ReactNode }) {
  const init = useRef(false);
  if (!init.current) { configureAmplify(); init.current = true; }
  return <>{children}</>;
}
