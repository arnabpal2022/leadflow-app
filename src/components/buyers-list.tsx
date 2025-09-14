'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { formatCurrency, formatDate, debounce } from '@/lib/utils';
import { BuyerFilters } from '@/lib/validations/buyer';
import Link from 'next/link';
import { Eye, Download, ChevronLeft, ChevronRight } from 'lucide-react';

interface Buyer {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  city: string;
  propertyType: string;
  budgetMin: number | null;
  budgetMax: number | null;
  timeline: string;
  status: string;
  updatedAt: number;
  owner: {
    name: string | null;
    email: string;
  };
}

interface BuyersResponse {
  buyers: Buyer[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export default function BuyersList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<BuyersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<BuyerFilters>({
    search: searchParams.get('search') || '',
    city: ((): "Chandigarh" | "Mohali" | "Zirakpur" | "Panchkula" | "Other" | undefined => {
      const val = searchParams.get('city');
      return val === "Chandigarh" || val === "Mohali" || val === "Zirakpur" || val === "Panchkula" || val === "Other" ? val : undefined;
    })(),
    propertyType: ((): "Apartment" | "Villa" | "Plot" | "Office" | "Retail" | undefined => {
      const val = searchParams.get('propertyType');
      return val === "Apartment" || val === "Villa" || val === "Plot" || val === "Office" || val === "Retail" ? val : undefined;
    })(),
    status: ((): "New" | "Qualified" | "Contacted" | "Visited" | "Negotiation" | "Converted" | "Dropped" | undefined => {
      const val = searchParams.get('status');
      return val === "New" || val === "Qualified" || val === "Contacted" || val === "Visited" || val === "Negotiation" || val === "Converted" || val === "Dropped" ? val : undefined;
    })(),
    timeline: ((): "0-3m" | "3-6m" | ">6m" | "Exploring" | undefined => {
      const val = searchParams.get('timeline');
      return val === "0-3m" || val === "3-6m" || val === ">6m" || val === "Exploring" ? val : undefined;
    })(),
    page: parseInt(searchParams.get('page') || '1'),
    sort: (searchParams.get('sort') as any) || 'updatedAt',
    order: (searchParams.get('order') as any) || 'desc',
  });

  const fetchBuyers = useCallback(async (currentFilters: BuyerFilters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.set(key, value.toString());
        }
      });

