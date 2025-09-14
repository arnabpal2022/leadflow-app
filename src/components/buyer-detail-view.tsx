'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/utils';
import BuyerForm from './buyer-form';
import { Edit, ArrowLeft, Trash2 } from 'lucide-react';

interface BuyerDetailViewProps {
  buyer: any; // Type this properly based on your API response
}

export default function BuyerDetailView({ buyer }: BuyerDetailViewProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState(buyer.status);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const { data: session } = useSession();
  // Allow edit if current session user email matches owner email or ownerId matches
  const canEdit = Boolean(
    (session?.user?.email && buyer.owner?.email && session.user.email === buyer.owner.email) ||
    (session?.user?.id && buyer.ownerId && session.user.id === buyer.ownerId)
  );

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const toNumberTimestamp = (val: any): number | undefined => {
        if (typeof val === 'number' && !Number.isNaN(val)) return val;
        if (typeof val === 'string') {
          const asNum = Number(val);
          if (!Number.isNaN(asNum)) return asNum;
          const parsed = Date.parse(val);
          if (!Number.isNaN(parsed)) return parsed;
          return undefined;
        }
        if (val instanceof Date) return val.getTime();
        return undefined;
      };

      // Ensure updatedAt is a numeric timestamp to satisfy server validation
      const safeUpdatedAt = toNumberTimestamp(buyer.updatedAt);

      const payload = {
        ...buyer,
        status: newStatus,
        tags: buyer.tags || [],
        updatedAt: safeUpdatedAt,
      };

      const response = await fetch(`/api/buyers/${buyer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setStatus(newStatus);
        router.refresh();
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this buyer lead?')) {
      return;
    }

    try {
      const response = await fetch(`/api/buyers/${buyer.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/buyers');
      } else {
        alert('Failed to delete buyer');
      }
    } catch (error) {
      console.error('Error deleting buyer:', error);
      alert('Failed to delete buyer');
    }
  };

  if (isEditing) {
    return (
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Edit Buyer Lead</h1>
          <p className="text-sm text-gray-500">Update the buyer lead details</p>
        </div>
        <BuyerForm 
          initialData={buyer} 
          isEdit={true}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{buyer.fullName}</h1>
            <p className="text-muted-foreground">Buyer Lead Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Quick Status Update */}
  <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">Quick Status Update</h2>
        <div className="flex items-center gap-4">
          <Select
            value={status}
            onChange={(e) => handleStatusUpdate(e.target.value)}
            disabled={updatingStatus || !canEdit}
          >
            <option value="New">New</option>
            <option value="Qualified">Qualified</option>
            <option value="Contacted">Contacted</option>
            <option value="Visited">Visited</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Converted">Converted</option>
            <option value="Dropped">Dropped</option>
          </Select>
          {updatingStatus && <span className="text-sm text-gray-500">Updating...</span>}
        </div>
      </div>

      {/* Buyer Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h2 className="text-xl font-semibold mb-6">Contact Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Full Name</label>
              <p className="text-lg">{buyer.fullName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Phone</label>
              <p className="text-lg">{buyer.phone}</p>
            </div>
            {buyer.email && (
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-lg">{buyer.email}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500">City</label>
              <p className="text-lg">{buyer.city}</p>
            </div>
          </div>
        </div>

  <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h2 className="text-xl font-semibold mb-6">Property Requirements</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Property Type</label>
              <p className="text-lg">{buyer.propertyType}</p>
            </div>
            {buyer.bhk && (
              <div>
                <label className="text-sm font-medium text-gray-500">BHK</label>
                <p className="text-lg">{buyer.bhk}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500">Purpose</label>
              <p className="text-lg">{buyer.purpose}</p>
            </div>
            {(buyer.budgetMin || buyer.budgetMax) && (
              <div>
                <label className="text-sm font-medium text-gray-500">Budget</label>
                <p className="text-lg">
                  {buyer.budgetMin && formatCurrency(buyer.budgetMin)}
                  {buyer.budgetMin && buyer.budgetMax && ' - '}
                  {buyer.budgetMax && formatCurrency(buyer.budgetMax)}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500">Timeline</label>
              <p className="text-lg">{buyer.timeline}</p>
            </div>
          </div>
        </div>

  <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h2 className="text-xl font-semibold mb-6">Lead Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Source</label>
              <p className="text-lg">{buyer.source}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                buyer.status === 'New' ? 'bg-blue-100 text-blue-800' :
                buyer.status === 'Converted' ? 'bg-green-100 text-green-800' :
                buyer.status === 'Dropped' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {buyer.status}
              </span>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Owner</label>
              <p className="text-lg">{buyer.owner.name || buyer.owner.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Created</label>
              <p className="text-lg">{formatDate(buyer.createdAt)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Last Updated</label>
              <p className="text-lg">{formatDate(buyer.updatedAt)}</p>
            </div>
          </div>
        </div>

  <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h2 className="text-xl font-semibold mb-6">Additional Information</h2>
          <div className="space-y-4">
            {buyer.notes && (
              <div>
                <label className="text-sm font-medium text-gray-500">Notes</label>
                <p className="text-gray-700 whitespace-pre-wrap">{buyer.notes}</p>
              </div>
            )}
            {buyer.tags && buyer.tags.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {buyer.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="inline-flex px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History */}
      {buyer.history && buyer.history.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-6">Recent Changes</h2>
          <div className="space-y-4">
            {buyer.history.map((entry: any) => (
              <div key={entry.id} className="border-l-4 border-blue-500 pl-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-600">
                      Changed by {entry.changedByUser.name || entry.changedByUser.email}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(entry.changedAt)}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <pre className="text-sm bg-gray-50 p-2 rounded overflow-x-auto">
                    {JSON.stringify(JSON.parse(entry.diff), null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}