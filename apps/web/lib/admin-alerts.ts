import { prisma } from '@oreko/database';
import { sendEmail } from '@/lib/services/email';
import { formatCurrency, formatDate, getBaseUrl, toNumber } from '@/lib/utils';
import { logger } from '@/lib/logger';

const PAYMENT_ALERT_EVENT = 'admin_payment_alert_sent';
const OVERDUE_ALERT_EVENT = 'admin_overdue_alert_sent';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function getAdminAlertRecipients(): string[] {
  return Array.from(
    new Set(
      (process.env.ADMIN_ALERT_EMAILS || '')
        .split(/[;,]/)
        .map((email) => email.trim().toLowerCase())
        .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    )
  );
}

function renderAlertEmail(params: {
  eyebrow: string;
  title: string;
  message: string;
  rows: Array<{ label: string; value: string }>;
  actionLabel: string;
  actionUrl: string;
}): string {
  const rows = params.rows
    .map(
      ({ label, value }) => `
        <tr>
          <td style="padding:10px 0;color:#667085;font-size:14px;border-bottom:1px solid #eaecf0;">${escapeHtml(label)}</td>
          <td style="padding:10px 0;color:#101828;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #eaecf0;">${escapeHtml(value)}</td>
        </tr>`
    )
    .join('');

  return `<!doctype html>
  <html lang="es">
    <body style="margin:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;color:#101828;">
      <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(params.message)}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:32px 16px;">
        <tr><td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #eaecf0;border-radius:16px;overflow:hidden;">
            <tr><td style="height:6px;background:#f57a1f;"></td></tr>
            <tr><td style="padding:32px;">
              <p style="margin:0 0 10px;color:#f57a1f;font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">${escapeHtml(params.eyebrow)}</p>
              <h1 style="margin:0 0 12px;font-size:26px;line-height:1.25;">${escapeHtml(params.title)}</h1>
              <p style="margin:0 0 22px;color:#475467;font-size:16px;line-height:1.6;">${escapeHtml(params.message)}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:26px;">${rows}</table>
              <a href="${escapeHtml(params.actionUrl)}" style="display:inline-block;background:#f57a1f;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:13px 22px;border-radius:999px;">${escapeHtml(params.actionLabel)}</a>
            </td></tr>
            <tr><td style="padding:18px 32px;background:#1f2328;color:#ffffff;font-size:12px;line-height:1.5;">Grupo Movensa · Aviso automático de gestión</td></tr>
          </table>
        </td></tr>
      </table>
    </body>
  </html>`;
}

/**
 * Notify the configured administrative recipients about a newly recorded payment.
 * The invoice event prevents duplicate messages if the payment webhook is retried.
 */
export async function notifyInvoicePaymentAdmins(params: {
  invoiceId: string;
  paymentId: string;
  amount: number;
  source: 'manual' | 'stripe';
}): Promise<boolean> {
  const recipients = getAdminAlertRecipients();
  if (recipients.length === 0) {
    logger.warn('ADMIN_ALERT_EMAILS is not configured; payment alert was not sent');
    return false;
  }

  const [invoice, existingAlert] = await Promise.all([
    prisma.invoice.findFirst({
      where: { id: params.invoiceId, deletedAt: null },
      include: {
        client: { select: { name: true, company: true } },
      },
    }),
    prisma.invoiceEvent.findFirst({
      where: {
        invoiceId: params.invoiceId,
        eventType: PAYMENT_ALERT_EVENT,
        metadata: { path: ['paymentId'], equals: params.paymentId },
      },
      select: { id: true },
    }),
  ]);

  if (!invoice || existingAlert) return Boolean(existingAlert);

  const clientName = invoice.client.company || invoice.client.name;
  const result = await sendEmail({
    to: recipients,
    subject: `Pago recibido · Factura ${invoice.invoiceNumber}`,
    html: renderAlertEmail({
      eyebrow: 'Pago recibido',
      title: `Se registró un pago de ${formatCurrency(params.amount, invoice.currency)}`,
      message: `El pago de la factura ${invoice.invoiceNumber} fue registrado correctamente.`,
      rows: [
        { label: 'Cliente', value: clientName },
        { label: 'Factura', value: invoice.invoiceNumber },
        { label: 'Pago recibido', value: formatCurrency(params.amount, invoice.currency) },
        { label: 'Saldo pendiente', value: formatCurrency(toNumber(invoice.amountDue), invoice.currency) },
      ],
      actionLabel: 'Ver factura',
      actionUrl: `${getBaseUrl()}/invoices/${invoice.id}`,
    }),
    tags: [{ name: 'type', value: 'admin_payment_received' }],
  });

  if (!result.success) {
    logger.error({ invoiceId: invoice.id, error: result.error }, 'Failed to send payment admin alert');
    return false;
  }

  await prisma.invoiceEvent.create({
    data: {
      invoiceId: invoice.id,
      eventType: PAYMENT_ALERT_EVENT,
      actorType: 'system',
      metadata: {
        paymentId: params.paymentId,
        amount: params.amount,
        source: params.source,
        recipients,
      },
    },
  });

  return true;
}

/**
 * Mark an unpaid invoice overdue and notify administrators once.
 */
export async function notifyInvoiceOverdueAdminsOnce(invoiceId: string): Promise<boolean> {
  const recipients = getAdminAlertRecipients();
  if (recipients.length === 0) {
    logger.warn('ADMIN_ALERT_EMAILS is not configured; overdue alert was not sent');
    return false;
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, deletedAt: null },
    include: {
      client: { select: { name: true, company: true } },
      events: {
        where: { eventType: OVERDUE_ALERT_EVENT },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!invoice || invoice.events.length > 0 || toNumber(invoice.amountDue) <= 0) {
    return Boolean(invoice?.events.length);
  }

  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  if (invoice.dueDate >= startOfToday || ['paid', 'voided', 'draft'].includes(invoice.status)) {
    return false;
  }

  if (invoice.status !== 'overdue') {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: 'overdue' },
    });
  }

  const clientName = invoice.client.company || invoice.client.name;
  const result = await sendEmail({
    to: recipients,
    subject: `Factura vencida · ${invoice.invoiceNumber}`,
    html: renderAlertEmail({
      eyebrow: 'Factura vencida',
      title: `La factura ${invoice.invoiceNumber} continúa pendiente`,
      message: 'La fecha de vencimiento ya pasó y todavía existe un saldo pendiente de cobro.',
      rows: [
        { label: 'Cliente', value: clientName },
        { label: 'Factura', value: invoice.invoiceNumber },
        { label: 'Venció', value: formatDate(invoice.dueDate) },
        { label: 'Saldo pendiente', value: formatCurrency(toNumber(invoice.amountDue), invoice.currency) },
      ],
      actionLabel: 'Revisar factura',
      actionUrl: `${getBaseUrl()}/invoices/${invoice.id}`,
    }),
    tags: [{ name: 'type', value: 'admin_invoice_overdue' }],
  });

  if (!result.success) {
    logger.error({ invoiceId: invoice.id, error: result.error }, 'Failed to send overdue admin alert');
    return false;
  }

  await prisma.invoiceEvent.create({
    data: {
      invoiceId: invoice.id,
      eventType: OVERDUE_ALERT_EVENT,
      actorType: 'system',
      metadata: { recipients },
    },
  });

  return true;
}
