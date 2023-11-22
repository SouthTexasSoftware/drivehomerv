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

  console.log(
    "Server Received an CustomerConfirmation email call to API : ",
    requestData
  );

  let responseJson = {
    error: false,
    code: "",
  };

  try {
    let emailPayload = {
      booking_id: requestData.id,
      receipt_date: formatDate(requestData.receipt_date_string),
      customer_name:
        requestData.customerObject?.first_name +
        " " +
        requestData.customerObject?.last_name,
      customer_email: requestData.customerObject?.email,
      customer_phone: requestData.customerObject?.phone,
      start_date: formatDate(requestData.start),
      end_date: formatDate(requestData.end),
      unit_name: requestData.unit_name,
      price_per_night: requestData.price_per_night?.toString(),
      trip_length: requestData.trip_length?.toString(),
      nightly_rate_sum: requestData.nightly_rate_sum?.toString(),
      service_fee: requestData.service_fee?.toString(),
      taxes_and_fees: requestData.taxes_and_fees?.toString(),
      total_price: requestData.total_price?.toString(),
      unit_img_link: requestData.unit_img_link,
      notes: "placeholder for confirmation/receipt notes",
    };

    //@ts-ignore
    await emailHandler(
      requestData.customerObject.email,
      "confirmation",
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
