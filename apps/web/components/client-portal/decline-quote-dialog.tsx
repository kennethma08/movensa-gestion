'use client';

import { useState } from 'react';
import { XCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { declineQuote, type PublicQuoteData } from '@/lib/quotes/portal-actions';
import { toast } from 'sonner';

interface DeclineQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: PublicQuoteData;
  accessToken: string;
  onDeclined: () => void;
}

const DECLINE_REASONS = [
  { value: 'price', label: 'El precio es demasiado alto' },
  { value: 'scope', label: 'El alcance no se ajusta a mis necesidades' },
  { value: 'timing', label: 'El plazo no me funciona' },
  { value: 'competitor', label: 'Elegí otro proveedor' },
  { value: 'budget', label: 'Limitaciones de presupuesto' },
  { value: 'postponed', label: 'El proyecto fue pospuesto' },
  { value: 'other', label: 'Otro motivo' },
];

export function DeclineQuoteDialog({
  open,
  onOpenChange,
  quote,
  accessToken,
  onDeclined,
}: DeclineQuoteDialogProps) {
  const [reason, setReason] = useState<string>('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await declineQuote({
        accessToken,
        reason: reason || undefined,
        comment: comment.trim() || undefined,
      });

      if (result.success) {
        toast.success('Cotización rechazada');
        onDeclined();
      } else {
        toast.error(result.error || 'No se pudo rechazar la cotización');
      }
    } catch {
      toast.error('Ocurrió un error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      // Reset form state
      setReason('');
      setComment('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Rechazar cotización
          </DialogTitle>
          <DialogDescription>
            Indique a {quote.business.name} por qué rechaza la cotización. Sus
            comentarios nos ayudan a mejorar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reason Selection */}
          <div className="space-y-2">
            <Label htmlFor="decline-reason">Motivo (opcional)</Label>
            <Select value={reason} onValueChange={setReason} disabled={isSubmitting}>
              <SelectTrigger id="decline-reason">
                <SelectValue placeholder="Seleccione un motivo..." />
              </SelectTrigger>
              <SelectContent>
                {DECLINE_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Comments */}
          <div className="space-y-2">
            <Label htmlFor="decline-comment">Comentarios adicionales (opcional)</Label>
            <Textarea
              id="decline-comment"
              placeholder="Comentarios adicionales que desee compartir..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isSubmitting}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rechazando...
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Rechazar cotización
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