      const response = await fetch(`/api/buyers?${params}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching buyers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedFetch = useCallback(
    debounce((newFilters: BuyerFilters) => {
      fetchBuyers(newFilters);
      updateURL(newFilters);
    }, 300),
    [fetchBuyers]
  );

  const updateURL = (newFilters: BuyerFilters) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, value.toString());
      }
    });
    router.push(`/buyers?${params}`, { scroll: false });
  };

  const updateFilters = (updates: Partial<BuyerFilters>) => {
    const newFilters = { ...filters, ...updates, page: 1 };
    setFilters(newFilters);
    debouncedFetch(newFilters);
  };

  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    fetchBuyers(newFilters);
    updateURL(newFilters);
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && key !== 'page') {
          params.set(key, value.toString());
        }
      });

      const response = await fetch(`/api/buyers/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `buyers-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  useEffect(() => {
    fetchBuyers(filters);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
        <Input
          placeholder="Search by name, phone, email..."
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
        />
        
        <Select
          className="min-w-0 w-full transition-all duration-150 ease-in-out focus:outline-none focus:border-none focus:scale-[1.01] hover:scale-[1.01]"
          value={filters.city || ''}
          onChange={(e) => updateFilters({ city: (e.target.value || undefined) as BuyerFilters['city'] })}
        >
          <option value="">All Cities</option>
          <option value="Chandigarh">Chandigarh</option>
          <option value="Mohali">Mohali</option>
          <option value="Zirakpur">Zirakpur</option>
          <option value="Panchkula">Panchkula</option>
          <option value="Other">Other</option>
        </Select>

        <Select
          className="min-w-0 w-full transition-all duration-150 ease-in-out focus:outline-none focus:border-none focus:scale-[1.01] hover:scale-[1.01]"
          value={filters.propertyType || ''}
          onChange={(e) => updateFilters({ propertyType: (e.target.value || undefined) as BuyerFilters['propertyType'] })}
        >
          <option value="">All Property Types</option>
          <option value="Apartment">Apartment</option>
          <option value="Villa">Villa</option>
          <option value="Plot">Plot</option>
          <option value="Office">Office</option>
          <option value="Retail">Retail</option>
        </Select>

        <Select
          className="min-w-0 w-full transition-all duration-150 ease-in-out focus:outline-none focus:border-none focus:scale-[1.01] hover:scale-[1.01]"
          value={filters.status || ''}
          onChange={(e) => updateFilters({ status: (e.target.value || undefined) as BuyerFilters['status'] })}
        >
          <option value="">All Statuses</option>
          <option value="New">New</option>
          <option value="Qualified">Qualified</option>
          <option value="Contacted">Contacted</option>
          <option value="Visited">Visited</option>
          <option value="Negotiation">Negotiation</option>
          <option value="Converted">Converted</option>
          <option value="Dropped">Dropped</option>
        </Select>

        <Select
          className="min-w-0 w-full transition-all duration-150 ease-in-out focus:outline-none focus:border-none focus:scale-[1.01] hover:scale-[1.01]"
          value={filters.timeline || ''}
          onChange={(e) => updateFilters({ timeline: (e.target.value || undefined) as BuyerFilters['timeline'] })}
        >
          <option value="">All Timelines</option>
          <option value="0-3m">0-3 months</option>
          <option value="3-6m">3-6 months</option>
          <option value=">6m">&gt;6 months</option>
          <option value="Exploring">Exploring</option>
        </Select>

        <Button
          onClick={async () => {
            // small rotation animation by toggling a class
            const btn = document.getElementById('export-button');
            if (btn) {
              btn.classList.add('animate-[spin_0.6s_ease]');
              setTimeout(() => btn.classList.remove('animate-[spin_0.6s_ease]'), 600);
            }
            await handleExport();
          }}
          id="export-button"
          variant="ghost"
          className="w-full"
        >
          <Download className="w-4 h-4 mr-2 transition-transform duration-200" />
          Export
        </Button>
      </div>

      {/* Results */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
        {data?.buyers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No buyers found matching your criteria.</p>
            <p className="text-sm text-gray-400 mt-2">Try clearing filters or importing leads.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name & Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location & Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Budget
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timeline & Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.buyers.map((buyer) => (
                    <tr key={buyer.id} className="hover:bg-gray-50 transition-transform duration-150 ease-in-out hover:-translate-y-0.5 hover:shadow-sm">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {buyer.fullName}
                          </div>
                          <div className="text-sm text-gray-500">{buyer.phone}</div>
                          {buyer.email && (
                            <div className="text-sm text-gray-500">{buyer.email}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{buyer.city}</div>
                        <div className="text-sm text-gray-500">{buyer.propertyType}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {buyer.budgetMin || buyer.budgetMax ? (
                          <div>
                            {buyer.budgetMin && formatCurrency(buyer.budgetMin)}
                            {buyer.budgetMin && buyer.budgetMax && ' - '}
                            {buyer.budgetMax && formatCurrency(buyer.budgetMax)}
                          </div>
                        ) : (
                          <span className="text-gray-400">Not specified</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{buyer.timeline}</div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          buyer.status === 'New' ? 'bg-blue-100 text-blue-800' :
                          buyer.status === 'Converted' ? 'bg-green-100 text-green-800' :
                          buyer.status === 'Dropped' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {buyer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(buyer.updatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link 
                          href={`/buyers/${buyer.id}`}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <Button
                    variant="ghost"
                    onClick={() => handlePageChange(data.pagination.page - 1)}
                    disabled={data.pagination.page <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handlePageChange(data.pagination.page + 1)}
                    disabled={data.pagination.page >= data.pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">
                        {(data.pagination.page - 1) * data.pagination.pageSize + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min(data.pagination.page * data.pagination.pageSize, data.pagination.total)}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium">{data.pagination.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <Button
                        variant="ghost"
                        onClick={() => handlePageChange(data.pagination.page - 1)}
                        disabled={data.pagination.page <= 1}
                        className="rounded-l-md"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1)
                        .filter(page => 
                          page === 1 || 
                          page === data.pagination.totalPages || 
                          Math.abs(page - data.pagination.page) <= 2
                        )
                        .map((page, index, array) => (
                          <div key={page} className="flex">
                            {index > 0 && array[index - 1] !== page - 1 && (
                              <span className="px-3 py-2 text-gray-500">...</span>
                            )}
                            <Button
                              variant={page === data.pagination.page ? 'default' : 'ghost'}
                              onClick={() => handlePageChange(page)}
                              className="rounded-none"
                            >
                              {page}
                            </Button>
                          </div>
                        ))}
                      <Button
                        variant="ghost"
                        onClick={() => handlePageChange(data.pagination.page + 1)}
                        disabled={data.pagination.page >= data.pagination.totalPages}
                        className="rounded-r-md"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}