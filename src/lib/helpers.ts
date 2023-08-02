import { firebaseClientConfig } from "../config";
import type { QuerySnapshot } from "firebase/firestore";
import {
  collection,
  getDocs,
  persistentLocalCache,
  persistentMultipleTabManager,
  updateDoc,
  doc,
  query,
  where,
} from "@firebase/firestore";
import { get } from "svelte/store";
import type {
  Unit,
  FirebaseStore,
  PhotoDocument,
  Booking,
  FileDocument,
} from "./types";
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
      const db = firestoreModule.initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
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
export async function populateUnitStore(
  fbStore: FirebaseStore,
  options?: { cms?: boolean; all_bookings?: boolean }
) {
  if (typeof window != undefined) {
    try {
      const unitCollectionDocs = await getDocs(collection(fbStore.db, "units"));

      let initialUnits: Unit[] = [];
      unitCollectionDocs.forEach((doc) => {
        initialUnits.push(doc.data() as Unit);
      });

      for (let unit of initialUnits) {
        // *** BOOKINGS SUBCOLLECTION DATA PULL

        // MODIFY Bookings data pull to only get bookings that have not ended before today()
        // only pull all bookings when on the CMS views
        let todaysDate = new DateTime();
        let todaysUnixTimestamp = Math.ceil(todaysDate.getTime() / 1000);

        let bookingsCollection = collection(
          fbStore.db,
          "units",
          unit.id,
          "bookings"
        );
        let publicBookingsQuery = query(
          bookingsCollection,
          where("unix_end", ">=", todaysUnixTimestamp)
        );
        let privateBookingsQuery = collection(
          fbStore.db,
          "units",
          unit.id,
          "bookings"
        );

        let unitBookings: QuerySnapshot;

        unitBookings = await getDocs(publicBookingsQuery);

        // initialize the empty arrays...
        unit.bookings = [];
        unit.bookingDates = [];

        for (let bookingDoc of unitBookings.docs) {
          let booking = bookingDoc.data() as Booking;

          if (options?.cms) {
            // DO ONLY IF CMS IS PASSED TO THE UNIT STORE LOAD FUNCTION
            // PULL BOOKING PHOTOS & DOCUMENTS
            let bookingPhotosCollection = collection(
              fbStore.db,
              "units",
              unit.id,
              "bookings",
              booking.id,
              "photos"
            );
            let bookingDocumentsCollection = collection(
              fbStore.db,
              "units",
              unit.id,
              "bookings",
              booking.id,
              "documents"
            );

            let bookingPhotos = await getDocs(bookingPhotosCollection);
            let bookingDocuments = await getDocs(bookingDocumentsCollection);

            booking.photos = [];
            booking.documents = [];
            bookingPhotos.forEach((photoDoc) => {
              //@ts-ignore
              booking.photos.push(photoDoc.data() as PhotoDocument);
            });
            bookingDocuments.forEach((fileDoc) => {
              //@ts-ignore
              booking.documents.push(fileDoc.data() as FileDocument);
            });
          }

          let bookingDates = {
            start: new DateTime(booking.start, "MMM-DD-YYYY"),
            end: new DateTime(booking.end, "MMM-DD-YYYY"),
          };

          if (unit.bookingDates && unit.bookings) {
            unit.bookingDates.push(bookingDates);
            unit.bookings.push(booking);
          }

          // HOW-TO update every booking in the DB...
          if (!booking.unix_start) {
            let docRef = doc(
              fbStore.db,
              "units",
              unit.id,
              "bookings",
              booking.id
            );
            console.log("updating booking ", booking.id);
            await updateDoc(docRef, {
              unix_start: Math.ceil(bookingDates.start.getTime() / 1000),
              unix_end: Math.ceil(bookingDates.end.getTime() / 1000),
            });
            console.log("finished updating");
          }
        }

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
