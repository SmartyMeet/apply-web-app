import { Suspense } from 'react';
import { ApplyPage } from '@/components/ApplyPage';

interface TenantJobApplyPageProps {
  params: Promise<{ tenant: string; sourceJobId: string }>;
}

export default async function TenantJobApplyPage({ params }: TenantJobApplyPageProps) {
  const { tenant, sourceJobId } = await params;

  return (
    <Suspense fallback={<LoadingFallback />}>
      <ApplyPage tenant={tenant} sourceJobId={sourceJobId} />
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
