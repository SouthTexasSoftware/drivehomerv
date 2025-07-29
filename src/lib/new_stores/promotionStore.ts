// src/lib/stores/promotionStore.ts
import { writable } from "svelte/store";
import type { PromotionType } from "$lib/new_types/PromotionType";
import { Promotion } from "$lib/classes/Promotion";
import { alertStore } from "$lib/stores/alert";

function createPromotionStore() {
  const { subscribe, set, update } = writable<PromotionType[]>([]);
  const promotion = new Promotion();

  return {
    subscribe,
    loadAll: async (alert: boolean = false) => {
      try {
        const promotions = await promotion.getAll();
        set(promotions);
        if (alert) alertStore.success("Promotions loaded successfully", 3000);
      } catch (error) {
        if (alert) alertStore.error("Failed to load promotions", 5000);
        console.error(error);
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
        const newPromotion = await promotion.create(data);
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
        const updatedPromotion = await promotion.update(id, data);
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
        await promotion.delete(id);
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
