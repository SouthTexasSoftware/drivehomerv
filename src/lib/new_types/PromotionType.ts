// src/lib/new_types/Promotion.ts
import type { Timestamp } from 'firebase/firestore';

export type PromotionType = {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDate: Date | string;
  endDate?: Date | string;
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
  minimumPurchase?: number;
  applicableUnits?: string[];
  customerEligibility?: string[];
  maxDiscount?: number;
  stackable: boolean;
  createdAt: Timestamp | string;
  updatedAt?: Timestamp | string;
};