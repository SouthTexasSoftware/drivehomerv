import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import Stripe from "stripe";
import { stripeConfig } from "../../../../../config";
import type { Booking, Customer, Unit } from "$lib/types";

export const POST = (async ({ request }) => {
  const unitObject = (await request.json()) as Unit;

  const stripe = new Stripe(stripeConfig.privateKey, {
    apiVersion: "2022-11-15",
  });

  let responseJson = {
    error: false,
    stripe_product_id: "",
    code: "",
  };

  try {
    let shortDescription =
      "Sleeps " +
      unitObject.information.bullet_points.summary.sleeps +
      ", " +
      "Length " +
      unitObject.information.bullet_points.summary.length +
      ", " +
      "Built: " +
      unitObject.information.bullet_points.summary.year_built +
      ", " +
      unitObject.information.bullet_points.summary.vehicle_type;

    const newStripeProduct = await stripe.products.create({
      name: unitObject.name,
      description: shortDescription,
      type: "good",
    });

    responseJson.stripe_product_id = newStripeProduct.id;
  } catch (e) {
    if (e instanceof Error) {
      responseJson.code = e.message;
    }
    responseJson.error = true;
  }

  return json(responseJson);
}) satisfies RequestHandler;
