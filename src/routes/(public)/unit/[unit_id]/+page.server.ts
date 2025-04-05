import type { Actions } from "./$types";
import { emailHandler } from "$lib/email";

export const actions = {
  default: async ({ request }) => {
    const data = await request.formData();

    // console.log(data);
    let first_name = data.get("first-name");
    let last_name = data.get("last-name");
    let full_name = first_name + " " + last_name;
    let email = data.get("email");
    let phone = data.get("phone");
    let start_date = data.get("start-date");
    let end_date = data.get("end-date");
    let quoted_price = data.get("total-price");
    let unit_name = data.get("unit-name");
    let passengers = data.get("passengers");

    let emailPayload = {
      name: full_name,
      phone: phone as string,
      email: email as string,
      details:
        " Start: " +
        start_date +
        " | End: " +
        end_date +
        "\n Unit: " +
        unit_name +
        "\n Quoted: " +
        quoted_price +
        "\n Passengers: " +
        passengers,
    };
    // organize data and call email Handler to send the notification email out...

    //await emailHandler("request", emailPayload);
  },
} satisfies Actions;

// send email out
// email template expects { name , phone , email , details}
