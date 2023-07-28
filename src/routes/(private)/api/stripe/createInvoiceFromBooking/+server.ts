import { json, error } from "@sveltejs/kit";
//@ts-ignore
import type { RequestHandler } from "./$types";
import Stripe from "stripe";
import { stripeConfig } from "../../../../../config";
import type { Booking } from "lib/types";
import { DateTime } from "@easepick/bundle";

interface BookingAndID {
  bookingRequest: Booking;
  customerId: string;
  stripe_product_id: string;
}

//@ts-ignore
export const POST = (async ({ request }) => {
  const bookingAndId = (await request.json()) as BookingAndID;

  console.log(
    "Server Received a CreateBookingPrice call to API : ",
    bookingAndId
  );

  const stripe = new Stripe(stripeConfig.privateKey, {
    apiVersion: "2022-11-15",
  });

  let responseJson = {
    error: false,
    price_id_list: [""],
    invoice_items_list: [""],
    invoices: [],
    code: "",
  };

  let tripInvoiceSplit = true;
  // determine if invoice is 50% or 100%
  let todaysDate = new DateTime();
  console.log(todaysDate);
  let tripStartDate = new DateTime(
    bookingAndId.bookingRequest.start,
    "MMM-DD-YYYY"
  );
  if (tripStartDate.diff(todaysDate) < 30) {
    tripInvoiceSplit = false;
  }

  let stripeBookingTotalPrice = 0;
  if (bookingAndId.bookingRequest.total_price) {
    stripeBookingTotalPrice = bookingAndId.bookingRequest.total_price * 100;
  }
  let bookingStart = new DateTime(
    bookingAndId.bookingRequest.start,
    "MMM-DD-YYYY"
  );
  let unixStart = Math.floor(bookingStart.getTime() / 1000);
  let bookingEnd = new DateTime(bookingAndId.bookingRequest.end, "MMM-DD-YYYY");
  let unixEnd = Math.floor(bookingEnd.getTime() / 1000);

  if (tripInvoiceSplit) {
    // TWO SEPERATE PRICE OBJECTS - AND THE FIRST INVOICE ITEM CREATED
    // FIRST PRICE AND INVOICE ITEM
    try {
      const first_price_object = await stripe.prices.create({
        currency: "usd",
        product: bookingAndId.stripe_product_id,
        unit_amount: stripeBookingTotalPrice / 2,
        nickname:
          "#1 " +
          bookingAndId.bookingRequest.start +
          " to " +
          bookingAndId.bookingRequest.end,
        metadata: {
          customer_stripe_id: bookingAndId.customerId,
        },
      });
      responseJson.price_id_list[0] = first_price_object.id;

      //HALF INVOICE OBJECT
      let firstInvoiceMemo =
        "Thank you for booking with Drive Home RV! This invoice is for HALF the price of your trip. We appreciate your business.";
      const first_invoice = await stripe.invoices.create({
        customer: bookingAndId.customerId,
        collection_method: "send_invoice",
        description: firstInvoiceMemo,
        days_until_due: 0,
      });

      let firstPrice = bookingAndId.bookingRequest.total_price;
      if (firstPrice) {
        firstPrice = firstPrice / 2;
      }
      //@ts-ignore
      responseJson.invoices.push({
        id: first_invoice.id,
        status: "draft",
        amount: firstPrice,
      });

      const first_invoice_item = await stripe.invoiceItems.create({
        customer: bookingAndId.customerId,
        price: first_price_object.id,
        invoice: first_invoice.id,
        period: { start: unixStart, end: unixEnd },
      });

      responseJson.invoice_items_list[0] = first_invoice_item.id;
    } catch (e) {
      if (e instanceof Error) {
        responseJson.code = e.message;
      }
      responseJson.error = true;
      console.log(e);
    }
    // SECOND PRICE AND INVOICE
    try {
      const second_price_object = await stripe.prices.create({
        currency: "usd",
        product: bookingAndId.stripe_product_id,
        unit_amount: stripeBookingTotalPrice / 2,
        nickname:
          "#2 " +
          bookingAndId.bookingRequest.start +
          " to " +
          bookingAndId.bookingRequest.end,
        metadata: {
          customer_stripe_id: bookingAndId.customerId,
        },
      });
      responseJson.price_id_list.push(second_price_object.id);

      // SECOND HALF INVOICE OBJECT
      let secondInvoiceMemo =
        "Thank you for booking with Drive Home RV! This invoice is for HALF the price of your trip. We appreciate your business.";
      let bookingStartDate = new DateTime(
        bookingAndId.bookingRequest.start,
        "MMM-DD-YYYY"
      );
      let weekBeforeStart = bookingStartDate.add(-30);
      let unixTimestamp = Math.floor(weekBeforeStart.getTime() / 1000);

      const second_invoice = await stripe.invoices.create({
        customer: bookingAndId.customerId,
        collection_method: "send_invoice",
        description: secondInvoiceMemo,
        due_date: unixTimestamp,
      });
      let secondPrice = bookingAndId.bookingRequest.total_price;
      if (secondPrice) {
        secondPrice = secondPrice / 2;
      }
      //@ts-ignore
      responseJson.invoices.push({
        id: second_invoice.id,
        status: "draft",
        amount: secondPrice,
      });

      const second_invoice_item = await stripe.invoiceItems.create({
        customer: bookingAndId.customerId,
        price: second_price_object.id,
        invoice: second_invoice.id,
        period: { start: unixStart, end: unixEnd },
      });

      responseJson.invoice_items_list.push(second_invoice_item.id);
    } catch (e) {
      if (e instanceof Error) {
        responseJson.code = e.message;
      }
      responseJson.error = true;
      console.log(e);
    }
  } else {
    // FULL PRICE AND INVOICE ITEM - < 30 DAYS OUT
    try {
      // FULL PRICE OBJECT
      const new_price_object = await stripe.prices.create({
        currency: "usd",
        product: bookingAndId.stripe_product_id,
        unit_amount: stripeBookingTotalPrice,
        nickname:
          bookingAndId.bookingRequest.start +
          " to " +
          bookingAndId.bookingRequest.end,
        metadata: {
          customer_stripe_id: bookingAndId.customerId,
        },
      });
      responseJson.price_id_list[0] = new_price_object.id;

      //FULL INVOICE OBJECT
      let fullInvoiceMemo =
        "Thank you for booking with Drive Home RV! This invoice is for the FULL price of your trip. We appreciate your business.";
      const full_invoice = await stripe.invoices.create({
        customer: bookingAndId.customerId,
        collection_method: "send_invoice",
        description: fullInvoiceMemo,
        days_until_due: 0,
      });
      //@ts-ignore
      responseJson.invoices.push({
        id: full_invoice.id,
        status: "draft",
        amount: bookingAndId.bookingRequest.total_price,
      });

      //FULL INVOICE ITEM CREATED AND ADDED TO INVOICE ABOVE
      const full_invoice_item = await stripe.invoiceItems.create({
        customer: bookingAndId.customerId,
        price: new_price_object.id,
        invoice: full_invoice.id,
        period: { start: unixStart, end: unixEnd },
      });

      responseJson.invoice_items_list[0] = full_invoice_item.id;
    } catch (e) {
      if (e instanceof Error) {
        responseJson.code = e.message;
      }
      responseJson.error = true;
      console.log(e);
    }
  }

  return json(responseJson);
}) satisfies RequestHandler;
