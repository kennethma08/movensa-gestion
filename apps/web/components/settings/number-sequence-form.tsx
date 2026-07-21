'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { updateNumberSequence } from '@/lib/settings/actions';
import type { NumberSequenceData } from '@/lib/settings/types';
import { toast } from 'sonner';

interface NumberSequenceFormProps {
  type: 'quote' | 'invoice';
  title: string;
  description: string;
  initialData: NumberSequenceData | null;
}

export function NumberSequenceForm({
  type,
  title,
  description,
  initialData,
}: NumberSequenceFormProps) {
  const [prefix, setPrefix] = React.useState(initialData?.prefix || (type === 'quote' ? 'QT' : 'INV'));
  const [suffix, setSuffix] = React.useState(initialData?.suffix || '');
  const [currentValue, setCurrentValue] = React.useState(initialData?.currentValue ?? 0);
  const [padding, setPadding] = React.useState(initialData?.padding ?? 4);
  const [isSaving, setIsSaving] = React.useState(false);

  // Generate preview
  const previewNumber = React.useMemo(() => {
    const nextValue = currentValue + 1;
    const paddedNumber = String(nextValue).padStart(padding, '0');
    const cleanPrefix = (prefix || '').replace(/-$/, '');
    const parts = [cleanPrefix, paddedNumber];
    if (suffix) parts.push(suffix);
    return parts.join('-');
  }, [prefix, suffix, currentValue, padding]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateNumberSequence({
        type,
        prefix: prefix || undefined,
        suffix: suffix || undefined,
        currentValue,
        padding,
      });
      toast.success('Numeración actualizada');
    } catch {
      toast.error('No se pudo actualizar la numeración');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${type}-prefix`}>Prefijo</Label>
            <Input
              id={`${type}-prefix`}
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="QT"
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground">
              Texto que aparece antes del número.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${type}-suffix`}>Sufijo</Label>
            <Input
              id={`${type}-suffix`}
              value={suffix}
              onChange={(e) => setSuffix(e.target.value)}
              placeholder="Opcional"
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground">
              Texto que aparece después del número.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${type}-current`}>Valor actual</Label>
            <Input
              id={`${type}-current`}
              type="number"
              min="0"
              value={currentValue}
              onChange={(e) => setCurrentValue(Math.max(0, parseInt(e.target.value) || 0))}
            />
            <p className="text-xs text-muted-foreground">
              El próximo documento utilizará el siguiente número consecutivo.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${type}-padding`}>Cantidad de dígitos</Label>
            <Input
              id={`${type}-padding`}
              type="number"
              min="1"
              max="10"
              value={padding}
              onChange={(e) => setPadding(parseInt(e.target.value) || 4)}
            />
            <p className="text-xs text-muted-foreground">
              Mínimo de dígitos; por ejemplo, 4 produce 0001.
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/50 p-4">
          <p className="mb-1 text-sm font-medium">Vista previa</p>
          <p className="text-2xl font-mono">{previewNumber}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Próximo número generado
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
