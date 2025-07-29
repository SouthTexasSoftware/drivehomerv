// src/lib/classes/promotion.ts
import type { PromotionType } from "$lib/new_types/PromotionType";
import {
  Timestamp,
  collection,
  setDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { getFirebase, waitForFirebase } from "$lib/new_stores/firebaseStore";

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
    const promotionData: PromotionType = {
      ...data,
      id: "",
      usageCount: 0,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = doc(promotionsCollection);
    await setDoc(docRef, promotionData);
    promotionData.id = docRef.id;
    return promotionData;
  }

  async update(id: string, data: Partial<PromotionType>) {
    await waitForFirebase();
    const db = this.getDb();
    const updateData: Partial<PromotionType> = {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(doc(db, "promotions", id), updateData);
    return { id, ...updateData };
  }

  async delete(id: string) {
    await waitForFirebase();
    const db = this.getDb();
    await deleteDoc(doc(db, "promotions", id));
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
}
