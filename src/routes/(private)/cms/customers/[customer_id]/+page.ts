import type { PageLoad } from "./$types";
import { customerStore, firebaseStore } from "$lib/stores";
import { get } from "svelte/store";

export const load: PageLoad = async ({ params }) => {
  const { customer_id } = params;

  //   if (!customer) {
  //     throw error(404, `Customer with ID ${customer_id} not found`);
  //   }

  return {
    customer_id,
  };
};
