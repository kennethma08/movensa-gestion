import { Resend } from 'resend';
import nodemailer, { type Transporter } from 'nodemailer';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

// Email rate limit: 20 emails per hour per key (workspace or IP)
const EMAIL_RATE_LIMIT = { limit: 20, windowMs: 60 * 60 * 1000 };

// HTML escape to prevent XSS in email templates
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Email configuration types
export interface EmailConfig {
  from: string;
  replyTo?: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  tags?: Array<{
    name: string;
    value: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Initialize email client
let resend: Resend | null = null;
let smtpTransporter: Transporter | null = null;

function getSmtpClient(): Transporter | null {
  if (smtpTransporter) return smtpTransporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  if (!host || !user || !password) return null;

  const port = Number(process.env.SMTP_PORT || 587);
  smtpTransporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth: { user, pass: password },
  });
  return smtpTransporter;
}

function getEmailClient(): Resend | null {
  if (resend) return resend;

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    logger.warn('RESEND_API_KEY is not set. Email functionality will be disabled.');
    return null;
  }

  resend = new Resend(apiKey);
  return resend;
}

// Get default config
function getDefaultConfig(): EmailConfig {
  return {
    from: process.env.EMAIL_FROM || 'Grupo Movensa <info@grupomovensa.com>',
    replyTo: process.env.EMAIL_REPLY_TO,
  };
}

// Check if email is enabled
export function isEmailEnabled(): boolean {
  return getSmtpClient() !== null || getEmailClient() !== null;
}

// Send email (with optional rate limiting by key)
export async function sendEmail(
  options: EmailOptions,
  rateLimitKey?: string
): Promise<EmailResult> {
  // Apply rate limit if a key is provided (e.g., workspaceId)
  if (rateLimitKey) {
    const rl = await checkRateLimit(`email:${rateLimitKey}`, EMAIL_RATE_LIMIT);
    if (rl.limited) {
      logger.warn({ rateLimitKey }, 'Email rate limited');
      return {
        success: false,
        error: 'Email rate limit exceeded. Please try again later.',
      };
    }
  }

  const smtpClient = getSmtpClient();
  const client = smtpClient ? null : getEmailClient();

  if (!smtpClient && !client) {
    logger.warn({ subject: options.subject }, 'Email client not configured. Email not sent');
    return {
      success: false,
      error: 'Email service not configured',
    };
  }

  const config = getDefaultConfig();

  try {
    // Strip newlines and non-printable characters to prevent email header injection
    // Low #32: Also remove control characters that can break email client rendering
    const safeSubject = options.subject
      .replace(/[\r\n]+/g, ' ')
      .replace(/[\x00-\x1F\x7F]/g, '')
      .trim();

    // Bug #89: Generate plaintext fallback by stripping HTML tags if no text provided
    const htmlContent = options.html || options.text || 'This email has no content';
    const textContent = options.text || htmlContent
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (smtpClient) {
      const result = await smtpClient.sendMail({
        from: config.from,
        to: options.to,
        subject: safeSubject,
        html: htmlContent,
        text: textContent,
        replyTo: options.replyTo ?? config.replyTo,
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments,
      });

      return { success: true, messageId: result.messageId };
    }

    const { data, error } = await client!.emails.send({
      from: config.from,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: safeSubject,
      html: htmlContent,
      text: textContent,
      replyTo: options.replyTo ?? config.replyTo,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments,
      tags: options.tags,
    });

    if (error) {
      logger.error({ err: error }, 'Email send error');
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ err: message }, 'Email send exception');
    return {
      success: false,
      error: message,
    };
  }
}

// Validate URL is safe for embedding in email href attributes
function validateEmailUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid URL protocol');
    }
    return url;
  } catch {
    return '#';
  }
}

