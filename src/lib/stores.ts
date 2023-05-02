import { writable } from "svelte/store";
import type { Unit, Booking, FirebaseStore, Customer } from "./types";

export const firebaseStore = writable<FirebaseStore>(undefined);

export const unitStore = writable<Unit[]>(undefined);

export const bookingStore = writable<Booking>(undefined);

export const customerStore = writable<Customer>(undefined);
