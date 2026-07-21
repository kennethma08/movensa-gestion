'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, Plus, Upload, X, Globe, Twitter, Linkedin, Instagram, Facebook, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateBrandingSettings, updateBusinessProfile } from '@/lib/settings/actions';
import type { BrandingSettingsData, BusinessProfileData } from '@/lib/settings/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ACCENT_PRESETS = [
  '#EF4444', '#F97316', '#F59E0B', '#22C55E',
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899',
  '#14B8A6', '#475569',
];

const COUNTRY_OPTIONS = [
  'Costa Rica', 'Estados Unidos', 'Canadá', 'Reino Unido', 'Australia',
  'Alemania', 'Francia', 'Países Bajos', 'India',
  'Singapur', 'Nueva Zelanda', 'Japón', 'Brasil',
];

const SOCIAL_PLATFORMS = [
  { id: 'website', label: 'Sitio web', icon: Globe, placeholder: 'https://susitio.com' },
  { id: 'twitter', label: 'Twitter / X', icon: Twitter, placeholder: 'https://twitter.com/username' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/company/name' },
  { id: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/username' },
  { id: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/pagename' },
  { id: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@channel' },
] as const;

const brandingSchema = z.object({
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  businessName: z.string().min(1, 'El nombre del negocio es obligatorio').max(200),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  website: z.string().url().optional().or(z.literal('')),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  socialWebsite: z.string().url().optional().or(z.literal('')),
  socialTwitter: z.string().url().optional().or(z.literal('')),
  socialLinkedin: z.string().url().optional().or(z.literal('')),
  socialInstagram: z.string().url().optional().or(z.literal('')),
  socialFacebook: z.string().url().optional().or(z.literal('')),
  socialYoutube: z.string().url().optional().or(z.literal('')),
});

type BrandingFormValues = z.infer<typeof brandingSchema>;

interface BrandingSettingsFormProps {
  initialData: BrandingSettingsData | null;
  businessData?: BusinessProfileData | null;
}

export function BrandingSettingsForm({ initialData, businessData }: BrandingSettingsFormProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const [lightLogo, setLightLogo] = React.useState<string | null>(initialData?.logoUrl || null);
  const [darkLogo, setDarkLogo] = React.useState<string | null>(initialData?.darkLogoUrl || null);
  const [socialLinks, setSocialLinks] = React.useState<{ platform: string; url: string }[]>(
    (businessData?.socialLinks as { platform: string; url: string }[]) || []
  );

  const form = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      accentColor: initialData?.accentColor || '#3B82F6',
      businessName: businessData?.businessName || '',
      email: businessData?.email || '',
      phone: businessData?.phone || '',
      website: businessData?.website || '',
      street: businessData?.address?.street || '',
      city: businessData?.address?.city || '',
      state: businessData?.address?.state || '',
      postalCode: businessData?.address?.postalCode || '',
      country: businessData?.address?.country || '',
    },
  });

  const accentColor = form.watch('accentColor');

  // Low #47: Revoke old blob URL before creating new one to prevent memory leak
  const handleLogoUpload = (type: 'light' | 'dark') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/svg+xml';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Revoke previous blob URL if it exists
        const oldUrl = type === 'light' ? lightLogo : darkLogo;
        if (oldUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(oldUrl);
        }
        const url = URL.createObjectURL(file);
        if (type === 'light') setLightLogo(url);
        else setDarkLogo(url);
      }
    };
    input.click();
  };

  const addSocialLink = () => {
    const usedPlatforms = socialLinks.map((l) => l.platform);
    const available = SOCIAL_PLATFORMS.find((p) => !usedPlatforms.includes(p.id));
    if (available) {
      setSocialLinks([...socialLinks, { platform: available.id, url: '' }]);
    }
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const updateSocialLink = (index: number, field: 'platform' | 'url', value: string) => {
    const updated = [...socialLinks];
    const current = updated[index];
    if (!current) return;
    updated[index] = { platform: current.platform, url: current.url, [field]: value };
    setSocialLinks(updated);
  };

  const handleSubmit = async (data: BrandingFormValues) => {
    setIsSaving(true);
    try {
      await Promise.all([
        updateBrandingSettings({
          accentColor: data.accentColor,
          logoUrl: lightLogo || initialData?.logoUrl || undefined,
          darkLogoUrl: darkLogo || initialData?.darkLogoUrl || undefined,
        }),
        updateBusinessProfile({
          businessName: data.businessName,
          email: data.email || undefined,
          phone: data.phone || undefined,
          website: data.website || undefined,
          address: {
            street: data.street,
            city: data.city,
            state: data.state,
            postalCode: data.postalCode,
            country: data.country,
          },
          socialLinks,
        }),
      ]);
      toast.success('Configuración de marca actualizada');
    } catch {
      toast.error('No se pudo actualizar la configuración de marca');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle>Logo</CardTitle>
          <CardDescription>
            Su identidad visual aparecerá en facturas, cotizaciones y el portal del cliente.
            Suba un PNG transparente de hasta 200 × 50 píxeles y recorte el espacio vacío.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Logo para fondo claro</Label>
              <div
                className="group relative flex h-32 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-background transition-colors hover:border-primary/50 hover:bg-muted/50"
                onClick={() => handleLogoUpload('light')}
              >
                {lightLogo ? (
                  <>
                    <img src={lightLogo} alt="Logo para fondo claro" className="max-h-20 max-w-[180px] object-contain" />
                    <button
                      type="button"
                      className="absolute right-2 top-2 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => { e.stopPropagation(); setLightLogo(null); }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-6 w-6" />
                    <span className="text-sm">Subir logo</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Logo para fondo oscuro</Label>
              <div
                className="group relative flex h-32 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-zinc-900 transition-colors hover:border-primary/50"
                onClick={() => handleLogoUpload('dark')}
              >
                {darkLogo ? (
                  <>
                    <img src={darkLogo} alt="Logo para fondo oscuro" className="max-h-20 max-w-[180px] object-contain" />
                    <button
                      type="button"
                      className="absolute right-2 top-2 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => { e.stopPropagation(); setDarkLogo(null); }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-zinc-400">
                    <Upload className="h-6 w-6" />
                    <span className="text-sm">Subir logo</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accent Color */}
      <Card>
        <CardHeader>
          <CardTitle>Color de acento</CardTitle>
          <CardDescription>
            Elija un color predefinido o ingrese un código HEX personalizado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-3 block text-sm text-muted-foreground">
              Seleccione una opción o indique su propio color.
            </Label>
            <div className="flex flex-wrap gap-2">
              {ACCENT_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => form.setValue('accentColor', color)}
                  className={cn(
                    'relative h-9 w-9 rounded-full transition-all hover:scale-110',
                    accentColor === color && 'ring-2 ring-offset-2 ring-offset-background'
                  )}
                  style={{
                    backgroundColor: color,
                    '--tw-ring-color': color,
                  } as React.CSSProperties}
                >
                  {accentColor === color && (
                    <Check className="absolute inset-0 m-auto h-4 w-4 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: accentColor || '#3B82F6' }}
            >
              <Check className="h-4 w-4 text-white" />
            </div>
            <Input
              value={accentColor || ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                  form.setValue('accentColor', val);
                }
              }}
              placeholder="#3B82F6"
              className="max-w-[200px] font-mono"
            />
          </div>
        </CardContent>
      </Card>

      {/* Business Info */}
      <Card>
        <CardHeader>
          <CardTitle>Información de su negocio</CardTitle>
          <CardDescription>
            Esta información aparecerá en cotizaciones, facturas y el portal del cliente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Nombre del negocio</Label>
              <Input
                id="businessName"
                {...form.register('businessName')}
                placeholder="Nombre de su negocio"
              />
              {form.formState.errors.businessName && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.businessName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                placeholder="negocio@ejemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                {...form.register('phone')}
                placeholder="+506 0000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessWebsite">Sitio web</Label>
              <Input
                id="businessWebsite"
                {...form.register('website')}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="street">Dirección del negocio</Label>
              <Input
                id="street"
                {...form.register('street')}
                placeholder="Dirección exacta"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">País</Label>
              <Select
                value={form.watch('country') || ''}
                onValueChange={(value) => form.setValue('country', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el país" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                {...form.register('city')}
                placeholder="Ciudad"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Provincia o región</Label>
              <Input
                id="state"
                {...form.register('state')}
                placeholder="Provincia o región"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode">Código postal</Label>
              <Input
                id="postalCode"
                {...form.register('postalCode')}
                placeholder="12345"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Redes sociales</CardTitle>
            <CardDescription>
              Agregue los enlaces de sus redes sociales. Los iconos sin enlace no se mostrarán
              en el portal del cliente.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addSocialLink}
            disabled={socialLinks.length >= SOCIAL_PLATFORMS.length}
          >
            <Plus className="mr-1 h-4 w-4" />
            Agregar red social
          </Button>
        </CardHeader>
        <CardContent>
          {socialLinks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Aún no hay redes sociales. Use &quot;Agregar red social&quot; para comenzar.
            </p>
          ) : (
            <div className="space-y-3">
              {socialLinks.map((link, index) => {
                const platformInfo = SOCIAL_PLATFORMS.find((p) => p.id === link.platform);
                const Icon = platformInfo?.icon || Globe;
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted">
                      <Icon className="h-4 w-4" />
                    </div>
                    <Select
                      value={link.platform}
                      onValueChange={(value) => updateSocialLink(index, 'platform', value)}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SOCIAL_PLATFORMS.filter(
                          (p) => p.id === link.platform || !socialLinks.some((l) => l.platform === p.id)
                        ).map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={link.url}
                      onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                      placeholder={platformInfo?.placeholder || 'https://...'}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSocialLink(index)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
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
