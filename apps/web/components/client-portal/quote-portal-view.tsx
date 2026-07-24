'use client';

import { useState } from 'react';
import { Check, Download, CheckCircle2, XCircle, ChevronUp } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { PublicQuoteData } from '@/lib/quotes/portal-actions';
import { calculateDepositAmount } from '@/lib/quotes/utils';
import { QuoteBlockRenderer } from './quote-block-renderer';
import { AcceptQuoteDialog } from './accept-quote-dialog';
import { DeclineQuoteDialog } from './decline-quote-dialog';

interface QuotePortalViewProps {
  quote: PublicQuoteData;
  accessToken: string;
}

const ACCENT = '#3786b3';
const ACCENT_LIGHT = '#e3f2fa';
const ACCENT_BG = 'bg-sky-50/60';

function formatCurrency(amount: number, currency: string = 'CRC'): string {
  const parts = new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency,
  }).formatToParts(amount);
  return parts
    .map((p, i) => {
      if (p.type === 'currency' && parts[i + 1]?.type !== 'literal') return p.value + ' ';
      return p.value;
    })
    .join('');
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('es-CR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Costa_Rica',
  });
}

export function QuotePortalView({ quote, accessToken }: QuotePortalViewProps) {
  const [showDetails, setShowDetails] = useState(true);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [quoteStatus, setQuoteStatus] = useState(quote.status);

  const canRespond = ['sent', 'viewed'].includes(quoteStatus) && !quote.isExpired;
  const currency = quote.currency;
  const accentColor = quote.branding?.primaryColor || ACCENT;
  const accentLight = quote.branding?.primaryColor
    ? `${quote.branding.primaryColor}18`
    : ACCENT_LIGHT;

  const depositAmount = quote.settings.depositRequired
    ? calculateDepositAmount(
        quote.totals.total,
        quote.settings.depositType,
        quote.settings.depositValue
      )
    : 0;

  const handleAccepted = () => {
    setQuoteStatus('accepted');
    setShowAcceptDialog(false);
  };

  const handleDeclined = () => {
    setQuoteStatus('declined');
    setShowDeclineDialog(false);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Subtle wave decoration */}
      <svg
        className="pointer-events-none absolute left-0 top-0"
        viewBox="0 0 200 120"
        fill="none"
        style={{ width: '45%', height: '100px' }}
      >
        <path d="M0 0 L0 80 Q60 72 120 40 Q160 18 200 0 Z" fill={accentColor} opacity="0.05" />
        <path d="M0 0 L0 50 Q40 44 80 24 Q110 10 140 0 Z" fill={accentColor} opacity="0.03" />
      </svg>

      {/* Hero header — centered */}
      <div className="relative px-6 pb-5 pt-8 text-center">
        <div
          className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: accentLight }}
        >
          <Check className="h-5 w-5" style={{ color: accentColor }} />
        </div>
        <h3 className="text-base font-semibold tracking-tight">{quote.business.name}</h3>
        <p className="mt-1 text-3xl font-bold tracking-tight" style={{ color: accentColor }}>
          {formatCurrency(quote.totals.total, currency)}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          Cotización #{quote.quoteNumber} &middot;{' '}
          {quote.expirationDate
            ? `Válida hasta el ${formatDate(quote.expirationDate)}`
            : `Emitida el ${formatDate(quote.issueDate)}`}
        </p>
      </div>

      <Separator className="border-gray-100" />

      {/* Client + Line Items (Collapsible) */}
      <div className="px-6 py-4">
        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">{quote.client.name}</p>
              {quote.client.company && quote.client.company !== quote.client.name && (
                <p className="text-muted-foreground text-xs">{quote.client.company}</p>
              )}
            </div>
            <CollapsibleTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors">
                {showDetails ? 'Ocultar' : 'Ver detalles'}
                <ChevronUp
                  className={cn('h-3 w-3 transition-transform', !showDetails && 'rotate-180')}
                />
              </button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            <Separator className="mb-4 border-gray-100" />
            <div className="space-y-2">
              {/* Bug #73: Only show lineItems if blocks don't contain service-items (avoid duplicates) */}
              {quote.lineItems.length > 0 &&
                !quote.blocks.some((b) => b.type === 'service-item') && (
                  <>
                    {quote.lineItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2 text-sm">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {item.name || 'Concepto sin título'}
                          </p>
                          <p className="text-muted-foreground mt-0.5 truncate text-xs">
                            {item.quantity} &times; {formatCurrency(item.rate, currency)}
                            {item.description && (
                              <span className="text-muted-foreground/70 ml-1.5">
                                &middot; {item.description}
                              </span>
                            )}
                          </p>
                        </div>
                        <span className="ml-4 text-sm font-medium tabular-nums">
                          {formatCurrency(item.amount, currency)}
                        </span>
                      </div>
                    ))}

                    <Separator className="my-4 border-gray-100" />
                  </>
                )}

              {/* Subtotal/Discount rows */}
              {quote.totals.discountAmount > 0 && (
                <div className="mb-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="tabular-nums">
                      {formatCurrency(quote.totals.subtotal, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Descuento</span>
                    <span className="tabular-nums text-green-600">
                      -{formatCurrency(quote.totals.discountAmount, currency)}
                    </span>
                  </div>
                </div>
              )}

              {/* Tax row */}
              {quote.totals.taxTotal > 0 && (
                <div className="mb-3 space-y-2">
                  {quote.totals.discountAmount === 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="tabular-nums">
                        {formatCurrency(quote.totals.subtotal, currency)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Impuesto</span>
                    <span className="tabular-nums">
                      {formatCurrency(quote.totals.taxTotal, currency)}
                    </span>
                  </div>
                </div>
              )}

              {/* Total row */}
              <div
                className={cn(
                  '-mx-3 flex items-baseline justify-between rounded-lg border-l-2 px-3 py-3',
                  ACCENT_BG
                )}
                style={{ borderLeftColor: accentColor }}
              >
                <span className="text-sm font-semibold">Total</span>
                <span className="text-lg font-bold tabular-nums" style={{ color: accentColor }}>
                  {formatCurrency(quote.totals.total, currency)}
                </span>
              </div>

              {/* Deposit info */}
              {quote.settings.depositRequired && depositAmount > 0 && (
                <div className="mt-2 rounded-lg border border-dashed px-3 py-2">
                  <p className="text-xs font-medium">
                    Anticipo:{' '}
                    {quote.settings.depositType === 'percentage'
                      ? `${quote.settings.depositValue}%`
                      : formatCurrency(quote.settings.depositValue, currency)}{' '}
                    ({formatCurrency(depositAmount, currency)}) vence al aceptar
                  </p>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Content Blocks */}
      {quote.blocks.length > 0 && (
        <>
          <Separator className="border-gray-100" />
          <div className="px-6 py-5">
            <div className="space-y-4">
              {quote.blocks.map((block) => (
                <QuoteBlockRenderer key={block.id} block={block} quote={quote} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Notes */}
      {quote.notes && (
        <>
          <Separator className="border-gray-100" />
          <div className="px-6 py-5">
            <p className="text-muted-foreground whitespace-pre-wrap text-sm">{quote.notes}</p>
          </div>
        </>
      )}

      {/* Terms */}
      {quote.terms && (
        <>
          <Separator className="border-gray-100" />
          <div className="px-6 py-5">
            <p className="text-muted-foreground mb-1 text-xs font-medium">Términos y condiciones</p>
            <p className="text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed">
              {quote.terms}
            </p>
          </div>
        </>
      )}

      {/* Action Buttons */}
      <div className="space-y-2 px-6 pb-4 pt-2">
        {canRespond ? (
          <>
            <button
              onClick={() => setShowAcceptDialog(true)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: accentColor }}
            >
              <CheckCircle2 className="h-4 w-4" />
              Aceptar cotización
            </button>
            <button
              onClick={() => setShowDeclineDialog(true)}
              className="border-border text-muted-foreground hover:bg-muted/50 flex h-10 w-full items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors"
            >
              <XCircle className="h-4 w-4" />
              Denegar cotización
            </button>
          </>
        ) : quoteStatus === 'accepted' ? (
          <div className="py-4 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-green-500" />
            <p className="mt-2 text-sm font-medium text-green-700 dark:text-green-400">
              Cotización aceptada
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              ¡Gracias! Pronto le comunicaremos los siguientes pasos.
            </p>
          </div>
        ) : quoteStatus === 'declined' ? (
          <div className="py-4 text-center">
            <XCircle className="mx-auto h-8 w-8 text-red-500" />
            <p className="mt-2 text-sm font-medium text-red-700 dark:text-red-400">
              Cotización rechazada
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Si cambia de opinión, comuníquese con nosotros.
            </p>
          </div>
        ) : quote.isExpired ? (
          <div className="py-4 text-center">
            <p className="text-muted-foreground text-sm">
              Esta cotización venció. Comuníquese con la empresa para solicitar una nueva.
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground py-2 text-center text-sm">
            Esta cotización está disponible para consulta.
          </p>
        )}
        <button
          type="button"
          onClick={() =>
            window.open(`/api/download/quote/${quote.id}?token=${accessToken}`, '_blank')
          }
          className="border-border hover:bg-muted/50 flex h-11 w-full items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition-colors"
        >
          <Download className="h-4 w-4" />
          Descargar PDF
        </button>
      </div>

      {/* Branded footer */}
      <div className="px-6 pb-5 pt-2">
        <div className="flex items-center justify-center gap-2">
          <div className="bg-border/40 h-px flex-1" />
          <p className="text-muted-foreground/50 whitespace-nowrap text-[10px]">
            Documento generado por {quote.business.name}
          </p>
          <div className="bg-border/40 h-px flex-1" />
        </div>
      </div>

      {/* Dialogs */}
      <AcceptQuoteDialog
        open={showAcceptDialog}
        onOpenChange={setShowAcceptDialog}
        quote={quote}
        accessToken={accessToken}
        onAccepted={handleAccepted}
      />
      <DeclineQuoteDialog
        open={showDeclineDialog}
        onOpenChange={setShowDeclineDialog}
        quote={quote}
        accessToken={accessToken}
        onDeclined={handleDeclined}
      />
    </div>
  );
}
