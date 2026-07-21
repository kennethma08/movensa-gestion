'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { deleteWorkspace } from '@/lib/settings/actions';

export function DangerZone() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (confirmation !== 'DELETE') return;

    setError(null);
    setIsDeleting(true);

    try {
      const result = await deleteWorkspace();
      if (result.success) {
        router.push('/');
      } else {
        setError(result.error || 'No se pudo eliminar el espacio de trabajo');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Zona de riesgo
        </CardTitle>
        <CardDescription>
          Acciones irreversibles que eliminan información
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Eliminar espacio de trabajo</h4>
            <p className="text-sm text-muted-foreground">
              Elimine permanentemente este espacio de trabajo y todos sus datos.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">Eliminar espacio de trabajo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Eliminar espacio de trabajo
                </DialogTitle>
                <DialogDescription>
                  Esta acción no se puede deshacer. Se eliminarán permanentemente el
                  espacio de trabajo y todos sus datos asociados, incluidos:
                </DialogDescription>
              </DialogHeader>

              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 my-4">
                <li>Todas las cotizaciones y facturas</li>
                <li>Todos los clientes</li>
                <li>Todas las tarifas y plantillas</li>
                <li>El acceso de todos los miembros del equipo</li>
              </ul>

              <div className="grid gap-2">
                <Label htmlFor="confirmation">
                  Escriba <strong>DELETE</strong> para confirmar
                </Label>
                <Input
                  id="confirmation"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder="DELETE"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isDeleting}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={confirmation !== 'DELETE' || isDeleting}
                >
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Eliminar espacio de trabajo
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
