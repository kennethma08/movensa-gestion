'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { DataTable } from '@/components/ui/data-table/data-table';
import { getClientColumns, clientTypeOptions } from './clients-columns';
import { ClientListItem, PaginatedClients } from '@/lib/clients/types';
import { User, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { deleteClient, deleteClients } from '@/lib/clients/actions';
import { toast } from 'sonner';
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

interface ClientsDataTableProps {
  data: PaginatedClients;
}

export function ClientsDataTable({ data }: ClientsDataTableProps) {
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<ClientListItem[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await deleteClient(deleteId);
      toast.success('Cliente eliminado correctamente');
      setDeleteId(null);
      router.refresh();
    } catch {
      toast.error('No se pudo eliminar el cliente');
    } finally {
      setIsDeleting(false);
    }
  };

  // Bug #214: Track confirmation state for bulk delete
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;

    setIsDeleting(true);
    try {
      const result = await deleteClients(selectedRows.map((c) => c.id));
      toast.success(`${result.deleted} clientes eliminados correctamente`);
      setSelectedRows([]);
      setShowBulkDeleteConfirm(false);
      router.refresh();
    } catch {
      toast.error('No se pudieron eliminar los clientes');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = getClientColumns({
    onView: (client) => {
      router.push(`/clients/${client.id}`);
    },
    onEdit: (client) => {
      router.push(`/clients/${client.id}/edit`);
    },
    onDelete: (client) => {
      setDeleteId(client.id);
    },
    onCreateQuote: (client) => {
      router.push(`/quotes/new?clientId=${client.id}`);
    },
    onCreateInvoice: (client) => {
      router.push(`/invoices/new?clientId=${client.id}`);
    },
  });

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-16">
      <User className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">No hay clientes</h3>
      <p className="text-muted-foreground mb-4">
        Agregue el primer cliente para comenzar
      </p>
      <Button asChild>
        <Link href="/clients/new">
          <Plus className="mr-2 h-4 w-4" />
          Agregar cliente
        </Link>
      </Button>
    </div>
  );

  return (
    <>
      {selectedRows.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-muted-foreground">
            {selectedRows.length} seleccionado(s)
          </span>
          {/* Bug #214: Confirmation before bulk delete */}
          {showBulkDeleteConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-destructive font-medium">
                ¿Eliminar {selectedRows.length} clientes?
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Eliminando...' : 'Confirmar'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowBulkDeleteConfirm(true)}
              disabled={isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar seleccionados
            </Button>
          )}
        </div>
      )}

      <DataTable
        columns={columns}
        data={data.data}
        filterKey="name"
        filterPlaceholder="Buscar clientes..."
        statusOptions={clientTypeOptions}
        statusFilterKey="type"
        pageSizes={[10, 25, 50, 100]}
        emptyState={emptyState}
        onRowSelect={setSelectedRows}
        onRowClick={(row) => router.push(`/clients/${row.id}`)}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar cliente</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Desea eliminar este cliente? Esta acción no se puede deshacer.
              Las cotizaciones y facturas asociadas se conservarán, pero dejarán
              de estar vinculadas con el cliente.
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
