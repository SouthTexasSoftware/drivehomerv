import sgMail from "@sendgrid/mail";
import { dev } from "$app/environment";
import { sendgridConfig } from "../config";

const newRequestTemplateId = "d-24b1dabe9daa4e8c8191d5957ca5e90a";

let msg: MessageObject = {
  from: {
    name: "South Texas Software",
    email: "notifications@southtexas.software",
  },
  to: [
    "notifications@southtexas.software",
    "info@drivehomerv.com",
    "steve@drivehomerv.com",
  ],
  // 'alec@rapplitemedia.com',
};

/**
 * Simple helper function to match the email type to it's template ID - Async
 * @param type template/name of email.
 * @param payload object who's keys match what is expected by it's template.
 */
export async function emailHandler(
  type: string,
  payload: { [key: string]: string | null }
) {
  //build 'msg' object based on the type and payload details
  switch (type) {
    case "request":
      msg.templateId = newRequestTemplateId;
      msg.dynamicTemplateData = payload;
      break;
  }

  // d: change to dev if testing other features
  if (dev) {
    console.log(
      "****************** SIMULATING EMAIL PAYLOAD *********************"
    );
    console.error(msg);
  } else {
    sgMail.setApiKey(sendgridConfig.apiKey);
    try {
      //@ts-ignore
      let sgResponse = await sgMail.send(msg);
      console.log(sgResponse);
    } catch (e) {
      console.error(e);
    }
  }
}

interface MessageObject {
  from: { name: string; email: string };
  to: string | string[];
  templateId?: string;
  dynamicTemplateData?: { [key: string]: any };
}
