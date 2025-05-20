// src/routes/api/maps/getDistance/+server.ts
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import axios from "axios";
import { GOOG_MAPS_KEY } from "$env/static/private";

// Define the expected request body shape
interface DistanceRequestBody {
  startLat: number;
  startLng: number;
  endAddress: string;
}

// Define the possible response shapes
interface DistanceResponse {
  distance?: string;
  error?: string;
  details?: string;
}

const GOOGLE_MAPS_API_KEY = GOOG_MAPS_KEY;

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body: DistanceRequestBody = await request.json();

    const { startLat, startLng, endAddress } = body;

    if (!startLat || !startLng || !endAddress) {
      return json({ error: "Missing required parameters" }, { status: 400 });
    }

    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/distancematrix/json",
      {
        params: {
          origins: `${startLat},${startLng}`,
          destinations: endAddress,
          key: GOOGLE_MAPS_API_KEY,
          units: "imperial", // or 'metric'
          mode: "driving", // or 'walking', 'bicycling', etc.
        },
      }
    );

    const data = response.data;

    if (data.status === "OK") {
      const distance = data.rows[0].elements[0].distance.text;
      return json({ distance });
    } else {
      return json(
        { error: "Invalid request", details: data.status },
        { status: 400 }
      );
    }
  } catch (error) {
    return json(
      {
        error: "Server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
};
