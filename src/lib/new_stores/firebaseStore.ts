// src/lib/stores/firebaseStore.ts
import { writable, type Writable } from "svelte/store";
import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type {
  Firestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";
import type { Analytics } from "firebase/analytics";
import { firebaseClientConfig } from "../../config";

export interface FirebaseStore {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
  analytics?: Analytics;
}

//@ts-ignore
const firebaseStore: Writable<FirebaseStore> = writable(undefined);
let initializationPromise: Promise<void> | null = null;

export async function connectToFirebase() {
  if (typeof window !== "undefined") {
    try {
      // Check if already initialized
      let currentStore: FirebaseStore | undefined;
      firebaseStore.subscribe((value) => (currentStore = value))();
      if (currentStore) {
        return true;
      }

      const appModule = await import("firebase/app");
      const firestoreModule = await import("firebase/firestore");
      const storageModule = await import("firebase/storage");
      const authModule = await import("firebase/auth");

      // Initialize Firebase
      const app = appModule.initializeApp(
        firebaseClientConfig,
        "drive-home-rv"
      );
      const auth = authModule.getAuth(app);
      const db = firestoreModule.initializeFirestore(app, {
        localCache: firestoreModule.persistentLocalCache({
          tabManager: firestoreModule.persistentMultipleTabManager(),
        }),
      });
      const storage = storageModule.getStorage(app);

      const storeValue: FirebaseStore = { app, auth, db, storage };
      firebaseStore.set(storeValue);
      return true;
    } catch (e) {
      console.error("Firebase initialization failed:", e);
      throw e; // Let callers handle the error
    }
  }
  return false;
}

export function getFirebase(): FirebaseStore {
  let currentStore: FirebaseStore | undefined;
  firebaseStore.subscribe((value) => (currentStore = value))();
  if (!currentStore) {
    throw new Error(
      "Firebase not initialized. Ensure connectToFirebase() has completed."
    );
  }
  return currentStore;
}

export function waitForFirebase(): Promise<void> {
  return new Promise((resolve, reject) => {
    let unsubscribe: (() => void) | null = null;
    unsubscribe = firebaseStore.subscribe((value) => {
      if (value) {
        if (unsubscribe) unsubscribe();
        resolve();
      }
    });
    // Handle case where Firebase initialization fails
    connectToFirebase().catch((error) => {
      if (unsubscribe) unsubscribe();
      reject(error);
    });
  });
}

export { firebaseStore };
