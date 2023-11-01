<script lang="ts">
  import { customerStore, firebaseStore } from "$lib/stores";
  import { afterUpdate, createEventDispatcher, onMount } from "svelte";
  import { DateTime } from "@easepick/bundle";
  import { enhance } from "$app/forms";
  import {
    collection,
    setDoc,
    Timestamp,
    doc,
    arrayUnion,
    updateDoc,
  } from "firebase/firestore";
  import { fade } from "svelte/transition";
  import type { Unit } from "lib/types";

  export let unitObject: Unit;

  let dispatch = createEventDispatcher();
  let submittingForm = false;
  let formElement: HTMLFormElement;

  let invoicePercentage = "50";

  onMount(() => {
    window.scrollTo(0, 150);
    setInvoicePercentageString();
    console.log($customerStore);
  });

  

  function setInvoicePercentageString() {
    let selectedStartDate = new DateTime($customerStore.start, "MMM-DD-YYYY");
    let todaysDate = new DateTime();
    if (selectedStartDate.diff(todaysDate) < 30) {
      invoicePercentage = "100";
    } else {
      invoicePercentage = "50";
    }
  }

  function dispatchCloseModal() {
    dispatch("close", true);
  }

  function dispatchRequestSuccess() {
    dispatch("requestSuccess", true);
  }

  function getMonthString(dateString: string | undefined) {
    if (!dateString || dateString == "undefined") {
      return "None";
    }
    let dateTimeObject = new DateTime(dateString, "MMM-DD-YYYY");

    let dayString = dateTimeObject.toLocaleString("en-us", {
      weekday: "long",
    });
    let monthString = dateTimeObject.toLocaleString("en-us", {
      month: "long",
    });

    let dayNumber = dateTimeObject.getDate();
    let dayNumberFormatted = ordinal_suffix_of(dayNumber);

    return monthString + " " + dayNumberFormatted;
  }

  function ordinal_suffix_of(i: number) {
    var j = i % 10,
      k = i % 100;
    if (j == 1 && k != 11) {
      return i + "st";
    }
    if (j == 2 && k != 12) {
      return i + "nd";
    }
    if (j == 3 && k != 13) {
      return i + "rd";
    }
    return i + "th";
  }

  // form submission handled inline on form element via use:enhance
</script>

