import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import Stripe from "stripe";
import { stripeConfig } from "../../../../../config";
import type { Booking, Customer } from "lib/types";

export const POST = (async ({ request }) => {
  const bookingObject = (await request.json()) as Booking;

  console.log(
    "Server Received a createPaymentIntent call to API : ",
    bookingObject
  );

  const stripe = new Stripe(stripeConfig.privateKey, {
    apiVersion: "2022-11-15",
  });

  let responseJson = {
    error: false,
    client_secret: "placeholder",
    code: "",

  };

  //@ts-ignore
  let paymentTotal = bookingObject.total_price || 0;

  try {

    const newPaymentIntent = await stripe.paymentIntents.create({
      amount: paymentTotal * 100,
      currency: "usd",
      //@ts-ignore
      customer: bookingObject.customerObject.stripe_id,
      automatic_payment_methods: { enabled: true },
    });
    if (newPaymentIntent.client_secret) {
      responseJson.client_secret = newPaymentIntent.client_secret;
    }
  } catch (e) {
    if (e instanceof Error) {
      responseJson.code = e.message;
    }
    responseJson.error = true;
  }

  return json(responseJson);
}) satisfies RequestHandler;
