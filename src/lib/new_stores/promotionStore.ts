// src/lib/stores/promotionStore.ts
import { writable } from "svelte/store";
import type { PromotionType } from "$lib/new_types/PromotionType";
import { Promotion } from "$lib/classes/Promotion";
import { alertStore } from "$lib/stores/alert";

function createPromotionStore() {
  const { subscribe, set, update } = writable<PromotionType[]>([]);

  // Lazy instantiation of Promotion to avoid SSR issues
  let promotion: Promotion | null = null;
  function getPromotionInstance(): Promotion {
    if (!promotion && typeof window !== "undefined") {
      promotion = new Promotion();
    }
    if (!promotion) {
      throw new Error("Promotion instance not available");
    }
    return promotion;
  }

  return {
    subscribe,
    loadAll: async (alert: boolean = false) => {
      try {
        const promotionInstance = getPromotionInstance();
        const promotions = await promotionInstance.getAll();
        set(promotions);
        if (alert) alertStore.success("Promotions loaded successfully", 3000);
      } catch (error) {
        if (alert) alertStore.error("Failed to load promotions", 5000);
        console.error(error);
      }
    },
    get: async (id: string): Promise<PromotionType | null> => {
      try {
        // Check local store first
        let foundPromotion: PromotionType | undefined;
        update((promotions) => {
          foundPromotion = promotions.find((p) => p.id === id);
          return promotions; // Return unchanged to satisfy update
        });

        if (foundPromotion) {
          return foundPromotion;
        }

        // Fetch from database
        const promotionInstance = getPromotionInstance();
        const dbPromotion = await promotionInstance.get(id);
        if (dbPromotion) {
          update((promotions) => [...promotions, dbPromotion]);
        }
        return dbPromotion;
      } catch (error) {
        console.error("Failed to fetch promotion from database:", error);
        return null;
      }
    },
    create: async (
      data: Omit<
        PromotionType,
        "id" | "createdAt" | "usageCount" | "updatedAt"
      >,
      alert: boolean = false
    ) => {
      try {
        const promotionInstance = getPromotionInstance();
        const newPromotion = await promotionInstance.create(data);
        update((promotions) => [...promotions, newPromotion]);
        if (alert) alertStore.success("Promotion created successfully", 3000);
      } catch (error) {
        if (alert) alertStore.error("Failed to create promotion", 5000);
        console.error(error);
      }
    },
    update: async (
      id: string,
      data: Partial<PromotionType>,
      alert: boolean = false
    ) => {
      try {
        const promotionInstance = getPromotionInstance();
        const updatedPromotion = await promotionInstance.update(id, data);
        update((promotions) =>
          promotions.map((p) =>
            p.id === id ? { ...p, ...updatedPromotion } : p
          )
        );
        if (alert) alertStore.success("Promotion updated successfully", 3000);
      } catch (error) {
        if (alert) alertStore.error("Failed to update promotion", 5000);
        console.error(error);
      }
    },
    delete: async (id: string, alert: boolean = false) => {
      try {
        const promotionInstance = getPromotionInstance();
        await promotionInstance.delete(id);
        update((promotions) => promotions.filter((p) => p.id !== id));
        if (alert) alertStore.success("Promotion deleted successfully", 3000);
      } catch (error) {
        if (alert) alertStore.error("Failed to delete promotion", 5000);
        console.error(error);
      }
    },
  };
}

export const promotionStore = createPromotionStore();
