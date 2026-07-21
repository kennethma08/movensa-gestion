'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { changePassword } from '@/lib/auth/actions';
import { passwordSchema as passwordValidation } from '@/lib/validations/auth';

// Schema for changing password (requires current password)
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contraseña actual es obligatoria'),
    newPassword: passwordValidation,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'La contraseña nueva debe ser distinta de la actual',
    path: ['newPassword'],
  });

// Schema for setting password (no current password required)
const setPasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: passwordValidation,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type PasswordFormData = z.infer<typeof changePasswordSchema>;

interface ChangePasswordFormProps {
  hasExistingPassword: boolean;
}

export function ChangePasswordForm({ hasExistingPassword }: ChangePasswordFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(hasExistingPassword ? changePasswordSchema : setPasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data: PasswordFormData) {
    setIsLoading(true);

    try {
      const result = await changePassword({
        currentPassword: hasExistingPassword ? data.currentPassword : undefined,
        newPassword: data.newPassword,
      });

      if (!result.success) {
        toast.error(result.error || 'No se pudo actualizar la contraseña');
        return;
      }

      toast.success(hasExistingPassword ? 'Contraseña actualizada correctamente' : 'Contraseña definida correctamente');
      reset();
    } catch {
      toast.error('Ocurrió un error. Inténtelo nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
      {hasExistingPassword && (
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Contraseña actual</Label>
          <Input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            disabled={isLoading}
            {...register('currentPassword')}
          />
          {errors.currentPassword && (
            <p className="text-sm text-destructive">
              {errors.currentPassword.message}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="newPassword">
          {hasExistingPassword ? 'Contraseña nueva' : 'Contraseña'}
        </Label>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          disabled={isLoading}
          {...register('newPassword')}
        />
        {errors.newPassword && (
          <p className="text-sm text-destructive">
            {errors.newPassword.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar {hasExistingPassword ? 'contraseña nueva' : 'contraseña'}</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          disabled={isLoading}
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
        <p className="font-medium">Requisitos de la contraseña:</p>
        <ul className="mt-1 list-inside list-disc space-y-0.5">
          <li>Al menos 8 caracteres</li>
          <li>Una letra mayúscula</li>
          <li>Una letra minúscula</li>
          <li>Un número</li>
        </ul>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {hasExistingPassword ? 'Cambiar contraseña' : 'Definir contraseña'}
      </Button>
    </form>
  );
}
