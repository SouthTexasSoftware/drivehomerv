import type { PageServerLoad } from "./$types";
import Stripe from "stripe";
import { STR_PRIVATE_KEY } from "$env/static/private";

export const load: PageServerLoad = async (data) => {
  let paymentIntentKey = data.url.searchParams.get("payment_intent");

  if (paymentIntentKey) {
    // payment intent and/or secret has been passed back to us..
    const stripe = new Stripe(STR_PRIVATE_KEY, {
      apiVersion: "2022-11-15",
    });

    let paymentIntentObject = await stripe.paymentIntents.retrieve(
      paymentIntentKey
    );

    return { paymentIntentObject };
  }
};
