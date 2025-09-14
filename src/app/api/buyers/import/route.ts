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

    if (parsed.errors && parsed.errors.length > 0) {
      return NextResponse.json({ error: 'CSV parse error', details: parsed.errors }, { status: 400 });
    }

    // parsed.data may be an array of arrays or objects depending on header parsing
    const rows = Array.isArray(parsed.data) ? parsed.data : [];

    // Filter out empty rows (sometimes Papa returns rows with all empty strings)
    const filteredRows = rows.filter((r: any) => {
      if (!r || typeof r !== 'object') return false;
      // check if all values are empty
      const values = Object.values(r).map(v => (v === null || v === undefined ? '' : String(v).trim()));
      return values.some(v => v !== '');
    });

  if (filteredRows.length > 200) {
      return NextResponse.json({ error: 'Maximum 200 rows allowed' }, { status: 400 });
    }

    const validRows: any[] = [];
    const errors: Array<{ row: number; errors: string[] }> = [];

  filteredRows.forEach((row: any, index: number) => {
      try {
        // Coerce common CSV string fields to expected shapes/types
        const normalized = {
          ...row,
          // trim strings
          fullName: typeof row.fullName === 'string' ? row.fullName.trim() : row.fullName,
          email: typeof row.email === 'string' ? row.email.trim() : row.email,
          phone: typeof row.phone === 'string' ? row.phone.trim() : row.phone,
          city: typeof row.city === 'string' ? row.city.trim() : row.city,
          propertyType: typeof row.propertyType === 'string' ? row.propertyType.trim() : row.propertyType,
          bhk: row.bhk === '' ? undefined : (typeof row.bhk === 'string' ? row.bhk.trim() : row.bhk),
          purpose: typeof row.purpose === 'string' ? row.purpose.trim() : row.purpose,
          budgetMin: row.budgetMin === '' || row.budgetMin === undefined ? undefined : Number(row.budgetMin),
          budgetMax: row.budgetMax === '' || row.budgetMax === undefined ? undefined : Number(row.budgetMax),
          timeline: typeof row.timeline === 'string' ? row.timeline.trim() : row.timeline,
          source: typeof row.source === 'string' ? row.source.trim() : row.source,
          notes: typeof row.notes === 'string' ? row.notes.trim() : row.notes,
          tags: typeof row.tags === 'string' ? (row.tags ? row.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []) : row.tags,
        };

        const validatedRow = csvImportRowSchema.parse(normalized);
        
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
        const resolvedOwnerId = ownerId;
        if (!resolvedOwnerId) {
          errors.push({ row: index + 1, errors: ['Unauthorized'] });
          return;
        }

        validRows.push({
          ...validatedRow,
          ownerId: resolvedOwnerId,
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

  console.log('CSV import parsed.meta', { fields: parsed.meta?.fields });
  console.log('CSV import filteredRows count', filteredRows.length);
  console.log('CSV import validation errors (so far)', { errorsCount: errors.length });

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
      totalRows: filteredRows.length,
      fields: parsed.meta?.fields || [],
      insertedCount,
      errorCount: errors.length,
      errors,
    });
  } catch (error) {
    console.error('Error importing CSV:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}