import { writable } from "svelte/store";
import type { FirebaseStore, Unit } from "./types";

export const firebaseStore = writable<FirebaseStore>(undefined);

export const unitStore = writable<Unit[]>(undefined);
