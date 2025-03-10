<script lang="ts">
  import { enhance } from "$app/forms";
  import type { Booking } from "$lib/types";
  import AgreementVerbiageLatest from "./AgreementVerbiageLatest.svelte";
  import { DateTime } from "@easepick/bundle";
  import { Timestamp, doc, updateDoc } from "firebase/firestore";
  import { firebaseStore } from "$lib/stores";

  export let bookingObject: Booking;
  let scrollContainer: HTMLElement;
  let scrollCompleted = false;
  let formSubmitting = false;

  function scrollListener() {
    if (
      scrollContainer.scrollHeight -
        scrollContainer.scrollTop -
        scrollContainer.clientHeight <
      1
    ) {
      scrollCompleted = true;
    }
  }
</script>

<div class="agreement-container">
  <div
    class="agreement-document"
    bind:this={scrollContainer}
    on:scroll={scrollListener}
  >
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
    <!-- and then generic text down below-->
    <AgreementVerbiageLatest />
  </div>
  <div class="divider wide" />
  <form
    class:active={scrollCompleted}
    method="POST"
    name="contact-form"
    id="contact-form"
    use:enhance={async ({ form, data, cancel }) => {
      if (formSubmitting) {
        return;
      }
      // submit form data to firebase for storage, and then on to server to send notification email
      formSubmitting = true;

      let formObject = {};

      for (const [key, value] of data) {
        //@ts-ignore
        formObject[key] = value;
      }
      //@ts-ignore
      let newDate = new DateTime(formObject.date, "YYYY-MM-DD");
      let formattedDate = newDate.format("MMM-DD-YYYY");
      //@ts-ignore
      let acceptedBool = formObject.checkbox == "on" ? true : false;

      bookingObject.agreement_details = {
        //@ts-ignore
        name: formObject.name,
        date: formattedDate,
        accepted: acceptedBool,
        version: 2,
      };

      //@ts-ignore
      let bookingDoc = doc(
        $firebaseStore.db,
        "units",
        bookingObject.unit_id,
        "bookings",
        bookingObject.id
      );

      await updateDoc(bookingDoc, {
        agreement_details: bookingObject.agreement_details,
        agreement_signed: true,
        agreement_notification: true,
        updated: Timestamp.now(),
      });

      location.reload();

      cancel();

      formSubmitting = false;
    }}
  >
    <div class="row sign">
      <div class="input-wrapper name">
        <p class="label">Renter Name</p>
        <input type="text" required autocomplete="given-name" name="name" />
      </div>
      <div class="input-wrapper date">
        <p class="label">Today's Date</p>
        <input type="date" required name="date" />
      </div>
    </div>
    <div class="row check">
      <div class="input-wrapper check">
        <input type="checkbox" required name="checkbox" />
        <p class="label check">I have read and agree to all of the above.</p>
      </div>
      <div class="input-wrapper button">
        <button type="submit">
          {#if formSubmitting}
            <div class="spinner" />
          {:else}
            Submit
          {/if}
        </button>
      </div>
    </div>
  </form>
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
    border: 1px solid hsl(var(--b2));
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
    filter: opacity(0.3);
    transition: all 1s;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  form.active {
    pointer-events: all;
    filter: none;
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
  .input-wrapper.name input {
    width: 80%;
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
    border: 1px solid hsl(var(--b3));
    padding: 3px 10px;
    margin-top: 0;
  }
  button {
    font-family: cms-semibold;
    color: hsl(var(--b1));
    background-color: hsl(var(--p));
    border-radius: 5px;
    width: 100px;
    height: 30px;
    box-shadow: 0 1px 3px grey;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .spinner {
    content: "";
    border-radius: 50%;
    border-top: 2px solid hsl(var(--b1));
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

  @keyframes spinning {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  
  @media (max-width: 700px) {
    .row {
        flex-direction: column;
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
