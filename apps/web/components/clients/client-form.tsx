'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { createClientSchema, type CreateClientInput } from '@/lib/validations/client';
import { cn } from '@/lib/utils';

interface ClientFormProps {
  defaultValues?: Partial<CreateClientInput>;
  onSubmit: (data: CreateClientInput) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function ClientForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = 'Guardar cliente',
}: ClientFormProps) {
  const form = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      type: 'individual',
      name: '',
      email: '',
      phone: '',
      website: '',
      company: '',
      taxId: '',
      notes: '',
      tags: [],
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      },
      contacts: [],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'contacts',
  });

  const clientType = form.watch('type');

  // Bug #202: Wrap in try/catch so server errors show feedback
  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await onSubmit(data);
    } catch {
      form.setError('root', { message: 'No se pudo guardar el cliente. Inténtelo nuevamente.' });
    }
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Información básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de cliente</Label>
              <Select
                value={clientType}
                onValueChange={(value) => form.setValue('type', value as 'individual' | 'company')}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Seleccione un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Persona</SelectItem>
                  <SelectItem value="company">Empresa</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.type && (
                <p className="text-sm text-destructive">{form.formState.errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">{clientType === 'company' ? 'Nombre del contacto' : 'Nombre completo'} *</Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder={clientType === 'company' ? 'Nombre del contacto principal' : 'Nombre y apellidos'}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
          </div>

          {clientType === 'company' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company">Nombre de la empresa</Label>
                <Input
                  id="company"
                  {...form.register('company')}
                  placeholder="Nombre de la empresa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxId">Identificación tributaria</Label>
                <Input
                  id="taxId"
                  {...form.register('taxId')}
                  placeholder="123-45-6789"
                />
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico *</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                placeholder="cliente@ejemplo.com"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                {...form.register('phone')}
                placeholder="+506 0000-0000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Sitio web</Label>
            <Input
              id="website"
              type="text"
              {...form.register('website')}
              placeholder="ejemplo.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle>Dirección</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.formState.errors.address && typeof form.formState.errors.address.message === 'string' && (
            <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="address.street">Dirección exacta</Label>
            <Input
              id="address.street"
              {...form.register('address.street')}
              placeholder="Señas de la dirección"
            />
            {form.formState.errors.address?.street && (
              <p className="text-sm text-destructive">{form.formState.errors.address.street.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="address.city">Ciudad</Label>
              <Input
                id="address.city"
                {...form.register('address.city')}
                placeholder="Ciudad"
              />
              {form.formState.errors.address?.city && (
                <p className="text-sm text-destructive">{form.formState.errors.address.city.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address.state">Provincia o región</Label>
              <Input
                id="address.state"
                {...form.register('address.state')}
                placeholder="Provincia"
              />
              {form.formState.errors.address?.state && (
                <p className="text-sm text-destructive">{form.formState.errors.address.state.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="address.postalCode">Código postal</Label>
              <Input
                id="address.postalCode"
                {...form.register('address.postalCode')}
                placeholder="10001"
              />
              {form.formState.errors.address?.postalCode && (
                <p className="text-sm text-destructive">{form.formState.errors.address.postalCode.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address.country">País</Label>
              <Input
                id="address.country"
                {...form.register('address.country')}
                placeholder="Costa Rica"
              />
              {form.formState.errors.address?.country && (
                <p className="text-sm text-destructive">{form.formState.errors.address.country.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Contacts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Contactos adicionales</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ name: '', email: '', phone: '', role: '', isPrimary: false })}
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar contacto
          </Button>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">No se han agregado contactos adicionales.</p>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="relative rounded-lg border p-4"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                  <div className="grid gap-4 pr-8 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nombre</Label>
                      <Input
                        {...form.register(`contacts.${index}.name`)}
                        placeholder="Nombre del contacto"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Correo electrónico</Label>
                      <Input
                        type="email"
                        {...form.register(`contacts.${index}.email`)}
                        placeholder="contacto@ejemplo.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono</Label>
                      <Input
                        type="tel"
                        {...form.register(`contacts.${index}.phone`)}
                        placeholder="+506 0000-0000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cargo</Label>
                      <Input
                        {...form.register(`contacts.${index}.role`)}
                        placeholder="Ej.: Gerente de proyecto"
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center space-x-2">
                    {/* Bug #203: Only one contact can be primary — uncheck others */}
                    <Checkbox
                      id={`contacts.${index}.isPrimary`}
                      checked={form.watch(`contacts.${index}.isPrimary`)}
                      onCheckedChange={(checked) => {
                        if (checked === true) {
                          // Uncheck all other contacts
                          fields.forEach((_, i) => {
                            if (i !== index) form.setValue(`contacts.${i}.isPrimary`, false);
                          });
                        }
                        form.setValue(`contacts.${index}.isPrimary`, checked === true);
                      }}
                    />
                    <Label htmlFor={`contacts.${index}.isPrimary`} className="text-sm font-normal">
                      Contacto principal
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notas</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            {...form.register('notes')}
            placeholder="Notas internas sobre este cliente..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
