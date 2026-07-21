'use client';

import { useState } from 'react';
import { Loader2, PenLine } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SignaturePad } from './signature-pad';
import { counterSignContract } from '@/lib/contracts/actions';
import type { SignatureData } from '@/lib/contracts/types';

interface CountersignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  contractName: string;
  onCountersigned?: () => void;
}

export function CountersignDialog({
  open,
  onOpenChange,
  contractId,
  contractName,
  onCountersigned,
}: CountersignDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signature, setSignature] = useState<SignatureData | null>(null);

  const handleSubmit = async () => {
    if (!signature) {
      toast.error('Ingrese su firma');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await counterSignContract(contractId, signature);
      if (!result.success) {
        toast.error(result.error || 'No se pudo refrendar el contrato');
        return;
      }
      toast.success('Contrato refrendado correctamente');
      onOpenChange(false);
      onCountersigned?.();
    } catch {
      toast.error('No se pudo refrendar el contrato');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[600px] !max-h-[85vh] !p-0 !gap-0 !flex !flex-col overflow-hidden">
        <div className="p-6 pb-3 shrink-0">
          <DialogHeader>
            <DialogTitle>Refrendar contrato</DialogTitle>
            <DialogDescription>
              Aplique la firma de su empresa a &quot;{contractName}&quot;.
              El cliente ya firmó este contrato.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4 min-h-0">
          <SignaturePad onSignatureChange={setSignature} />

          <p className="text-xs text-muted-foreground">
            Al refrendar, confirma que revisó y acepta los términos del contrato.
            Su firma y la fecha se conservarán como registro de verificación.
          </p>
        </div>

        <div className="shrink-0 border-t p-4 bg-background">
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !signature}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <PenLine className="mr-2 h-4 w-4" />
              Refrendar
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
