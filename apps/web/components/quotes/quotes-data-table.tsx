'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  FileText,
  Plus,
  Download,
  Pencil,
  Check,
  ChevronUp,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { DataTable } from '@/components/ui/data-table/data-table';
import { BulkAction } from '@/components/ui/data-table/data-table-toolbar';
import { getQuoteColumns, quoteStatusOptions } from './quotes-columns';
import { QuoteListItem, QuoteStatus } from '@/lib/quotes/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { duplicateQuote, deleteQuote, getQuote, updateQuoteStatus } from '@/lib/quotes/actions';
import { getBusinessProfile } from '@/lib/settings/actions';
import { createInvoiceFromQuote } from '@/lib/invoices/actions';
import { cn } from '@/lib/utils';
import { SendEmailDialog } from '@/components/shared/send-email-dialog';

const ACCENT = '#3786b3';
const ACCENT_LIGHT = '#e3f2fa';
const ACCENT_BG = 'bg-sky-50/60';

function formatCurrency(amount: number, currency: string = 'USD'): string {
  const parts = new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
  }).formatToParts(amount);
  return parts.map((p, i) => {
    if (p.type === 'currency' && parts[i + 1]?.type !== 'literal') return p.value + ' ';
    return p.value;
  }).join('');
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-CR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface QuotesDataTableProps {
  data: QuoteListItem[];
}

