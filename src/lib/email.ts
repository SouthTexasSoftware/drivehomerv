import sgMail from "@sendgrid/mail";
import { dev } from "$app/environment";
import { SG_API_KEY } from "$env/static/private";

const confirmationTemplateId = "d-d9d1191bbaf84a578f35ee147cb6db57";
const ownerNotificationTemplateId = "d-4d6e684b748e479e9c5132abf0929f11";
const rentalAgreementTemplateId = "d-2e4d9f8b57ef486281d8a2b19554e8ed";

let msg: MessageObject = {
  from: {
    name: "Drive Home RV Bookings",
    email: "donotreply@booking.drivehomerv.com",
  },
  // 'alec@rapplitemedia.com',
};

/**
 * Simple helper function to match the email type to it's template ID - Async
 * @param type template/name of email.
 * @param payload object who's keys match what is expected by it's template.
 */
export async function emailHandler(
  to: string | string[],
  type: string,
  payload: { [key: string]: any | undefined }
) {
  msg.to = to;

  // console.log("attempting email payload = ", payload);
  //build 'msg' object based on the type and payload details
  switch (type) {
    case "owner_notification":
      msg.templateId = ownerNotificationTemplateId;
      msg.dynamicTemplateData = payload;
      /**
       * payload = {
       * subject:
       * body_one:
       * body_two:
       * body_three:
       * body_four:
       * link:
       * }
       */
      break;

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
        sales_tax,
        damage_protection,
        total_price,
        unit_img_link,
        notes

      }
      */
      break;

    case "rentalAgreement":
      msg.templateId = rentalAgreementTemplateId;
      msg.dynamicTemplateData = payload;
      /*payload = {
      "link":
      "start_date":
      "end_date": 
      "unit_name":
      "location":
      "pickup_time":
      "dropoff_time":
      "unit_img_link":
      "notes":
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
    sgMail.setApiKey(SG_API_KEY);
    try {
      //@ts-ignore
      let sgResponse = await sgMail.send(msg);
      // console.log(sgResponse);
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
