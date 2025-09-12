import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ImportForm from '@/components/import-form';

export default async function ImportPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Import Buyer Leads</h1>
        <p className="text-sm text-gray-500">Upload a CSV file to import multiple buyer leads</p>
      </div>

      <ImportForm />
    </div>
  );
}