import { firebaseClientConfig } from "../config";
import { QuerySnapshot } from "firebase/firestore";
import {
  collection,
  getDocs,
  persistentLocalCache,
  persistentMultipleTabManager,
  updateDoc,
  doc,
  query,
  where,
  onSnapshot,
} from "@firebase/firestore";
import { get } from "svelte/store";
import type {
  Unit,
  FirebaseStore,
  PhotoDocument,
  Booking,
  FileDocument,
} from "./types";
import {
  bookingUpdateStore,
  cmsStore,
  firebaseStore,
  unitStore,
} from "./stores";
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

        // only pull Bookings that are ongoing or in the future
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

        // initialize the empty arrays...
        unit.bookings = [];
        unit.bookingDates = [];

        cmsStore.update((store) => {
          let snapshotListener = onSnapshot(
            publicBookingsQuery,
            (querySnapshot) => {
              populateUnitBookings(querySnapshot, unit);
            }
          );
          store.bookingListeners.push({
            unit_id: unit.id,
            listener: snapshotListener,
          });

          return store;
        });

        // *** PHOTOS SUBCOLLECTION DATA PULL
        let unitPhotos = await getDocs(
          collection(fbStore.db, "units", unit.id, "photos")
        );

        unit.photos = [];
        let sortPhotos: PhotoDocument[] = [];

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
 * Helper function to process the data returned from a QuerySnapshot and modify the passing in Unit
 * @param snapshot - QuerySnapshot of a Booking collection of documents
 * @param unit - Unit associated with snapshot
 *
 */
export function populateUnitBookings(snapshot: QuerySnapshot, unit: Unit) {
  console.log("re-populating unit bookings for ", unit.name);
  let bookings = [];
  let bookingDates = [];

  for (let bookingDoc of snapshot.docs) {
    let booking = bookingDoc.data() as Booking;

    let bookingDateObjects = {
      start: new DateTime(booking.start, "MMM-DD-YYYY"),
      end: new DateTime(booking.end, "MMM-DD-YYYY"),
    };

    bookings.push(booking);
    if (booking.confirmed || booking.in_checkout) {
      bookingDates.push(bookingDateObjects);
    }
  }

  unit.bookings = bookings;
  unit.bookingDates = bookingDates;

  unitStore.update((storeData) => {
    for (let storeUnit of storeData.units) {
      if (storeUnit.id == unit.id) {
        storeUnit.bookings = unit.bookings;
        storeUnit.bookingDates = unit.bookingDates;
        bookingUpdateStore.update((storeData) => {
          storeData.triggerRefresh = true;
          storeData.unit_id = unit.id;
          return storeData;
        });
      }
    }
    return storeData;
  });
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
        base_rental_fee: "",
        taxes_and_insurance: "",
        service_fee: "",
        mileage_overage: "",
        generator_usage: "",
        weekly_discount: "",
        monthly_discount: "",
        minimum_nights: "",
        security_deposit: "",
        cleaning_and_restocking: "",
        kitchen_utensils: "",
        late_dropoff_fee: "",
        additional_options: {},
      },
      delivery: {
        price_per_mile: "",
        additional_options: {},
      },
      upgrades: {
        dumping: "",
        marshmellow_kit: "",
        folding_chairs_and_table: "",
        propane_refill: "",
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

/**
 *  Receives a formatted datestring and return the month & day in string format
 *  @param dateString MMM-DD-YYYY
 *  @returns Month & Day with ordinal suffix e.g. November 20th
 */
export function getMonthString(dateString: string | undefined) {
  if (!dateString || dateString == "undefined") {
    return "None";
  }
  let dateTimeObject = new DateTime(dateString, "MMM-DD-YYYY");

  let dayString = dateTimeObject.toLocaleString("en-us", {
    weekday: "long",
  });
  let monthString = dateTimeObject.toLocaleString("en-us", {
    month: "long",
  });

  let dayNumber = dateTimeObject.getDate();
  let dayNumberFormatted = ordinal_suffix_of(dayNumber);

  return monthString + " " + dayNumberFormatted;
}

/**
 *  Receives a formatted datestring and returns the day of the week
 *  @param dateString MMM-DD-YYYY
 *  @returns Day of Week e.g. Sunday
 */
export function getDayString(dateString: string | undefined) {
  if (!dateString || dateString == "undefined") {
    return "None";
  }
  let dateTimeObject = new DateTime(dateString, "MMM-DD-YYYY");

  let dayString = dateTimeObject.toLocaleString("en-us", {
    weekday: "long",
  });

  return dayString;
}

/**
 * Adds the appropriate ending to a dates number '22nd or 28th' etc
 * @param i Number to format
 * @returns Formatted string e.g. 20th
 */
function ordinal_suffix_of(i: number) {
  var j = i % 10,
    k = i % 100;
  if (j == 1 && k != 11) {
    return i + "st";
  }
  if (j == 2 && k != 12) {
    return i + "nd";
  }
  if (j == 3 && k != 13) {
    return i + "rd";
  }
  return i + "th";
}

/**
 * Generates a UUID for
 * @returns formatted uuid string
 */
export function newUUID(): string {
  // Alphanumeric characters
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let autoId = "";
  for (let i = 0; i < 20; i++) {
    autoId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return autoId;
}
