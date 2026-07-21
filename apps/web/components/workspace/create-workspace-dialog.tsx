'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createWorkspace } from '@/lib/workspace/actions';

interface CreateWorkspaceDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function CreateWorkspaceDialog({ trigger, onSuccess }: CreateWorkspaceDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await createWorkspace({ name });
      setOpen(false);
      setName('');
      onSuccess?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el espacio de trabajo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo espacio de trabajo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Crear espacio de trabajo</DialogTitle>
            <DialogDescription>
              Cree un espacio para organizar por separado sus clientes, cotizaciones y facturas.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre del espacio de trabajo</Label>
              <Input
                id="name"
                placeholder="Mi negocio"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || name.trim().length < 2}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear espacio de trabajo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
