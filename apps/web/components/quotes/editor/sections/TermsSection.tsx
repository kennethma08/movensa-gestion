'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

interface TermsSectionProps {
  terms: string;
  onTermsChange: (terms: string) => void;
}

const DEFAULT_TERMS = `1. Condiciones de pago: El pago vence dentro de los 30 días posteriores a la fecha de facturación.

2. Pago tardío: Se aplicará un recargo mensual del 1,5 % a las facturas vencidas.

3. Alcance: Esta cotización cubre únicamente los servicios indicados. Cualquier trabajo adicional requerirá una cotización separada.

4. Vigencia: Esta cotización es válida por 30 días a partir de su fecha de emisión.

5. Cancelación: Cualquiera de las partes puede cancelar este acuerdo mediante aviso escrito con 14 días de anticipación.`;

export function TermsSection({ terms, onTermsChange }: TermsSectionProps) {
  const handleUseDefault = () => {
    onTermsChange(DEFAULT_TERMS);
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Términos y condiciones</CardTitle>
            <CardDescription>
              Estos términos aparecerán en la cotización
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleUseDefault}>
            <FileText className="mr-2 h-4 w-4" />
            Usar texto predeterminado
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div>
          <Label htmlFor="terms" className="sr-only">Términos y condiciones</Label>
          <Textarea
            id="terms"
            placeholder="Escriba los términos y condiciones..."
            value={terms}
            onChange={(e) => onTermsChange(e.target.value)}
            rows={12}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Consejo: puede guardar los términos predeterminados en Configuración → Cotizaciones
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
