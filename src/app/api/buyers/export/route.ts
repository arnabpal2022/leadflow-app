import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { buyers } from '@/lib/db/schema';
import { buyerFilterSchema } from '@/lib/validations/buyer';
import { and, or, like, desc, asc, eq } from 'drizzle-orm';
import Papa from 'papaparse';

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
      sort: searchParams.get('sort') || 'updatedAt',
      order: searchParams.get('order') || 'desc',
    });

    // Build where clause (same as GET /buyers)
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
    });

    // Convert to CSV format
    const csvData = result.map((buyer: any) => ({
      fullName: buyer.fullName,
      email: buyer.email || '',
      phone: buyer.phone,
      city: buyer.city,
      propertyType: buyer.propertyType,
      bhk: buyer.bhk || '',
      purpose: buyer.purpose,
      budgetMin: buyer.budgetMin || '',
      budgetMax: buyer.budgetMax || '',
      timeline: buyer.timeline,
      source: buyer.source,
      notes: buyer.notes || '',
      tags: buyer.tags ? JSON.parse(buyer.tags).join(',') : '',
      status: buyer.status,
    }));

    const csv = Papa.unparse(csvData);
    
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="buyers-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}