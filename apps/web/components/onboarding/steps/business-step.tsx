'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowRight, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateBusinessProfile } from '@/lib/settings/actions';

const businessSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  website: z.string().transform((val) => {
    if (val && !val.startsWith('http://') && !val.startsWith('https://')) {
      return `https://${val}`;
    }
    return val;
  }).pipe(z.string().url('Please enter a valid URL')).optional().or(z.literal('')),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

type BusinessFormData = z.infer<typeof businessSchema>;

interface OnboardingBusinessStepProps {
  onNext: () => void;
  initialComplete?: boolean;
}

export function OnboardingBusinessStep({ onNext, initialComplete }: OnboardingBusinessStepProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
  });

  const onSubmit = (data: BusinessFormData) => {
    setError(null);
    startTransition(async () => {
      try {
        await updateBusinessProfile({
          businessName: data.businessName,
          email: data.email,
          phone: data.phone || undefined,
          website: data.website || undefined,
          address: {
            street: data.street || '',
            city: data.city || '',
            state: data.state || '',
            postalCode: data.zipCode || '',
            country: data.country || '',
          },
        });

        router.refresh();
        onNext();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo guardar el perfil del negocio');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="text-center mb-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Cuéntenos sobre su negocio</h3>
        <p className="text-sm text-muted-foreground">
          This information will appear on your quotes and invoices
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="businessName">Nombre del negocio *</Label>
          <Input
            id="businessName"
            {...register('businessName')}
            placeholder="Nombre de su empresa"
          />
          {errors.businessName && (
            <p className="text-sm text-destructive">{errors.businessName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico *</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="correo@suempresa.com"
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            {...register('phone')}
            placeholder="+506 0000-0000"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="website">Sitio web</Label>
          <Input
            id="website"
            {...register('website')}
            placeholder="https://suempresa.com"
          />
          {errors.website && (
            <p className="text-sm text-destructive">{errors.website.message}</p>
          )}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="street">Dirección exacta</Label>
          <Textarea
            id="street"
            {...register('street')}
            placeholder="Dirección exacta"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Ciudad</Label>
          <Input id="city" {...register('city')} placeholder="Ciudad" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">Provincia o región</Label>
          <Input id="state" {...register('state')} placeholder="NY" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="zipCode">Código postal</Label>
          <Input id="zipCode" {...register('zipCode')} placeholder="10001" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">País</Label>
          <Input id="country" {...register('country')} placeholder="Costa Rica" />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="mr-2 h-4 w-4" />
          )}
          Continue
        </Button>
      </div>
    </form>
  );
}
