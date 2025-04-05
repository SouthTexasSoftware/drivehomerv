import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

interface RequestData {
  id: string;
}

export const POST = (async ({ request }) => {
  const requestData = (await request.json()) as RequestData;

  // console.log("Cancel Booking from Timer api call: ", requestData);

  let responseJson = {
    error: false,
    code: "",
  };

  return json(responseJson);
}) satisfies RequestHandler;
