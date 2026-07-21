import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { prisma, Prisma } from '@oreko/database';
import { logger } from '@/lib/logger';

type WebsiteLeadPayload = {
  requestId?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  company?: unknown;
  service?: unknown;
  message?: unknown;
};

function clean(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function jsonObject(value: Prisma.JsonValue): Record<string, Prisma.JsonValue> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, Prisma.JsonValue>;
}

function isAuthorized(request: NextRequest) {
  const expected = process.env.WEBSITE_INTEGRATION_SECRET?.trim();
  const authorization = request.headers.get('authorization');
  const provided = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!expected || !provided) return false;

  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);
  return expectedBytes.length === providedBytes.length && timingSafeEqual(expectedBytes, providedBytes);
}

/**
 * POST /api/v1/integrations/website-leads
 * Receives a contact request from grupomovensa.com, updates the client by email,
 * and creates a separate project so every inquiry retains its own history.
 */
export async function POST(request: NextRequest) {
  if (!process.env.WEBSITE_INTEGRATION_SECRET) {
    return NextResponse.json({ error: 'La integración no está configurada.' }, { status: 503 });
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  let body: WebsiteLeadPayload;
  try {
    body = (await request.json()) as WebsiteLeadPayload;
  } catch {
    return NextResponse.json({ error: 'El cuerpo de la solicitud no contiene JSON válido.' }, { status: 400 });
  }

  const requestId = clean(body.requestId, 100).replace(/[^a-zA-Z0-9_-]/g, '');
  const name = clean(body.name, 120);
  const email = clean(body.email, 180).toLowerCase();
  const phone = clean(body.phone, 50);
  const company = clean(body.company, 150);
  const service = clean(body.service, 150);
  const message = clean(body.message, 5000);

  if (!name || !email || !service || !message) {
    return NextResponse.json({ error: 'Faltan campos requeridos.' }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'El correo electrónico no es válido.' }, { status: 400 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: process.env.WEBSITE_INTEGRATION_WORKSPACE_SLUG?.trim() || 'grupo-movensa' },
    select: { id: true },
  });
  if (!workspace) {
    return NextResponse.json({ error: 'No se encontró el espacio de trabajo configurado.' }, { status: 500 });
  }

  const workspaceId = workspace.id;
  const receivedAt = new Date();
  const marker = requestId ? `Solicitud web: ${requestId}` : '';

  try {
    const result = await prisma.$transaction(async (tx) => {
      if (marker) {
        const existingProject = await tx.project.findFirst({
          where: {
            workspaceId,
            deletedAt: null,
            description: { contains: marker },
          },
          select: { id: true, clientId: true },
        });

        if (existingProject) {
          return {
            clientId: existingProject.clientId,
            projectId: existingProject.id,
            created: false,
          };
        }
      }

      const existingClient = await tx.client.findUnique({
        where: { workspaceId_email: { workspaceId, email } },
        select: { id: true, phone: true, company: true, metadata: true },
      });

      const metadata: Prisma.InputJsonObject = {
        ...jsonObject(existingClient?.metadata ?? {}),
        source: 'grupomovensa.com',
        lastWebsiteInquiryAt: receivedAt.toISOString(),
        lastWebsiteInquiryService: service,
      };

      const client = existingClient
        ? await tx.client.update({
            where: { id: existingClient.id },
            data: {
              name,
              phone: phone || existingClient.phone,
              company: company || existingClient.company,
              metadata,
              deletedAt: null,
            },
            select: { id: true },
          })
        : await tx.client.create({
            data: {
              workspaceId,
              name,
              email,
              phone: phone || null,
              company: company || null,
              metadata,
            },
            select: { id: true },
          });

      const description = [
        marker,
        'Origen: formulario de grupomovensa.com',
        `Recibida: ${receivedAt.toISOString()}`,
        `Servicio solicitado: ${service}`,
        phone ? `Teléfono: ${phone}` : '',
        company ? `Empresa, negocio o persona: ${company}` : '',
        '',
        'Mensaje:',
        message,
      ]
        .filter((line) => line !== '')
        .join('\n');

      const project = await tx.project.create({
        data: {
          workspaceId,
          clientId: client.id,
          name: `Solicitud web · ${service} · ${name}`.slice(0, 240),
          description,
        },
        select: { id: true },
      });

      return { clientId: client.id, projectId: project.id, created: true };
    });

    return NextResponse.json({ ok: true, ...result }, { status: result.created ? 201 : 200 });
  } catch (error) {
    logger.error({ err: error }, 'Error importing a website lead');
    return NextResponse.json(
      { error: 'No se pudo registrar la solicitud en Movensa Gestión.' },
      { status: 500 }
    );
  }
}
