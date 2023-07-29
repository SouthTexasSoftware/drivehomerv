<script lang="ts">
  import { beforeNavigate } from "$app/navigation";
  import { page, updated } from "$app/stores";
  import { firebaseStore } from "$lib/stores";
  import type { Booking, Customer, Unit } from "$lib/types";
  import { DateTime } from "@easepick/bundle";
  import { arrayUnion, collection, doc, updateDoc } from "firebase/firestore";
  import { beforeUpdate } from "svelte";
  import { fade } from "svelte/transition";

  export let bookingObject: Booking | undefined;
  export let unitObject: Unit;

  let priceInputElement: HTMLInputElement;
  let timerOn = false;
  let saving = false;
  let saved = false;

  let generateInvoiceErrorMessage = "Default Error";
  let generateInvoiceError = false;
  let generatingInvoice = false;

  let tripStartLabel = "Departure";
  let tripEndLabel = "Return";

  let bookingsSubcollectionRef = collection(
    $firebaseStore.db,
    "units",
    $page.params.unit_id,
    "bookings"
  );

  beforeNavigate(() => {
    generateInvoiceError = false;
  });

  beforeUpdate(() => {
    updateTripStartEndLabels();
  });

  function updateTripStartEndLabels() {
    if (
      unitObject.information.bullet_points.summary.vehicle_type.includes(
        "Class"
      )
    ) {
      tripStartLabel = "Departure";
      tripEndLabel = "Return";
    } else {
      tripStartLabel = "Delivery";
      tripEndLabel = "Pick-up";
    }
  }

  // format the date string stored in booking to a nice string
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

  function getDayString(dateString: string | undefined) {
    if (!dateString || dateString == "undefined") {
      return "None";
    }
    let dateTimeObject = new DateTime(dateString, "MMM-DD-YYYY");

    let dayString = dateTimeObject.toLocaleString("en-us", {
      weekday: "long",
    });

    return dayString;
  }

  function getTimeString(time: string | undefined) {
    if (!time) {
      return "No Time";
    } else {
      return time;
    }
  }

  function getCustomerName(customer: Customer) {
    let string = customer.first_name + " " + customer.last_name;
    return string;
  }

  async function updateBookingStatus(evt: Event) {
    saving = true;

    if (evt) {
      //@ts-ignore
      let newStatus = evt.target.value;

      //@ts-ignore
      bookingObject.status = newStatus;

      let updateFirebaseInvoices = false;
      if (newStatus == "approved") {
        // check that bookingObject has been setup in Stripe
        if (bookingObject?.stripe_invoices) {
          // TODO: check that invoice hasn't already been sent?

          //***  SEND INVOICE FOR MANUAL PAYMENT...  ***
          let approveInvoice = await fetch("/api/stripe/approveInvoice", {
            method: "POST",
            body: JSON.stringify({
              // TODO: this kind of sucks
              invoiceID: bookingObject?.stripe_invoices[0].id,
            }),
            headers: {
              "Content-Type": "application/json",
            },
          });

          let invoiceResponse = await approveInvoice.json();
          if (invoiceResponse.error) {
            throw new Error(invoiceResponse.error);
          } else {
            // read the returned invoice object and update our database?

            bookingObject.stripe_invoices[0].status =
              invoiceResponse.invoiceObject.status;

            updateFirebaseInvoices = true;
          }
        }
      }

      if (updateFirebaseInvoices) {
        await updateDoc(doc(bookingsSubcollectionRef, bookingObject?.id), {
          status: newStatus,
          stripe_invoices: bookingObject?.stripe_invoices,
        });
      } else {
        await updateDoc(doc(bookingsSubcollectionRef, bookingObject?.id), {
          status: newStatus,
        });
      }
      saving = false;
      saved = true;
      setTimeout(() => {
        saved = false;
      }, 2000);
    }
  }

  function triggerPriceInputTimer() {
    if (timerOn) {
      return;
    }
    timerOn = true;
    setTimeout(() => {
      updateBookingPrice(priceInputElement);
      timerOn = false;
    }, 5000);
  }

  async function updateBookingPrice(evt: HTMLInputElement) {
    saving = true;

    let newPrice = evt.value;

    await updateDoc(doc(bookingsSubcollectionRef, bookingObject?.id), {
      total_price: newPrice,
    });

    //@ts-ignore
    bookingObject.total_price = newPrice;

    saving = false;
    saved = true;
    setTimeout(() => {
      saved = false;
    }, 2000);
  }

  async function generateStripeInvoice() {
    generatingInvoice = true;
    generateInvoiceValidation();
    if (generateInvoiceError) {
      generatingInvoice = false;
      return;
    }

    console.log(bookingObject?.customerObject);

    //***  CREATE CUSTOMER IN STRIPE  ***
    let createStripeCustomer = await fetch("/api/stripe/createCustomer", {
      method: "POST",
      body: JSON.stringify(bookingObject?.customerObject),
      headers: {
        "Content-Type": "application/json",
      },
    });

    let customerResponse = await createStripeCustomer.json();

    if (customerResponse.error) {
      throw new Error(customerResponse.error);
    } else {
      //@ts-ignore
      bookingObject.customerObject.stripe_id = customerResponse.stripe_id;
    }

    //***  CREATE INVOICE FROM BOOKING IN STRIPE  ***
    let createStripeInvoice = await fetch(
      "/api/stripe/createInvoiceFromBooking",
      {
        method: "POST",
        body: JSON.stringify({
          bookingRequest: bookingObject,
          customerId: bookingObject?.customerObject?.stripe_id,
          stripe_product_id: unitObject.stripe_product_id,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    let invoiceReponse = await createStripeInvoice.json();

    if (invoiceReponse.error) {
      throw new Error(invoiceReponse.error);
    } else {
      //@ts-ignore
      bookingObject.stripe_invoiceItem_id_list =
        invoiceReponse.invoice_items_list;
      //@ts-ignore
      bookingObject.stripe_price_id_list = invoiceReponse.price_id_list;
      //@ts-ignore
      bookingObject.stripe_invoices = invoiceReponse.invoices;

      await updateDoc(doc(bookingsSubcollectionRef, bookingObject?.id), {
        stripe_price_id_list: arrayUnion(...invoiceReponse.price_id_list),
        stripe_invoiceItem_id_list: arrayUnion(
          ...invoiceReponse.invoice_items_list
        ),
        stripe_invoices: arrayUnion(...invoiceReponse.invoices),
      });
    }

    generatingInvoice = false;
    return;
  }

  function generateInvoiceValidation() {
    generateInvoiceError = false;

    // lots of checks to see if all the information necessary has been provided.

    if (!bookingObject?.customerObject) {
      generateInvoiceErrorMessage = "No Customer Created";
      generateInvoiceError = true;
      return;
    }

    if (
      !bookingObject.customerObject.email ||
      !bookingObject.customerObject.first_name ||
      !bookingObject.customerObject.last_name ||
      !bookingObject.customerObject.phone
    ) {
      generateInvoiceErrorMessage = "Customer Details Needed";
      generateInvoiceError = true;
      return;
    }

    if (!bookingObject?.total_price) {
      generateInvoiceErrorMessage = "Price Required";
      generateInvoiceError = true;
      return;
    }

    // check that the booking is not in the past?
  }

  /**
   * Adds the appropriate ending to a dates number '22nd or 28th' etc
   * @param i Number to format
   */
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

  function formatPhoneNumber(phoneNumberString: string) {
    var cleaned = ("" + phoneNumberString).replace(/\D/g, "");
    var match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return "(" + match[1] + ") " + match[2] + "-" + match[3];
    }
    return null;
  }
</script>

<div class="overview-container">
  {#if bookingObject}
    <div class="pickup-dropoff-container">
      <div class="calendar-square">
        <p class="calendar-square-title">{tripStartLabel}</p>
        <div class="separating-bar" />

        <p class="day">{getDayString(bookingObject.start)}</p>
        <p class="month">{getMonthString(bookingObject.start)}</p>
        <p class="time">{getTimeString(bookingObject.pickup_time)}</p>
      </div>
      <div class="calendar-square">
        <p class="calendar-square-title">{tripEndLabel}</p>
        <div class="separating-bar" />

        <p class="day">{getDayString(bookingObject.end)}</p>
        <p class="month">{getMonthString(bookingObject.end)}</p>
        <p class="time">{getTimeString(bookingObject.dropoff_time)}</p>
      </div>
    </div>

    <div class="section">
      <div class="section-label">Customer</div>
      {#if bookingObject?.customerObject}
        <p>{getCustomerName(bookingObject.customerObject)}</p>
        <p>{formatPhoneNumber(bookingObject.customerObject.phone)}</p>
        <p>{bookingObject.customerObject.email}</p>
      {:else}
        <p>No Customer Entered</p>
      {/if}
    </div>

    <div class="section">
      <div class="section-label">Total Price</div>

      <input
        type="number"
        bind:this={priceInputElement}
        bind:value={bookingObject.total_price}
        on:input={triggerPriceInputTimer}
      />
    </div>
    <div class="section">
      <div class="section-label">Booking Status</div>
      <select
        name="booking-status"
        id="booking-status"
        on:change={(e) => updateBookingStatus(e)}
      >
        <option
          value="requested"
          selected={bookingObject?.status == "requested"}>Requested</option
        >
        <option value="approved" selected={bookingObject?.status == "approved"}
          >Approved</option
        >
        <option
          value="inProgress"
          selected={bookingObject?.status == "inProgress"}>In Progress</option
        >
        <option
          value="completed"
          selected={bookingObject?.status == "completed"}>Completed</option
        >
        <option
          value="manualEntry"
          selected={bookingObject?.status == "manualEntry"}
          >Manually Added</option
        >
      </select>
    </div>
    <div class="section last">
      <div class="section-label">
        Stripe Status
        {#if bookingObject.customerObject?.stripe_id}
          <a
            class="stripe-product"
            href="https://dashboard.stripe.com/test/customers/{bookingObject
              .customerObject?.stripe_id}"
            target="_blank">CUSTOMER</a
          >
        {/if}
      </div>
      {#if bookingObject.stripe_invoices}
        {#each bookingObject.stripe_invoices as invoiceObj}
          <a
            target="_blank"
            class="stripe-invoice"
            href="https://dashboard.stripe.com/test/invoices/{invoiceObj.id}"
          >
            ${invoiceObj.amount} invoice
          </a>
        {/each}
      {:else}
        <button class="stripe" on:click={generateStripeInvoice}>
          {#if generatingInvoice}
            <div class="spinner white" />
          {:else}
            Generate Invoice
          {/if}
          {#if generateInvoiceError}
            <span class="generate-error">{generateInvoiceErrorMessage}</span>
          {/if}
        </button>
      {/if}
    </div>
    <div class="id-container">
      Booking ID: <span class="booking-id">{bookingObject.id}</span>
    </div>
    <div class="saving-container">
      {#if saving}
        <div class="spinner" />
      {/if}
      {#if saved}
        <svg
          width="14"
          height="12"
          viewBox="0 0 14 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          transition:fade
        >
          <path
            d="M1 5.95654L5.16047 9.74893L12.0943 1.10277"
            stroke="#AE2623"
            stroke-width="2.77358"
          />
        </svg>
      {/if}
    </div>
  {/if}
</div>

<style>
  .pickup-dropoff-container {
    display: flex;
    justify-content: space-evenly;
    width: 100%;
  }
  .overview-container {
    display: flex;
    flex-direction: column;
    padding: 15px;
    overflow-y: scroll;
  }
  .calendar-square {
    width: 41%;
    border: 1px solid var(--cms-boxShadow);
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .calendar-square-title {
    font-family: cms-semibold;
    font-size: 15px;
    color: var(--cms-text);
  }
  .separating-bar {
    width: 27%;
    height: 1px;
    background-color: var(--cms-text);
  }
  .day,
  .month {
    font-family: cms-regular;
    text-align: center;
  }
  .time {
    font-family: cms-light;
    font-size: 14px;
  }
  .separating-bar,
  .month {
    margin-bottom: 5px;
  }
  .section {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 15px;
  }
  .section.last {
    margin-bottom: 50%;
  }
  .section-label {
    font-family: cms-semibold;
    align-self: flex-start;
    font-size: 14px;
    display: flex;
  }
  .stripe-product {
    font-family: font-bold;
    border-radius: 4px;
    background-color: #625afa;
    color: white;
    font-size: 10px;
    padding: 0px 10px;
    margin-left: 72px;
    height: 15px;
  }
  .stripe-invoice {
    border-radius: 4px;
    border: solid 1px #513dd9;
    padding: 2px 15px;
    color: #513dd9;
    font-family: font-regular;
    font-size: 16px;
    margin-top: 5px;
  }
  button.stripe {
    font-family: font-bold;
    border-radius: 4px;
    background-color: #625afa;
    color: white;
    font-size: 14px;
    padding: 3px 10px;
    align-self: center;
    margin-top: 10px;
    position: relative;
    width: 150px;
    height: 26px;
  }
  .generate-error {
    position: absolute;
    color: hsl(var(--er));
    font-size: 10px;
    font-family: font-bold;
    left: 5%;
    max-width: 90%;
    top: 110%;
  }
  p {
    font-family: cms-regular;
  }
  input {
    border: 1px solid var(--cms-boxShadow);
    font-size: 16px;
    font-family: cms-regular;
    padding: 6px 15px;
    border-radius: 4px;
    outline: none;
    width: 100%;
  }
  select {
    font-size: 16px;
    font-family: cms-regular;
    padding: 6px 15px;
    border-radius: 4px;
    outline: none;
    width: 100%;
  }
  .id-container {
    font-size: 12px;
    position: absolute;
    bottom: 0px;
    left: 0;
    font-family: cms-regular;
    background-color: hsl(var(--b1));
    width: 100%;
    text-align: center;
    padding: 2px;
  }
  .booking-id {
    user-select: all;
    cursor: copy;
  }
  .saving-container {
    position: absolute;
    bottom: 5px;
    right: -25px;
  }
  .spinner {
    content: "";
    border-radius: 50%;
    border-top: 2px solid hsl(var(--p));
    border-right: 2px solid transparent;
    animation-name: spinning;
    animation-duration: 1.2s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    opacity: 1;
    transition: all 0.2s;
    width: 15px;
    height: 15px;
  }
  .spinner.white {
    border-top: 2px solid hsl(var(--b2));
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
