import { Suspense } from 'react';
import { config } from '@/lib/config';
import { ThankYouPage } from '@/components/ThankYouPage';

export default function RootThankYouPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ThankYouPage tenant={config.defaultTenant} />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-10 w-32 bg-gray-200 rounded mb-4" />
        <div className="h-4 w-48 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
