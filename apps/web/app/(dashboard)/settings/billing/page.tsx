export const dynamic = 'force-dynamic';

import { CheckCircle, AlertCircle, CreditCard, MoreHorizontal, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getCurrentUserRole, getBillingInfo } from '@/lib/settings/actions';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Plan y facturación',
};

export default async function BillingSettingsPage() {
  const currentUserRole = await getCurrentUserRole();

  // Only owners can access billing
  if (currentUserRole !== 'owner') {
    redirect('/settings');
  }

  const billing = await getBillingInfo();
  const currentPlan = billing?.plan || 'free';

  return (
    <div className="space-y-8">
      {/* Plan actual */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Plan actual</CardTitle>
              <CardDescription>
                Consulte el estado del plan y la información de cobro del sistema.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold capitalize">{currentPlan === 'free' ? 'Plan interno' : `Plan ${currentPlan}`}</h3>
                  <p className="text-sm text-muted-foreground">
                    {/* Low #51: Fixed label — nextBillingDate is not the start date */}
                    {billing?.nextBillingDate
                      ? `Próximo cobro: ${new Date(billing.nextBillingDate).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      : 'Sin cobros programados'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  {currentPlan !== 'free' && (
                    <>
                      <p className="text-lg font-bold">
                        ${currentPlan === 'pro' ? '9.00' : currentPlan === 'team' ? '29.00' : '0.00'}
                      </p>
                      {billing?.nextBillingDate && (
                        <p className="text-xs text-muted-foreground">
                          Próximo cobro: {new Date(billing.nextBillingDate).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </>
                  )}
                </div>
                <Button variant="ghost" size="icon" aria-label="Más acciones">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Status badges */}
            <div className="mt-3 flex items-center gap-2">
              {billing?.status === 'active' ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Activo
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {billing?.status || 'Sin cobro'}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métodos de pago */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Métodos de pago</CardTitle>
              <CardDescription>
                Administre el método utilizado para los cobros del plan.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" disabled>
              <Plus className="mr-1 h-4 w-4" />
              Agregar método de pago
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {billing?.paymentMethod ? (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-16 items-center justify-center rounded border bg-muted text-xs font-semibold uppercase">
                  {billing.paymentMethod.brand}
                </div>
                <div>
                  <p className="font-medium">
                    {billing.paymentMethod.brand} terminada en {billing.paymentMethod.last4}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Vence {billing.paymentMethod.expMonth}/{billing.paymentMethod.expYear}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" disabled>Actualizar</Button>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-muted-foreground mb-2">No hay un método de pago registrado</p>
              <p className="text-sm text-muted-foreground">No se requiere un método mientras no existan cobros programados.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de cobros */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de cobros</CardTitle>
          <CardDescription>
            Aquí aparecerán los cargos y comprobantes asociados al plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="font-medium">No hay cobros registrados</p>
            <p className="mt-1 text-sm text-muted-foreground">
              El sistema no mostrará cargos de ejemplo ni movimientos simulados.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
