// src/lib/new_types/PromotionType.ts
import type { Timestamp } from "firebase/firestore";

export type PromotionType = {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startDate: Date | string | null;
  endDate?: Date | string | null;
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
  minimumPurchase?: number;
  applicableUnits?: string[];
  promotionUsage?: PromotionUsage[];
  maxDiscount?: number;
  stackable: boolean;
  createdAt: Timestamp | string;
  updatedAt?: Timestamp | string;
};


export interface PromotionUsage {
  customerId:string;
  bookingId:string;
  usedTimestamp: Timestamp | string;
}