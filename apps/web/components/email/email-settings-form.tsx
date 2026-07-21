'use client';

import * as React from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { getEmailSettings, updateEmailSettings } from '@/lib/settings/actions';

const DEFAULT_FOOTER =
  'Este correo y sus archivos adjuntos están destinados exclusivamente a la persona o entidad indicada. Si recibió este mensaje por error, notifíquelo al remitente. Se prohíbe su uso, divulgación o distribución no autorizada.';

export function EmailSettingsForm() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [signature, setSignature] = React.useState('');
  const [footer, setFooter] = React.useState(DEFAULT_FOOTER);
  const [clientEmail, setClientEmail] = React.useState('');

  // Load existing settings on mount
  React.useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getEmailSettings();
        if (settings) {
          setSignature(settings.emailSignature || '');
          setFooter(settings.emailFooter || DEFAULT_FOOTER);
          setClientEmail(settings.clientEmail || '');
        }
      } catch {
        toast.error('No se pudo cargar la configuración de correo');
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  // HIGH #37: Email settings are now properly persisted via updateEmailSettings server action.
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateEmailSettings({
        emailSignature: signature,
        emailFooter: footer,
        clientEmail: clientEmail,
      });
      toast.success('Configuración de correo guardada');
    } catch {
      toast.error('No se pudo guardar la configuración de correo');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-5 w-32 animate-pulse rounded bg-muted" />
              <div className="h-4 w-64 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-24 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Signature */}
      <Card>
        <CardHeader>
          <CardTitle>Firma de correo</CardTitle>
          <CardDescription>
            Esta firma se agregará a los correos enviados a los clientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="Grupo Movensa&#10;info@grupomovensa.com"
            className="min-h-[100px]"
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Email Footer */}
      <Card>
        <CardHeader>
          <CardTitle>Pie de correo</CardTitle>
          <CardDescription>
            Este texto legal aparecerá al final de los correos enviados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={footer}
            onChange={(e) => setFooter(e.target.value)}
            placeholder="Escriba el texto legal del pie de correo…"
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Email Setup */}
      <Card>
        <CardHeader>
          <CardTitle>Dirección de envío</CardTitle>
          <CardDescription>
            Configure la dirección visible en los mensajes dirigidos a clientes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Correo remitente actual</p>
                <p className="text-sm text-muted-foreground">
                  {clientEmail || 'No hay un correo configurado; se utilizará la dirección predeterminada del sistema.'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Correo visible para clientes</label>
            <div className="flex gap-3">
              <Input
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="info@grupomovensa.com"
                type="email"
                className="flex-1"
              />
              <Button type="button" variant="outline" disabled title="Verificación de correo próximamente">
                Verificar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Los clientes verán esta dirección como remitente de los correos del sistema.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  );
}
