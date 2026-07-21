'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, ExternalLink, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  updatePaymentSettings,
  createStripeOnboardingLink,
  checkStripeAccountStatus,
} from '@/lib/payments/actions';
import type { PaymentSettingsData } from '@/lib/payments/types';

interface PaymentSettingsFormProps {
  initialData: PaymentSettingsData | null;
  stripeEnabled: boolean;
}

export function PaymentSettingsForm({ initialData, stripeEnabled }: PaymentSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const [settings, setSettings] = useState({
    passProcessingFees: initialData?.passProcessingFees ?? false,
    defaultPaymentTerms: initialData?.defaultPaymentTerms ?? 30,
  });

  const [stripeStatus, setStripeStatus] = useState({
    connected: !!initialData?.stripeAccountId,
    onboardingComplete: initialData?.stripeOnboardingComplete ?? false,
    status: initialData?.stripeAccountStatus,
  });

  // Auto-check status when returning from Stripe onboarding
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true' || params.get('refresh') === 'true') {
      handleCheckStatus();
      // Clean up URL params
      window.history.replaceState({}, '', window.location.pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Low #64: Added toast feedback on save
  const handleSave = () => {
    startTransition(async () => {
      try {
        await updatePaymentSettings(settings);
        toast.success('Configuración de pagos guardada');
        router.refresh();
      } catch {
        toast.error('No se pudo guardar la configuración de pagos');
      }
    });
  };

  const handleStripeConnect = () => {
    startTransition(async () => {
      const result = await createStripeOnboardingLink();
      if (result.success && result.url) {
        window.location.href = result.url;
      }
    });
  };

  const handleCheckStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const status = await checkStripeAccountStatus();
      setStripeStatus({
        connected: status.connected,
        onboardingComplete: status.chargesEnabled && status.payoutsEnabled,
        status: status.status,
      });
      router.refresh();
    } finally {
      setIsCheckingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stripe Connect */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Stripe Connect</CardTitle>
              <CardDescription>
                Reciba pagos con tarjeta directamente desde las facturas.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!stripeEnabled ? (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">Stripe no está configurado</p>
                <p className="text-sm text-amber-700 mt-1">
                  Debe configurar las credenciales privadas de Stripe en el servidor para habilitar los pagos.
                </p>
              </div>
            </div>
          ) : stripeStatus.connected && stripeStatus.onboardingComplete ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Conectado con Stripe</p>
                  <p className="text-sm text-muted-foreground">
                    Ya puede recibir pagos con tarjeta de sus clientes.
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Activo
              </Badge>
            </div>
          ) : stripeStatus.connected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium">Configuración incompleta</p>
                    <p className="text-sm text-muted-foreground">
                      Complete la configuración de la cuenta para recibir pagos.
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  Pendiente
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleStripeConnect} disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Continuar configuración
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCheckStatus}
                  disabled={isCheckingStatus}
                >
                  {isCheckingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Revisar estado
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Conecte su cuenta de Stripe para aceptar tarjetas y otros medios de pago digitales desde las facturas.
              </p>
              <Button onClick={handleStripeConnect} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Conectar con Stripe
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Options */}
      <Card>
        <CardHeader>
          <CardTitle>Opciones de pago</CardTitle>
          <CardDescription>
            Configure cómo se procesan y vencen los pagos de las facturas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="passProcessingFees">Trasladar la comisión al cliente</Label>
              <p className="text-sm text-muted-foreground">
                Agrega la comisión de Stripe al total de la factura.
              </p>
            </div>
            <Switch
              id="passProcessingFees"
              checked={settings.passProcessingFees}
              onCheckedChange={(checked) =>
                setSettings((s) => ({ ...s, passProcessingFees: checked }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultPaymentTerms">Plazo de pago predeterminado</Label>
            <Select
              value={settings.defaultPaymentTerms.toString()}
              onValueChange={(value) =>
                setSettings((s) => ({ ...s, defaultPaymentTerms: parseInt(value) }))
              }
            >
              <SelectTrigger id="defaultPaymentTerms" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Pago inmediato</SelectItem>
                <SelectItem value="7">7 días</SelectItem>
                <SelectItem value="15">15 días</SelectItem>
                <SelectItem value="30">30 días</SelectItem>
                <SelectItem value="45">45 días</SelectItem>
                <SelectItem value="60">60 días</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Cantidad de días antes del vencimiento del pago.
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
