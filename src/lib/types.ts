import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type {
  Firestore,
  Timestamp,
  CollectionReference,
} from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";

export interface FirebaseStore {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
}

export interface Unit {
  additional_fees?: Array<Fee>;
  created_by: string;
  created_on: Timestamp;
  default_price?: number;
  description?: string;
  discounts?: Array<Discount>;
  feature_list?: { [key: string]: string };
  id: string;
  mileage_record?: Array<MileageEntry>;
  miles_price?: number;
  name: string;
  photo_list?: Array<Photo>;
  updated_on?: Timestamp;
  bookings?: CollectionReference;
  prices?: CollectionReference;
}

export interface Fee {
  name: string;
  amount: number;
  description?: string;
  fee_group?: string; // TODO: do we need adtl interface for FeeGroup ???
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
