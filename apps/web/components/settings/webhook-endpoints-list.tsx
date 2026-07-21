'use client';

import * as React from 'react';
import { Plus, Trash2, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { deleteWebhookEndpoint, updateWebhookEndpoint } from '@/lib/webhooks/actions';
import { WebhookEndpointForm } from './webhook-endpoint-form';
import { WebhookDeliveryLog } from './webhook-delivery-log';
import { toast } from 'sonner';

interface EndpointItem {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  totalDeliveries: number;
}

interface WebhookEndpointsListProps {
  initialEndpoints: EndpointItem[];
}

export function WebhookEndpointsList({ initialEndpoints }: WebhookEndpointsListProps) {
  const [endpoints, setEndpoints] = React.useState<EndpointItem[]>(initialEndpoints);
  const [showForm, setShowForm] = React.useState(false);
  const [editingEndpoint, setEditingEndpoint] = React.useState<EndpointItem | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [viewDeliveriesId, setViewDeliveriesId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [createdSecret, setCreatedSecret] = React.useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const result = await deleteWebhookEndpoint(deleteId);
      if (result.success) {
        setEndpoints((prev) => prev.filter((ep) => ep.id !== deleteId));
        toast.success('Punto de conexión eliminado');
      } else {
        toast.error(result.error || 'No se pudo eliminar');
      }
    } catch {
      toast.error('No se pudo eliminar el punto de conexión');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleToggleActive = async (endpoint: EndpointItem) => {
    try {
      const result = await updateWebhookEndpoint(endpoint.id, {
        isActive: !endpoint.isActive,
      });
      if (result.success) {
        setEndpoints((prev) =>
          prev.map((ep) =>
            ep.id === endpoint.id ? { ...ep, isActive: !ep.isActive } : ep
          )
        );
        toast.success(endpoint.isActive ? 'Webhook desactivado' : 'Webhook activado');
      } else {
        toast.error(result.error || 'No se pudo actualizar');
      }
    } catch {
      toast.error('No se pudo actualizar el punto de conexión');
    }
  };

  const handleCreated = (endpoint: EndpointItem & { secret?: string }) => {
    setEndpoints((prev) => [endpoint, ...prev]);
    setShowForm(false);
    if (endpoint.secret) {
      setCreatedSecret(endpoint.secret);
    }
  };

  const handleUpdated = (endpoint: EndpointItem) => {
    setEndpoints((prev) =>
      prev.map((ep) => (ep.id === endpoint.id ? endpoint : ep))
    );
    setEditingEndpoint(null);
  };

  return (
    <div className="space-y-6">
      {/* Secret display (shown once after creation) */}
      {createdSecret && (
        <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="text-base">Clave secreta del webhook creada</CardTitle>
            <CardDescription>
              Copie esta clave ahora. No volverá a mostrarse.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <code className="block rounded bg-muted p-3 font-mono text-sm break-all">
              {createdSecret}
            </code>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(createdSecret);
                  toast.success('Clave copiada al portapapeles');
                }}
              >
                Copiar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCreatedSecret(null)}
              >
                Ocultar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Puntos de conexión de webhooks</CardTitle>
            <CardDescription>
              Envíe notificaciones de eventos en tiempo real a servicios externos.
            </CardDescription>
          </div>
          <Button onClick={() => { setShowForm(true); setEditingEndpoint(null); }}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar punto de conexión
          </Button>
        </CardHeader>
        <CardContent>
          {endpoints.length === 0 && !showForm ? (
            <p className="py-8 text-center text-muted-foreground">
              No hay puntos de conexión configurados. Agregue uno para enviar notificaciones de eventos.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Eventos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {endpoints.map((endpoint) => (
                  <TableRow key={endpoint.id}>
                    <TableCell className="font-mono text-sm max-w-[300px] truncate">
                      {endpoint.url}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {endpoint.events.length <= 3 ? (
                          endpoint.events.map((event) => (
                            <Badge key={event} variant="secondary" className="text-xs">
                              {event}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            {endpoint.events.length} eventos
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={endpoint.isActive ? 'default' : 'outline'}>
                        {endpoint.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewDeliveriesId(endpoint.id)}
                          title="Ver entregas"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(endpoint)}
                          title={endpoint.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {endpoint.isActive ? (
                            <ToggleRight className="h-4 w-4" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingEndpoint(endpoint);
                            setShowForm(true);
                          }}
                          title="Editar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(endpoint.id)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit form dialog */}
      {showForm && (
        <WebhookEndpointForm
          endpoint={editingEndpoint}
          onCreated={handleCreated}
          onUpdated={handleUpdated}
          onCancel={() => { setShowForm(false); setEditingEndpoint(null); }}
        />
      )}

      {/* Delivery log dialog */}
      {viewDeliveriesId && (
        <WebhookDeliveryLog
          endpointId={viewDeliveriesId}
          onClose={() => setViewDeliveriesId(null)}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar punto de conexión</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán permanentemente este punto de conexión y todo su historial de entregas.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