// Pre-built email templates
export async function sendQuoteSentEmail(params: {
  to: string | string[];
  clientName: string;
  quoteName: string;
  quoteUrl: string;
  businessName: string;
  validUntil?: Date;
  message?: string;
  rateLimitKey?: string;
}): Promise<EmailResult> {
  const { to, clientName, quoteName, quoteUrl, businessName, validUntil, message, rateLimitKey } = params;

  const safeBusinessName = escapeHtml(businessName);
  const safeClientName = escapeHtml(clientName);
  const safeQuoteName = escapeHtml(quoteName);
  const safeMessage = message ? escapeHtml(message) : '';
  const safeQuoteUrl = validateEmailUrl(quoteUrl);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #232323;">Nueva cotización de ${safeBusinessName}</h2>
      <p>Hola ${safeClientName},</p>
      <p>${safeBusinessName} le ha enviado la cotización: <strong>${safeQuoteName}</strong>.</p>
      ${safeMessage ? `<p>${safeMessage}</p>` : ''}
      ${validUntil ? `<p>Esta cotización es válida hasta el ${validUntil.toLocaleDateString('es-CR')}.</p>` : ''}
      <p style="margin: 24px 0;">
        <a href="${safeQuoteUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Ver cotización
        </a>
      </p>
      <p>También puede copiar este enlace: ${safeQuoteUrl}</p>
      <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
      <p style="color: #666; font-size: 14px;">
        Enviado por ${safeBusinessName} · Nos movemos con la tecnología
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Cotización: ${quoteName} | ${businessName}`,
    html,
    tags: [
      { name: 'type', value: 'quote_sent' },
    ],
  }, rateLimitKey);
}

export async function sendInvoiceSentEmail(params: {
  to: string | string[];
  clientName: string;
  invoiceNumber: string;
  invoiceUrl: string;
  businessName: string;
  amount: string;
  dueDate: Date;
  message?: string;
  rateLimitKey?: string;
}): Promise<EmailResult> {
  const { to, clientName, invoiceNumber, invoiceUrl, businessName, amount, dueDate, message, rateLimitKey } = params;

  const safeBusinessName = escapeHtml(businessName);
  const safeClientName = escapeHtml(clientName);
  const safeInvoiceNumber = escapeHtml(invoiceNumber);
  const safeAmount = escapeHtml(amount);
  const safeMessage = message ? escapeHtml(message) : '';
  const safeInvoiceUrl = validateEmailUrl(invoiceUrl);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #232323;">Factura de ${safeBusinessName}</h2>
      <p>Hola ${safeClientName},</p>
      <p>${safeBusinessName} le ha enviado una factura:</p>
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0;"><strong>Factura:</strong> ${safeInvoiceNumber}</p>
        <p style="margin: 8px 0 0;"><strong>Monto:</strong> ${safeAmount}</p>
        <p style="margin: 8px 0 0;"><strong>Fecha de vencimiento:</strong> ${dueDate.toLocaleDateString('es-CR')}</p>
      </div>
      ${safeMessage ? `<p>${safeMessage}</p>` : ''}
      <p style="margin: 24px 0;">
        <a href="${safeInvoiceUrl}" style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Ver factura
        </a>
      </p>
      <p>También puede copiar este enlace: ${safeInvoiceUrl}</p>
      <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
      <p style="color: #666; font-size: 14px;">
        Enviado por ${safeBusinessName} · Nos movemos con la tecnología
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Factura ${invoiceNumber} de ${businessName} - ${amount}`,
    html,
    tags: [
      { name: 'type', value: 'invoice_sent' },
    ],
  }, rateLimitKey);
}

export async function sendPaymentReceivedEmail(params: {
  to: string;
  clientName: string;
  invoiceNumber: string;
  businessName: string;
  amount: string;
  receiptUrl?: string;
  rateLimitKey?: string;
}): Promise<EmailResult> {
  const { to, clientName, invoiceNumber, businessName, amount, receiptUrl, rateLimitKey } = params;

  const safeClientName = escapeHtml(clientName);
  const safeInvoiceNumber = escapeHtml(invoiceNumber);
  const safeAmount = escapeHtml(amount);
  const safeBusinessName = escapeHtml(businessName);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #232323;">Pago recibido</h2>
      <p>Hola ${safeClientName},</p>
      <p>Gracias. Recibimos su pago de <strong>${safeAmount}</strong> correspondiente a la factura ${safeInvoiceNumber}.</p>
      ${receiptUrl ? `
        <p style="margin: 24px 0;">
          <a href="${validateEmailUrl(receiptUrl)}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Ver comprobante
          </a>
        </p>
      ` : ''}
      <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
      <p style="color: #666; font-size: 14px;">
        Enviado por ${safeBusinessName} · Nos movemos con la tecnología
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Pago recibido - Factura ${invoiceNumber}`,
    html,
    tags: [
      { name: 'type', value: 'payment_received' },
    ],
  }, rateLimitKey);
}

export async function sendQuoteAcceptedEmail(params: {
  to: string;
  quoteName: string;
  clientName: string;
  amount: string;
  quoteUrl: string;
  rateLimitKey?: string;
}): Promise<EmailResult> {
  const { to, quoteName, clientName, amount, quoteUrl, rateLimitKey } = params;

  const safeClientName = escapeHtml(clientName);
  const safeQuoteName = escapeHtml(quoteName);
  const safeAmount = escapeHtml(amount);
  const safeQuoteUrl = validateEmailUrl(quoteUrl);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10B981;">¡Cotización aceptada!</h2>
      <p><strong>${safeClientName}</strong> aceptó la cotización.</p>
      <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #10B981;">
        <p style="margin: 0;"><strong>Cotización:</strong> ${safeQuoteName}</p>
        <p style="margin: 8px 0 0;"><strong>Monto:</strong> ${safeAmount}</p>
      </div>
      <p style="margin: 24px 0;">
        <a href="${safeQuoteUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Ver cotización
        </a>
      </p>
      <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
      <p style="color: #666; font-size: 14px;">
        Grupo Movensa · Nos movemos con la tecnología
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Cotización aceptada: ${quoteName} - ${amount}`,
    html,
    tags: [
      { name: 'type', value: 'quote_accepted' },
    ],
  }, rateLimitKey);
}

