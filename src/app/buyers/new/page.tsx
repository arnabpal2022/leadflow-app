import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import BuyerForm from '@/components/buyer-form';

export default async function NewBuyerPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Add New Buyer Lead</h1>
        <p className="text-muted-foreground">Fill in the details to create a new buyer lead</p>
      </div>

      <BuyerForm />
    </div>
  );
}