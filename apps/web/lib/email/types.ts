import type { EmailTemplate, ScheduledEmail } from '@oreko/database';

// Email template types
export const EMAIL_TEMPLATE_TYPES = [
  'quote_sent',
  'quote_accepted',
  'quote_declined',
  'quote_reminder',
  'invoice_sent',
  'invoice_reminder',
  'invoice_overdue',
  'payment_received',
  'contract_sent',
  'contract_signed',
] as const;

export type EmailTemplateType = (typeof EMAIL_TEMPLATE_TYPES)[number];

// Email template list item
export interface EmailTemplateListItem {
  id: string;
  type: string;
  name: string;
  subject: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Email template detail
export interface EmailTemplateDetail extends EmailTemplateListItem {
  workspaceId: string;
  body: string;
}

// Create email template input
export interface CreateEmailTemplateInput {
  type: EmailTemplateType;
  name: string;
  subject: string;
  body: string;
  isActive?: boolean;
  isDefault?: boolean;
}

// Update email template input
export interface UpdateEmailTemplateInput extends Partial<CreateEmailTemplateInput> {
  id: string;
}

// Email template filter
export interface EmailTemplateFilter {
  type?: EmailTemplateType;
  search?: string;
  isActive?: boolean;
}

// Scheduled email list item
export interface ScheduledEmailListItem {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  recipientEmail: string;
  recipientName: string | null;
  subject: string;
  scheduledFor: Date;
  status: string;
  sentAt: Date | null;
  createdAt: Date;
}

// Scheduled email detail
export interface ScheduledEmailDetail extends ScheduledEmailListItem {
  workspaceId: string;
  templateId: string | null;
  body: string;
  errorMessage: string | null;
  retryCount: number;
}

// Email template variables
export interface EmailVariables {
  // Common
  businessName: string;
  businessEmail?: string;
  businessPhone?: string;
  clientName: string;
  clientEmail: string;
  clientCompany?: string;

  // Quote specific
  quoteName?: string;
  quoteNumber?: string;
  quoteUrl?: string;
  quoteTotal?: string;
  quoteValidUntil?: string;

  // Invoice specific
  invoiceNumber?: string;
  invoiceUrl?: string;
  invoiceTotal?: string;
  invoiceDueDate?: string;
  amountPaid?: string;
  amountDue?: string;
  daysOverdue?: number;

  // Contract specific
  contractName?: string;
  contractUrl?: string;

