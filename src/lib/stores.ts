import { writable } from "svelte/store";
import type {
  UnitStore,
  Booking,
  FirebaseStore,
  Unit,
  PhotoDocument,
  BookingDisplayFilter,
} from "./types";
import { doc, getDoc, type Unsubscribe } from "firebase/firestore";
import type { Customer, CustomerStore } from "./new_types/CustomerType";

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

export const customerStore = writable<CustomerStore>({
  customers: [],
  isPopulated: false,
  queryOptions: {
    limit: 10,
    loadAll: false,
    paginationCursor: null,
  },
  async getCustomer(
    customerId: string,
    fbStore: FirebaseStore
  ): Promise<Customer | undefined> {
    // Check if customer exists in store
    let foundCustomer: Customer | undefined = this.customers.find(
      (customer) => customer.id === customerId
    );

    // If not found, query Firebase
    if (!foundCustomer && typeof window !== "undefined") {
      try {
        const customerDocRef = doc(fbStore.db, "customers", customerId);
        const customerDoc = await getDoc(customerDocRef);

        if (customerDoc.exists()) {
          foundCustomer = customerDoc.data() as Customer;
          // Check for duplicates before adding
          if (
            !this.customers.some(
              (customer) => customer.id === foundCustomer!.id
            )
          ) {
            this.customers = [...this.customers, foundCustomer];
            // Update the store
            customerStore.set(this);
          }
        }
      } catch (error) {
        console.warn(`Error fetching customer with ID ${customerId}`);
        console.warn(error);
      }
    }

    return foundCustomer;
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

export const cmsBookingFilterStore = writable<BookingDisplayFilter>(undefined);

export const bookingTimerStore = writable<{
  value: string;
  timer: { reset: () => void; stop: () => void } | undefined;
}>({ value: "", timer: undefined });
