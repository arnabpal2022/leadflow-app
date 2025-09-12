import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { buyers, buyerHistory } from '@/lib/db/schema';
import { csvImportRowSchema } from '@/lib/validations/buyer';
import Papa from 'papaparse';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve ownerId from session or fallback to DB lookup by email
    let ownerId = session.user.id as string | undefined;
    if (!ownerId && session.user.email) {
      const maybeUser = await db.query.users.findFirst({ where: (u: any, { eq }: any) => eq(u.email, session.user.email) });
      ownerId = maybeUser?.id;
    }
    if (!ownerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });

    if (parsed.data.length > 200) {
      return NextResponse.json({ error: 'Maximum 200 rows allowed' }, { status: 400 });
    }

    const validRows: any[] = [];
    const errors: Array<{ row: number; errors: string[] }> = [];

  parsed.data.forEach((row: any, index: number) => {
      try {
        const validatedRow = csvImportRowSchema.parse(row);
        
        // Additional validation for BHK requirement
        if (['Apartment', 'Villa'].includes(validatedRow.propertyType) && !validatedRow.bhk) {
          errors.push({
            row: index + 1,
            errors: ['BHK is required for Apartment and Villa'],
          });
          return;
        }

        // Budget validation
        if (validatedRow.budgetMin && validatedRow.budgetMax && validatedRow.budgetMax < validatedRow.budgetMin) {
          errors.push({
            row: index + 1,
            errors: ['Maximum budget must be greater than or equal to minimum budget'],
          });
          return;
        }

        // Ensure ownerId exists
        const ownerId = session.user.id;
        if (!ownerId) {
          errors.push({ row: index + 1, errors: ['Unauthorized'] });
          return;
        }

        validRows.push({
          ...validatedRow,
          ownerId,
          status: validatedRow.status || 'New',
        });
      } catch (error: any) {
        const rowErrors = error.errors?.map((e: any) => `${e.path.join('.')}: ${e.message}`) || [error.message];
        errors.push({
          row: index + 1,
          errors: rowErrors,
        });
      }
    });

    // Insert valid rows in transaction
    let insertedCount = 0;
    if (validRows.length > 0) {
      const insertedBuyers = await db.insert(buyers).values(
        validRows.map(row => ({
          ...row,
          email: row.email || null,
          budgetMin: row.budgetMin || null,
          budgetMax: row.budgetMax || null,
          notes: row.notes || null,
          tags: row.tags?.length ? JSON.stringify(row.tags) : null,
        }))
      ).returning({ id: buyers.id });

      // Create history entries
      const historyEntries = insertedBuyers.map((buyer: any) => ({
        buyerId: buyer.id,
        changedBy: ownerId,
        diff: JSON.stringify({ action: 'imported' }),
      }));

      await db.insert(buyerHistory).values(historyEntries);
      insertedCount = insertedBuyers.length;
    }

    return NextResponse.json({
      totalRows: parsed.data.length,
      insertedCount,
      errorCount: errors.length,
      errors,
    });
  } catch (error) {
    console.error('Error importing CSV:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}