'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { updateBusinessProfile } from '@/lib/settings/actions';
import type { BusinessProfileData } from '@/lib/settings/types';
import { COMMON_TIMEZONES, COMMON_CURRENCIES } from '@/lib/settings/types';
import { toast } from 'sonner';

const businessProfileSchema = z.object({
  businessName: z.string().min(1, 'El nombre del negocio es obligatorio').max(200),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  website: z.string().url().optional().or(z.literal('')),
  taxId: z.string().max(100).optional(),
  currency: z.string().length(3).default('USD'),
  timezone: z.string().default('UTC'),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});

type BusinessProfileFormValues = z.infer<typeof businessProfileSchema>;

interface BusinessProfileFormProps {
  initialData: BusinessProfileData | null;
}

export function BusinessProfileForm({ initialData }: BusinessProfileFormProps) {
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<BusinessProfileFormValues>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      businessName: initialData?.businessName || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      website: initialData?.website || '',
      taxId: initialData?.taxId || '',
      currency: initialData?.currency || 'USD',
      timezone: initialData?.timezone || 'UTC',
      address: initialData?.address || {},
    },
  });

  const handleSubmit = async (data: BusinessProfileFormValues) => {
    setIsSaving(true);
    try {
      await updateBusinessProfile({
        businessName: data.businessName,
        email: data.email || undefined,
        phone: data.phone || undefined,
        website: data.website || undefined,
        taxId: data.taxId || undefined,
        currency: data.currency,
        timezone: data.timezone,
        address: data.address,
      });
      toast.success('Datos del negocio actualizados');
    } catch {
      toast.error('No se pudieron actualizar los datos');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información del negocio</CardTitle>
          <CardDescription>
            Estos datos aparecerán en sus cotizaciones, contratos y facturas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Nombre del negocio *</Label>
            <Input
              id="businessName"
              {...form.register('businessName')}
              placeholder="Grupo Movensa"
            />
            {form.formState.errors.businessName && (
              <p className="text-sm text-destructive">
                {form.formState.errors.businessName.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                placeholder="business@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                {...form.register('phone')}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="website">Sitio web</Label>
              <Input
                id="website"
                {...form.register('website')}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxId">Identificación tributaria</Label>
              <Input
                id="taxId"
                {...form.register('taxId')}
                placeholder="XX-XXXXXXX"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dirección</CardTitle>
          <CardDescription>
            Dirección que aparecerá en los documentos comerciales.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="street">Dirección exacta</Label>
            <Input
              id="street"
              {...form.register('address.street')}
              placeholder="Dulce Nombre"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                {...form.register('address.city')}
                placeholder="Cartago"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Provincia</Label>
              <Input
                id="state"
                {...form.register('address.state')}
                placeholder="Cartago"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="postalCode">Código postal</Label>
              <Input
                id="postalCode"
                {...form.register('address.postalCode')}
                placeholder="12345"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">País</Label>
              <Input
                id="country"
                {...form.register('address.country')}
                placeholder="Costa Rica"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuración regional</CardTitle>
          <CardDescription>
            Defina la moneda y la zona horaria predeterminadas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="currency">Moneda</Label>
              <Select
                value={form.watch('currency')}
                onValueChange={(value) => form.setValue('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Zona horaria</Label>
              <Select
                value={form.watch('timezone')}
                onValueChange={(value) => form.setValue('timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}