<section class="request-container" in:fade={{ duration: 200 }}>
  <h3>Request this Trip</h3>
  <button class="close-modal" on:click={dispatchCloseModal}>
    <svg
      width="30px"
      height="30px"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="Menu / Close_MD">
        <path
          id="Vector"
          d="M18 18L12 12M12 12L6 6M12 12L18 6M12 12L6 18"
          stroke="#000000"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
    </svg>
  </button>
  <form
    method="POST"
    use:enhance={async ({ form, data, action, cancel, submitter }) => {
      if (submittingForm) {
        return;
      }
      submittingForm = true;

      // create references and establish new unique IDs
      let customerCollection = collection($firebaseStore.db, "customers");
      let newCustomerDocRef = doc(customerCollection);
      const newCustomerId = newCustomerDocRef.id;

      let unitId = $customerStore.unit_id;
      if (!unitId) {
        unitId = "unitIdWasNotFound";
      }

      let bookingsCollection = collection(
        $firebaseStore.db,
        "units",
        unitId,
        "bookings"
      );
      let newBookingDocRef = doc(bookingsCollection);
      let newBookingId = newBookingDocRef.id;

      let newCustomer = {
        id: newCustomerId,
        first_name: data.get("first-name"),
        last_name: data.get("last-name"),
        email: data.get("email"),
        phone: data.get("phone"),
        created: Timestamp.now(),
        bookings: [newBookingId],
      };

      customerStore.update((storeData) => {
        //@ts-ignore
        storeData.customerObject = newCustomer;

        return storeData;
      });

      let startDate = new DateTime(data.get("start-date"), "MMM-DD-YYYY");
      let endDate = new DateTime(data.get("end-date"), "MMM-DD-YYYY");

      let newBookingRequest = {
        id: newBookingId,
        passengers: data.get("passengers"),
        total_price: data.get("total-price"),
        start: data.get("start-date"),
        end: data.get("end-date"),
        unix_start: Math.ceil(startDate.getTime() / 1000),
        unix_end: Math.ceil(endDate.getTime() / 1000),
        unit_id: data.get("unit-id"),
        unit_name: data.get("unit-name"),
        customer: newCustomerId,
        created: Timestamp.now(),
        status: "requested",
        pickup_time: data.get("pickup-time"),
        dropoff_time: data.get("dropoff-time"),
        pickup_dropoff_price_addition: data.get(
          "pickup-dropoff-price-addition"
        ),
      };

      let createCustomer = await setDoc(newCustomerDocRef, newCustomer);
      let createBooking = await setDoc(newBookingDocRef, newBookingRequest);

      //***  CREATE STRIPE CUSTOMER ***
      let createStripeCustomer = await fetch("/api/stripe/createCustomer", {
        method: "POST",
        body: JSON.stringify(newCustomer),
        headers: {
          "Content-Type": "application/json",
        },
      });

      let customerResponse = await createStripeCustomer.json();

      if (customerResponse.error) {
        throw new Error(customerResponse.error);
      } else {
        // add stripeId to the our database..
        console.log("Stripe Customer Created: ", customerResponse);
        await updateDoc(newCustomerDocRef, {
          stripe_id: customerResponse.stripe_id,
        });
      }

      //***  CREATE STRIPE BOOKING PRICE OBJECT  ***
      let createStripePrice = await fetch(
        "/api/stripe/createInvoiceFromBooking",
        {
          method: "POST",
          body: JSON.stringify({
            bookingRequest: newBookingRequest,
            customerId: customerResponse.stripe_id,
            stripe_product_id: unitObject.stripe_product_id,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      let priceResponse = await createStripePrice.json();

      if (priceResponse.error) {
        throw new Error(priceResponse.error);
      } else {
        // add priceId to the our database..
        console.log(priceResponse);

        await updateDoc(newBookingDocRef, {
          stripe_price_id_list: arrayUnion(...priceResponse.price_id_list),
          stripe_invoiceItem_id_list: arrayUnion(
            ...priceResponse.invoice_items_list
          ),
          stripe_invoices: arrayUnion(...priceResponse.invoices),
        });
      }

      submittingForm = false;

      dispatchRequestSuccess();
      dispatchCloseModal();
      // close the request modal and trigger a success window...
    }}
  >
    <label for="first-name">FIRST NAME</label>
    <input type="text" name="first-name" autocomplete="given-name" required />

    <label for="last-name">LAST NAME</label>
    <input type="text" name="last-name" autocomplete="family-name" required />

    <label for="email">EMAIL</label>
    <input type="email" name="email" autocomplete="email" required />

    <label for="phone">PHONE</label>
    <input type="tel" name="phone" autocomplete="tel" required />

    <label for="passengers"> PASSENGER COUNT </label>
    <input
      id="passenger-input"
      type="number"
      name="passengers"
      autocomplete="off"
      value="1"
      required
    />

    <p class="label">DATES</p>
    <div class="dates-row">
      <p class="date-box">
        {getMonthString($customerStore.start)}
        <span class="pd-time">@ {$customerStore.pickup_time}</span>
      </p>
      <div class="arrow-container">
        <svg
          id="right-arrow"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g id="Complete">
            <g id="arrow-right">
              <g>
                <polyline
                  data-name="Right"
                  fill="none"
                  id="Right-2"
                  points="16.4 7 21.5 12 16.4 17"
                  stroke="#000000"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                />

                <line
                  fill="none"
                  stroke="#000000"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  x1="2.5"
                  x2="19.2"
                  y1="12"
                  y2="12"
                />
              </g>
            </g>
          </g>
        </svg>
      </div>
      <p class="date-box">
        {getMonthString($customerStore.end)}
        <span class="pd-time">@ {$customerStore.dropoff_time}</span>
      </p>
    </div>

    <input hidden name="start-date" value={$customerStore.start} />
    <input hidden name="end-date" value={$customerStore.end} />
    <input hidden name="total-price" value={$customerStore.total_price} />
    <input hidden name="unit-id" value={$customerStore.unit_id} />
    <input hidden name="unit-name" value={$customerStore.unit_name} />
    <input hidden name="pickup-time" value={$customerStore.pickup_time} />
    <input hidden name="dropoff-time" value={$customerStore.dropoff_time} />
    <input
      hidden
      name="pickup-dropoff-price-addition"
      value={$customerStore.pickup_dropoff_price_addition}
    />

    <p class="label">PICKUP</p>
    <p class="info">Modena, New York</p>

    <p class="label">VEHICLE</p>
    <p class="info">{$customerStore.unit_name}</p>

    <p class="terms">
      By clicking ‘Request to Book’, you agree to receive follow up
      communications from our sales team to answer any further questions, and
      receive an invoice for {invoicePercentage}% of the total booking value of
      ${$customerStore.total_price}.
    </p>

    <button id="submit" type="submit">
      {#if submittingForm}
        <div class="spinner" />
      {:else}
        REQUEST TO BOOK
      {/if}
    </button>
  </form>
</section>

<style>
  .request-container {
    position: absolute;
    top: 200px;
    background-color: white;
    /* width: 90vw; */
    max-width: 800px;
    z-index: 101;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    box-shadow: 0px 2px 3px grey;
    border-radius: 4px;
    padding: 25px 100px;
  }
  .close-modal {
    position: absolute;
    top: 25px;
    right: 25px;
  }
  form {
    display: flex;
    flex-direction: column;
  }
  h3 {
    font-size: 36px;
    margin-bottom: 25px;
  }
  svg#right-arrow {
    height: 100%;
    width: 20px;
  }
  label,
  .label {
    color: grey;
    font-size: 14px;
    margin-bottom: -4px;
    font-family: font-light;
  }
  input {
    border-bottom: 1px solid hsl(var(--b2));
    border-radius: 2px;
    outline: none;
    font-size: 20px;
    margin-bottom: 20px;
  }
  #passenger-input {
    width: 75px;
  }
  .dates-row {
    display: flex;
    width: 100%;
    justify-content: space-around;
    font-size: 20px;
  }
  p.info {
    font-size: 20px;
    margin-left: 15px;
  }
  p.terms {
    width: 100%;
    text-align: center;
    margin: 25px auto 45px;
    font-family: font-light;
    font-size: 16px;
  }
  button#submit {
    background-color: hsl(var(--p));
    font-size: 24px;
    color: hsl(var(--b1));
    width: 100%;
    position: absolute;
    bottom: 0;
    left: 0;
    height: 50px;
    font-family: font-light;
  }
  .pd-time {
    font-family: font-light;
    font-size: 15px;
  }
  @media (max-width: 500px) {
    .date-box {
      position: relative;
      margin-bottom: 10px;
    }
    .pd-time {
      font-family: font-light;
      font-size: 13px;
      position: absolute;
      bottom: -10px;
      left: 30%;
    }
    .request-container {
      position: absolute;
      width: 90vw;
      padding: 25px;
    }
    h3 {
      font-size: 24px;
    }
    .close-modal {
      top: 10px;
      right: 10px;
    }
  }

  @media (min-width: 500px) and (max-width: 1000px) {
  }

  @media (min-width: 1000px) {
  }

  .spinner {
    content: "";
    border-radius: 50%;
    border-top: 2px solid hsl(var(--b1));
    border-right: 2px solid transparent;
    animation-name: spinning;
    animation-duration: 1s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    opacity: 1;
    transition: all 0.2s;
    width: 20px;
    height: 20px;
    margin: 0 auto;
  }
  @keyframes spinning {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
