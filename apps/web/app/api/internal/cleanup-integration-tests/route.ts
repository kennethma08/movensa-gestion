import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@oreko/database';

function isAuthorized(request: NextRequest) {
  const expected = process.env.CLEANUP_INTEGRATION_TESTS_SECRET?.trim();
  const authorization = request.headers.get('authorization');
  const provided = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!expected || !provided) return false;

  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);
  return expectedBytes.length === providedBytes.length && timingSafeEqual(expectedBytes, providedBytes);
}

/**
 * One-time maintenance endpoint. It only removes automated integration-test clients.
 * The matching email prefix is reserved by the integration test suite.
 */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: 'grupo-movensa' },
    select: { id: true },
  });

  if (!workspace) {
    return NextResponse.json({ error: 'No se encontró el espacio de trabajo.' }, { status: 404 });
  }

  const clients = await prisma.client.findMany({
    where: {
      workspaceId: workspace.id,
      email: { startsWith: 'prueba.integracion.' },
    },
    select: { id: true },
  });

  if (clients.length === 0) {
    return NextResponse.json({ ok: true, clientsDeleted: 0, projectsDeleted: 0 });
  }

  const clientIds = clients.map((client) => client.id);
  const projectsDeleted = await prisma.project.count({
    where: { workspaceId: workspace.id, clientId: { in: clientIds } },
  });

  const deleted = await prisma.client.deleteMany({
    where: { workspaceId: workspace.id, id: { in: clientIds } },
  });

  return NextResponse.json({
    ok: true,
    clientsDeleted: deleted.count,
    projectsDeleted,
  });
}
