import { NextResponse } from 'next/server';
import { prisma } from '@oreko/database';
import { notifyInvoiceOverdueAdminsOnce } from '@/lib/admin-alerts';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    const invoices = await prisma.invoice.findMany({
      where: {
        deletedAt: null,
        dueDate: { lt: startOfToday },
        amountDue: { gt: 0 },
        status: { in: ['sent', 'viewed', 'partial', 'overdue'] },
        events: { none: { eventType: 'admin_overdue_alert_sent' } },
      },
      select: { id: true },
      orderBy: { dueDate: 'asc' },
      take: 100,
    });

    let sent = 0;
    let failed = 0;
    for (const invoice of invoices) {
      try {
        const delivered = await notifyInvoiceOverdueAdminsOnce(invoice.id);
        if (delivered) sent += 1;
        else failed += 1;
      } catch (error) {
        failed += 1;
        logger.error({ err: error, invoiceId: invoice.id }, 'Failed to process overdue invoice alert');
      }
    }

    return NextResponse.json({
      success: true,
      processed: invoices.length,
      sent,
      failed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to process administrative email alerts');
    return NextResponse.json(
      { success: false, error: 'Failed to process administrative email alerts' },
      { status: 500 }
    );
  }
}

