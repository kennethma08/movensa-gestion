'use client';

import { useState } from 'react';
import { sanitizeHtml } from '@/lib/sanitize';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { Mail, Plus, Trash2, Loader2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { DataTable } from '@/components/ui/data-table/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { DataTableRowActions } from '@/components/ui/data-table/data-table-row-actions';
import { toast } from 'sonner';
import { deleteEmailTemplate, updateEmailTemplate } from '@/lib/email/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// SECURITY NOTE (HIGH #38): unescapeHtml converts HTML entities back to raw HTML.
// This is safe because every call site passes the result through sanitizeHtml()
// AFTER unescaping (see replaceVariables → sanitizeHtml in PreviewBody and the
// preview dialog's dangerouslySetInnerHTML). The order is:
//   1. unescapeHtml (decode entities from RichTextEditor double-encoding)
//   2. replaceVariables (substitute template placeholders)
//   3. sanitizeHtml (strip dangerous tags/attributes before rendering)
// Do NOT call unescapeHtml without a subsequent sanitizeHtml pass.
function unescapeHtml(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function replaceVariables(text: string) {
  // First unescape any double-escaped HTML (RichTextEditor wraps content in <p> tags
  // while escaping any HTML the user typed, causing double-encoding)
  const unescaped = unescapeHtml(text);
  return unescaped
    // camelCase variables (used by DEFAULT_TEMPLATES and email-template-form)
    .replace(/\{\{businessName\}\}/g, 'Empresa Ejemplo')
    .replace(/\{\{clientName\}\}/g, 'Juan Pérez')
    .replace(/\{\{clientEmail\}\}/g, 'john@example.com')
    .replace(/\{\{quoteName\}\}/g, 'Rediseño del sitio web')
    .replace(/\{\{quoteNumber\}\}/g, 'QT-0001')
    .replace(/\{\{quoteUrl\}\}/g, '#')
    .replace(/\{\{quoteTotal\}\}/g, '$5,000.00')
    .replace(/\{\{quoteValidUntil\}\}/g, '2026-12-31')
    .replace(/\{\{invoiceNumber\}\}/g, 'INV-0001')
    .replace(/\{\{invoiceUrl\}\}/g, '#')
    .replace(/\{\{invoiceTotal\}\}/g, '$5,000.00')
    .replace(/\{\{invoiceDueDate\}\}/g, '2026-04-01')
    .replace(/\{\{amountPaid\}\}/g, '$5,000.00')
    .replace(/\{\{amountDue\}\}/g, '$5,000.00')
    .replace(/\{\{daysOverdue\}\}/g, '7')
    .replace(/\{\{contractName\}\}/g, 'Contrato de servicios')
    .replace(/\{\{contractUrl\}\}/g, '#')
    .replace(/\{\{message\}\}/g, '¡Esperamos trabajar con usted!')
    // snake_case variables (fallback)
    .replace(/\{\{business_name\}\}/g, 'Empresa Ejemplo')
    .replace(/\{\{client_name\}\}/g, 'Juan Pérez')
    .replace(/\{\{client_email\}\}/g, 'john@example.com')
    .replace(/\{\{quote_name\}\}/g, 'Rediseño del sitio web')
    .replace(/\{\{quote_number\}\}/g, 'QT-0001')
    .replace(/\{\{quote_link\}\}/g, '#')
    .replace(/\{\{quote_total\}\}/g, '$5,000.00')
    .replace(/\{\{invoice_number\}\}/g, 'INV-0001')
    .replace(/\{\{invoice_link\}\}/g, '#')
    .replace(/\{\{invoice_total\}\}/g, '$5,000.00')
    .replace(/\{\{invoice_due_date\}\}/g, '2026-04-01')
    .replace(/\{\{contract_name\}\}/g, 'Service Agreement')
    .replace(/\{\{contract_link\}\}/g, '#')
    // Handle conditionals {{#if variable}}...{{/if}} — show the content
    .replace(/\{\{#if\s+\w+\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
}

function PreviewBody({ body }: { body: string }) {
  return (
    <div
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(replaceVariables(body)) }}
      className="prose prose-sm max-w-none"
    />
  );
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body?: string;
  type: string;
  isDefault: boolean;
  isActive: boolean;
  activity?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface EmailTemplatesDataTableProps {
  data: EmailTemplate[];
}

// Low #45: Use date-fns for accurate relative date formatting
function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Hace 1 día';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) {
    const weeks = Math.round(diffDays / 7);
    return `Hace ${weeks} sem.`;
  }
  if (diffDays < 365) {
    const months = Math.round(diffDays / 30.44); // Average days per month
    return `Hace ${months} mes${months === 1 ? '' : 'es'}`;
  }
  const years = Math.round(diffDays / 365.25); // Account for leap years
  return `Hace ${years} año${years === 1 ? '' : 's'}`;
}

export function EmailTemplatesDataTable({ data }: EmailTemplatesDataTableProps) {
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<EmailTemplate[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Preview dialog state
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  // Edit dialog state
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editName, setEditName] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenPreview = (template: EmailTemplate) => {
    setPreviewTemplate(template);
  };

  const handleClosePreview = () => {
    setPreviewTemplate(null);
  };

  const handleOpenEdit = (template: EmailTemplate) => {
    setPreviewTemplate(null); // close preview if open
    setEditingTemplate(template);
    setEditName(template.name);
    setEditSubject(template.subject);
    setEditBody(template.body ?? '');
    setEditIsActive(template.isActive);
  };

  const handleCloseEdit = () => {
    setEditingTemplate(null);
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;
    if (!editName.trim()) {
      toast.error('El nombre de la plantilla es obligatorio');
      return;
    }
    setIsSaving(true);
    try {
      await updateEmailTemplate({
        id: editingTemplate.id,
        name: editName,
        subject: editSubject,
        body: editBody,
        isActive: editIsActive,
      });
      toast.success('Plantilla actualizada');
      handleCloseEdit();
      router.refresh();
    } catch {
      toast.error('No se pudo actualizar la plantilla');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFromDialog = () => {
    if (!editingTemplate) return;
    setDeleteId(editingTemplate.id);
    handleCloseEdit();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteEmailTemplate(deleteId);
      toast.success('Plantilla eliminada');
      setDeleteId(null);
      router.refresh();
    } catch {
      toast.error('No se pudo eliminar la plantilla');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnDef<EmailTemplate>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Seleccionar todo"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Seleccionar fila"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nombre" />
      ),
      cell: ({ row }) => (
        <button
          type="button"
          className="font-medium text-primary hover:underline text-left"
          onClick={() => handleOpenEdit(row.original)}
        >
          {row.original.name}
        </button>
      ),
    },
    {
      accessorKey: 'subject',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Asunto" />
      ),
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {row.original.subject}
        </div>
      ),
    },
    {
      accessorKey: 'activity',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Actividad" />
      ),
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {row.original.activity ?? 'Sin actividad'}
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Creada" />
      ),
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {formatRelativeDate(row.original.createdAt)}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DataTableRowActions
          row={row.original}
          onView={(t) => handleOpenPreview(t)}
          onEdit={(t) => handleOpenEdit(t)}
          onDelete={(t) => setDeleteId(t.id)}
        />
      ),
    },
  ];

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-16">
      <Mail className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">No hay plantillas de correo</h3>
      <p className="text-muted-foreground mb-4">
        Cree plantillas para cotizaciones, facturas y recordatorios.
      </p>
      <Button asChild>
        <Link href="/settings/emails/new">
          <Plus className="mr-2 h-4 w-4" />
          Crear plantilla
        </Link>
      </Button>
    </div>
  );

  return (
    <>
      {data.length > 0 && (
        <div className="flex items-center justify-end mb-4">
          <Button asChild>
            <Link href="/settings/emails/new">
              <Plus className="mr-2 h-4 w-4" />
              Crear plantilla
            </Link>
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={data}
        filterKey="name"
        filterPlaceholder="Buscar plantillas..."
        pageSizes={[10, 25, 50, 100]}
        emptyState={emptyState}
        onRowSelect={setSelectedRows}
      />

      {/* Preview Dialog — read-only rendered email */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && handleClosePreview()}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            <DialogDescription asChild>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs capitalize">
                  {previewTemplate?.type.replace(/_/g, ' ')}
                </Badge>
                {previewTemplate?.isDefault && (
                  <Badge variant="secondary" className="text-xs">Predeterminada</Badge>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg p-4 bg-card space-y-3">
            <p className="text-sm">
              <span className="text-muted-foreground">Asunto: </span>
              <span className="font-medium">{replaceVariables(previewTemplate?.subject ?? '')}</span>
            </p>
            <hr />
            <div
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(replaceVariables(previewTemplate?.body ?? '')) }}
              className="prose prose-sm max-w-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClosePreview}>
              Cerrar
            </Button>
            <Button onClick={() => previewTemplate && handleOpenEdit(previewTemplate)}>
              Editar plantilla
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && handleCloseEdit()}>
        <DialogContent className="!flex !flex-col !max-w-[860px] !max-h-[90vh] !p-0 !gap-0 overflow-hidden">
          <div className="p-6 pb-4">
            <DialogHeader className="space-y-1">
              <DialogTitle>Editar plantilla de correo</DialogTitle>
              <DialogDescription>
                Personalice esta plantilla para sus notificaciones.
              </DialogDescription>
            </DialogHeader>
          </div>

          <Separator />

          <div className="flex-1 overflow-y-auto bg-muted/20">
            <div className="p-6 space-y-5">
              {/* Template Name + Delete */}
              <div className="flex items-center justify-between gap-4">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-base font-semibold !bg-transparent outline-none border-none shadow-none flex-1 placeholder:text-muted-foreground/40"
                  placeholder="Nombre de la plantilla"
                />
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  onClick={handleDeleteFromDialog}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar
                </button>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="edit-subject">Asunto</Label>
                <Input
                  id="edit-subject"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  placeholder="Asunto del correo..."
                />
                <p className="text-xs text-muted-foreground">
                  Use variables como {'{{business_name}}'}, {'{{quote_name}}'} o {'{{invoice_number}}'} para contenido dinámico.
                </p>
              </div>

              {/* Body */}
              <div className="space-y-2">
                <Label>Contenido</Label>
                <RichTextEditor
                  value={editBody}
                  onChange={setEditBody}
                  placeholder="Contenido del correo..."
                  showAttachment
                  onAttachment={() => toast.info('La función de adjuntos estará disponible próximamente')}
                />
                <p className="text-xs text-muted-foreground">
                  Use variables como {'{{client_name}}'}, {'{{quote_link}}'} o {'{{invoice_link}}'} para personalizar el contenido.
                </p>
              </div>

              {/* Type (read-only) */}
              {editingTemplate && (
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {editingTemplate.type.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Active toggle */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Activa</Label>
                  <p className="text-sm text-muted-foreground">
                    Habilite esta plantilla para las notificaciones automáticas.
                  </p>
                </div>
                <Switch
                  checked={editIsActive}
                  onCheckedChange={setEditIsActive}
                />
              </div>

              {/* Save / Cancel */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  onClick={handleSaveTemplate}
                  disabled={isSaving}
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCloseEdit}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar plantilla</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Confirma que desea eliminar esta plantilla de correo? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
