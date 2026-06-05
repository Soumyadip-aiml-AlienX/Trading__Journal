'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import TradeDetailClient from '@/components/trades/TradeDetailClient';

function TradeDetailQueryResolver() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || '';
  const paramsPromise = Promise.resolve({ id });

  return <TradeDetailClient params={paramsPromise} />;
}

export default function TradeDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <TradeDetailQueryResolver />
    </Suspense>
  );
}
