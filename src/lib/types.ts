import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type {
  Firestore,
  Timestamp,
  CollectionReference,
  DocumentReference,
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
  min_booking_days: number;
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
  photos?: PhotoDocument[];
  documents?: FileDocument[];
  stripe_product_id?: string;

  sessionOnly?: { [key: string]: any };
}

export interface PhotoDocument {
  id: string;
  label: string;
  filename: string;
  file_size: number; // in KiloBytes
  resolution?: string;
  index: number;
  index_string?: string;
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
  base_rental_fee: string;
  taxes_and_insurance: string;
  service_fee: string;
  mileage_overage: string;
  generator_usage: string;
  weekly_discount: string;
  monthly_discount: string;
  minimum_nights: string;
  security_deposit: string;
  cleaning_and_restocking: string;
  kitchen_utensils: string;
  late_dropoff_fee: string;
  additional_options: {
    [option_name: string]: string;
  };
}

interface OptionUpgrades {
  dumping: string;
  marshmellow_kit: string;
  folding_chairs_and_table: string;
  propane_refill: string;
  additional_options: {
    [option_name: string]: string;
  };
}
interface OptionDelivery {
  price_per_mile: string;
  additional_options: {
    [option_name: string]: string;
  };
}

export interface Booking {
  id: string;
  document_reference?: DocumentReference;
  customer?: string;
  customerObject?: Customer;
  unit_id?: string;
  stripe_product_id?: string;
  unit_name?: string;
  start: string; //MMM-DD-YYYY
  end: string; //MMM-DD-YYYY
  passengers?: string;
  startDate?: DateTime;
  endDate?: DateTime;
  unix_start?: number;
  unix_end?: number; // for ease of comparison
  total_price?: number;
  price_per_night?: number;
  trip_length?: number;
  nightly_rate_sum?: number;
  service_fee?: number;
  taxes_and_fees_per_night?: number;
  taxes_and_fees?: number;
  created?: Timestamp;
  created_by?: string;
  updated?: Timestamp;
  status: string;
  pickup_time?: string;
  pickup_location?: string;
  dropoff_time?: string;
  dropoff_location?: string;
  pickup_dropoff_price_addition?: number;

  agreement_signed?: boolean;
  agreement_link?: string;
  agreement_notification?: boolean;
  agreement_notification_timestamp?: Timestamp;
  agreement_viewed?: [date: string];
  agreement_details?: {
    name: string;
    date: string;
    accepted: boolean;
    version: number;
  };

  event_list?: BookingEvent[];
  photos?: PhotoDocument[];
  documents?: FileDocument[];
  unit_img_link?: string;
  notes?: string;

  confirmed: boolean;
  in_checkout: boolean;
  confirmation_email_sent?: boolean;
  receipt_date_string?: string; //MMM-DD-YYYY
  payment_intent?: { [key: any]: string };
  payment_status?: PaymentStatus;
  payment_link?: string;

  stripe_price_id_list?: [string];
  stripe_invoiceItem_id_list?: [string];
  stripe_invoices?: [
    {
      id: string;
      status: string;
      amount: number;
    }
  ];
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
  generate_payment_link,
  link_to_pay,
  paid,
}
enum AgreementStatus {
  queued,
  sent,
  accepted,
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
  stripe_id?: string;
  preferred_contact_method?: {
    text?: boolean;
    call?: boolean;
    email?: boolean;
  };
  contact_form_completed?: boolean;
  paymentIntent?: string;
}
