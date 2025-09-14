import { z } from 'zod';

export const cityEnum = z.enum(['Chandigarh', 'Mohali', 'Zirakpur', 'Panchkula', 'Other']);
export const propertyTypeEnum = z.enum(['Apartment', 'Villa', 'Plot', 'Office', 'Retail']);
export const bhkEnum = z.enum(['1', '2', '3', '4', 'Studio']);
export const purposeEnum = z.enum(['Buy', 'Rent']);
export const timelineEnum = z.enum(['0-3m', '3-6m', '>6m', 'Exploring']);
export const sourceEnum = z.enum(['Website', 'Referral', 'Walk-in', 'Call', 'Other']);
export const statusEnum = z.enum(['New', 'Qualified', 'Contacted', 'Visited', 'Negotiation', 'Converted', 'Dropped']);

export const buyerFormSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(80, 'Full name must be less than 80 characters'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().regex(/^\d{10,15}$/, 'Phone must be 10-15 digits'),
  city: cityEnum,
  propertyType: propertyTypeEnum,
  bhk: bhkEnum.optional(),
  purpose: purposeEnum,
  budgetMin: z.number().int().positive().optional(),
  budgetMax: z.number().int().positive().optional(),
  timeline: timelineEnum,
  source: sourceEnum,
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  tags: z.array(z.string()).optional(),
}).refine((data) => {
  // BHK required for Apartment/Villa
  if (['Apartment', 'Villa'].includes(data.propertyType) && !data.bhk) {
    return false;
  }
  return true;
}, {
  message: 'BHK is required for Apartment and Villa',
  path: ['bhk'],
}).refine((data) => {
  // Budget max >= budget min
  if (data.budgetMin && data.budgetMax && data.budgetMax < data.budgetMin) {
    return false;
  }
  return true;
}, {
  message: 'Maximum budget must be greater than or equal to minimum budget',
  path: ['budgetMax'],
});

// Extend the validated form schema for update operations (id + updatedAt)
export const buyerUpdateSchema = buyerFormSchema.safeExtend({
  id: z.string(),
  // Accept numeric timestamps or strings that can be parsed to numbers/ISO dates
  updatedAt: z.preprocess((val) => {
    if (typeof val === 'number' && !Number.isNaN(val)) return val;
    if (typeof val === 'string') {
      const asNum = Number(val);
      if (!Number.isNaN(asNum)) return asNum;
      const parsed = Date.parse(val);
      if (!Number.isNaN(parsed)) return parsed;
    }
    return val;
  }, z.number()),
});

export const buyerFilterSchema = z.object({
  search: z.string().optional(),
  city: cityEnum.optional(),
  propertyType: propertyTypeEnum.optional(),
  status: statusEnum.optional(),
  timeline: timelineEnum.optional(),
  page: z.number().int().positive().default(1),
  sort: z.enum(['updatedAt', 'createdAt', 'fullName']).default('updatedAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const csvImportRowSchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().regex(/^\d{10,15}$/),
  city: cityEnum,
  propertyType: propertyTypeEnum,
  bhk: bhkEnum.optional().or(z.literal('')),
  purpose: purposeEnum,
  budgetMin: z.string().transform(val => val ? parseInt(val) : undefined).optional(),
  budgetMax: z.string().transform(val => val ? parseInt(val) : undefined).optional(),
  timeline: timelineEnum,
  source: sourceEnum,
  notes: z.string().max(1000).optional().or(z.literal('')),
  tags: z.string().transform(val => val ? val.split(',').map(t => t.trim()) : []).optional(),
  status: statusEnum.optional(),
});

export type BuyerFormData = z.infer<typeof buyerFormSchema>;
export type BuyerUpdateData = z.infer<typeof buyerUpdateSchema>;
export type BuyerFilters = z.infer<typeof buyerFilterSchema>;
export type CsvImportRow = z.infer<typeof csvImportRowSchema>;