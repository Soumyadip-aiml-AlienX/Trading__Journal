import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    const where: Record<string, unknown> = {};
    
    if (category) {
      where.category = category;
    }
    
    if (search) {
      where.content = {
        contains: search,
      };
    }

    const lessons = await prisma.lesson.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(lessons);
  } catch (error) {
    console.error('Lessons GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const lesson = await prisma.lesson.create({
      data: {
        date: body.date ? new Date(body.date) : new Date(),
        content: body.content,
        category: body.category || 'Strategy',
        tags: body.tags ? JSON.stringify(body.tags) : '[]',
        tradeId: body.tradeId || null,
      },
    });

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    console.error('Lessons POST error:', error);
    return NextResponse.json({ error: 'Failed to create lesson' }, { status: 500 });
  }
}
