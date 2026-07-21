import { Suspense } from 'react';
import { Metadata } from 'next';
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';
import { AnalyticsSkeleton } from '@/components/analytics/analytics-skeleton';
import {
  getAnalyticsStats,
  getTopClientsByRevenue,
  getClientLTVData,
  getRevenueForecast,
} from '@/lib/dashboard/actions';
import { getWorkspaceCurrency } from '@/lib/settings/actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Analítica',
  description: 'Indicadores y análisis del rendimiento comercial',
};

async function AnalyticsContent() {
  const [
    stats,
    topClients,
    clientLTV,
    revenueForecast,
    currency,
  ] = await Promise.all([
    getAnalyticsStats(),
    getTopClientsByRevenue(5),
    getClientLTVData(5),
    getRevenueForecast(6, 3),
    getWorkspaceCurrency(),
  ]);

  return (
    <AnalyticsDashboard
      stats={stats}
      topClients={topClients}
      clientLTV={clientLTV.clients}
      revenueForecast={revenueForecast}
      currency={currency}
    />
  );
}

export default async function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analítica</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Indicadores detallados del rendimiento comercial de Grupo Movensa.
        </p>
      </div>

      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsContent />
      </Suspense>
    </div>
  );
}