  // Custom message
  message?: string;
}

// Default templates
export const DEFAULT_TEMPLATES: Record<
  EmailTemplateType,
  { name: string; subject: string; body: string }
> = {
  quote_sent: {
    name: 'Cotización enviada',
    subject: 'Cotización: {{quoteName}} de {{businessName}}',
    body: `<p>Hola {{clientName}},</p>
<p>{{businessName}} le ha enviado una cotización: <strong>{{quoteName}}</strong></p>
{{#if message}}<p>{{message}}</p>{{/if}}
{{#if quoteValidUntil}}<p>Esta cotización es válida hasta el {{quoteValidUntil}}.</p>{{/if}}
<p><a href="{{quoteUrl}}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Ver cotización</a></p>`,
  },
  quote_accepted: {
    name: 'Cotización aceptada',
    subject: 'Cotización aceptada: {{quoteName}} - {{quoteTotal}}',
    body: `<p>¡Buenas noticias!</p>
<p><strong>{{clientName}}</strong> aceptó la cotización: {{quoteName}}</p>
<p><strong>Importe:</strong> {{quoteTotal}}</p>
<p><a href="{{quoteUrl}}" style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Ver cotización</a></p>`,
  },
  quote_declined: {
    name: 'Cotización rechazada',
    subject: 'Cotización rechazada: {{quoteName}}',
    body: `<p>{{clientName}} rechazó la cotización: {{quoteName}}</p>
<p><a href="{{quoteUrl}}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Ver cotización</a></p>`,
  },
  quote_reminder: {
    name: 'Recordatorio de cotización',
    subject: 'Recordatorio: la cotización {{quoteName}} vence pronto',
    body: `<p>Hola {{clientName}},</p>
<p>Le recordamos que la cotización <strong>{{quoteName}}</strong> de {{businessName}} vence el {{quoteValidUntil}}.</p>
<p><a href="{{quoteUrl}}" style="background-color: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Revisar cotización</a></p>`,
  },
  invoice_sent: {
    name: 'Factura enviada',
    subject: 'Factura {{invoiceNumber}} de {{businessName}} - {{invoiceTotal}}',
    body: `<p>Hola {{clientName}},</p>
<p>{{businessName}} le ha enviado una factura:</p>
<p><strong>Factura:</strong> {{invoiceNumber}}<br>
<strong>Importe:</strong> {{invoiceTotal}}<br>
<strong>Fecha de vencimiento:</strong> {{invoiceDueDate}}</p>
{{#if message}}<p>{{message}}</p>{{/if}}
<p><a href="{{invoiceUrl}}" style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Ver y pagar factura</a></p>`,
  },
  invoice_reminder: {
    name: 'Recordatorio de factura',
    subject: 'Recordatorio: factura {{invoiceNumber}} de {{businessName}}',
    body: `<p>Hola {{clientName}},</p>
<p>Le recordamos que la factura {{invoiceNumber}} vence el {{invoiceDueDate}}.</p>
<p><strong>Importe pendiente:</strong> {{amountDue}}</p>
<p><a href="{{invoiceUrl}}" style="background-color: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Pagar ahora</a></p>`,
  },
  invoice_overdue: {
    name: 'Factura vencida',
    subject: 'Factura vencida: {{invoiceNumber}} - {{daysOverdue}} días de atraso',
    body: `<p>Hola {{clientName}},</p>
<p>Le recordamos que la factura {{invoiceNumber}} tiene {{daysOverdue}} días de atraso.</p>
<p><strong>Importe pendiente:</strong> {{amountDue}}</p>
<p><a href="{{invoiceUrl}}" style="background-color: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Pagar ahora</a></p>`,
  },
  payment_received: {
    name: 'Pago recibido',
    subject: 'Pago recibido - Factura {{invoiceNumber}}',
    body: `<p>Hola {{clientName}},</p>
<p>¡Gracias! Recibimos su pago de <strong>{{amountPaid}}</strong> correspondiente a la factura {{invoiceNumber}}.</p>`,
  },
  contract_sent: {
    name: 'Contrato enviado',
    subject: 'Contrato: {{contractName}} de {{businessName}}',
    body: `<p>Hola {{clientName}},</p>
<p>{{businessName}} le ha enviado un contrato para revisar y firmar: <strong>{{contractName}}</strong></p>
{{#if message}}<p>{{message}}</p>{{/if}}
<p><a href="{{contractUrl}}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Revisar y firmar</a></p>`,
  },
  contract_signed: {
    name: 'Contrato firmado',
    subject: 'Contrato firmado: {{contractName}}',
    body: `<p>¡Buenas noticias!</p>
<p><strong>{{clientName}}</strong> firmó el contrato: {{contractName}}</p>
<p><a href="{{contractUrl}}" style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Ver contrato firmado</a></p>`,
  },
};

// Get human-readable template type name
export function getTemplateTypeName(type: EmailTemplateType): string {
  const names: Record<EmailTemplateType, string> = {
    quote_sent: 'Cotización enviada',
    quote_accepted: 'Cotización aceptada',
    quote_declined: 'Cotización rechazada',
    quote_reminder: 'Recordatorio de cotización',
    invoice_sent: 'Factura enviada',
    invoice_reminder: 'Recordatorio de factura',
    invoice_overdue: 'Factura vencida',
    payment_received: 'Pago recibido',
    contract_sent: 'Contrato enviado',
    contract_signed: 'Contrato firmado',
  };
  return names[type] || type;
}
