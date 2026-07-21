'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { passwordSchema } from '@/lib/validations/auth';

// Bug #448: Use shared password schema from lib/validations/auth.ts
const registerSchema = z
  .object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Ingrese un correo electrónico válido'),
    password: passwordSchema,
    confirmPassword: z.string(),
    termsAccepted: z.literal(true, { errorMap: () => ({ message: 'Debe aceptar las condiciones de uso' }) }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterFormData) {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          termsAccepted: data.termsAccepted,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'No fue posible crear la cuenta.');
        return;
      }

      toast.success('Cuenta creada. Revise su correo electrónico para verificarla.');
      router.push('/verify-email');
    } catch {
      toast.error('No fue posible crear la cuenta. Inténtelo nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo</Label>
            <Input
              id="name"
              type="text"
              placeholder="Nombre y apellidos"
              autoComplete="name"
              disabled={isLoading}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="info@grupomovensa.com"
              autoComplete="email"
              disabled={isLoading}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
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
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
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

          <div className="flex items-start space-x-2">
            {/* Bug #194: Use setValue instead of fragile synthetic event hack */}
            <Checkbox
              id="termsAccepted"
              disabled={isLoading}
              checked={watch('termsAccepted')}
              onCheckedChange={(checked) => {
                if (checked === true) {
                  setValue('termsAccepted', true, { shouldValidate: true });
                } else {
                  setValue('termsAccepted', undefined as unknown as true, { shouldValidate: true });
                }
              }}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="termsAccepted" className="text-sm font-normal cursor-pointer">
                Acepto las condiciones de uso y la política de privacidad
              </Label>
              {errors.termsAccepted && (
                <p className="text-sm text-destructive">{errors.termsAccepted.message}</p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear cuenta
          </Button>
        </form>
      </CardContent>

    </Card>
  );
}
