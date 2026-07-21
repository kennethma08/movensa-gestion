'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { passwordSchema } from '@/lib/validations/auth';

// Bug #448: Use shared password schema from lib/validations/auth.ts
const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Store token in ref so it survives URL clearing
  const tokenRef = React.useRef(searchParams.get('token'));
  const token = tokenRef.current;

  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [isInvalidToken, setIsInvalidToken] = React.useState(!token);

  // Bug #12: Clear token from URL/history to prevent exposure in browser history
  // Bug #48: Guard against missing window.history.replaceState in edge environments
  React.useEffect(() => {
    if (token && typeof window !== 'undefined' && window.history?.replaceState) {
      window.history.replaceState({}, '', '/reset-password');
    }
  }, [token]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  async function onSubmit(data: ResetPasswordFormData) {
    if (!token) {
      toast.error('El enlace no es válido');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error === 'Invalid or expired token') {
          setIsInvalidToken(true);
        } else {
          toast.error(result.error || 'No se pudo restablecer la contraseña');
        }
        return;
      }

      setIsSuccess(true);
      toast.success('Contraseña restablecida correctamente');

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch {
      toast.error('Ocurrió un error. Inténtelo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }

  if (isInvalidToken) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle>Enlace inválido o vencido</CardTitle>
          <CardDescription>
            Este enlace para restablecer la contraseña no es válido o ya venció.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Por seguridad, los enlaces vencen después de una hora. Solicite uno nuevo.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/forgot-password">Solicitar otro enlace</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al inicio de sesión
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle>Contraseña restablecida</CardTitle>
          <CardDescription>
            Ya puede iniciar sesión con su nueva contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" asChild>
            <Link href="/login">Ir al inicio de sesión</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Restablecer contraseña</CardTitle>
        <CardDescription>
          Ingrese su nueva contraseña.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nueva contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              disabled={isLoading}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              disabled={isLoading}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Restablecer contraseña
          </Button>

          <Button variant="ghost" className="w-full" asChild>
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio de sesión
            </Link>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
