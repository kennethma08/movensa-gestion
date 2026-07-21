/**
 * Payment Types
 *
 * Note: Stripe IDs (stripePaymentIntentId, stripeChargeId, etc.) are stored
 * in plain text. This is acceptable because Stripe IDs are not secrets —
 * they require a valid Stripe API key to be actionable (Bug #83).
 */

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';

export type PaymentMethod = 'card' | 'bank_transfer' | 'cash' | 'check' | 'other';

export interface PaymentListItem {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  referenceNumber: string | null;
  stripePaymentIntentId: string | null;
  processedAt: Date | null;
  createdAt: Date;
  invoice: {
    invoiceNumber: string;
    client: {
      name: string;
      company: string | null;
    };
  };
}

export interface PaymentDetail extends PaymentListItem {
  notes: string | null;
  stripeChargeId: string | null;
  stripeReceiptUrl: string | null;
  refundedAt: Date | null;
  refundAmount: number | null;
  refundReason: string | null;
}

export interface CreateCheckoutSessionInput {
  invoiceId: string;
  amount?: number; // Optional for partial payment, defaults to amountDue
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResult {
  success: boolean;
  sessionUrl?: string;
  clientSecret?: string;
  error?: string;
}

export interface PaymentSettingsData {
  stripeAccountId: string | null;
  stripeAccountStatus: string | null;
  stripeOnboardingComplete: boolean;
  enabledPaymentMethods: string[];
  passProcessingFees: boolean;
  defaultPaymentTerms: number;
}

export interface StripeOnboardingResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface PaymentIntentResult {
  success: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  error?: string;
}

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'card', label: 'Tarjeta de crédito o débito' },
  { value: 'bank_transfer', label: 'Transferencia bancaria' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'check', label: 'Cheque' },
  { value: 'other', label: 'Otro' },
];

export const PAYMENT_STATUSES: { value: PaymentStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pendiente', color: 'yellow' },
  { value: 'processing', label: 'En proceso', color: 'blue' },
  { value: 'completed', label: 'Completado', color: 'green' },
  { value: 'failed', label: 'Fallido', color: 'red' },
  { value: 'refunded', label: 'Reembolsado', color: 'purple' },
  { value: 'cancelled', label: 'Cancelado', color: 'gray' },
];
