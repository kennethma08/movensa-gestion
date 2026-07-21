'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Key, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { generateApiKey, revokeApiKey } from '@/lib/api-keys/actions';
import type { ApiKeyListItem } from '@/lib/api-keys/actions';
import { formatDate } from '@/lib/utils';

interface ApiKeysManagerProps {
  keys: ApiKeyListItem[];
}

export function ApiKeysManager({ keys }: ApiKeysManagerProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const handleCreate = async () => {
    if (!keyName.trim()) {
      toast.error('Indique un nombre para la clave');
      return;
    }
    setIsCreating(true);
    try {
      const result = await generateApiKey({ name: keyName });
      if (!result.success) {
        toast.error(result.error || 'No se pudo crear la clave de API');
        return;
      }
      setNewKey(result.key!);
      setKeyName('');
      router.refresh();
    } catch {
      toast.error('No se pudo crear la clave de API');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyKey = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      toast.success('Clave copiada al portapapeles');
    }
  };

  const handleCloseNewKey = () => {
    setNewKey(null);
    setCreateOpen(false);
  };

  const handleRevoke = async () => {
    if (!revokeId) return;
    setIsRevoking(true);
    try {
      const result = await revokeApiKey(revokeId);
      if (!result.success) {
        toast.error(result.error || 'No se pudo revocar la clave');
        return;
      }
      toast.success('Clave de API revocada');
      setRevokeId(null);
      router.refresh();
    } catch {
      toast.error('No se pudo revocar la clave');
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Claves de API</CardTitle>
            <CardDescription>
              Utilice claves privadas para autenticar integraciones con la API del sistema.
            </CardDescription>
          </div>
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Crear clave
          </Button>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Key className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No hay claves de API activas.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{key.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-mono">{key.keyPrefix}...••••••</span>
                      <span>Creada {formatDate(key.createdAt)}</span>
                      {key.lastUsedAt && (
                        <span>Último uso {formatDate(key.lastUsedAt)}</span>
                      )}
                      {key.expiresAt && (
                        <span>
                          Vence {formatDate(key.expiresAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setRevokeId(key.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Key Dialog */}
      <Dialog open={createOpen && !newKey} onOpenChange={(open) => !open && setCreateOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear clave de API</DialogTitle>
            <DialogDescription>
              Asigne un nombre que permita identificar la integración.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="key-name">Nombre de la clave</Label>
              <Input
                id="key-name"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="Por ejemplo: Integración del sitio web"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isCreating}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isCreating || !keyName.trim()}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generar clave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Key Display Dialog */}
      <Dialog open={!!newKey} onOpenChange={() => handleCloseNewKey()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clave de API creada</DialogTitle>
            <DialogDescription>
              Copie la clave ahora. Por seguridad, no volverá a mostrarse.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="flex items-center gap-2">
              <Input
                value={newKey || ''}
                readOnly
                className="font-mono text-xs"
              />
              <Button variant="outline" size="icon" onClick={handleCopyKey}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCloseNewKey}>Listo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation */}
      <AlertDialog open={!!revokeId} onOpenChange={() => setRevokeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revocar clave de API</AlertDialogTitle>
            <AlertDialogDescription>
              La clave quedará deshabilitada permanentemente y las integraciones que la utilicen dejarán de funcionar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={isRevoking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revocar clave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
