import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { emailHandler } from "$lib/email";
import type { Booking } from "$lib/types";
import { DateTime } from "@easepick/bundle";

interface RequestData {
  invoiceID: string;
}

export const POST = (async ({ request }) => {
  const requestData = (await request.json()) as Booking;

  console.log("Server Received an OwnerNotification email call to API : ");

  // console.log(
  //   "Server Received an OwnerNotification email call to API : ",
  //   requestData
  // );

  let responseJson = {
    error: false,
    code: "",
  };

  try {
    let emailPayload = {
      subject: "New Booking",
      body_one:
        requestData.unit_name +
        " has been booked from " +
        requestData.start +
        " to " +
        requestData.end +
        ".",
      body_two: "Please use the link below to review.",
      link:
        "https://drivehomerv-git-preview-southtexassoftware.vercel.app/cms/units/" +
        requestData.unit_id +
        "/bookings/" +
        requestData.id +
        "/Overview",
    };

    //@ts-ignore
    await emailHandler(
      [
        "info@drivehomerv.com",
        "steve@drivehomerv.com",
        "notifications@southtexas.software",
      ],
      "owner_notification",
      emailPayload
    );
  } catch (e) {
    if (e instanceof Error) {
      responseJson.code = e.message;
    }
    responseJson.error = true;
  }

  return json(responseJson);
}) satisfies RequestHandler;

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
