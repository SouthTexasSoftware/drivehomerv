<script lang="ts">
  import { beforeNavigate } from "$app/navigation";
  import { page, updated } from "$app/stores";
  import { bookingStore, firebaseStore } from "$lib/stores";
  import type { Booking, Customer, Unit } from "$lib/types";
  import { getMonthString, getDayString } from "$lib/helpers";
  import {
    Timestamp,
    arrayUnion,
    collection,
    doc,
    setDoc,
    updateDoc,
  } from "firebase/firestore";
  import { beforeUpdate } from "svelte";
  import { fade } from "svelte/transition";

  export let bookingObject: Booking | undefined;
  export let unitObject: Unit;

  let priceInputElement: HTMLInputElement;
  let timerOn = false;
  let saving = false;
  let saved = false;

  let generatingPaymentLink = false;

  let tripStartLabel = "Departure";
  let tripEndLabel = "Return";

  let bookingsSubcollectionRef = collection(
    $firebaseStore.db,
    "units",
    $page.params.unit_id,
    "bookings"
  );

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

  function formatPhoneNumber(phoneNumberString: string) {
    var cleaned = ("" + phoneNumberString).replace(/\D/g, "");
    var match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return "(" + match[1] + ") " + match[2] + "-" + match[3];
    }
    return phoneNumberString;
  }

  // used when a booking is created manually.
  // will: call createPaymentIntent to api, and generate the client secret and paymentIntent id;
  // attach paymentIntent to booking and update our DB
  // attach payment_link to booking to show in CMS
  async function generatePaymentLink() {
    if (generatingPaymentLink) return;
    generatingPaymentLink = true;

    // booking is created already attach the object to the store
    if (bookingObject) {
      bookingStore.set(bookingObject);
    } else {
      return;
    }
    // stripe customer will be created prior too
    let requestIntentKey = await fetch("/api/stripe/createPaymentIntent", {
      method: "POST",
      body: JSON.stringify($bookingStore),
      headers: {
        "Content-Type": "application/json",
      },
    });

    let serverResponse = await requestIntentKey.json();
    if (serverResponse.error) {
      console.error(serverResponse.code);
      return "error";
    }

    // format = $page.url.origin + "/unit/" + unit_id + "book_now" + ?payment_intent=___ + &payment_intent_client_secret=___
    let generatedLink =
      $page.url.origin +
      "/unit/" +
      $bookingStore.unit_id +
      "/book_now?payment_intent=" +
      serverResponse.payment_intent.id +
      "&payment_intent_client_secret=" +
      serverResponse.payment_intent.client_secret;

    bookingStore.update((storeData) => {
      //@ts-ignore
      storeData.payment_intent = serverResponse.payment_intent;
      storeData.payment_link = generatedLink;

      return storeData;
    });

    $bookingStore.updated = Timestamp.now();

    //@ts-ignore
    await setDoc($bookingStore.document_reference, $bookingStore);

    generatingPaymentLink = false;
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
        <p>No Customer Created</p>
      {/if}
    </div>

    <div class="double-row">
      <div class="section">
        <div class="section-label">
          Created
          {#if bookingObject.created_by}
            <p class="label-status mini">{bookingObject.created_by}</p>
          {/if}
        </div>
        <p class="small-date">
          {getDayString(bookingObject.created)}, {getMonthString(
            bookingObject.created
          )}
        </p>
      </div>
      <div class="section">
        <div class="section-label">Updated</div>
        <p class="small-date">
          {getDayString(bookingObject.updated)}, {getMonthString(
            bookingObject.updated
          )}
        </p>
      </div>
    </div>
    <div class="section">
      <div class="section-label">
        Payment
        {#if bookingObject.payment_intent}
          {#if bookingObject.payment_intent.status == "succeeded"}
            <p class="label-status">Paid</p>
          {:else}
            <a href={bookingObject.payment_link} class="label-status pending">Link To Pay</a>
          {/if}
        {:else}
          <button on:click={generatePaymentLink} class="label-status generate">
            {#if generatingPaymentLink}
              <div class="spinner white" />
            {:else}
              Generate payment link
            {/if}</button
          >
        {/if}
      </div>
      <p>
        {#if bookingObject.customerObject?.stripe_id}
          <a
            class="stripe-link"
            href="https://dashboard.stripe.com/customers/{bookingObject
              .customerObject?.stripe_id}"
            target="_blank">STRIPE CUSTOMER</a
          >
        {/if}
      </p>
      <p>
        {#if bookingObject.payment_intent}
          <a
            class="stripe-link"
            href="https://dashboard.stripe.com/payments/{bookingObject
              .payment_intent.id}"
            target="_blank">STRIPE PAYMENT OBJECT</a
          >
        {/if}
      </p>
    </div>

    <div class="section">
      <div class="section-label">
        Rental Agreement
        {#if bookingObject.agreement_status}
          {#if bookingObject.agreement_status == "queued"}
            <p class="label-status pending">Queued</p>
          {:else if bookingObject.agreement_status == "sent"}
            <p class="label-status pending">Sent</p>
          {:else if bookingObject.agreement_status == "accepted"}
            <p class="label-status">Accepted</p>
          {/if}
        {/if}
      </div>
      <p>
        {#if bookingObject.agreement_link}
          <a
            class="agreement-link"
            href={bookingObject.agreement_link}
            target="_blank">Agreement Link</a
          >
        {/if}
        Coming Soon
      </p>
    </div>

    <p class="section-label individual">Pricing Table</p>
    <div class="double-row pricing">
      <div class="section pricing last">
        {#if bookingObject.total_price}
          <p>
            ${bookingObject.price_per_night} x {bookingObject.trip_length} nights
          </p>
          <p>Service Fee</p>
          <p>Taxes & Insurance</p>
          <p>Pickup/Dropoff Fee</p>
          <p class="total-price">Total</p>
        {:else}
          <p>Not Added</p>
        {/if}
      </div>
      <div class="section pricing right">
        {#if bookingObject.total_price}
          <p>${bookingObject.total_price}</p>
          <p>${bookingObject.service_fee}</p>
          <p>${bookingObject.taxes_and_fees}</p>
          <p>${bookingObject.pickup_dropoff_price_addition}</p>
          <p class="total-price">${bookingObject.total_price}</p>
        {:else}
          <p>Not Added</p>
        {/if}
      </div>
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
    width: 150px;
    min-height: 130px;
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
    margin-top: 5px;
  }
  .time {
    font-family: cms-light;
    font-size: 14px;
    margin-top: auto;
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
  .section.pricing {
    padding: 15px 0;
  }
  .section.pricing * {
    font-size: 14px;
  }
  .section.pricing.right * {
    text-align: right;
  }
  .section.last {
    margin-bottom: 50%;
  }
  .section-label {
    font-family: cms-semibold;
    align-self: flex-start;
    font-size: 14px;
    display: flex;
    margin-left: 0 !important;
    position: relative;
  }
  .section-label.individual {
    padding-left: 15px;
    margin-top: 15px;
  }
  .label-status {
    position: absolute;
    left: 110%;
    top: -5px;
    background-color: hsl(var(--su));
    color: hsl(var(--b1));
    font-family: cms-semibold;
    font-size: 12px;
    padding: 0px 13px;
    border-radius: 15px;
  }
  .label-status.mini {
    font-size: 10px;
    background-color: #dfdfdf;
  }
  .label-status.pending {
    background-color: hsl(var(--wa));
    width: 150px;
    text-align: center;
  }
  .label-status.generate {
    background-color: hsl(var(--er));
    width: 180px;
    text-align: center;
    height: 18px;
  }
  .small-date {
    font-size: 13px;
  }
  .double-row {
    display: flex;
    width: 100%;
  }
  .double-row.pricing {
    justify-content: center;
    border-top: 1px solid var(--cms-boxShadow);
    border-bottom: 1px solid var(--cms-boxShadow);
  }
  .double-row .section {
    width: 50%;
  }
  .double-row.pricing .section {
    width: 50%;
  }
  .double-row.pricing .section.right {
    width: 30%;
  }
  .stripe-link {
    font-family: cms-semibold;
    border-radius: 4px;
    background-color: #625afa;
    color: white;
    font-size: 13px;
    padding: 3px 10px;
    margin-left: 15px;
    height: 15px;
  }
  .agreement-link {
    font-family: cms-semibold;
    border-radius: 4px;
    background-color: hsl(var(--p));
    color: white;
    font-size: 13px;
    padding: 3px 10px;
    margin-left: 15px;
    height: 15px;
  }
  .total-price {
    color: hsl(var(--p));
    font-family: cms-semibold;
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
    font-size: 18px;
  }

  select {
    font-size: 16px;
    font-family: cms-regular;
    padding: 6px 15px;
    border-radius: 4px;
    outline: none;
    width: 200px;
    height: 40px;
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
    width: 10px;
    height: 10px;
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
