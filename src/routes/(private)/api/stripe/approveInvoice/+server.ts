import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import Stripe from "stripe";
import { STR_PRIVATE_KEY } from "$env/static/private";

interface RequestData {
  invoiceID: string;
}

export const POST = (async ({ request }) => {
  const requestData = (await request.json()) as RequestData;

  // console.log("Server Received an ApproveInvoice call to API : ", requestData);

  const stripe = new Stripe(STR_PRIVATE_KEY, {
    apiVersion: "2022-11-15",
  });

  let responseJson = {
    error: false,
    invoiceObject: {},
    code: "",
  };

  try {
    const sent_invoice = await stripe.invoices.sendInvoice(
      requestData.invoiceID
    );

    responseJson.invoiceObject = sent_invoice;
  } catch (e) {
    if (e instanceof Error) {
      responseJson.code = e.message;
    }
    responseJson.error = true;
  }

  return json(responseJson);
}) satisfies RequestHandler;
