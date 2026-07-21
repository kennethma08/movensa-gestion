'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { inviteMember, type WorkspaceMemberRole } from '@/lib/settings/actions';

export function InviteMemberButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WorkspaceMemberRole>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await inviteMember(email, role);
      if (result.success) {
        setOpen(false);
        setEmail('');
        setRole('member');
        router.refresh();
      } else {
        setError(result.error || 'No se pudo invitar al miembro');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Invitar miembro
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invitar miembro del equipo</DialogTitle>
            <DialogDescription>
              Invite a una persona a colaborar en este espacio de trabajo.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="persona@ejemplo.com"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Rol</Label>
              <Select value={role} onValueChange={(v) => setRole(v as WorkspaceMemberRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador - acceso completo</SelectItem>
                  <SelectItem value="member">Miembro - crear y editar</SelectItem>
                  <SelectItem value="viewer">Observador - solo lectura</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar invitación
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
