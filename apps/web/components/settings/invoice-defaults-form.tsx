'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateInvoiceDefaults, type InvoiceDefaults } from '@/lib/settings/actions';
import { PAYMENT_TERMS } from '@/lib/invoices/types';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface InvoiceDefaultsFormProps {
  initialData: InvoiceDefaults;
}

export function InvoiceDefaultsForm({ initialData }: InvoiceDefaultsFormProps) {
  const [data, setData] = useState<InvoiceDefaults>(initialData);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await updateInvoiceDefaults(data);
      if (result.success) {
        toast.success('Valores predeterminados guardados');
      } else {
        toast.error(result.error || 'No se pudo guardar la configuración');
      }
    } catch {
      toast.error('No se pudo guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Valores predeterminados de facturación</CardTitle>
        <CardDescription>
          Defina los plazos, mensajes y condiciones para las nuevas facturas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="paymentTerms">Plazo de pago predeterminado</Label>
            <Select
              value={data.paymentTerms}
              onValueChange={(value) => setData({ ...data, paymentTerms: value })}
            >
              <SelectTrigger id="paymentTerms">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_TERMS.map((term) => (
                  <SelectItem key={term.value} value={term.value}>
                    {term.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultNotes">Notas predeterminadas</Label>
            <Textarea
              id="defaultNotes"
              value={data.defaultNotes}
              onChange={(e) => setData({ ...data, defaultNotes: e.target.value })}
              placeholder="Notas que aparecerán en cada factura…"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultTerms">Términos y condiciones predeterminados</Label>
            <Textarea
              id="defaultTerms"
              value={data.defaultTerms}
              onChange={(e) => setData({ ...data, defaultTerms: e.target.value })}
              placeholder="Términos y condiciones para las nuevas facturas…"
              rows={3}
            />
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Cargo por atraso</Label>
                <p className="text-sm text-muted-foreground">
                  Aplica automáticamente un cargo a las facturas vencidas.
                </p>
              </div>
              <Switch
                checked={data.lateFeeEnabled}
                onCheckedChange={(checked) => setData({ ...data, lateFeeEnabled: checked })}
              />
            </div>
            {data.lateFeeEnabled && (
              <div className="flex gap-4">
                <div className="w-32">
                  <Label>Tipo</Label>
                  <Select
                    value={data.lateFeeType}
                    onValueChange={(value: 'percentage' | 'fixed') =>
                      setData({ ...data, lateFeeType: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentaje</SelectItem>
                      <SelectItem value="fixed">Importe fijo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>{data.lateFeeType === 'percentage' ? 'Porcentaje (%)' : 'Importe'}</Label>
                  <Input
                    type="number"
                    value={data.lateFeeValue}
                    onChange={(e) => setData({ ...data, lateFeeValue: parseFloat(e.target.value) || 0 })}
                    min={0}
                    step="0.01"
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label>Recordatorios de pago</Label>
              <p className="text-sm text-muted-foreground">
                Envía recordatorios automáticos antes y después del vencimiento.
              </p>
            </div>
            <Switch
              checked={data.reminderEnabled}
              onCheckedChange={(checked) => setData({ ...data, reminderEnabled: checked })}
            />
          </div>

          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar valores
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
