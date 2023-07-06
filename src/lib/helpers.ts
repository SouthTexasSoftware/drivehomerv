import { firebaseClientConfig } from "../config";
import { collection, getDocs } from "firebase/firestore";
import { get } from "svelte/store";
import type { Unit, FirebaseStore, PhotoDocument, Booking } from "./types";
import { firebaseStore, unitStore } from "./stores";
import { DateTime } from "@easepick/bundle";
import { getAnalytics } from "firebase/analytics";

// TODO: needs a fallback when a failure is caught. Display a message, etc.
/**
 * Asynchronous call to establish connection with Firebase
 * @returns boolean
 */
export async function connectToFirebase() {
  if (typeof window != undefined) {
    try {
      const appModule = await import("firebase/app");
      const firestoreModule = await import("firebase/firestore");
      const storageModule = await import("firebase/storage");
      const authModule = await import("firebase/auth");

      // ** PUBLIC VARIABLES **

      // Initialize Firebase
      const app = appModule.initializeApp(
        firebaseClientConfig,
        "drive-home-rv"
      );
      const auth = authModule.getAuth(app);
      const db = firestoreModule.getFirestore(app);
      const storage = storageModule.getStorage(app);

      firebaseStore.set({
        app: app,
        auth: auth,
        db: db,
        storage: storage,
      });

      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
}

/**
 * Database query that updates the unitStore with latest information
 * @params fbStore Is the copy of firebaseStore already created
 *
 */
export async function populateUnitStore(fbStore: FirebaseStore) {
  if (typeof window != undefined) {
    try {
      const unitCollectionDocs = await getDocs(collection(fbStore.db, "units"));

      let initialUnits: Unit[] = [];
      unitCollectionDocs.forEach((doc) => {
        initialUnits.push(doc.data() as Unit);
      });

      for (let unit of initialUnits) {
        // *** BOOKINGS SUBCOLLECTION DATA PULL
        let unitBookings = await getDocs(
          collection(fbStore.db, "units", unit.id, "bookings")
        );

        // initialize the empty arrays...
        unit.bookings = [];
        unit.bookingDates = [];

        unitBookings.forEach((doc) => {
          let booking = doc.data() as Booking;

          let bookingDates = {
            start: new DateTime(booking.start, "MMM-DD-YYYY"),
            end: new DateTime(booking.end, "MMM-DD-YYYY"),
          };

          if (unit.bookingDates && unit.bookings) {
            unit.bookingDates.push(bookingDates);
            unit.bookings.push(booking);
          }
        });

        // *** PHOTOS SUBCOLLECTION DATA PULL
        let unitPhotos = await getDocs(
          collection(fbStore.db, "units", unit.id, "photos")
        );

        unit.photos = [];

        unitPhotos.forEach((doc) => {
          let photoDoc = doc.data() as PhotoDocument;

          if (unit.photos) {
            unit.photos.push(photoDoc);
          }
        });
      }

      unitStore.update((data) => {
        data.units = initialUnits;
        data.isPopulated = true;

        return data;
      });

      return;
    } catch (error) {
      console.warn("Error in initial unitStore population");
      console.warn(error);
    }
  }
}

/**
 *  For now, this will be called in an onMount function only. And check for deployed url vs dev server
 */
export function connectAnalytics() {
  if (get(firebaseStore)) {
    let fb = get(firebaseStore);
    const analytics = getAnalytics(fb.app);

    return analytics;
  }
}

export const newUnitModel: Unit = {
  default_price: 0,
  name: "",
  id: "",
  min_booking_days: 1,

  publicly_visible: false,
  cms_edited: false,
  information: {
    bullet_points: {
      summary: {
        pickup_location: "",
        sleeps: "",
        year_built: "",
        vehicle_type: "",
        length: "",
        additional_options: {},
      },
      rv_details: {
        year_built: "",
        manufacturer: "",
        make: "",
        model: "",
        vehicle_type: "",
        sleeps: "",
        number_of_beds: "",
        slides: "",
        fresh_water_tank: "",
        length: "",
        height: "",
        additional_options: {},
      },
      drivable_features: {
        transmission: "",
        cruise_control: false,
        seatbelts: false,
        fuel_type: "",
        fuel_capacity: "",
        fuel_consumption: "",
        electrical_service: "",
        dual_battery: "",
        power_steering: false,
        gross_weight: "",
        dry_weight: "",
        cargo_weight: "",
        additional_options: {},
      },
      campsite_essentials: {
        electrical_service: "",
        fresh_water_tank: "",
        length: "",
        electric_generator: false,
        hot_and_cold_water: false,
        additional_options: {},
      },
      kitchen: {
        refrigerator: false,
        kitchen_sink: false,
        slide_out: false,
        microwave: false,
        range: false,
        additional_options: {},
      },
      bathroom: {
        toilet: false,
        shower: false,
        bathroom_sink: false,
        additional_options: {},
      },
      temperature_control: {
        hot_and_cold_water: false,
        dash_air_conditioning: false,
        roof_air_conditioning: false,
        additional_options: {},
      },
      entertainment: {
        tv: false,
        additional_options: {},
      },
      additional: {
        electric_generator: false,
        rear_view_camera: false,
        fire_extinguisher: false,
        additional_options: {},
      },
    },
    paragraphs: {
      description: {
        content: "",
      },
      notes: {
        content: "",
      },
    },
    rules_and_policies: {
      rental: {
        pickup_time: "",
        dropoff_time: "",
        minimum_renter_age: "",
        pets_allowed: "",
        late_dropoff_or_early_pickup: "",
        additional_options: {},
      },
      cancellation: {
        full_refund_policy: "",
        half_refund_policy: "",
        no_refund_policy: "",
        additional_options: {},
      },
    },
    rates_and_fees: {
      pricing: {
        base_rental_fee: 0,
        taxes_and_insurance: 0,
        service_fee: 0,
        mileage_overage: 0,
        generator_usage: 0,
        weekly_discount: 0,
        monthly_discount: 0,
        minimum_nights: 0,
        security_deposit: 0,
        cleaning_and_restocking: 0,
        kitchen_utensils: 0,
        late_dropoff_fee: 0,
        additional_options: {},
      },
      delivery: {
        price_per_mile: 0,
        additional_options: {},
      },
      upgrades: {
        dumping: 0,
        marshmellow_kit: 0,
        folding_chairs_and_table: 0,
        propane_refill: 0,
        additional_options: {},
      },
    },
  },
  photos: {
    //@ts-ignore
    public: {
      carousel: [],
      album: [],
    },
    records: {
      bookings: [],
      maintenance: [],
    },
  },
};
