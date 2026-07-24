'use client';

import { useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import { ArrowUpRight } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { QuoteStatusCounts, ConversionFunnelData } from '@/lib/dashboard/types';

interface SalesPipelineSectionProps {
  dateRange?: DateRange;
  conversionRate: number;
  avgDealValue: number;
  quoteStatusCounts: QuoteStatusCounts;
  conversionFunnel: ConversionFunnelData;
}

function formatCurrency(amount: number, currency: string = 'USD'): string {
  const parts = new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).formatToParts(amount);
  return parts
    .map((p, i) => {
      if (p.type === 'currency' && parts[i + 1]?.type !== 'literal') return p.value + ' ';
      return p.value;
    })
    .join('');
}

const STATUS_ITEMS = [
  { key: 'accepted', label: 'Aceptadas', color: 'bg-emerald-500' },
  { key: 'sent', label: 'Enviadas', color: 'bg-blue-500' },
  { key: 'viewed', label: 'Vistas', color: 'bg-amber-400' },
  { key: 'draft', label: 'Borradores', color: 'bg-slate-400' },
  { key: 'declined', label: 'Rechazadas', color: 'bg-red-400' },
  { key: 'expired', label: 'Vencidas', color: 'bg-orange-400' },
] as const;

export function SalesPipelineSection({
  conversionRate,
  avgDealValue,
  quoteStatusCounts,
  conversionFunnel,
}: SalesPipelineSectionProps) {
  const totalQuotes = conversionFunnel.quotesCreated;
  const wonQuotes = conversionFunnel.quotesAccepted;
  const maxCount = useMemo(() => {
    return Math.max(
      quoteStatusCounts.draft,
      quoteStatusCounts.sent,
      quoteStatusCounts.viewed,
      quoteStatusCounts.accepted,
      quoteStatusCounts.declined,
      quoteStatusCounts.expired,
      1
    );
  }, [quoteStatusCounts]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-baseline justify-between">
          <CardTitle className="text-sm font-medium">Embudo de ventas</CardTitle>
          <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
            <ArrowUpRight className="h-3 w-3" />
            <span className="font-medium">{conversionRate.toFixed(0)}% de éxito</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Key metrics row */}
        <div className="mb-5 flex items-center gap-6">
          <div>
            <p className="text-2xl font-semibold tracking-tight">{totalQuotes}</p>
            <p className="text-muted-foreground text-xs">Cotizaciones totales</p>
          </div>
          <div className="bg-border h-8 w-px" />
          <div>
            <p className="text-2xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
              {wonQuotes}
            </p>
            <p className="text-muted-foreground text-xs">Won</p>
          </div>
          <div className="bg-border h-8 w-px" />
          <div>
            <p className="text-2xl font-semibold tracking-tight">{formatCurrency(avgDealValue)}</p>
            <p className="text-muted-foreground text-xs">Avg deal</p>
          </div>
        </div>

        {/* Status breakdown */}
        <div className="space-y-2.5">
          {STATUS_ITEMS.map((item) => {
            const count = quoteStatusCounts[item.key] ?? 0;
            const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
            return (
              <div key={item.key} className="flex items-center gap-3">
                <span className="text-muted-foreground w-16 shrink-0 text-xs">{item.label}</span>
                <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${item.color}`}
                    style={{ width: `${Math.max(pct, count > 0 ? 3 : 0)}%` }}
                  />
                </div>
                <span className="w-5 text-right text-xs font-medium tabular-nums">{count}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
