import { json, error, fail } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { emailHandler } from "$lib/email";
import type { Booking, Unit } from "$lib/types";
import easepick from "@easepick/bundle";
const { DateTime } = easepick;
import { firebaseAdminConfig } from "../../../../../config";
import {
  getApp,
  initializeApp,
  applicationDefault,
  cert,
} from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { serverAdminStore } from "$lib/stores";
import { get } from "svelte/store";

interface RequestData {
  invoiceID: string;
}

/**
 * goal of this endpoint is to:
 * - gather todays date ✅
 * - create firestore admin  connection to db
 * - pull down all future Bookings based on unix_start ?
 * - compare start dates to current date , where diff is <= 10 days , check for agreement email status
 * - if no email has been sent, craft and send email trigger to sendgrid
 * - update db now, based on emails that have been sent... so as not to trigger a duplicate
 *
 * */

export const POST = (async ({ request }) => {
  //currently an empty request, this is just a trigger
  const requestData = await request.json();

  // console.log("Server received a Rental Agreement Cron Job start command");

  let responseJson = {
    error: false,
    code: "",
    msg: "",
  };

  let todaysDate = new DateTime();
  let todayUnix = Math.ceil(todaysDate.getTime() / 1000);
  let tenDaysAwayDate = todaysDate.add(10);
  let tenDaysAwayUnix = Math.ceil(tenDaysAwayDate.getTime() / 1000);

  // list to pass along to owner in notification after indiv. emails have been sent out.
  let emailsSucceeded: string[] = [];
  let emailsFailed: string[] = [];

  let serverFirebase = get(serverAdminStore);

  if (!serverFirebase) {
    //initialize firebase admin app, map db object, and assign to the serverAdminStore for saved state
    try {
      serverFirebase = initializeApp({
        credential: cert({
          projectId: firebaseAdminConfig.projectId,
          clientEmail: firebaseAdminConfig.clientEmail,
          privateKey: firebaseAdminConfig.privateKey?.replace(/\\n/g, "\n"),
        }),
      });
    } catch (e) {
      console.log(e);
      serverFirebase = getApp();
    }
    const db = getFirestore();

    serverAdminStore.set({
      app: serverFirebase,
      db: db,
    });
  }

  serverFirebase = get(serverAdminStore);

  try {
    //query all bookings in all subcollections
    // for specifically bookings that start after today, but no more than 10 days in the future
    let upcomingBookingsSnap = await serverFirebase.db
      .collectionGroup("bookings")
      .where("unix_start", ">=", todayUnix)
      .where("unix_start", "<=", tenDaysAwayUnix)
      .get();

    if (!upcomingBookingsSnap.empty) {
      // check each booking for a boolean agreement_notification, if undefined/false -> queue email
      for (let bookingDoc of upcomingBookingsSnap.docs) {
        let bookingData = bookingDoc.data() as Booking;

        if (!bookingData.agreement_notification) {
          let emailSent = await sendAgreementEmail(bookingData);

          await bookingDoc._ref.update({
            agreement_notification: emailSent,
            agreement_notification_timestamp: Timestamp.now(),
          });

          if (emailSent) {
            // add to list for final owner notification
            emailsSucceeded.push(bookingData.id);
          } else {
            emailsFailed.push(bookingData.id);
          }
        }
      }
    } else {
      // console.log("no bookings found that match query");
    }
  } catch (e) {
    console.log(e);
  }

  if (emailsSucceeded.length > 0 || emailsFailed.length > 0) {
    await sendOwnerEmail(emailsSucceeded, emailsFailed);
  }

  responseJson.msg = todaysDate.toString();

  return json(responseJson);
}) satisfies RequestHandler;

// preview for agreementLink
// "https://drivehomerv-hs3z-git-preview-southtexassoftwares-projects.vercel.app/unit/" +

// organize payload and call emailHandler
async function sendAgreementEmail(booking: Booking) {
  let agreementLink =
    "https://drivehomerv-hs3z-git-preview-southtexassoftwares-projects.vercel.app/unit/" +
    booking.unit_id +
    "/agreement/" +
    booking.id;

  let payload = {
    link: agreementLink,
    start_date: formatDate(booking.start),
    end_date: formatDate(booking.end),
    unit_name: booking.unit_name,
    location: booking.pickup_location,
    pickup_time: booking.pickup_time,
    dropoff_time: booking.dropoff_time,
    unit_img_link: booking.unit_img_link,
    notes:
      "We're excited to see you soon! Please take a minute to review and sign our Rental Agreement, we will go over this in detail when you get the keys to your Rental. Feel free to call or text us if you have any questions in the meantime!",
  };

  try {
    await emailHandler(
      //@ts-ignore
      booking.customerObject.email,
      "rentalAgreement",
      payload
    );
  } catch (e) {
    return false;
  }

  return true;
}

// organize payload and call emailHandler
async function sendOwnerEmail(successList: string[], failList: string[]) {
  let totalBookings = successList.length + failList.length;

  let payload = {
    subject: "Automated Rental Agreement Report",
    body_one: "Total bookings reviewed: " + totalBookings.toString(),
    body_two: "Emails Sent: " + successList.length.toString(),
    body_three: "Emails Failed: " + failList.length.toString(),
    body_four: "You can find the latest booking information at the link below.",
    link: "https://drivehomerv-hs3z-git-preview-southtexassoftwares-projects.vercel.app/cms/bookings",
  };

  try {
    await emailHandler(
      [
        "info@drivehomerv.com",
        "steve@drivehomerv.com",
        "notifications@southtexas.software",
      ],
      "owner_notification",
      payload
    );
  } catch (e) {
    return false;
  }

  return true;
}

// accepts MMM-DD-YYYY and converts to Mmm DD, YYYY
function formatDate(dateString: string) {
  let month = dateString.slice(0, 3);
  let day = dateString.slice(4, 6);
  let year = dateString.slice(7, 11);

  if (day.slice(0, 1) == "0") {
    day = day.slice(1, 2);
  }

  month = month.slice(0, 1).toUpperCase() + month.slice(1).toLowerCase();

  return month + " " + day + ", " + year;
}
