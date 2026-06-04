import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { getUserFromRequest } from '@/lib/auth';

// POST: Receive alert from TradingView (unauthenticated, relies on userId query param)
export async function POST(request: NextRequest) {
  // Rate limiting: 60 requests per minute per IP
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const { allowed } = rateLimit(`webhook:${ip}`, { maxRequests: 60, windowMs: 60_000 });

  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': '60', 'X-RateLimit-Remaining': '0' },
      }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const body = await request.json();
    
    // Parse symbol, normalize to uppercase (XAUUSD, BTCUSD, etc.)
    let ticker = (body.ticker || body.symbol || 'XAUUSD').toUpperCase();
    if (ticker.includes('GOLD') || ticker.includes('XAU')) {
      ticker = 'XAUUSD';
    } else if (ticker.includes('BTC') || ticker.includes('BITCOIN')) {
      ticker = 'BTCUSD';
    } else if (ticker.includes('ETH') || ticker.includes('ETHEREUM')) {
      ticker = 'ETHUSD';
    }
    
    const action = (body.action || body.side || 'BUY').toUpperCase() === 'SELL' ? 'SELL' : 'BUY';
    const price = parseFloat(body.price) || 0;
    const stopLoss = body.stopLoss ? parseFloat(body.stopLoss) : null;
    const tp1 = body.tp1 ? parseFloat(body.tp1) : null;
    const tp2 = body.tp2 ? parseFloat(body.tp2) : null;
    
    // Determine session
    const date = new Date();
    const hour = date.getUTCHours();
    let session = 'NY Open';
    if (hour >= 7 && hour < 12) {
      session = 'London Open';
    } else if (hour >= 12 && hour < 15) {
      session = 'NY Open';
    } else if (hour >= 15 && hour < 18) {
      session = 'NY Lunch';
    } else {
      session = 'Late NY';
    }
    
    const setup = body.setup || body.message || 'TradingView Signal';

    const alert = await prisma.webhookAlert.create({
      data: {
        userId,
        ticker,
        action,
        price,
        stopLoss,
        tp1,
        tp2,
        session,
        setup,
        rawPayload: JSON.stringify(body),
        status: 'pending',
      },
    });

    return NextResponse.json({ success: true, alertId: alert.id }, { status: 201 });
  } catch (error) {
    console.error('TradingView Webhook POST error:', error);
    return NextResponse.json({ error: 'Failed to process webhook alert' }, { status: 500 });
  }
}

// GET: Fetch alerts for the logged-in user
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';

    const where: Record<string, unknown> = { userId: user.id };
    if (!all) {
      where.status = 'pending';
    }

    const alerts = await prisma.webhookAlert.findMany({
      where,
      orderBy: { receivedAt: 'desc' },
    });
    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Alerts GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

// PATCH: Update alert status for the logged-in user
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status') || 'converted';

    if (!id) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
    }

    const existingAlert = await prisma.webhookAlert.findUnique({
      where: { id }
    });

    if (!existingAlert || existingAlert.userId !== user.id) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    const alert = await prisma.webhookAlert.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error('WebhookAlert PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
  }
}
