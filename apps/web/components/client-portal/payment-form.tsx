'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Loader2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface PaymentFormProps {
  invoiceId: string;
  accessToken: string;
  amountDue: number;
  currency: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function formatCurrency(amount: number, currency: string = 'USD'): string {
  const parts = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).formatToParts(amount);
  return parts.map((p, i) => {
    if (p.type === 'currency' && parts[i + 1]?.type !== 'literal') return p.value + ' ';
    return p.value;
  }).join('');
}

function CheckoutForm({
  invoiceId,
  accessToken,
  amountDue,
  currency,
  onSuccess,
  onCancel,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/i/${accessToken}?payment=success`,
      },
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message || 'No se pudo procesar el pago. Inténtelo nuevamente.');
      setIsProcessing(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isProcessing || !stripe}>
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pagar {formatCurrency(amountDue, currency)}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export function PaymentForm(props: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Create payment intent on mount
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/checkout/invoice/${props.invoiceId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken: props.accessToken,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
        } else {
          setClientSecret(data.clientSecret);
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError('No se pudo iniciar el pago. Inténtelo nuevamente.');
        setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [props.invoiceId, props.accessToken]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Preparando el pago...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
        <Button variant="outline" onClick={props.onCancel}>
          Cancelar
        </Button>
      </div>
    );
  }

  if (!clientSecret) return null;

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            borderRadius: '6px',
          },
        },
      }}
    >
      <CheckoutForm {...props} />
    </Elements>
  );
}
