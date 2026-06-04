import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay } from 'date-fns';
import { sendNotification } from '@/lib/notifications';
import { generateDailySummary } from '@/lib/calculations';
import { syncToNotion } from '@/lib/notion';
import { getUserFromRequest } from '@/lib/auth';

// GET - Retrieve daily log for a specific date or a date range for the current user
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    if (dateFrom || dateTo) {
      const logs = await prisma.dailyLog.findMany({
        where: {
          userId: user.id,
          date: {
            ...(dateFrom ? { gte: startOfDay(new Date(dateFrom)) } : {}),
            ...(dateTo ? { lte: startOfDay(new Date(dateTo)) } : {}),
          },
        },
        orderBy: { date: 'asc' },
      });
      return NextResponse.json(logs);
    }

    const date = startOfDay(dateParam ? new Date(dateParam) : new Date());
    const log = await prisma.dailyLog.findUnique({
      where: { date_userId: { date, userId: user.id } },
      include: { trades: true },
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error('DailyLog GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch daily log' }, { status: 500 });
  }
}

// POST - Create daily log (pre-session check-in) for the current user
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const date = startOfDay(new Date(body.date));

    const log = await prisma.dailyLog.upsert({
      where: { date_userId: { date, userId: user.id } },
      update: {
        mentalState: body.mentalState,
        physicalState: body.physicalState,
        marketConfidence: body.marketConfidence,
        distractionLevel: body.distractionLevel,
        sleepQuality: body.sleepQuality,
        personalStress: body.personalStress ?? false,
        stressDetails: body.stressDetails ?? null,
        readinessScore: body.readinessScore,
      },
      create: {
        userId: user.id,
        date,
        mentalState: body.mentalState,
        physicalState: body.physicalState,
        marketConfidence: body.marketConfidence,
        distractionLevel: body.distractionLevel,
        sleepQuality: body.sleepQuality,
        personalStress: body.personalStress ?? false,
        stressDetails: body.stressDetails ?? null,
        readinessScore: body.readinessScore,
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error('DailyLog POST error:', error);
    return NextResponse.json({ error: 'Failed to save daily log' }, { status: 500 });
  }
}

// PATCH - Update daily log (reflection) for the current user
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const date = startOfDay(new Date(body.date));

    // Check if log exists, create minimal one if not
    const existing = await prisma.dailyLog.findUnique({
      where: { date_userId: { date, userId: user.id } }
    });
    if (!existing) {
      return NextResponse.json(
        { error: 'Please complete the pre-session check-in first.' },
        { status: 400 }
      );
    }

    const log = await prisma.dailyLog.update({
      where: { date_userId: { date, userId: user.id } },
      data: {
        marketBias: body.marketBias ?? null,
        goldBehaviour: body.goldBehaviour ?? null,
        cryptoBehaviour: body.cryptoBehaviour ?? null,
        keyNewsEvents: body.keyNewsEvents ?? null,
        goodDayToTrade: body.goodDayToTrade ?? null,
        strategyRating: body.strategyRating ?? null,
        setupsWorked: body.setupsWorked ?? null,
        setupsFailed: body.setupsFailed ?? null,
        obQuality: body.obQuality ?? null,
        fvgReliability: body.fvgReliability ?? null,
        followedPlan: body.followedPlan ?? null,
        biggestMistake: body.biggestMistake ?? null,
        biggestSuccess: body.biggestSuccess ?? null,
        whatDifferently: body.whatDifferently ?? null,
        lessonLearned: body.lessonLearned ?? null,
        keyLevels: body.keyLevels ?? null,
        expectedBias: body.expectedBias ?? null,
        scheduledNews: body.scheduledNews ?? null,
        tomorrowPlan: body.tomorrowPlan ?? null,
        tradingGoals: body.tradingGoals ?? null,
      },
    });

    // Save lesson to lessons database if provided
    if (body.lessonLearned) {
      await prisma.lesson.create({
        data: {
          userId: user.id,
          date,
          content: body.lessonLearned,
          category: 'Strategy',
        },
      });
    }

    // Fetch today's trades to generate daily summary
    let summaryText = 'Reflection completed.';
    try {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const todayTrades = await prisma.trade.findMany({
        where: {
          userId: user.id,
          date: {
            gte: date,
            lt: nextDay,
          },
        },
      });

      summaryText = generateDailySummary(
        date.toLocaleDateString(),
        todayTrades,
        body.lessonLearned || null
      );

      // Save summary back to DailyLog
      await prisma.dailyLog.update({
        where: { date_userId: { date, userId: user.id } },
        data: { autoSummary: summaryText },
      });

      // Send Discord/Telegram Notification
      await sendNotification(`[MAVEN JOURNAL] Daily Reflection Completed!\n${summaryText}`);

      // Sync to Notion
      try {
        await syncToNotion(log, todayTrades);
      } catch (notionErr) {
        console.error('Failed to sync daily log to Notion:', notionErr);
      }
    } catch (err) {
      console.error('Failed to generate daily reflection summary:', err);
    }

    return NextResponse.json(log);
  } catch (error) {
    console.error('DailyLog PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update daily log' }, { status: 500 });
  }
}
