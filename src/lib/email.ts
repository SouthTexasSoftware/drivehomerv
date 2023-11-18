import sgMail from "@sendgrid/mail";
import { dev } from "$app/environment";
import { sendgridConfig } from "../config";


const confirmationTemplateId = "d-24b1dabe9daa4e8c8191d5957ca5e90a";

let msg: MessageObject = {
  from: {
    name: "Drive Home RV Bookings",
    email: "notifications@southtexas.software",
  },
  // 'alec@rapplitemedia.com',
};

/**
 * Simple helper function to match the email type to it's template ID - Async
 * @param type template/name of email.
 * @param payload object who's keys match what is expected by it's template.
 */
export async function emailHandler( to: string,
  type: string,
  payload: { [key: string]: string | null }
) {

  msg.to = to;

  //build 'msg' object based on the type and payload details
  switch (type) {
    case "confirmation":
      msg.templateId = confirmationTemplateId;
      msg.dynamicTemplateData = payload;
      /*payload = {
        booking_id,
        receipt_date,
        customer_name,
        customer_email,
        customer_phone,
        start_date, (formatted)
        end_date, (formatted)
        unit_name,
        price_per_night,
        trip_length,
        nightly_rate_sum,
        service_fee,
        taxes_and_fees,
        total_price,
        unit_img_link,
        notes

      }
      */
      break;
  }

  // d: change to dev if testing other features
  if (dev) {
    console.log(
      "****************** SIMULATING EMAIL PAYLOAD *********************"
    );
    console.log(msg);
  } else {
    sgMail.setApiKey(sendgridConfig.apiKey);
    try {
      //@ts-ignore
      let sgResponse = await sgMail.send(msg);
      console.log(sgResponse);
    } catch (e) {
      console.error(e);

      throw e;
    }
  }
}

interface MessageObject {
  from: { name: string; email: string };
  to?: string | string[];
  templateId?: string;
  dynamicTemplateData?: { [key: string]: any };
}
