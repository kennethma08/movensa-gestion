'use server';

import { headers } from 'next/headers';
import { prisma } from '@oreko/database';
import { sendEmail } from '@/lib/services/email';
import { checkRateLimit } from '@/lib/rate-limit';
import { generateSigningOtp, verifySigningOtp, isSigningVerified } from './otp';
import { logger } from '@/lib/logger';

async function getClientIp(): Promise<string> {
  const headersList = await headers();
  return (
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Send an OTP to the client's email for signer identity verification.
 * Called before the signature pad is shown.
 */
export async function sendSigningOtp(input: {
  type: 'quote' | 'contract';
  accessToken: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const ip = await getClientIp();

    // Rate limit: 5 OTP sends per 10 minutes per IP
    const rateLimitResult = await checkRateLimit(`otp-send:${ip}`, {
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });
    if (rateLimitResult.limited) {
      return { success: false, error: 'Se solicitaron demasiados códigos. Espere unos minutos.' };
    }

    let clientEmail: string;
    let clientName: string;
    let businessName: string;
    let documentId: string;

    if (input.type === 'quote') {
      // Bug #155: Only allow OTP for quotes in signable status
      const quote = await prisma.quote.findFirst({
        where: {
          accessToken: input.accessToken,
          deletedAt: null,
          status: { in: ['sent', 'viewed'] },
        },
        select: {
          id: true,
          client: { select: { email: true, name: true } },
          workspace: {
            select: {
              name: true,
              businessProfile: { select: { businessName: true } },
            },
          },
        },
      });

      if (!quote) {
        return { success: false, error: 'Documento no encontrado.' };
      }

      clientEmail = quote.client.email;
      clientName = quote.client.name;
      businessName = quote.workspace.businessProfile?.businessName || quote.workspace.name;
      documentId = quote.id;
    } else {
      // MEDIUM #19: Filter out soft-deleted contract instances
      // Bug #155: Only allow OTP for contracts in signable status
      const contract = await prisma.contractInstance.findFirst({
        where: {
          accessToken: input.accessToken,
          deletedAt: null,
          status: { in: ['sent', 'viewed'] },
        },
        select: {
          id: true,
          client: { select: { email: true, name: true } },
          workspace: {
            select: {
              name: true,
              businessProfile: { select: { businessName: true } },
            },
          },
        },
      });

      if (!contract || !contract.client) {
        return { success: false, error: 'Documento no encontrado.' };
      }

      clientEmail = contract.client.email;
      clientName = contract.client.name;
      businessName = contract.workspace.businessProfile?.businessName || contract.workspace.name;
      documentId = contract.id;
    }

    // Generate OTP
    const otpKey = `${input.type}:${documentId}`;
    const code = await generateSigningOtp(otpKey, clientEmail);

    // Send email with OTP
    const emailResult = await sendEmail({
      to: clientEmail,
      // Low #33: Don't expose OTP code in subject line (visible in notifications/previews)
      subject: `Código de verificación de ${businessName}`,
      html: `
        <div lang="es" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verifique su identidad</h2>
          <!-- Low #34: Escape client/business names to prevent XSS in email -->
          <p>Hola ${clientName.replace(/</g, '&lt;').replace(/>/g, '&gt;')},</p>
          <p>${businessName.replace(/</g, '&lt;').replace(/>/g, '&gt;')} solicitó su firma en un documento. Para verificar su identidad, ingrese este código:</p>
          <div style="margin: 24px 0; text-align: center;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; background: #f3f4f6; padding: 16px 32px; border-radius: 8px; display: inline-block;">
              ${code}
            </span>
          </div>
          <p style="color: #666; font-size: 14px;">Este código vence en 10 minutos. Si no realizó esta solicitud, puede ignorar este correo.</p>
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
          <p style="color: #666; font-size: 12px;">Enviado por ${businessName.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        </div>
      `,
      tags: [{ name: 'type', value: 'signing_otp' }],
    });

    if (!emailResult.success) {
      return {
        success: false,
        error: 'No se pudo enviar el correo de verificación. Inténtelo nuevamente.',
      };
    }

    return { success: true };
  } catch (error) {
    logger.error({ err: error }, 'Error sending signing OTP');
    return { success: false, error: 'No se pudo enviar el código de verificación.' };
  }
}

/**
 * Verify the OTP code entered by the signer.
 */
export async function verifySigningOtpAction(input: {
  type: 'quote' | 'contract';
  accessToken: string;
  code: string;
  email: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const ip = await getClientIp();

    // Rate limit: 10 verify attempts per 10 minutes per IP
    const rateLimitResult = await checkRateLimit(`otp-verify:${ip}`, {
      limit: 10,
      windowMs: 10 * 60 * 1000,
    });
    if (rateLimitResult.limited) {
      return { success: false, error: 'Demasiados intentos. Espere unos minutos.' };
    }

    // Look up document ID from access token
    let documentId: string;

    if (input.type === 'quote') {
      const quote = await prisma.quote.findFirst({
        where: { accessToken: input.accessToken, deletedAt: null },
        select: { id: true },
      });
      if (!quote) return { success: false, error: 'Documento no encontrado.' };
      documentId = quote.id;
    } else {
      // MEDIUM #19: Filter out soft-deleted contract instances
      const contract = await prisma.contractInstance.findFirst({
        where: { accessToken: input.accessToken, deletedAt: null },
        select: { id: true },
      });
      if (!contract) return { success: false, error: 'Documento no encontrado.' };
      documentId = contract.id;
    }

    const otpKey = `${input.type}:${documentId}`;
    const result = await verifySigningOtp(otpKey, input.code, input.email);

    if (!result.valid) {
      return { success: false, error: result.error || 'Código no válido.' };
    }

    return { success: true };
  } catch (error) {
    logger.error({ err: error }, 'Error verifying signing OTP');
    return { success: false, error: 'No se pudo completar la verificación.' };
  }
}

/**
 * Check if the signer has already been verified for this document.
 */
export async function checkSigningVerification(input: {
  type: 'quote' | 'contract';
  accessToken: string;
}): Promise<boolean> {
  try {
    let documentId: string;

    if (input.type === 'quote') {
      const quote = await prisma.quote.findFirst({
        where: { accessToken: input.accessToken, deletedAt: null },
        select: { id: true },
      });
      if (!quote) return false;
      documentId = quote.id;
    } else {
      // MEDIUM #19: Filter out soft-deleted contract instances
      const contract = await prisma.contractInstance.findFirst({
        where: { accessToken: input.accessToken, deletedAt: null },
        select: { id: true },
      });
      if (!contract) return false;
      documentId = contract.id;
    }

    return await isSigningVerified(`${input.type}:${documentId}`);
  } catch {
    return false;
  }
}
