'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ConversionFunnelData } from '@/lib/dashboard/types';

interface QuotePipelineProps {
  data: ConversionFunnelData;
  className?: string;
}

const STAGES = [
  { key: 'quotesCreated', label: 'Created', color: 'bg-blue-500' },
  { key: 'quotesSent', label: 'Enviadas', color: 'bg-blue-400' },
  { key: 'quotesViewed', label: 'Vistas', color: 'bg-blue-300' },
  { key: 'quotesAccepted', label: 'Aceptadas', color: 'bg-green-500' },
  { key: 'invoicesCreated', label: 'Facturadas', color: 'bg-green-400' },
  { key: 'invoicesPaid', label: 'Pagadas', color: 'bg-emerald-500' },
] as const;

export function QuotePipeline({ data, className }: QuotePipelineProps) {
  const stages = useMemo(() => {
    const maxValue = data.quotesCreated || 1;
    return STAGES.map((stage) => {
      const value = data[stage.key as keyof ConversionFunnelData];
      const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
      return { ...stage, value, pct };
    });
  }, [data]);

  const isEmpty = data.quotesCreated === 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Flujo de cotización a cobro</CardTitle>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <p className="text-sm text-muted-foreground text-center py-4">No hay datos del embudo</p>
        ) : (
          <div className="space-y-3">
            {stages.map((stage) => (
              <div key={stage.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{stage.label}</span>
                  <span className="font-medium">{stage.value} ({Math.round(stage.pct)}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${stage.color} transition-all duration-500`}
                    style={{ width: `${Math.max(stage.pct, stage.value > 0 ? 4 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
