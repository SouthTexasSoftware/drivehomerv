import { firebaseClientConfig } from "../config";
import { collection, query, onSnapshot } from "firebase/firestore";
import { get } from "svelte/store";
import type { Unit } from "./types";
import { firebaseStore, unitStore } from "./stores";

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
        console.log("Units List Updated: ", unitsList);
        // TODO: set listeners off of this, so that things can get triggered on update.
      });
    } catch (error) {
      console.warn("Error in populating UnitStore");
      console.warn(error);
    }
  }
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
    console.log("Matching Unit Found: ", unitFound);
  }
  return unitFound;
}
