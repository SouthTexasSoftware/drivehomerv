import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type {
  Firestore,
  Timestamp,
  CollectionReference,
} from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";
import type { DateTime } from "@easepick/datetime";
import type { Analytics } from "firebase/analytics";

export interface FirebaseStore {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
  analytics?: Analytics;
}

export interface UnitStore {
  units: Unit[];
  getUnit(unitId: string): Unit | undefined;
  isPopulated: boolean;
}

export interface Unit {
  additional_fees?: Array<Fee>;
  created_by?: string;
  created_on?: Timestamp;
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
  updated_by?: string;
  bookings?: Booking[];
  bookingDates?: { start: Date; end: Date }[];
  prices?: CollectionReference;
  min_booking_days: number; //TODO: should be NIGHTS
  feature_sleeps?: string;
  feature_vehicle_class?: string;
  feature_year_built?: string;
  feature_length?: string;

  publicly_visible: boolean;
  cms_edited: boolean;
  information: {
    bullet_points: InformationBulletPoints;
    paragraphs: InformationParagraphs;
    rules_and_policies: InformationRulesPolicies;
    rates_and_fees: InformationRatesFees;
  };
  photos: PhotoDocument[];
  documents?: FileDocument[];
}

export interface PhotoDocument {
  id: string;
  label: string;
  filename: string;
  file_size: number; // in KiloBytes
  resolution?: string;
  index: number;
  date_added: Timestamp;
  file_path: string;
  downloadURL: string;
  unit_id: string;
  booking_id?: string;
  subcategory: string;
  option: string;
  references?: {
    type: string;
    id: string;
  }[];
}

export interface FileDocument {
  id: string;
  label: string;
  filename: string;
  file_size: number; // in KiloBytes
  index: number;
  date_added: Timestamp;
  file_path: string;
  downloadURL: string;
  unit_id: string;
  booking_id?: string;
  subcategory: string;
  option: string;
  references?: {
    type: string;
    id: string;
  }[];
}

interface InformationBulletPoints {
  summary: OptionSummary;
  rv_details: OptionRvDetails;
  drivable_features: OptionDrivableFeatures;
  campsite_essentials: OptionCampsiteEssentials;
  kitchen: OptionKitchen;
  bathroom: OptionBathroom;
  temperature_control: OptionTemperatureControl;
  entertainment: OptionEntertainment;
  additional: OptionBulletsAdditional;
}

interface OptionSummary {
  pickup_location: string;
  sleeps: string;
  year_built: string;
  vehicle_type: string;
  length: string;
  additional_options: {
    [option_name: string]: string;
  };
}

interface OptionRvDetails {
  year_built: string;
  manufacturer: string;
  make: string;
  model: string;
  vehicle_type: string;
  sleeps: string;
  number_of_beds: string;
  slides: string;
  fresh_water_tank: string;
  length: string;
  height: string;
  additional_options: {
    [option_name: string]: string;
  };
}

interface OptionDrivableFeatures {
  transmission: string;
  cruise_control: boolean;
  seatbelts: boolean;
  fuel_type: string;
  fuel_capacity: string;
  fuel_consumption: string;
  electrical_service: string;
  dual_battery: string;
  power_steering: boolean;
  gross_weight: string;
  dry_weight: string;
  cargo_weight: string;
  additional_options: {
    [option_name: string]: string;
  };
}

interface OptionCampsiteEssentials {
  electrical_service: string;
  fresh_water_tank: string;
  length: string;
  electric_generator: boolean;
  hot_and_cold_water: boolean;
  additional_options: {
    [option_name: string]: string;
  };
}

interface OptionKitchen {
  refrigerator: boolean;
  kitchen_sink: boolean;
  slide_out: boolean;
  microwave: boolean;
  range: boolean;
  additional_options: {
    [option_name: string]: boolean;
  };
}

interface OptionBathroom {
  toilet: boolean;
  shower: boolean;
  bathroom_sink: boolean;
  additional_options: {
    [option_name: string]: boolean;
  };
}

interface OptionTemperatureControl {
  hot_and_cold_water: boolean;
  dash_air_conditioning: boolean;
  roof_air_conditioning: boolean;
  additional_options: {
    [option_name: string]: boolean;
  };
}

interface OptionEntertainment {
  tv: boolean;
  additional_options: {
    [option_name: string]: boolean;
  };
}

interface OptionBulletsAdditional {
  electric_generator: boolean;
  rear_view_camera: boolean;
  fire_extinguisher: boolean;
  additional_options: {
    [option_name: string]: boolean;
  };
}

interface InformationParagraphs {
  description: OptionDescription;
  notes: OptionNotes;
}

interface OptionDescription {
  content: string;
}
interface OptionNotes {
  content: string;
}

interface InformationRulesPolicies {
  rental: OptionRentalRules;
  cancellation: OptionCancellationPolicy;
}

interface OptionRentalRules {
  pickup_time: string;
  dropoff_time: string;
  minimum_renter_age: string;
  pets_allowed: string;
  late_dropoff_or_early_pickup: string;
  additional_options: {
    [option_name: string]: string;
  };
}
interface OptionCancellationPolicy {
  full_refund_policy: string;
  half_refund_policy: string;
  no_refund_policy: string;
  additional_options: {
    [option_name: string]: string;
  };
}

interface InformationRatesFees {
  pricing: OptionPricing;
  delivery: OptionDelivery;
  upgrades: OptionUpgrades;
}

interface OptionPricing {
  base_rental_fee: number;
  taxes_and_insurance: number;
  service_fee: number;
  mileage_overage: number;
  generator_usage: number;
  weekly_discount: number;
  monthly_discount: number;
  minimum_nights: number;
  security_deposit: number;
  cleaning_and_restocking: number;
  kitchen_utensils: number;
  late_dropoff_fee: number;
  additional_options: {
    [option_name: string]: number;
  };
}

interface OptionUpgrades {
  dumping: number;
  marshmellow_kit: number;
  folding_chairs_and_table: number;
  propane_refill: number;
  additional_options: {
    [option_name: string]: number;
  };
}
interface OptionDelivery {
  price_per_mile: number;
  additional_options: {
    [option_name: string]: number;
  };
}

// TODO: add pickup, dropoff time and location
// TODO: add booking referrer
export interface Booking {
  id: string;
  customer?: string;
  customerObject?: Customer;
  unit_id?: string;
  unit_name?: string;
  start: string; //MMM-DD-YYYY
  end: string; //MMM-DD-YYYY
  total_price?: number;
  created?: Timestamp;
  updated?: Timestamp;
  status: string;
  pickup_time?: string;
  pickup_location?: string;
  dropoff_time?: string;
  dropoff_location?: string;
  pickup_dropoff_price_addition?: number;
  payment_status?: PaymentStatus;
  agreement_status?: AgreementStatus;
  event_list?: BookingEvent[];
  photos: PhotoDocument[];
  documents: FileDocument[];
}

interface BookingEvent {
  created: Timestamp;
  triggered_by: string;
  title: string;
  description?: string;
  id: string;
  booking_id: string;
}

enum BookingStatus {
  requested,
  approved,
  inProgress,

  completed,
  manualEntry,
}

enum PaymentStatus {
  quoted,
  invoiced,
  paid_deposit,
  paid_in_full,
}
enum AgreementStatus {
  drafted,
  sent,
  accepted,
  denied,
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
  id: string;
  first_name: string;
  last_name: string;
  created?: Timestamp;
  phone: string;
  email: string;
  address?: null;
  payment_method?: null;
  terms_agreement?: boolean;
  bookings?: string[];
  age_over_25?: boolean;
}
