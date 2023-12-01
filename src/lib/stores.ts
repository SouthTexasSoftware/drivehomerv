import { writable } from "svelte/store";
import type {
  UnitStore,
  Booking,
  FirebaseStore,
  Unit,
  PhotoDocument,
} from "./types";
import type { Unsubscribe } from "firebase/firestore";

export const firebaseStore = writable<FirebaseStore>(undefined);

export const unitStore = writable<UnitStore>({
  units: [],
  isPopulated: false,
  getUnit(unitId) {
    let foundUnit: Unit | undefined = undefined;
    this.units.forEach((unit) => {
      if (unit.id == unitId) {
        foundUnit = unit;
      }
    });
    return foundUnit;
  },
});

export const bookingStore = writable<Booking>(undefined);

export const cmsStore = writable<{
  triggerRefresh: boolean;
  bookingListeners: [{ unit_id: string; listener: Unsubscribe }];
  photosUpdated: {
    unit_id: string;
    new_array: PhotoDocument[];
    deleted?: string;
  };
}>({
  triggerRefresh: false,
  //@ts-ignore
  bookingListeners: [],
  //@ts-ignore
  photosUpdated: {},
});

export const bookingUpdateStore = writable<{
  triggerRefresh: boolean;
  unit_id: string;
}>({
  triggerRefresh: false,
  unit_id: "",
});

export const serverAdminStore = writable<{ [storeKey: string]: any }>();
