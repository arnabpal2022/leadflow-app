import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import BuyersList from "@/components/buyers-list";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Download, Upload } from "lucide-react";

export default async function BuyersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Buyer Leads</h1>
          <p className="text-sm text-gray-500">Manage your buyer leads</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/buyers/import">
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Link>
          </Button>
          <Button asChild>
            <Link href="/buyers/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Lead
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <BuyersList />
      </Suspense>
    </div>
  );
}
