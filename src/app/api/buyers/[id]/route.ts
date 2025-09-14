import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { buyers, buyerHistory } from '@/lib/db/schema';
import { buyerUpdateSchema, buyerPatchSchema } from '@/lib/validations/buyer';
import { eq } from 'drizzle-orm';
import rateLimit from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
});

function resolveParams(request: NextRequest, context: any) {
  // context.params may be a promise, an object, or undefined in different Next versions/runtime
  try {
    if (context?.params) {
      // If it's a thenable (Promise), await it
      if (typeof context.params.then === 'function') {
        return context.params;
      }
      return Promise.resolve(context.params);
    }
  } catch (err) {
    // ignore and fallback
  }

  // Fallback: parse id from request URL
  try {
    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean);
    const id = parts[parts.length - 1];
    return Promise.resolve({ id });
  } catch (err) {
    return Promise.resolve(undefined);
  }
}

export async function GET(request: NextRequest, context: any) {
  try {
    const params = await resolveParams(request, context);
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const buyer = await db.query.buyers.findFirst({
      where: eq(buyers.id, params.id),
      with: {
        owner: {
          columns: { name: true, email: true },
        },
        history: {
          orderBy: (history: any, { desc }: any) => [desc(history.changedAt)],
          limit: 5,
          with: {
            changedByUser: {
              columns: { name: true, email: true },
            },
          },
        },
      },
    });

    if (!buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });
    }

    // Parse tags
    const buyerWithParsedTags = {
      ...buyer,
      tags: buyer.tags ? JSON.parse(buyer.tags) : [],
    };

    return NextResponse.json(buyerWithParsedTags);
  } catch (error) {
    console.error('Error fetching buyer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  try {
    const params = await resolveParams(request, context);
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve ownerId
    let ownerId = session.user.id as string | undefined;
    if (!ownerId && session.user.email) {
      const maybeUser = await db.query.users.findFirst({ where: (u: any, { eq }: any) => eq(u.email, session.user.email) });
      ownerId = maybeUser?.id;
    }
    if (!ownerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await limiter.check(20, ownerId);

  const body = await request.json();
  console.log('PUT /api/buyers/:id incoming', { paramsId: params.id, body });

  // Try full update schema first, fall back to lightweight patch schema for quick updates
  let validatedData: any;
  try {
    validatedData = buyerUpdateSchema.parse(body);
  } catch (err) {
    // Attempt lightweight patch (e.g. only status + updatedAt)
    try {
      validatedData = buyerPatchSchema.parse(body);
    } catch (err2) {
      console.log('PUT /api/buyers/:id validation failed', { err, err2 });
      throw err; // Let outer catch handle responding with Invalid data
    }
  }
  console.log('PUT /api/buyers/:id validatedData', { validatedData });

    // Check if buyer exists and user has permission
    const existingBuyer = await db.query.buyers.findFirst({
      where: eq(buyers.id, params.id),
    });

    console.log('PUT /api/buyers/:id existingBuyer', { id: existingBuyer?.id, updatedAt: existingBuyer?.updatedAt });

    if (!existingBuyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });
    }

    // Check ownership or admin role
  if (existingBuyer.ownerId !== ownerId && session.user.role !== 'admin') {
    console.log('PUT /api/buyers/:id forbidden - owner mismatch', { existingOwnerId: existingBuyer.ownerId, ownerId, sessionRole: session.user.role });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check for concurrent updates
    const existingUpdatedAtNumber = (existingBuyer.updatedAt instanceof Date
      ? existingBuyer.updatedAt.getTime()
      : existingBuyer.updatedAt);

    if (existingUpdatedAtNumber !== validatedData.updatedAt) {
      console.log('PUT /api/buyers/:id concurrent update mismatch', { existingUpdatedAtNumber, validatedDataUpdatedAt: validatedData.updatedAt });
      return NextResponse.json({ 
        error: 'Record has been modified by another user. Please refresh and try again.' 
      }, { status: 409 });
    }

    // Calculate diff for history
      const changes: Record<string, { from: any; to: any }> = {};
      Object.keys(validatedData).forEach(key => {
        if (key !== 'id' && key !== 'updatedAt') {
          const oldValue = (existingBuyer as any)[key];
          const newValue = (validatedData as any)[key];
          if (oldValue !== newValue) {
            changes[key] = { from: oldValue, to: newValue };
          }
        }
      });

    const now = new Date();
    
  // Build a set object only with fields provided in the validated data to avoid overwriting unspecified fields
  const setData: any = {};
  if ('status' in validatedData) setData.status = validatedData.status;
  if ('email' in validatedData) setData.email = validatedData.email || null;
  if ('budgetMin' in validatedData) setData.budgetMin = validatedData.budgetMin ?? null;
  if ('budgetMax' in validatedData) setData.budgetMax = validatedData.budgetMax ?? null;
  if ('notes' in validatedData) setData.notes = validatedData.notes ?? null;
  if ('tags' in validatedData) setData.tags = validatedData.tags ? JSON.stringify(validatedData.tags) : null;
  if ('fullName' in validatedData) setData.fullName = validatedData.fullName;
  if ('phone' in validatedData) setData.phone = validatedData.phone;
  if ('city' in validatedData) setData.city = validatedData.city;
  if ('propertyType' in validatedData) setData.propertyType = validatedData.propertyType;
  if ('bhk' in validatedData) setData.bhk = validatedData.bhk ?? null;
  if ('purpose' in validatedData) setData.purpose = validatedData.purpose;
  if ('timeline' in validatedData) setData.timeline = validatedData.timeline;
  if ('source' in validatedData) setData.source = validatedData.source;

  setData.updatedAt = now;

  const updatedBuyer = await db.update(buyers)
    .set(setData)
    .where(eq(buyers.id, params.id))
    .returning();

  console.log('PUT /api/buyers/:id updatedBuyer result', { updatedBuyer });

  // Create history entry if there were changes
    if (Object.keys(changes).length > 0) {
      await db.insert(buyerHistory).values({
        buyerId: params.id,
        changedBy: ownerId,
        diff: JSON.stringify(changes),
      });
    }

  // updatedBuyer is an array from drizzle .returning(); return the first item
  return NextResponse.json(updatedBuyer && updatedBuyer.length ? updatedBuyer[0] : null);
  } catch (error: any) {
    if (error.message === 'Rate limit exceeded') {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    console.error('Error updating buyer:', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, context: any) {
  const params = await resolveParams(request, context);
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve ownerId for authorization
    let ownerId = session.user.id as string | undefined;
    if (!ownerId && session.user.email) {
      const maybeUser = await db.query.users.findFirst({ where: (u: any, { eq }: any) => eq(u.email, session.user.email) });
      ownerId = maybeUser?.id;
    }
    if (!ownerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingBuyer = await db.query.buyers.findFirst({
      where: eq(buyers.id, params.id),
    });

    if (!existingBuyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });
    }

  if (existingBuyer.ownerId !== ownerId && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.delete(buyers).where(eq(buyers.id, params.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting buyer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}