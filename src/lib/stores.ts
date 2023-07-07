import { writable } from "svelte/store";
import type { UnitStore, Booking, FirebaseStore, Unit } from "./types";

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

export const customerStore = writable<Booking>(undefined);
