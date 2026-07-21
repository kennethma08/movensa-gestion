'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Badge } from '@/components/ui/badge';
import { cancelScheduledEmail } from '@/lib/email/actions';
import type { ScheduledEmailListItem } from '@/lib/email/types';

interface ScheduledEmailListProps {
  emails: ScheduledEmailListItem[];
}

type StatusConfigItem = {
  icon: typeof Clock;
  variant: 'default' | 'secondary' | 'destructive';
  label: string;
};

const statusConfig: Record<string, StatusConfigItem> = {
  pending: { icon: Clock, variant: 'secondary', label: 'Pendiente' },
  sent: { icon: CheckCircle, variant: 'default', label: 'Enviado' },
  failed: { icon: AlertCircle, variant: 'destructive', label: 'Fallido' },
  cancelled: { icon: XCircle, variant: 'secondary', label: 'Cancelado' },
};

const defaultConfig: StatusConfigItem = { icon: Clock, variant: 'secondary', label: 'Pendiente' };

export function ScheduledEmailList({ emails }: ScheduledEmailListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [cancelId, setCancelId] = useState<string | null>(null);

  const handleCancel = async () => {
    if (!cancelId) return;
    startTransition(async () => {
      try {
        await cancelScheduledEmail(cancelId);
        setCancelId(null);
        router.refresh();
      } catch (error) {
        console.error('Failed to cancel scheduled email:', error);
      }
    });
  };

  if (emails.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Mail className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No hay correos programados</h3>
          <p className="text-muted-foreground text-center mt-1">
            Los correos aparecerán aquí cuando configure recordatorios automáticos.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Correos programados</CardTitle>
          <CardDescription>
            Consulte y administre los correos que se enviarán más adelante.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Destinatario</TableHead>
                <TableHead>Asunto</TableHead>
                <TableHead>Programado para</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emails.map((email) => {
                const config = statusConfig[email.status] ?? defaultConfig;
                const StatusIcon = config.icon;
                return (
                  <TableRow key={email.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{email.recipientName || 'Desconocido'}</p>
                        <p className="text-sm text-muted-foreground">
                          {email.recipientEmail}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {email.subject}
                    </TableCell>
                    <TableCell>
                      {new Intl.DateTimeFormat('es-CR', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                        timeZone: 'America/Costa_Rica',
                      }).format(new Date(email.scheduledFor))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.variant} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {email.status === 'pending' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Más acciones">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setCancelId(email.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <X className="mr-2 h-4 w-4" />
                              Cancelar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar correo programado</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Confirma que desea cancelar este correo programado? Esta acción
              no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Conservar programación</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancelar correo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