export function QuotesDataTable({ data: initialData }: QuotesDataTableProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewingQuote, setViewingQuote] = useState<any | null>(null);
  const [showDetails, setShowDetails] = useState(true);

  // Local data for status updates
  const [data, setData] = useState(initialData);

  const handleView = async (quote: QuoteListItem) => {
    try {
      const fullQuote = await getQuote(quote.id);
      if (fullQuote) {
        setViewingQuote(fullQuote);
        setShowDetails(true);
      } else {
        // Fallback: navigate to quote detail page
        router.push(`/quotes/${quote.id}`);
      }
    } catch {
      router.push(`/quotes/${quote.id}`);
    }
  };

  const handleCloseView = () => {
    setViewingQuote(null);
  };

  const handleDuplicate = async (quote: QuoteListItem) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const result = await duplicateQuote(quote.id);
      if (result.success && result.quoteId) {
        toast.success('Cotización duplicada correctamente');
        router.push(`/quotes/${result.quoteId}`);
      } else {
        toast.error('No se pudo duplicar la cotización');
      }
    } catch {
      toast.error('No se pudo duplicar la cotización');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (quote: QuoteListItem) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const result = await deleteQuote(quote.id);
      if (result.success) {
        toast.success('Cotización eliminada correctamente');
        setData((prev) => prev.filter((q) => q.id !== quote.id));
      } else {
        toast.error('No se pudo eliminar la cotización');
      }
    } catch {
      toast.error('No se pudo eliminar la cotización');
    } finally {
      setIsProcessing(false);
    }
  };

  // Business name for email dialog
  const [businessName, setBusinessName] = useState('');
  useEffect(() => {
    getBusinessProfile().then((p) => setBusinessName(p?.businessName || '')).catch(() => {});
  }, []);

  // Dialog states
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendTarget, setSendTarget] = useState<QuoteListItem | null>(null);

  // Send Quote
  const handleSend = useCallback((quote: QuoteListItem) => {
    setSendTarget(quote);
    setSendDialogOpen(true);
  }, []);

  const handleSendComplete = useCallback(() => {
    if (sendTarget) {
      setData((prev) =>
        prev.map((q) =>
          q.id === sendTarget.id ? { ...q, status: 'sent' } : q
        )
      );
    }
    setSendTarget(null);
  }, [sendTarget]);

  const handleChangeStatus = useCallback(async (
    quote: QuoteListItem,
    status: 'under_review' | 'accepted' | 'declined'
  ) => {
    const statusLabels: Partial<Record<QuoteStatus, string>> = {
      draft: 'borrador',
      under_review: 'en estudio',
      accepted: 'aceptada',
      declined: 'denegada',
    };

    toast.loading('Actualizando estado...', { id: `quote-status-${quote.id}` });
    try {
      const result = await updateQuoteStatus(quote.id, status);
      if (!result.success) {
        toast.error(result.error || 'No se pudo cambiar el estado.', { id: `quote-status-${quote.id}` });
        return;
      }

      setData((current) => current.map((item) => (
        item.id === quote.id ? { ...item, status } : item
      )));
      toast.success(`Cotización marcada como ${statusLabels[status] || status}.`, { id: `quote-status-${quote.id}` });
      router.refresh();
    } catch {
      toast.error('No se pudo cambiar el estado.', { id: `quote-status-${quote.id}` });
    }
  }, [router]);

  // Bug #75: Copy Link — use access token URL (not quoteNumber).
  // QuoteListItem doesn't include accessToken, so we fall back to the quote detail page.
  const handleCopyLink = useCallback(async (quote: QuoteListItem) => {
    // The public portal URL requires an access token which isn't available on the list item.
    // Copy the internal quote link instead so the user can share from the detail page.
    const url = `${window.location.origin}/quotes/${quote.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Enlace copiado; puede compartirlo desde el detalle de la cotización');
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  }, []);

  // Convert to Invoice
  const handleConvertToInvoice = useCallback(async (quote: QuoteListItem) => {
    if (quote.status !== 'accepted') {
      toast.error('Solo las cotizaciones aceptadas se pueden convertir en facturas');
      return;
    }

    toast.loading('Convirtiendo cotización en factura...', { id: 'convert' });
    try {
      const result = await createInvoiceFromQuote(quote.id);
      if (result.success && result.invoice) {
        toast.success('¡Cotización convertida en factura!', { id: 'convert' });
        setData((prev) =>
          prev.map((q) =>
            q.id === quote.id ? { ...q, status: 'converted' } : q
          )
        );
        router.push(`/invoices/${result.invoice.id}`);
      } else {
        toast.error(result.error || 'No se pudo convertir la cotización', { id: 'convert' });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo convertir la cotización';
      console.error('Convert to invoice error:', err);
      toast.error(msg, { id: 'convert' });
    }
  }, [router]);

  const columns = getQuoteColumns({
    onView: handleView,
    onEdit: (quote) => {
      router.push(`/quotes/${quote.id}/edit`);
    },
    onDuplicate: handleDuplicate,
    onDelete: handleDelete,
    onDownload: (quote) => {
      window.open(`/api/pdf/quote/${quote.id}`, '_blank');
    },
    onSend: handleSend,
    onCopyLink: handleCopyLink,
    onConvertToInvoice: handleConvertToInvoice,
    onChangeStatus: handleChangeStatus,
  });

  const bulkActions: BulkAction<QuoteListItem>[] = [
    {
      label: 'Eliminar',
      icon: <Trash2 className="mr-2 h-4 w-4" />,
      variant: 'destructive',
      onClick: async (rows) => {
        const drafts = rows.filter((r) => r.status === 'draft');
        if (drafts.length === 0) {
          toast.error('Solo se pueden eliminar cotizaciones en borrador');
          return;
        }
        setIsProcessing(true);
        try {
          let deleted = 0;
          for (const quote of drafts) {
            const result = await deleteQuote(quote.id);
            if (result.success) deleted++;
          }
          toast.success(`${deleted} cotización(es) eliminada(s)`);
          setData((prev) => prev.filter((q) => !drafts.some((d) => d.id === q.id)));
        } catch {
          toast.error('No se pudieron eliminar las cotizaciones');
        } finally {
          setIsProcessing(false);
        }
      },
    },
  ];

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-16">
      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">Aún no hay cotizaciones</h3>
      <p className="text-muted-foreground mb-4">
        Cree la primera cotización para comenzar
      </p>
      <Button asChild>
        <Link href="/quotes/new">
          <Plus className="mr-2 h-4 w-4" />
          Crear cotización
        </Link>
      </Button>
    </div>
  );

  const quote = viewingQuote;

  // Extract line items from blocks for the view dialog
  const lineItems = quote?.blocks
    ?.filter((b: any) => b.type === 'service-item')
    ?.map((b: any) => ({
      id: b.id,
      name: b.content.name || 'Concepto sin título',
      description: b.content.description || '',
      quantity: b.content.quantity || 0,
      rate: b.content.rate || 0,
      amount: (b.content.quantity || 0) * (b.content.rate || 0),
    })) || [];

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        filterKey="client"
        filterPlaceholder="Buscar cotizaciones..."
        statusOptions={quoteStatusOptions}
        statusFilterKey="status"
        pageSizes={[10, 25, 50, 100]}
        emptyState={emptyState}
        onRowClick={(quote) => handleView(quote)}
        bulkActions={bulkActions}
      />

      {/* Quote View Dialog — Payment Page Style */}
      <Dialog open={!!viewingQuote} onOpenChange={(open) => !open && handleCloseView()}>
        <DialogContent className="!flex !flex-col !max-w-[520px] !max-h-[90vh] !p-0 !gap-0 overflow-hidden">
          <DialogTitle className="sr-only">Vista previa de la cotización</DialogTitle>
          <DialogDescription className="sr-only">
            Resumen de la cotización, conceptos, total y datos del cliente.
          </DialogDescription>
          {quote && (
            <>
              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto">
                {/* Payment Page Card */}
                <div className="bg-card overflow-hidden relative">
                  {/* Subtle wave decoration */}
                  <svg className="absolute top-0 left-0 pointer-events-none" viewBox="0 0 200 120" fill="none" style={{ width: '45%', height: '100px' }}>
                    <path d="M0 0 L0 80 Q60 72 120 40 Q160 18 200 0 Z" fill={ACCENT} opacity="0.05" />
                    <path d="M0 0 L0 50 Q40 44 80 24 Q110 10 140 0 Z" fill={ACCENT} opacity="0.03" />
                  </svg>

                  {/* Header — centered */}
                  <div className="px-6 pt-8 pb-5 text-center relative">
                    <div
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full mb-3"
                      style={{ backgroundColor: ACCENT_LIGHT }}
                    >
                      <Check className="h-5 w-5" style={{ color: ACCENT }} />
                    </div>
                    <h3 className="text-base font-semibold tracking-tight">
                      {quote.client?.name || 'Cotización'}
                    </h3>
                    <p className="text-3xl font-bold tracking-tight mt-1" style={{ color: ACCENT }}>
                      {formatCurrency(quote.totals.total, quote.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cotización #{quote.quoteNumber} &middot; {quote.expirationDate ? `Válida hasta ${formatDate(String(quote.expirationDate))}` : `Emitida ${formatDate(String(quote.issueDate))}`}
                    </p>
                  </div>

                  <Separator className="border-gray-100" />

                  {/* Client + Line Items (Collapsible) */}
                  <div className="px-6 py-4">
                    <Collapsible open={showDetails} onOpenChange={setShowDetails}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-sm">
                            {quote.client?.name || 'Seleccionar cliente'}
                          </p>
                          {quote.client?.company && quote.client.company !== quote.client.name && (
                            <p className="text-xs text-muted-foreground">
                              {quote.client.company}
                            </p>
                          )}
                        </div>
                        <CollapsibleTrigger asChild>
                          <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                            {showDetails ? 'Hide' : 'Details'}
                            <ChevronUp
                              className={cn(
                                'h-3 w-3 transition-transform',
                                !showDetails && 'rotate-180'
                              )}
                            />
                          </button>
                        </CollapsibleTrigger>
                      </div>

                      <CollapsibleContent>
                        <Separator className="mb-4 border-gray-100" />
                        <div className="space-y-2">
                          {lineItems.map((item: any) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between py-2 text-sm"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {item.name || 'Concepto sin título'}
                                </p>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                  {item.quantity} &times; {formatCurrency(item.rate, quote.currency)}
                                  {item.description && (
                                    <span className="ml-1.5 text-muted-foreground/70">
                                      &middot; {item.description}
                                    </span>
                                  )}
                                </p>
                              </div>
                              <span className="ml-4 font-medium tabular-nums text-sm">
                                {formatCurrency(item.amount, quote.currency)}
                              </span>
                            </div>
                          ))}

                          <Separator className="my-4 border-gray-100" />

                          {/* Subtotal/Discount rows if applicable */}
                          {quote.totals.discountAmount > 0 && (
                            <div className="space-y-2 mb-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="tabular-nums">{formatCurrency(quote.totals.subtotal, quote.currency)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Descuento</span>
                                <span className="tabular-nums text-green-600">-{formatCurrency(quote.totals.discountAmount, quote.currency)}</span>
                              </div>
                            </div>
                          )}

                          {/* Tax row if applicable */}
                          {quote.totals.taxTotal > 0 && (
                            <div className="space-y-2 mb-3">
                              {quote.totals.discountAmount === 0 && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Subtotal</span>
                                  <span className="tabular-nums">{formatCurrency(quote.totals.subtotal, quote.currency)}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Impuesto</span>
                                <span className="tabular-nums">{formatCurrency(quote.totals.taxTotal, quote.currency)}</span>
                              </div>
                            </div>
                          )}

                          {/* Total row */}
                          <div
                            className={cn(
                              'flex justify-between items-baseline rounded-lg px-3 py-3 -mx-3 border-l-2',
                              ACCENT_BG,
                            )}
                            style={{ borderLeftColor: ACCENT }}
                          >
                            <span className="font-semibold text-sm">Total</span>
                            <span className="text-lg font-bold tabular-nums" style={{ color: ACCENT }}>
                              {formatCurrency(quote.totals.total, quote.currency)}
                            </span>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>

                  {/* Notes */}
                  {quote.notes && (
                    <>
                      <Separator className="border-gray-100" />
                      <div className="px-6 py-5">
                        <p className="text-sm text-muted-foreground">{quote.notes}</p>
                      </div>
                    </>
                  )}

                  {/* Terms */}
                  {quote.terms && (
                    <>
                      <Separator className="border-gray-100" />
                      <div className="px-6 py-5">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Términos y condiciones</p>
                        <p className="text-sm text-muted-foreground">{quote.terms}</p>
                      </div>
                    </>
                  )}

                  {/* Action Buttons */}
                  <div className="px-6 pb-4 pt-2 space-y-2">
                    <button
                      className="w-full h-12 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors text-white"
                      style={{ backgroundColor: ACCENT }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Aceptar cotización
                    </button>
                    <button
                      onClick={() => window.open(`/api/pdf/quote/${quote.id}`, '_blank')}
                      className="w-full h-10 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors border border-border text-muted-foreground hover:bg-muted/50"
                    >
                      <Download className="h-4 w-4" />
                      Descargar cotización
                    </button>
                  </div>

                  {/* Powered By Footer */}
                  <div className="px-6 pb-5 pt-2">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="h-px flex-1 bg-border/40" />
                      <p className="text-[10px] text-muted-foreground/50 whitespace-nowrap">
                        Powered by Oreko
                      </p>
                      <div className="h-px flex-1 bg-border/40" />
                    </div>
                  </div>
                </div>
              </div>

            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      {sendTarget && (
        <SendEmailDialog
          open={sendDialogOpen}
          onOpenChange={setSendDialogOpen}
          type="quote"
          documentId={sendTarget.id}
          documentNumber={sendTarget.quoteNumber}
          recipientEmail={sendTarget.client?.email || ''}
          recipientName={sendTarget.client?.name || ''}
          businessName={businessName}
          total={sendTarget.total}
          currency={sendTarget.currency}
          dueDate={sendTarget.expirationDate || undefined}
          onSent={handleSendComplete}
        />
      )}
    </>
  );
}
