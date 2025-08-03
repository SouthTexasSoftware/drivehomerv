// src/lib/classes/Promotion.ts
import type {
  PromotionType,
  PromotionUsage,
} from "$lib/new_types/PromotionType";
import {
  Timestamp,
  collection,
  setDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { getFirebase, waitForFirebase } from "$lib/new_stores/firebaseStore";
import { newUUID } from "$lib/helpers";
import { promotionStore } from "$lib/new_stores/promotionStore";
import { get } from "svelte/store";

export class Promotion {
  private getDb() {
    return getFirebase().db;
  }

  async create(
    data: Omit<PromotionType, "id" | "createdAt" | "usageCount" | "updatedAt">
  ) {
    await waitForFirebase();
    const db = this.getDb();
    const promotionsCollection = collection(db, "promotions");

    // Create base promotion data
    const promotionData: PromotionType = {
      ...data,
      id: newUUID(),
      usageCount: 0,
      startDate: data.startDate,
      endDate: data.endDate ? data.endDate : null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Remove keys with undefined values
    const cleanedData: Partial<PromotionType> = {};
    (Object.keys(promotionData) as Array<keyof PromotionType>).forEach(
      (key) => {
        if (promotionData[key] !== undefined) {
          //@ts-ignore
          cleanedData[key] = promotionData[key];
        }
      }
    );

    const docRef = doc(promotionsCollection, cleanedData.id);
    await setDoc(docRef, cleanedData);
    return promotionData;
  }

  async update(id: string, data: Partial<PromotionType>) {
    await waitForFirebase();
    const db = this.getDb();
    const updateData: Partial<PromotionType> = {
      ...data,
      startDate: data.startDate ? data.startDate : null,
      endDate: data.endDate ? data.endDate : null,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(doc(db, "promotions", id), updateData);
    return { id, ...updateData };
  }

  async delete(id: string) {
    try {
      await waitForFirebase();
      const db = this.getDb();
      if (!db) {
        throw new Error("Firestore database instance is not initialized");
      }
      await deleteDoc(doc(db, "promotions", id));
    } catch (error) {
      console.error("Error deleting promotion:", error);
      throw error;
    }
  }

  async get(id: string): Promise<PromotionType | null> {
    await waitForFirebase();
    const db = this.getDb();
    const docRef = doc(db, "promotions", id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as PromotionType;
  }

  async getAll(): Promise<PromotionType[]> {
    await waitForFirebase();
    const db = this.getDb();
    const promotionsCollection = collection(db, "promotions");
    const snapshot = await getDocs(promotionsCollection);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as PromotionType)
    );
  }

  async validate(
    code: string,
    unitId?: string,
    orderTotal?: number,
    customerId?: string
  ): Promise<PromotionType | null> {
    try {
      await waitForFirebase();
      const db = this.getDb();
      const promotionsCollection = collection(db, "promotions");
      const q = query(promotionsCollection, where("code", "==", code));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.warn(`No promotion found for code: ${code}`);
        return null;
      }

      const promotion = snapshot.docs[0].data() as PromotionType;
      const promotionId = snapshot.docs[0].id;

      // Check if promotion is active
      if (!promotion.isActive) {
        console.warn(`Promotion ${code} is inactive`);
        return null;
      }

      // Check date validity
      const now = new Date();
      if (promotion.startDate && now < new Date(promotion.startDate)) {
        console.warn(`Promotion ${code} has not started yet`);
        return null;
      }
      if (promotion.endDate && now > new Date(promotion.endDate)) {
        console.warn(`Promotion ${code} has expired`);
        return null;
      }

      // Check usage limits
      if (
        promotion.usageLimit &&
        promotion.usageCount >= promotion.usageLimit
      ) {
        console.warn(`Promotion ${code} has reached its usage limit`);
        return null;
      }

      // Check minimum purchase requirement
      if (
        promotion.minimumPurchase &&
        orderTotal !== undefined &&
        orderTotal < promotion.minimumPurchase
      ) {
        console.warn(
          `Promotion ${code} requires a minimum purchase of ${promotion.minimumPurchase}`
        );
        return null;
      }

      // Check applicable units
      // bypass if applicable = all
      if (!promotion.applicableUnits?.includes("all")) {
        if (promotion.applicableUnits && unitId) {
          const isApplicable = promotion.applicableUnits!.includes(unitId);

          if (!isApplicable) {
            console.warn(
              `Promotion ${code} is not applicable to the provided units`
            );
            return null;
          }
        }
      }

      // Check if customer has already used the promotion (if restricted to one use per customer)
      // if (
      //   promotion.usedByCustomers &&
      //   customerId &&
      //   promotion.usedByCustomers.includes(customerId)
      // ) {
      //   console.warn(
      //     `Promotion ${code} has already been used by customer ${customerId}`
      //   );
      //   return null;
      // }

      return promotion;
    } catch (error) {
      console.error("Error validating promotion:", error);
      return null;
    }
  }

  async use(
    code: string,
    customerId: string,
    bookingId: string
  ): Promise<PromotionType | null> {
    try {
      await waitForFirebase();
      const db = this.getDb();

      // Validate the promotion first
      const promotion = await this.validate(
        code,
        undefined,
        undefined,
        customerId
      );
      if (!promotion) {
        console.warn(`Cannot use promotion ${code}: invalid or not found`);
        return null;
      }

      // Increment usage count
      const newUsageCount = (promotion.usageCount || 0) + 1;

      // Update promotionUsage
      const usage: PromotionUsage = {
        customerId: customerId,
        bookingId: bookingId,
        usedTimestamp: Timestamp.now(),
      };

      const newUsageArray = promotion.promotionUsage
        ? [...promotion.promotionUsage, usage]
        : [usage];

      const updateData: Partial<PromotionType> = {
        usageCount: newUsageCount,
        promotionUsage: newUsageArray,
        updatedAt: Timestamp.now(),
      };

      // Update Firestore
      await updateDoc(doc(db, "promotions", promotion.id), updateData);

      // Update promotionStore
      promotionStore.update(promotion.id, updateData);

      // Return the updated promotion
      return { ...promotion, ...updateData };
    } catch (error) {
      console.error("Error using promotion:", error);
      return null;
    }
  }
}
