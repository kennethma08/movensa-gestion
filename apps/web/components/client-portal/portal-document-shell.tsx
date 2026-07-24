'use client';

import { Download } from 'lucide-react';
import type { PortalBusinessInfo, PortalBranding } from '@/lib/portal/types';

interface PortalDocumentShellProps {
  business: PortalBusinessInfo;
  branding: PortalBranding | null;
  documentType: 'quote' | 'invoice' | 'contract';
  documentNumber: string;
  statusBadge?: React.ReactNode;
  onDownloadPdf?: () => void;
  children: React.ReactNode;
}

export function PortalDocumentShell({
  business,
  branding,
  documentType,
  documentNumber,
  statusBadge,
  onDownloadPdf,
  children,
}: PortalDocumentShellProps) {
  const documentLabels = {
    quote: 'Cotización',
    invoice: 'Factura',
    contract: 'Contrato',
  };
  const logoUrl = branding?.logoUrl || business.logoUrl;

  return (
    <div className="flex min-h-screen items-start justify-center bg-slate-100 px-3 py-5 sm:px-6 sm:py-10 dark:bg-neutral-950">
      <div className="bg-card w-full max-w-[760px] overflow-hidden rounded-2xl border shadow-xl">
        <div className="bg-card flex flex-col gap-4 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={business.name}
                className="h-10 w-auto max-w-40 object-contain"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-sm font-bold text-white">
                {business.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{business.name}</p>
              <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                <span>
                  {documentLabels[documentType]} {documentNumber}
                </span>
                {statusBadge}
              </div>
            </div>
          </div>
          {onDownloadPdf && (
            <button
              type="button"
              onClick={onDownloadPdf}
              className="hover:bg-muted inline-flex h-10 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors"
            >
              <Download className="h-4 w-4" />
              Descargar PDF
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
