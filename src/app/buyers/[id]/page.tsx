import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import BuyerDetailView from '@/components/buyer-detail-view';
import { db } from '@/lib/db';
import { buyers } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

interface Props {
  params: { id: string };
}

export default async function BuyerDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/signin');
  }
  try {
    // `params` can be a Promise in some Next runtime shapes — await it before
    // accessing properties to avoid the runtime error.
    const resolvedParams: any = await params;
    const id = resolvedParams.id;

    // Server-side: fetch directly from DB instead of HTTP call. Use the same
    // relations as the API to keep the shape consistent.
    const buyer = await db.query.buyers.findFirst({
      where: eq(buyers.id, id),
      with: {
        owner: { columns: { name: true, email: true } },
        history: {
          orderBy: (h: any, { desc }: any) => [desc(h.changedAt)],
          limit: 5,
          with: {
            changedByUser: { columns: { name: true, email: true } },
          },
        },
      },
    });

    if (!buyer) {
      notFound();
    }

    // Ensure tags is an array (stored as JSON text in DB)
    const buyerWithParsedTags = {
      ...buyer,
      tags: buyer.tags ? JSON.parse(buyer.tags) : [],
    };

    return (
      <div className="container mx-auto px-4 py-8">
        <BuyerDetailView buyer={buyerWithParsedTags} />
      </div>
    );
  } catch (error) {
    console.error('Error fetching buyer:', error);
    notFound();
  }
}