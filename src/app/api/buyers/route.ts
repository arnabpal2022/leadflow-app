import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { buyers, buyerHistory, users } from '@/lib/db/schema';
import { buyerFormSchema, buyerFilterSchema } from '@/lib/validations/buyer';
import { eq, and, or, like, desc, asc } from 'drizzle-orm';
import rateLimit from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500,
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = buyerFilterSchema.parse({
      search: searchParams.get('search') || undefined,
      city: searchParams.get('city') || undefined,
      propertyType: searchParams.get('propertyType') || undefined,
      status: searchParams.get('status') || undefined,
      timeline: searchParams.get('timeline') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      sort: searchParams.get('sort') || 'updatedAt',
      order: searchParams.get('order') || 'desc',
    });

    const pageSize = 10;
    const offset = (filters.page - 1) * pageSize;

    // Build where clause
    const conditions = [];
    
    if (filters.search) {
      conditions.push(
        or(
          like(buyers.fullName, `%${filters.search}%`),
          like(buyers.phone, `%${filters.search}%`),
          like(buyers.email, `%${filters.search}%`)
        )
      );
    }

    if (filters.city) {
      conditions.push(eq(buyers.city, filters.city));
    }

    if (filters.propertyType) {
      conditions.push(eq(buyers.propertyType, filters.propertyType));
    }

    if (filters.status) {
      conditions.push(eq(buyers.status, filters.status));
    }

    if (filters.timeline) {
      conditions.push(eq(buyers.timeline, filters.timeline));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const totalResult = await db.select()
      .from(buyers)
      .where(whereClause);
    const total = totalResult.length;

    // Get buyers with pagination and sorting
    const allowedSorts = [
        'updatedAt', 'createdAt', 'fullName', 'email', 'phone',
        'city', 'propertyType', 'status', 'timeline'
    ];
    const sortKey = allowedSorts.includes(filters.sort) ? filters.sort : 'updatedAt';
    const orderBy = filters.order === 'desc' 
      ? desc(buyers[sortKey])
      : asc(buyers[sortKey]);

    const result = await db.query.buyers.findMany({
      where: whereClause,
      orderBy,
      limit: pageSize,
      offset,
      with: {
        owner: {
          columns: { name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      buyers: result,
      pagination: {
        page: filters.page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching buyers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve ownerId: prefer session.user.id, fall back to DB lookup by email
    let ownerId = session.user.id as string | undefined;
    if (!ownerId && session.user.email) {
  const maybeUser = await db.query.users.findFirst({ where: (usersCol: any, { eq }: any) => eq(usersCol.email, session.user.email) });
      ownerId = maybeUser?.id;
    }
    if (!ownerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    await limiter.check(10, ownerId); // 10 requests per minute per user

    const body = await request.json();
    const validatedData = buyerFormSchema.parse(body);

    const newBuyer = await db.insert(buyers).values({
      ...validatedData,
      email: validatedData.email || null,
      budgetMin: validatedData.budgetMin || null,
      budgetMax: validatedData.budgetMax || null,
      notes: validatedData.notes || null,
      tags: validatedData.tags ? JSON.stringify(validatedData.tags) : null,
  ownerId,
    }).returning();

    // Create history entry
    await db.insert(buyerHistory).values({
      buyerId: newBuyer[0].id,
      changedBy: ownerId,
      diff: JSON.stringify({ action: 'created', data: validatedData }),
    });

    return NextResponse.json(newBuyer[0], { status: 201 });
  } catch (error: any) {
    if (error.message === 'Rate limit exceeded') {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    console.error('Error creating buyer:', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}