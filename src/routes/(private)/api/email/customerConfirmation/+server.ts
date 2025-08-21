import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { emailHandler } from "$lib/email";
import type { Booking } from "$lib/types";



interface RequestData {
  invoiceID: string;
}

export const POST = (async ({ request }) => {
  const requestData = (await request.json()) as Booking;

  // console.log("Server Received an CustomerConfirmation email call to API");
  // console.log(
  //   "Server Received an CustomerConfirmation email call to API",
  //   requestData
  // );

  let responseJson = {
    error: false,
    code: "",
  };

  try {
    let emailPayload = {
      booking_id: requestData.id,
      receipt_date: formatDate(requestData.receipt_date_string!),
      customer_name:
        requestData.customerObject?.first_name +
        " " +
        requestData.customerObject?.last_name,
      customer_email: requestData.customerObject?.email,
      customer_phone: requestData.customerObject?.phone,
      start_date: formatDate(requestData.start),
      end_date: formatDate(requestData.end),
      pickup_time: requestData.pickup_time,
      dropoff_time: requestData.dropoff_time,
      unit_name: requestData.unit_name,
      price_per_night: requestData.price_per_night?.toString(),
      trip_length: requestData.trip_length?.toString(),
      nightly_rate_sum: requestData.nightly_rate_sum?.toString(),
      service_fee: requestData.service_fee?.toString(),
      sales_tax: requestData.sales_tax?.toString(),
      damage_protection: requestData.damage_protection?.toString(),
      additional_line_items: formatLineItems(requestData.additional_line_items),
      total_price: requestData.total_price?.toString(),
      unit_img_link: requestData.unit_img_link,
      notes:
        "Welcome to the Drive Home family! We are so excited that you chose us to help outfit you for your adventure. We can't wait to meet you in person and help guide you through your RV rental experience. Whether you are a return customer or just renting for the first time, we are happy to welcome you and answer any questions that you may have.",
    };

    //@ts-ignore
    await emailHandler(
      requestData.customerObject!.email,
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

function formatLineItems(
  line_item_obj:
    | {
        [name: string]: { value: number; type: "add" | "subtract" };
      }
    | undefined
) {
  if (!line_item_obj) {
    return [];
  }

  let json_compat_array = Object.entries(line_item_obj).map((item) => {
    let string_value = item[1].value.toString();
    if (item[1].type == "subtract") {
      string_value = "-$" + string_value;
    } else {
      string_value = "$" + string_value;
    }
    let full_object = {
      name: item[0],
      string_value: string_value,
    };

    return full_object;
  });

  return json_compat_array;
}
