'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createQuote, updateQuote, sendQuote } from '@/lib/quotes/actions';
import type { ClientInfo } from './useQuoteForm';

interface UseQuoteSaveOptions {
  document: {
    id: string;
    clientId: string;
    projectId: string | null;
    title: string;
    blocks: any[];
    notes: string;
    terms: string;
    internalNotes: string;
  } | null;
  client: ClientInfo | null;
}

export function useQuoteSave({ document, client }: UseQuoteSaveOptions) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);

  const handleSave = async () => {
    // Bug #168: Prevent double-submit race condition
    if (!document || isLoading || isSending) return;

    setIsLoading(true);
    try {
      if (document.id.startsWith('temp-')) {
        const result = await createQuote({
          clientId: client?.id || document.clientId,
          projectId: document.projectId,
          title: document.title,
          blocks: document.blocks,
        });

        if (result.success && result.quote) {
          toast.success('Cotización guardada como borrador');
          router.push(`/quotes/${result.quote.id}`);
        }
      } else {
        const result = await updateQuote(document.id, {
          title: document.title,
          blocks: document.blocks,
          notes: document.notes,
          terms: document.terms,
          internalNotes: document.internalNotes,
        });

        if (result.success) {
          toast.success('Cotización guardada correctamente');
        }
      }
    } catch {
      toast.error('No se pudo guardar la cotización');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendQuote = async () => {
    // Bug #168: Prevent double-submit race condition
    if (!document || !client || isSending || isLoading) return;

    setIsSending(true);
    try {
      let quoteId = document.id;

      if (document.id.startsWith('temp-')) {
        const createResult = await createQuote({
          clientId: client.id,
          projectId: document.projectId,
          title: document.title,
          blocks: document.blocks,
        });

        if (!createResult.success || !createResult.quote) {
          throw new Error('No se pudo crear la cotización');
        }
        quoteId = createResult.quote.id;
      }

      const result = await sendQuote(quoteId);

      if (result.success) {
        if (result.emailSent) {
          toast.success('Cotización enviada y correo entregado');
        } else {
          toast.warning('La cotización quedó marcada como enviada, pero el correo no pudo entregarse. Revise la configuración de correo.');
        }
        router.push(`/quotes/${quoteId}`);
      } else {
        throw new Error(result.error || 'No se pudo enviar la cotización');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo enviar la cotización');
    } finally {
      setIsSending(false);
      setShowSendConfirm(false);
    }
  };

  return {
    isLoading,
    isSending,
    showSendConfirm,
    setShowSendConfirm,
    handleSave,
    handleSendQuote,
  };
}
