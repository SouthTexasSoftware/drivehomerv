<script lang="ts">
  import type { Booking } from "$lib/types";
  import * as easepickPkg from '@easepick/bundle';
  const {easepick , RangePlugin, LockPlugin, DateTime} = easepickPkg;
  import type { ComponentType } from "svelte";
  import Agreement from "./Agreement.svelte";
  const svelteComponents = import.meta.glob("./*.svelte");

  export let bookingObject: Booking;

  let AgreementVersion: ComponentType;
  // this finds the associated Legacy version based on the saved version at signing... in a vite/svelte friendly way
  if (bookingObject.agreement_details?.version) {
    for (const path in svelteComponents) {
      if (path.includes(bookingObject.agreement_details?.version.toString())) {
        // fancy lookig , but basically the key:value pair is a filename paired with an <Promise>import() function. weird to me.
        svelteComponents[path]().then((component) => {
          //@ts-ignore because it doesn't technically know this will be a svelte component.
          AgreementVersion = component.default;
        });
      }
    }
  }

  let timeStamp = new DateTime(
    bookingObject.agreement_details?.date,
    "MMM-DD-YYYY"
  );

  let timeString = timeStamp.toDateString();
</script>

<div class="agreement-container">
  <div class="agreement-document">
    <div class="agreement-title">Drive Home RV, LLC | Rental Agreement</div>
    <!-- contains information from the booking in a header-->
    <div class="booking-details">
      <p>Rental Unit: {bookingObject.unit_name}</p>
      <p>
        Delivery Date/Time: {bookingObject.start}, {bookingObject.pickup_time}
      </p>
      <p>
        Pick-up Date/Time: {bookingObject.end}, {bookingObject.dropoff_time}
      </p>
      <p>
        Renter Name: {bookingObject.customerObject?.first_name}
        {bookingObject.customerObject?.last_name}
      </p>
    </div>

    {#if AgreementVersion}
      <svelte:component this={AgreementVersion} />
    {/if}
  </div>
  <!-- <div class="divider wide" />
  <form method="POST" name="contact-form" id="contact-form">
    <div class="signature-captured">
      This form was electronically signed on {timeString}.
    </div>
    <div class="row sign">
      <div class="input-wrapper name">
        <p class="label">Renter Name</p>
        <p class="input-data name">{bookingObject.agreement_details?.name}</p>
      </div>
      <div class="input-wrapper date">
        <p class="label">Date Signed</p>
        <p class="input-data date">{bookingObject.agreement_details?.date}</p>
      </div>
    </div>
    <div class="row check">
      <div class="input-wrapper check">
        <input type="checkbox" required name="checkbox" checked />
        <p class="label check">I have read and agree to all of the above.</p>
      </div>
    </div>
  </form> -->
</div>

<style>
  .agreement-container {
    display: flex;
    flex-direction: column;
  }
  .agreement-document {
    height: 400px;
    width: 100%;
    display: flex;
    flex-direction: column;
    border-radius: 10px;
    border: 1px solid var(--b2);
    padding: 15px;
    overflow-y: scroll;
  }
  .agreement-title {
    font-family: Arial, Helvetica, sans-serif;
    align-self: center;
  }
  .booking-details {
    margin: 15px 0;
  }
  .booking-details p {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 16px;
    font-weight: bold;
  }
  form {
    pointer-events: none;
    background-color: #fbfbfb;
    filter: opacity(0.6);
    transition: all 1s;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding-bottom: 30px;
    border-radius: 10px;
  }

  .row {
    display: flex;
    width: 80%;
  }
  .row.check {
    margin-top: 15px;
  }
  .input-wrapper.name {
    flex-grow: 1;
  }

  .input-wrapper.check {
    display: flex;
    align-items: center;
    flex-grow: 1;
  }
  .label.check {
    margin: 0;
    padding: 0;
    margin-left: 5px;
  }
  .label {
    font-family: cms-semibold;
    font-size: 14px;
    margin-bottom: 0;
    padding-bottom: 0;
  }
  input {
    border-radius: 5px;
    border: 1px solid var(--b3);
    padding: 3px 10px;
    margin-top: 0;
  }
  .input-data {
    padding: 3px 10px;
    border-radius: 5px;
    border: 1px solid var(--b3);
  }
  .input-data.name {
    width: 75%;
  }
  .input-data.date {
    width: 120%;
  }
  .signature-captured {
    font-size: 12px;
    color: var(--p);
    margin-top: -15px;
    margin-bottom: 15px;
  }

  @media (max-width: 700px) {
    .row {
      flex-direction: column;
    }
    .input-data.date {
      width: 50%;
    }
    .input-wrapper.check {
      margin: 10px 0;
      align-items: flex-start;
    }
    .input-wrapper.check input {
      margin-top: 3px;
    }
  }
</style>
