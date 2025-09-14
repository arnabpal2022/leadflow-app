'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BuyerFormData, buyerFormSchema } from '@/lib/validations/buyer';
import { X } from 'lucide-react';

interface BuyerFormProps {
  initialData?: Partial<BuyerFormData & { id: string; updatedAt: number }>;
  isEdit?: boolean;
  onCancel?: () => void;
}

export default function BuyerForm({ initialData, isEdit = false, onCancel }: BuyerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
  } = useForm<BuyerFormData>({
    resolver: zodResolver(buyerFormSchema),
    defaultValues: {
      fullName: initialData?.fullName || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      city: initialData?.city || 'Chandigarh',
      propertyType: initialData?.propertyType || 'Apartment',
      bhk: initialData?.bhk || undefined,
      purpose: initialData?.purpose || 'Buy',
      budgetMin: initialData?.budgetMin || undefined,
      budgetMax: initialData?.budgetMax || undefined,
      timeline: initialData?.timeline || '0-3m',
      source: initialData?.source || 'Website',
      notes: initialData?.notes || '',
      tags: initialData?.tags || [],
    },
  });

  const propertyType = watch('propertyType');
  const showBhk = ['Apartment', 'Villa'].includes(propertyType);

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const onSubmit = async (data: BuyerFormData) => {
    setLoading(true);
    try {
      // Ensure updatedAt is sent as a numeric timestamp (server expects number)
      const toNumberTimestamp = (val: any): number | undefined => {
        if (typeof val === 'number' && !Number.isNaN(val)) return val;
        if (typeof val === 'string') {
          // if string is numeric (milliseconds or seconds), prefer numeric parse
          const asNum = Number(val);
          if (!Number.isNaN(asNum)) return asNum;
          const parsed = Date.parse(val);
          if (!Number.isNaN(parsed)) return parsed;
          return undefined;
        }
        if (val instanceof Date) return val.getTime();
        return undefined;
      };

      const safeUpdatedAt = isEdit && initialData?.updatedAt !== undefined
        ? toNumberTimestamp(initialData!.updatedAt)
        : undefined;

      // Normalize bhk: empty string -> undefined for non-residential property types
      const normalizedBhk = data.bhk === '' ? undefined : data.bhk;

      const payload = {
        ...data,
        tags,
        budgetMin: data.budgetMin || undefined,
        budgetMax: data.budgetMax || undefined,
        email: data.email || undefined,
        notes: data.notes || undefined,
        bhk: normalizedBhk,
        ...(isEdit && initialData ? { id: initialData.id, ...(safeUpdatedAt !== undefined ? { updatedAt: safeUpdatedAt } : {}) } : {}),
      };

      const url = isEdit ? `/api/buyers/${initialData?.id}` : '/api/buyers';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push('/buyers');
        router.refresh();
      } else if (response.status === 409) {
        const error = await response.json();
        alert(error.error); // Better to use a toast notification
      } else if (response.status === 429) {
        alert('Too many requests. Please wait a moment.');
      } else {
        const error = await response.json();
        if (error.error === 'Invalid data') {
          setError('root', { message: 'Please check your input data' });
        } else {
          alert('An error occurred. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl bg-white p-6 rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <Input
            id="fullName"
            {...register('fullName')}
            className={errors.fullName ? 'border-red-500' : ''}
          />
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Phone *
          </label>
          <Input
            id="phone"
            {...register('phone')}
            placeholder="10-15 digits"
            className={errors.phone ? 'border-red-500' : ''}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
            City *
          </label>
          <Select id="city" {...register('city')} className={errors.city ? 'border-red-500' : ''}>
            <option value="Chandigarh">Chandigarh</option>
            <option value="Mohali">Mohali</option>
            <option value="Zirakpur">Zirakpur</option>
            <option value="Panchkula">Panchkula</option>
            <option value="Other">Other</option>
          </Select>
          {errors.city && (
            <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-2">
            Property Type *
          </label>
          <Select 
            id="propertyType" 
            {...register('propertyType')} 
            className={errors.propertyType ? 'border-red-500' : ''}
          >
            <option value="Apartment">Apartment</option>
            <option value="Villa">Villa</option>
            <option value="Plot">Plot</option>
            <option value="Office">Office</option>
            <option value="Retail">Retail</option>
          </Select>
          {errors.propertyType && (
            <p className="mt-1 text-sm text-red-600">{errors.propertyType.message}</p>
          )}
        </div>

        {showBhk && (
          <div>
            <label htmlFor="bhk" className="block text-sm font-medium text-gray-700 mb-2">
              BHK *
            </label>
            <Select id="bhk" {...register('bhk')} className={errors.bhk ? 'border-red-500' : ''}>
              <option value="">Select BHK</option>
              <option value="Studio">Studio</option>
              <option value="1">1 BHK</option>
              <option value="2">2 BHK</option>
              <option value="3">3 BHK</option>
              <option value="4">4 BHK</option>
            </Select>
            {errors.bhk && (
              <p className="mt-1 text-sm text-red-600">{errors.bhk.message}</p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-2">
            Purpose *
          </label>
          <Select id="purpose" {...register('purpose')} className={errors.purpose ? 'border-red-500' : ''}>
            <option value="Buy">Buy</option>
            <option value="Rent">Rent</option>
          </Select>
          {errors.purpose && (
            <p className="mt-1 text-sm text-red-600">{errors.purpose.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="budgetMin" className="block text-sm font-medium text-gray-700 mb-2">
            Budget Min (INR)
          </label>
          <Input
            id="budgetMin"
            type="number"
            {...register('budgetMin', { valueAsNumber: true })}
            className={errors.budgetMin ? 'border-red-500' : ''}
          />
          {errors.budgetMin && (
            <p className="mt-1 text-sm text-red-600">{errors.budgetMin.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="budgetMax" className="block text-sm font-medium text-gray-700 mb-2">
            Budget Max (INR)
          </label>
          <Input
            id="budgetMax"
            type="number"
            {...register('budgetMax', { valueAsNumber: true })}
            className={errors.budgetMax ? 'border-red-500' : ''}
          />
          {errors.budgetMax && (
            <p className="mt-1 text-sm text-red-600">{errors.budgetMax.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="timeline" className="block text-sm font-medium text-gray-700 mb-2">
            Timeline *
          </label>
          <Select id="timeline" {...register('timeline')} className={errors.timeline ? 'border-red-500' : ''}>
            <option value="0-3m">0-3 months</option>
            <option value="3-6m">3-6 months</option>
            <option value=">6m">&gt;6 months</option>
            <option value="Exploring">Exploring</option>
          </Select>
          {errors.timeline && (
            <p className="mt-1 text-sm text-red-600">{errors.timeline.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-2">
            Source *
          </label>
          <Select id="source" {...register('source')} className={errors.source ? 'border-red-500' : ''}>
            <option value="Website">Website</option>
            <option value="Referral">Referral</option>
            <option value="Walk-in">Walk-in</option>
            <option value="Call">Call</option>
            <option value="Other">Other</option>
          </Select>
          {errors.source && (
            <p className="mt-1 text-sm text-red-600">{errors.source.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <Textarea
          id="notes"
          {...register('notes')}
          rows={4}
          placeholder="Additional notes (max 1000 characters)"
          className={errors.notes ? 'border-red-500' : ''}
        />
        {errors.notes && (
          <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <div className="flex gap-2 mb-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add a tag"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          />
          <Button type="button" onClick={addTag} variant="outline">
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {errors.root && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{errors.root.message}</p>
        </div>
      )}

  <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : isEdit ? 'Update Lead' : 'Create Lead'}
        </Button>
        <Button type="button" variant="outline" onClick={() => onCancel ? onCancel() : router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}