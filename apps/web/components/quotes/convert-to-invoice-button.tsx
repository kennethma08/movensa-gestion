'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Receipt, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { createInvoiceFromQuote } from '@/lib/invoices/actions';
import { sendInvoice } from '@/lib/invoices/actions';

const PAYMENT_TERMS = [
  { value: '7', label: '7 días' },
  { value: '15', label: '15 días' },
  { value: '30', label: '30 días' },
  { value: '45', label: '45 días' },
  { value: '60', label: '60 días' },
  { value: '90', label: '90 días' },
];

interface ConvertToInvoiceButtonProps {
  quoteId: string;
  quoteTitle: string;
  total: number;
  currency?: string;
}

function formatMoney(amount: number, currency: string): string {
  const parts = new Intl.NumberFormat('es-CR', { style: 'currency', currency, currencyDisplay: 'narrowSymbol' }).formatToParts(amount);
  return parts.map((p, i) => {
    if (p.type === 'currency' && parts[i + 1]?.type !== 'literal') return p.value + ' ';
    return p.value;
  }).join('');
}

export function ConvertToInvoiceButton({
  quoteId,
  quoteTitle,
  total,
  currency = 'USD',
}: ConvertToInvoiceButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendImmediately, setSendImmediately] = useState(false);
  const [paymentTermDays, setPaymentTermDays] = useState('30');

  const dueDate = new Date(Date.now() + parseInt(paymentTermDays) * 24 * 60 * 60 * 1000);

  const handleConvert = async () => {
    setIsConverting(true);
    setError(null);

    try {
      const result = await createInvoiceFromQuote(quoteId, {
        dueDays: parseInt(paymentTermDays),
      });

      if (result.success && result.invoice) {
        if (sendImmediately) {
          await sendInvoice(result.invoice.id).catch(() => {
            toast.error('La factura se creó, pero el correo no pudo enviarse. Puede enviarlo manualmente.');
          });
        }
        router.push(`/invoices/${result.invoice.id}`);
      } else {
        setError(result.error || 'No se pudo crear la factura');
      }
    } catch (err) {
      setError('Ocurrió un error inesperado al crear la factura');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default">
          <Receipt className="mr-2 h-4 w-4" />
          Convertir en factura
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convertir cotización en factura</DialogTitle>
          <DialogDescription>
            Se creará una factura nueva con todos los conceptos, notas y condiciones de esta cotización.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cotización</span>
              <span className="font-medium">{quoteTitle}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monto total</span>
              <span className="font-medium">
                {formatMoney(total, currency)}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <Label htmlFor="payment-terms" className="text-sm font-normal">Condiciones de pago</Label>
              <Select value={paymentTermDays} onValueChange={setPaymentTermDays}>
                <SelectTrigger id="payment-terms" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TERMS.map((term) => (
                    <SelectItem key={term.value} value={term.value}>
                      {term.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Vence: {dueDate.toLocaleDateString('es-CR')}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="send-immediate"
                checked={sendImmediately}
                onCheckedChange={(checked) => setSendImmediately(checked === true)}
              />
              <Label htmlFor="send-immediate" className="text-sm font-normal">
                Enviar inmediatamente después de crearla
              </Label>
            </div>
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-600">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isConverting}
          >
            Cancelar
          </Button>
          <Button onClick={handleConvert} disabled={isConverting}>
            {isConverting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear factura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
