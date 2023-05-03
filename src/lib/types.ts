import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type {
  Firestore,
  Timestamp,
  CollectionReference,
} from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";
import type { DateTime } from "@easepick/datetime";

export interface FirebaseStore {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
}

export interface Unit {
  additional_fees: Array<Fee>;
  created_by: string;
  created_on: Timestamp;
  daily_fees_total?: number;
  default_price: number;
  description?: string;
  discounts?: Array<Discount>;
  feature_list?: Array<Feature>;
  avail_extras?: Array<Extra>;
  id: string;
  mileage_record?: Array<MileageEntry>;
  miles_price?: number;
  name: string;
  long_name?: string;
  short_name?: string;
  photo_list?: Array<Photo>;
  updated_on?: Timestamp;
  bookings?: DateTime[][];
  prices?: CollectionReference;
  min_booking_days: number;
  feature_sleeps?: string;
  feature_vehicle_class?: string;
  feature_year_built?: string;
  feature_length?: string;
}

export interface Booking {
  id?: string;
  customer?: string;
  unit_id?: string;
  unit_name?: string;
  start?: string; //MMM-DD-YYYY
  end?: string; //MMM-DD-YYYY
  total_price?: number;
  created?: Timestamp;
  status?: BookingStatus;
}

enum BookingStatus {
  requested,
  reserved,
  paid,
  completed,
  manualEntry,
}

export interface Fee {
  name: string;
  amount: number;
  description?: string;
  fee_group?: string; // TODO: do we need adtl interface for FeeGroup ???
  per_day: boolean;
}

export interface Discount {
  name: string;
  percentage?: number;
  timespan: number;
  value?: number;
}

export interface MileageEntry {
  booking?: string;
  created_by: string;
  created_on: Timestamp;
  value: number;
}

export interface Photo {
  filename: string;
  date_added: Timestamp;
  primary: boolean;
  index: number;
}

export interface Feature {
  name: string;
  icon: string;
  shorthand: string;
  value: string;
}

export interface Extra {
  name: string;
  amount: string;
  description?: string;
  selected?: boolean;
}

export interface Customer {
  id?: string;
  first_name: string;
  last_name: string;
  created: Timestamp;
  phone: string;
  email: string;
  address?: null;
  payment_method?: null;
  terms_agreement?: boolean;
  bookings?: string[];
  age_over_25?: boolean;
  documents?: Document[];
}
