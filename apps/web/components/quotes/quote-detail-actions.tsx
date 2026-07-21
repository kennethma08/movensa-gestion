'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Copy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { sendQuote, duplicateQuote } from '@/lib/quotes/actions';

interface QuoteDetailActionsProps {
  quoteId: string;
  status: string;
}

export function SendQuoteButton({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    setIsSending(true);
    try {
      const result = await sendQuote(quoteId);
      if (result.success) {
        if (result.emailSent) {
          toast.success('Cotización enviada y correo entregado');
        } else {
          toast.warning('La cotización se marcó como enviada, pero el correo no pudo entregarse. Revise la configuración del correo.');
        }
        router.refresh();
      } else {
        toast.error(result.error || 'No se pudo enviar la cotización');
      }
    } catch {
      toast.error('No se pudo enviar la cotización');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Button size="sm" onClick={handleSend} disabled={isSending}>
      {isSending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Send className="mr-2 h-4 w-4" />
      )}
      Enviar al cliente
    </Button>
  );
}

export function DuplicateQuoteButton({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [isDuplicating, setIsDuplicating] = useState(false);

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      const result = await duplicateQuote(quoteId);
      if (result.success && result.quoteId) {
        toast.success('Cotización duplicada');
        router.push(`/quotes/${result.quoteId}`);
      }
    } catch {
      toast.error('No se pudo duplicar la cotización');
    } finally {
      setIsDuplicating(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleDuplicate} disabled={isDuplicating}>
      {isDuplicating ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Copy className="mr-2 h-4 w-4" />
      )}
      Duplicate
    </Button>
  );
}
