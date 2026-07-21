import type {
  BusinessProfile,
  BrandingSettings,
  PaymentSettings,
  TaxRate,
  NumberSequence,
} from '@oreko/database';

// Business profile type
export interface BusinessProfileData {
  businessName: string;
  logoUrl: string | null;
  darkLogoUrl: string | null;
  socialLinks: { platform: string; url: string }[] | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: Address | null;
  taxId: string | null;
  currency: string;
  timezone: string;
}

// Address type
export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

// Branding settings type
export interface BrandingSettingsData {
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  logoUrl: string | null;
  darkLogoUrl: string | null;
  faviconUrl: string | null;
  customCss: string | null;
  fontFamily: string | null;
}

// Payment settings type
export interface PaymentSettingsData {
  stripeAccountId: string | null;
  stripeAccountStatus: string | null;
  stripeOnboardingComplete: boolean;
  enabledPaymentMethods: string[];
  passProcessingFees: boolean;
  defaultPaymentTerms: number;
}

// Tax rate type
export interface TaxRateData {
  id: string;
  name: string;
  rate: number;
  description: string | null;
  isInclusive: boolean;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Number sequence type
export interface NumberSequenceData {
  id: string;
  type: string;
  prefix: string | null;
  suffix: string | null;
  currentValue: number;
  padding: number;
}

// Create tax rate input
export interface CreateTaxRateInput {
  name: string;
  rate: number;
  description?: string;
  isInclusive?: boolean;
  isDefault?: boolean;
  isActive?: boolean;
}

// Update tax rate input
export interface UpdateTaxRateInput extends Partial<CreateTaxRateInput> {
  id: string;
}

// Update business profile input
export interface UpdateBusinessProfileInput {
  businessName?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: Address;
  socialLinks?: { platform: string; url: string }[];
  taxId?: string;
  currency?: string;
  timezone?: string;
}

// Update branding settings input
export interface UpdateBrandingSettingsInput {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  darkLogoUrl?: string;
  faviconUrl?: string;
  customCss?: string;
  fontFamily?: string;
}

// Update payment settings input
export interface UpdatePaymentSettingsInput {
  enabledPaymentMethods?: string[];
  passProcessingFees?: boolean;
  defaultPaymentTerms?: number;
}

// Email settings type
export interface EmailSettingsData {
  emailSignature: string | null;
  emailFooter: string | null;
  clientEmail: string | null;
}

// Update email settings input
export interface UpdateEmailSettingsInput {
  emailSignature?: string;
  emailFooter?: string;
  clientEmail?: string;
}

// Update number sequence input
export interface UpdateNumberSequenceInput {
  type: 'quote' | 'invoice';
  prefix?: string;
  suffix?: string;
  currentValue?: number;
  padding?: number;
}

// All settings combined
export interface AllSettings {
  businessProfile: BusinessProfileData | null;
  branding: BrandingSettingsData | null;
  payment: PaymentSettingsData | null;
  taxRates: TaxRateData[];
  numberSequences: NumberSequenceData[];
}

// Workspace data
export interface WorkspaceData {
  id: string;
  name: string;
  slug: string;
  ownerId: string | null;
  createdAt: Date;
}

// Common timezones
export const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'America/Toronto',
  'America/Vancouver',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Amsterdam',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland',
] as const;

// Custom field types
export type CustomFieldType = 'text' | 'number' | 'date' | 'dropdown' | 'multiselect' | 'checkbox' | 'url' | 'email';
export type CustomFieldEntity = 'quote' | 'invoice' | 'client' | 'project';

export const CUSTOM_FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  text: 'Texto',
  number: 'Número',
  date: 'Fecha',
  dropdown: 'Lista desplegable',
  multiselect: 'Selección múltiple',
  checkbox: 'Casilla',
  url: 'URL',
  email: 'Correo electrónico',
};

export const CUSTOM_FIELD_ENTITY_LABELS: Record<CustomFieldEntity, string> = {
  quote: 'Cotizaciones',
  invoice: 'Facturas',
  client: 'Clientes',
  project: 'Proyectos',
};

export interface CustomFieldData {
  id: string;
  name: string;
  fieldType: CustomFieldType;
  appliesTo: CustomFieldEntity[];
  isRequired: boolean;
  isActive: boolean;
  options: string[];
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Integration types
export interface IntegrationData {
  id: string;
  name: string;
  provider: string;
  description: string;
  isConnected: boolean;
  isAvailable: boolean;
  connectedAt: Date | null;
  config: Record<string, unknown>;
}

// Webhook types
export type WebhookEvent =
  | 'quote.created' | 'quote.sent' | 'quote.accepted' | 'quote.declined' | 'quote.expired'
  | 'invoice.created' | 'invoice.sent' | 'invoice.paid' | 'invoice.overdue' | 'invoice.voided'
  | 'client.created' | 'client.updated' | 'client.deleted'
  | 'project.created' | 'project.updated' | 'project.completed'
  | 'payment.received' | 'payment.refunded' | 'payment.failed';

export const WEBHOOK_EVENT_LABELS: Record<WebhookEvent, string> = {
  'quote.created': 'Cotización creada',
  'quote.sent': 'Cotización enviada',
  'quote.accepted': 'Cotización aceptada',
  'quote.declined': 'Cotización rechazada',
  'quote.expired': 'Cotización vencida',
  'invoice.created': 'Factura creada',
  'invoice.sent': 'Factura enviada',
  'invoice.paid': 'Factura pagada',
  'invoice.overdue': 'Factura vencida',
  'invoice.voided': 'Factura anulada',
  'client.created': 'Cliente creado',
  'client.updated': 'Cliente actualizado',
  'client.deleted': 'Cliente eliminado',
  'project.created': 'Proyecto creado',
  'project.updated': 'Proyecto actualizado',
  'project.completed': 'Proyecto completado',
  'payment.received': 'Pago recibido',
  'payment.refunded': 'Pago reembolsado',
  'payment.failed': 'Pago fallido',
};

export interface WebhookData {
  id: string;
  name: string;
  url: string;
  secret: string | null;
  events: WebhookEvent[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Common currencies
export const COMMON_CURRENCIES = [
  { code: 'CRC', name: 'Colón costarricense', symbol: '₡' },
  { code: 'USD', name: 'Dólar estadounidense', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'Libra esterlina', symbol: '£' },
  { code: 'CAD', name: 'Dólar canadiense', symbol: 'CA$' },
  { code: 'AUD', name: 'Dólar australiano', symbol: 'A$' },
  { code: 'JPY', name: 'Yen japonés', symbol: '¥' },
  { code: 'CNY', name: 'Yuan chino', symbol: '¥' },
  { code: 'INR', name: 'Rupia india', symbol: '₹' },
  { code: 'SGD', name: 'Dólar singapurense', symbol: 'S$' },
  { code: 'NZD', name: 'Dólar neozelandés', symbol: 'NZ$' },
] as const;
