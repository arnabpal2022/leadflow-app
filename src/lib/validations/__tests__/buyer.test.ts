import { describe, it, expect } from 'vitest';
import { buyerFormSchema, csvImportRowSchema } from '../buyer';

describe('Buyer Validation', () => {
  describe('buyerFormSchema', () => {
    it('should validate a complete buyer form', () => {
      const validBuyer = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210',
        city: 'Chandigarh' as const,
        propertyType: 'Apartment' as const,
        bhk: '2' as const,
        purpose: 'Buy' as const,
        budgetMin: 5000000,
        budgetMax: 7000000,
        timeline: '0-3m' as const,
        source: 'Website' as const,
        notes: 'Looking for a nice apartment',
        tags: ['urgent', 'first-time-buyer'],
      };

      const result = buyerFormSchema.safeParse(validBuyer);
      expect(result.success).toBe(true);
    });

    it('should require BHK for Apartment', () => {
      const invalidBuyer = {
        fullName: 'John Doe',
        phone: '9876543210',
        city: 'Chandigarh' as const,
        propertyType: 'Apartment' as const,
        // bhk: missing
        purpose: 'Buy' as const,
        timeline: '0-3m' as const,
        source: 'Website' as const,
      };

      const result = buyerFormSchema.safeParse(invalidBuyer);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('bhk') && 
          issue.message.includes('BHK is required')
        )).toBe(true);
      }
    });

    it('should validate budget min <= budget max', () => {
      const invalidBuyer = {
        fullName: 'John Doe',
        phone: '9876543210',
        city: 'Chandigarh' as const,
        propertyType: 'Plot' as const,
        purpose: 'Buy' as const,
        budgetMin: 7000000,
        budgetMax: 5000000, // Less than min
        timeline: '0-3m' as const,
        source: 'Website' as const,
      };

      const result = buyerFormSchema.safeParse(invalidBuyer);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('budgetMax')
        )).toBe(true);
      }
    });

    it('should validate phone number format', () => {
      const invalidBuyer = {
        fullName: 'John Doe',
        phone: '123', // Too short
        city: 'Chandigarh' as const,
        propertyType: 'Plot' as const,
        purpose: 'Buy' as const,
        timeline: '0-3m' as const,
        source: 'Website' as const,
      };

      const result = buyerFormSchema.safeParse(invalidBuyer);
      expect(result.success).toBe(false);
    });
  });

  describe('csvImportRowSchema', () => {
    it('should validate CSV row with string numbers', () => {
      const csvRow = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210',
        city: 'Chandigarh' as const,
        propertyType: 'Apartment' as const,
        bhk: '2' as const,
        purpose: 'Buy' as const,
        budgetMin: '5000000', // String number
        budgetMax: '7000000', // String number
        timeline: '0-3m' as const,
        source: 'Website' as const,
        notes: 'Test notes',
        tags: 'urgent,first-time', // Comma-separated
        status: 'New' as const,
      };

      const result = csvImportRowSchema.safeParse(csvRow);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.budgetMin).toBe(5000000);
        expect(result.data.budgetMax).toBe(7000000);
        expect(result.data.tags).toEqual(['urgent', 'first-time']);
      }
    });
  });
});