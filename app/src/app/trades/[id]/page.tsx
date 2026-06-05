import TradeDetailClient from '@/components/trades/TradeDetailClient';

export const dynamicParams = false;

export async function generateStaticParams() {
  return [];
}

export default function TradeDetailPage(props: any) {
  return <TradeDetailClient {...props} />;
}
