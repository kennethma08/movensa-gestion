'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Copy, Loader2, ListChecks, Clock3, CheckCircle2, XCircle, FileEdit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { sendQuote, duplicateQuote, updateQuoteStatus } from '@/lib/quotes/actions';

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
      Duplicar
    </Button>
  );
}

type ManualQuoteStatus = 'draft' | 'under_review' | 'accepted' | 'declined';

const manualStatuses: Array<{
  value: ManualQuoteStatus;
  label: string;
  icon: typeof Clock3;
  className?: string;
}> = [
  { value: 'draft', label: 'Borrador', icon: FileEdit },
  { value: 'under_review', label: 'En estudio', icon: Clock3 },
  { value: 'accepted', label: 'Aceptada', icon: CheckCircle2, className: 'text-emerald-600' },
  { value: 'declined', label: 'Denegada', icon: XCircle, className: 'text-red-600' },
];

export function ChangeQuoteStatusButton({
  quoteId,
  currentStatus,
}: {
  quoteId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  if (currentStatus === 'converted') return null;

  const handleChange = async (status: ManualQuoteStatus) => {
    setIsUpdating(true);
    try {
      const result = await updateQuoteStatus(quoteId, status);
      if (!result.success) {
        toast.error(result.error || 'No se pudo cambiar el estado.');
        return;
      }
      const label = manualStatuses.find((item) => item.value === status)?.label.toLowerCase() || status;
      toast.success(`Cotización marcada como ${label}.`);
      router.refresh();
    } catch {
      toast.error('No se pudo cambiar el estado.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isUpdating}>
          {isUpdating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ListChecks className="mr-2 h-4 w-4" />
          )}
          Cambiar estado
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {manualStatuses
          .filter((item) => item.value !== currentStatus)
          .map((item) => {
            const Icon = item.icon;
            return (
              <DropdownMenuItem
                key={item.value}
                onClick={() => handleChange(item.value)}
                className={item.className}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </DropdownMenuItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
