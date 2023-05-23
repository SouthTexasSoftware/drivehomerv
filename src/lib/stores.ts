import { writable } from "svelte/store";
import type { UnitStore, Booking, FirebaseStore, Unit } from "./types";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { get } from "svelte/store";
import { DateTime } from "@easepick/bundle";

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
  updateUnit(unitId) {
    this.units.forEach(async (unit) => {
      if (unit.id == unitId) {
        // pull down new data for unit and update it?
        let updatedUnit: Unit;

        let fbStore = get(firebaseStore);
        const unitRef = doc(fbStore.db, "units", unitId);
        const docSnap = await getDoc(unitRef);
        const bookingsRef = collection(fbStore.db, "units", unitId, "bookings");
        const bookingsSnap = await getDocs(bookingsRef);

        updatedUnit = docSnap.data() as Unit;

        bookingsSnap.forEach((doc) => {
          let booking = doc.data() as Booking;

          updatedUnit.bookings?.push(booking);

          let bookingDates = {
            start: new DateTime(booking.start, "MMM-DD-YYYY"),
            end: new DateTime(booking.end, "MMM-DD-YYYY"),
          };

          updatedUnit.bookingDates?.push(bookingDates);
        });

        unit = updatedUnit;
      }
    });
  },
});

export const customerStore = writable<Booking>(undefined);
