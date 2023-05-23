import { firebaseClientConfig } from "../config";
import {
  collection,
  query,
  onSnapshot,
  getDocs,
  type DocumentData,
  QuerySnapshot,
} from "firebase/firestore";
import { get } from "svelte/store";
import type { Unit, Booking, FirebaseStore } from "./types";
import { firebaseStore, unitStore } from "./stores";
import { DateTime } from "@easepick/bundle";
import { getAnalytics } from "firebase/analytics";
import { init } from "svelte/internal";

// TODO: needs a fallback when a failure is caught. Display a message, etc.

/**
 * Asynchronous call to establish connection with Firebase
 * @returns boolean
 */
export async function connectToFirebase() {
  if (typeof window != undefined) {
    try {
      const appModule = await import("firebase/app");
      const firestoreModule = await import("firebase/firestore");
      const storageModule = await import("firebase/storage");
      const authModule = await import("firebase/auth");

      // ** PUBLIC VARIABLES **

      // Initialize Firebase
      const app = appModule.initializeApp(
        firebaseClientConfig,
        "drive-home-rv"
      );
      const auth = authModule.getAuth(app);
      const db = firestoreModule.getFirestore(app);
      const storage = storageModule.getStorage(app);

      firebaseStore.set({
        app: app,
        auth: auth,
        db: db,
        storage: storage,
      });

      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
}

/**
 * Database query that updates the unitStore with latest information
 * @params fbStore Is the copy of firebaseStore already created
 *
 */
export async function populateUnitStore(fbStore: FirebaseStore) {
  if (typeof window != undefined) {
    try {
      const unitCollectionDocs = await getDocs(collection(fbStore.db, "units"));

      let initialUnits: Unit[] = [];
      unitCollectionDocs.forEach((doc) => {
        initialUnits.push(doc.data() as Unit);
      });

      for (let unit of initialUnits) {
        let unitBookings = await getDocs(
          collection(fbStore.db, "units", unit.id, "bookings")
        );

        unitBookings.forEach((doc) => {
          let booking = doc.data();

          let bookingDates = {
            start: new DateTime(booking.start, "MMM-DD-YYYY"),
            end: new DateTime(booking.end, "MMM-DD-YYYY"),
          };

          // initialize the empty arrays...
          unit.bookings = [];
          unit.bookingDates = [];

          unit.bookingDates.push(bookingDates);
          unit.bookings.push(booking);
        });
      }

      unitStore.update((data) => {
        data.units = initialUnits;
        data.isPopulated = true;

        return data;
      });

      return;
    } catch (error) {
      console.warn("Error in initial unitStore population");
      console.warn(error);
    }
  }
}

/**
 *  For now, this will be called in an onMount function only. And check for deployed url vs dev server
 */
export function connectAnalytics() {
  if (get(firebaseStore)) {
    let fb = get(firebaseStore);
    const analytics = getAnalytics(fb.app);

    return analytics;
  }
}
