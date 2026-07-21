'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Edit,
  Send,
  Download,
  Copy,
  MoreHorizontal,
  Trash2,
  Ban,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { InvoiceDocument } from '@/lib/invoices/types';
import { sendInvoice, deleteInvoice, updateInvoiceStatus, duplicateInvoice } from '@/lib/invoices/actions';

interface InvoiceActionsProps {
  invoice: InvoiceDocument;
  isOverdue: boolean;
}

export function InvoiceActions({ invoice, isOverdue }: InvoiceActionsProps) {
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isVoiding, setIsVoiding] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showVoidDialog, setShowVoidDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);

  const handleSend = async () => {
    setIsSending(true);
    try {
      const result = await sendInvoice(invoice.id);
      if (result.success) {
        if (result.emailSent) {
          toast.success('Factura enviada y correo entregado');
        } else {
          toast.warning('La factura se marcó como enviada, pero el correo no pudo entregarse. Revise la configuración del correo.');
        }
        router.refresh();
        setShowSendDialog(false);
      } else {
        toast.error(result.error || 'No se pudo enviar la factura');
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteInvoice(invoice.id);
      if (result.success) {
        toast.success('Factura eliminada correctamente');
        router.push('/invoices');
      } else {
        toast.error(result.error || 'No se pudo eliminar la factura');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleVoid = async () => {
    setIsVoiding(true);
    try {
      const result = await updateInvoiceStatus(invoice.id, 'voided');
      if (result.success) {
        toast.success('Factura anulada correctamente');
        router.refresh();
        setShowVoidDialog(false);
      } else {
        toast.error(result.error || 'No se pudo anular la factura');
      }
    } finally {
      setIsVoiding(false);
    }
  };

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      const result = await duplicateInvoice(invoice.id);
      if (result.success && result.invoiceId) {
        toast.success('Factura duplicada correctamente');
        router.push(`/invoices/${result.invoiceId}`);
      } else {
        toast.error(result.error || 'No se pudo duplicar la factura');
      }
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDownload = () => {
    window.open(`/api/download/invoice/${invoice.id}`, '_blank');
  };

  const canEdit = invoice.status === 'draft';
  const canSend = invoice.status === 'draft';
  const canVoid = invoice.status !== 'draft' && invoice.status !== 'voided' && invoice.status !== 'paid';
  // Low #56: Only allow deleting drafts — server rejects voided invoice deletion
  const canDelete = invoice.status === 'draft';
  const hasDropdownActions = canVoid || canDelete;

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleDuplicate} disabled={isDuplicating}>
          {isDuplicating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />}
          Duplicar
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Descargar PDF
        </Button>
        {canEdit && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/invoices/${invoice.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        )}
        {canSend && (
          <Button size="sm" onClick={() => setShowSendDialog(true)}>
            <Send className="mr-2 h-4 w-4" />
            Enviar al cliente
          </Button>
        )}
        {invoice.status !== 'draft' && invoice.status !== 'voided' && invoice.accessToken && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/i/${invoice.accessToken}`} target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver portal
            </Link>
          </Button>
        )}

        {hasDropdownActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="More actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canVoid && (
                <DropdownMenuItem onClick={() => setShowVoidDialog(true)} className="text-orange-600">
                  <Ban className="mr-2 h-4 w-4" />
                  Anular factura
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  {canVoid && <DropdownMenuSeparator />}
                  <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar factura
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Send Confirmation Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar factura</DialogTitle>
            <DialogDescription>
              Are you sure you want to send this invoice to the client? They will receive an email
              with a link to view and pay the invoice.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)} disabled={isSending}>
              Cancelar
            </Button>
            <Button onClick={handleSend} disabled={isSending}>
              {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar factura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void Confirmation Dialog */}
      <Dialog open={showVoidDialog} onOpenChange={setShowVoidDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anular factura</DialogTitle>
            <DialogDescription>
              Are you sure you want to void this invoice? This action cannot be undone.
              The invoice will be marked as voided and the client will no longer be able to pay it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVoidDialog(false)} disabled={isVoiding}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleVoid} disabled={isVoiding}>
              {isVoiding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Anular factura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar factura</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar factura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