export async function sendInvoiceReminderEmail(params: {
  to: string;
  clientName: string;
  invoiceNumber: string;
  invoiceUrl: string;
  businessName: string;
  amount: string;
  dueDate: Date;
  daysOverdue?: number;
  rateLimitKey?: string;
}): Promise<EmailResult> {
  const { to, clientName, invoiceNumber, invoiceUrl, businessName, amount, dueDate, daysOverdue, rateLimitKey } = params;

  const safeClientName = escapeHtml(clientName);
  const safeInvoiceNumber = escapeHtml(invoiceNumber);
  const safeBusinessName = escapeHtml(businessName);
  const safeAmount = escapeHtml(amount);
  const safeInvoiceUrl = validateEmailUrl(invoiceUrl);

  const isOverdue = daysOverdue !== undefined && daysOverdue > 0;
  const subject = isOverdue
    ? `Vencida: Factura ${invoiceNumber} - ${amount} (${daysOverdue} días de atraso)`
    : `Recordatorio: Factura ${invoiceNumber} de ${businessName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${isOverdue ? '#EF4444' : '#F59E0B'};">
        ${isOverdue ? 'Factura vencida' : 'Recordatorio de factura'}
      </h2>
      <p>Hola ${safeClientName},</p>
      <p>
        ${isOverdue
          ? `Le recordamos que la factura ${safeInvoiceNumber} tiene ${daysOverdue} días de atraso.`
          : `Le recordamos que la factura ${safeInvoiceNumber} vence el ${dueDate.toLocaleDateString('es-CR')}.`
        }
      </p>
      <div style="background: ${isOverdue ? '#fef2f2' : '#fffbeb'}; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid ${isOverdue ? '#EF4444' : '#F59E0B'};">
        <p style="margin: 0;"><strong>Factura:</strong> ${safeInvoiceNumber}</p>
        <p style="margin: 8px 0 0;"><strong>Monto:</strong> ${safeAmount}</p>
        <p style="margin: 8px 0 0;"><strong>Fecha de vencimiento:</strong> ${dueDate.toLocaleDateString('es-CR')}</p>
      </div>
      <p style="margin: 24px 0;">
        <a href="${safeInvoiceUrl}" style="background-color: ${isOverdue ? '#EF4444' : '#F59E0B'}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Ver factura
        </a>
      </p>
      <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
      <p style="color: #666; font-size: 14px;">
        Enviado por ${safeBusinessName} · Nos movemos con la tecnología
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    tags: [
      { name: 'type', value: isOverdue ? 'invoice_overdue' : 'invoice_reminder' },
    ],
  }, rateLimitKey);
}

/**
 * Send workspace invitation email
 */
export async function sendInvitationEmail(params: {
  to: string;
  workspaceName: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
  rateLimitKey?: string;
}): Promise<EmailResult> {
  const { to, workspaceName, inviterName, role, inviteUrl, rateLimitKey } = params;

  const safeInviterName = escapeHtml(inviterName);
  const safeWorkspaceName = escapeHtml(workspaceName);
  const safeRole = escapeHtml(role);
  const safeInviteUrl = validateEmailUrl(inviteUrl);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #F57A1F;">Invitación a Grupo Movensa</h2>
      <p>${safeInviterName} le invitó a unirse a <strong>${safeWorkspaceName}</strong> con el rol <strong>${safeRole}</strong>.</p>
      <p>Desde este sistema podrá colaborar en la gestión comercial y administrativa.</p>
      <p style="margin: 24px 0;">
        <a href="${safeInviteUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Aceptar invitación
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">La invitación vence en 7 días. Si todavía no tiene una cuenta, podrá crearla al aceptar.</p>
      <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
      <p style="color: #666; font-size: 14px;">
        Grupo Movensa · Nos movemos con la tecnología
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Invitación a ${workspaceName}`,
    html,
    tags: [{ name: 'type', value: 'workspace_invitation' }],
  }, rateLimitKey);
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(params: {
  to: string;
  name: string;
  verifyUrl: string;
}): Promise<EmailResult> {
  const { to, name, verifyUrl } = params;

  const safeName = escapeHtml(name);
  const safeVerifyUrl = validateEmailUrl(verifyUrl);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #F57A1F;">Verifique su correo electrónico</h2>
      <p>Hola ${safeName},</p>
      <p>Gracias por crear su cuenta en el sistema de Grupo Movensa. Use el siguiente botón para verificar su correo electrónico:</p>
      <p style="margin: 24px 0;">
        <a href="${safeVerifyUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Verificar correo
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">Este enlace vence en 24 horas. Si no creó esta cuenta, puede ignorar este mensaje.</p>
      <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
      <p style="color: #666; font-size: 14px;">
        Grupo Movensa · Nos movemos con la tecnología
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject: 'Verifique su correo | Grupo Movensa',
    html,
    tags: [{ name: 'type', value: 'email_verification' }],
  });
}
