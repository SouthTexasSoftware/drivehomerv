import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import Stripe from "stripe";
import { STR_PRIVATE_KEY } from "$env/static/private";
import type { Customer } from "lib/types";

export const POST = (async ({ request }) => {
  const customerObject = (await request.json()) as Customer;

  console.log(
    "Server Received a UpdateCustomer call to API : ",
    customerObject
  );

  const stripe = new Stripe(STR_PRIVATE_KEY, {
    apiVersion: "2022-11-15",
  });

  let responseJson = {
    error: false,
    stripe_id: "placeholder",
    code: "",
  };

  try {
    const new_customer_object = await stripe.customers.update(
      //@ts-ignore
      customerObject.stripe_id,
      {
        email: customerObject.email,
        name: customerObject.first_name + " " + customerObject.last_name,
        phone: customerObject.phone,
      }
    );

    responseJson.stripe_id = new_customer_object.id;
  } catch (e) {
    if (e instanceof Error) {
      responseJson.code = e.message;
    }
    responseJson.error = true;
  }

  return json(responseJson);
}) satisfies RequestHandler;
