import { firebaseClientConfig } from "../config";
import { collection, query, onSnapshot } from "firebase/firestore";
import { get } from "svelte/store";
import type { Unit, Booking } from "./types";
import { firebaseStore, unitStore } from "./stores";
import { DateTime } from "@easepick/bundle";

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
 *
 */
export async function populateUnitStore() {
  if (typeof window != undefined) {
    try {
      let fb = get(firebaseStore);

      const dbQuery = query(collection(fb.db, "units"));

      const unsubscribeCallback = onSnapshot(dbQuery, (snapshot) => {
        let unitsList: Unit[] = [];
        snapshot.forEach((doc) => {
          let loadedUnit = doc.data() as Unit;
          unitsList.push(loadedUnit);
          // Sorting can happen here if needed.
        });
        unitStore.set(unitsList);
        unitsList.forEach((unitObj) => {
          attachUnitBookingsListener(unitObj);
        });

        // TODO: set listeners off of this, so that things can get triggered on update.
      });
    } catch (error) {
      console.warn("Error in populating UnitStore");
      console.warn(error);
    }
  }
}

/**
 * Pass in unitobject ot setup unit bookings listeners, updates automatically on addition of booking to unit
 * @param unitObject
 *
 */
async function attachUnitBookingsListener(unitObject: Unit) {
  let fb = get(firebaseStore);

  let collectionReference = collection(
    fb.db,
    "units",
    unitObject.id,
    "bookings"
  );

  const q = query(collectionReference);
  let localStorageBookings: DateTime[][] = [];

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const snapshotBookings: DateTime[][] = [];
    const allBookingsList: Booking[] = [];

    querySnapshot.forEach((booking: Booking) => {
      //@ts-ignore
      const bookingData = booking.data();

      const start = new DateTime(bookingData.start, "MMM-DD-YYYY");
      const end = new DateTime(bookingData.end, "MMM-DD-YYYY");

      snapshotBookings.push([start, end]);
      allBookingsList.push(bookingData);
    });

    unitStore.update((units) => {
      units.forEach((unit) => {
        if (unit.id == unitObject.id) {
          unit.bookings = snapshotBookings;
          unit.bookingObjects = allBookingsList;
        }
      });

      return units;
    });
  });
}

/**
 * Lookup and return the information in unitStore associated with this ID
 * @param id - string id pulled from user input/request
 * @returns Unit - unit object with associated information
 */
export function unitLookup(id: string): Unit | undefined {
  let currentUnitList = get(unitStore);

  if (!currentUnitList) {
    console.log("Unit Lookup failed on undefined unitStore.");
    return undefined;
  }

  let unitFound: Unit | undefined = undefined;

  currentUnitList.forEach((unit) => {
    if (unit.id == id.trim()) {
      unitFound = unit;
    }
  });

  if (!unitFound) {
    console.warn("Unit Lookup found 0 results.");
  } else {
    // console.log("Matching Unit Found: ", unitFound);
  }
  return unitFound;
}

export function objectKeyToLabel(key: string) {
  let label = key.replaceAll("_", " ");
  label = label.replaceAll("and", "&");

  return label.replace(/(^|\s)\S/g, function (t) {
    return t.toUpperCase();
  });
}

export function formatPhoneNumber(phoneNumberString: string) {
  var cleaned = ("" + phoneNumberString).replace(/\D/g, "");
  var match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return "(" + match[1] + ") " + match[2] + "-" + match[3];
  }
  return null;
}

export function newUUID(): string {
  // Alphanumeric characters
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let autoId = "";
  for (let i = 0; i < 20; i++) {
    autoId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return autoId;
}
