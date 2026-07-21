'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  FileText,
  MoreHorizontal,
  Eye,
  Send,
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
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
  DropdownMenuSeparator,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { deleteContractInstance, sendContractInstance } from '@/lib/contracts/actions';
import type { ContractInstanceListItem } from '@/lib/contracts/types';

interface ContractInstanceListProps {
  instances: ContractInstanceListItem[];
  searchQuery?: string;
  statusFilter?: string;
}

const statusConfig: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }
> = {
  draft: {
    label: 'Borrador',
    variant: 'secondary',
    icon: <FileText className="h-3 w-3" />,
  },
  sent: {
    label: 'Enviado',
    variant: 'default',
    icon: <Mail className="h-3 w-3" />,
  },
  viewed: {
    label: 'Visto',
    variant: 'outline',
    icon: <Eye className="h-3 w-3" />,
  },
  signed: {
    label: 'Signed',
    variant: 'default',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  expired: {
    label: 'Vencido',
    variant: 'destructive',
    icon: <Clock className="h-3 w-3" />,
  },
};

export function ContractInstanceList({
  instances,
  searchQuery = '',
  statusFilter = '',
}: ContractInstanceListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchQuery);
  const [status, setStatus] = useState(statusFilter);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSearch = (value: string) => {
    setSearch(value);
    updateUrl(value, status);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    updateUrl(search, value);
  };

  const updateUrl = (searchValue: string, statusValue: string) => {
    startTransition(() => {
      const params = new URLSearchParams();
      if (searchValue) params.set('search', searchValue);
      if (statusValue && statusValue !== 'all') params.set('status', statusValue);
      router.push(`/contracts?${params.toString()}`);
    });
  };

  const handleSend = async (id: string) => {
    startTransition(async () => {
      try {
        const result = await sendContractInstance(id);
        if (result.emailSent) {
          toast.success('Contrato enviado y correo entregado');
        } else {
          toast.warning('El contrato se marcó como enviado, pero el correo no pudo entregarse. Revise la configuración del correo.');
        }
        router.refresh();
      } catch (error) {
        console.error('Failed to send contract:', error);
      }
    });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    startTransition(async () => {
      try {
        await deleteContractInstance(deleteId);
        setDeleteId(null);
        router.refresh();
      } catch (error) {
        console.error('Failed to delete contract:', error);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar contratos..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={status || 'all'} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="draft">Borrador</SelectItem>
            <SelectItem value="sent">Enviado</SelectItem>
            <SelectItem value="viewed">Visto</SelectItem>
            <SelectItem value="signed">Firmado</SelectItem>
            <SelectItem value="expired">Vencido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {instances.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No hay contratos</h3>
            <p className="text-muted-foreground text-center mt-1">
              Cree un contrato a partir de una plantilla para comenzar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contrato</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Cotización</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Firmado</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instances.map((instance) => {
                const config = statusConfig[instance.status] ?? statusConfig.draft;
                return (
                  <TableRow key={instance.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/contracts/${instance.id}`}
                        className="hover:underline"
                      >
                        {instance.contractName}
                      </Link>
                    </TableCell>
                    <TableCell>{instance.clientName}</TableCell>
                    <TableCell>
                      {instance.quoteName || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={config?.variant ?? 'secondary'} className="gap-1">
                        {config?.icon}
                        {config?.label ?? instance.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {instance.signedAt ? formatDate(instance.signedAt) : '-'}
                    </TableCell>
                    <TableCell>{formatDate(instance.createdAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="More actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/contracts/${instance.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver
                            </Link>
                          </DropdownMenuItem>
                          {instance.status === 'draft' && (
                            <DropdownMenuItem
                              onClick={() => handleSend(instance.id)}
                              disabled={isPending}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Send to Client
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteId(instance.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar contrato</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this contract? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
