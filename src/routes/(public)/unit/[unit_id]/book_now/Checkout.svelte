<script lang="ts">
  import type { Unit } from "$lib/types";
  import { bookingStore, firebaseStore } from "$lib/stores";
  import ArrowIcon from "./zIconArrow.svelte";
  import { enhance } from "$app/forms";
  import { createEventDispatcher, onMount } from "svelte";
  import { page } from "$app/stores";
  import { Timestamp, doc, setDoc, updateDoc } from "firebase/firestore";
  import { get } from "svelte/store";
  import { fly } from "svelte/transition";
  import { DateTime } from "@easepick/bundle";
  import { PUBLIC_STR_KEY } from "$env/static/public";

  export let unitObject: Unit;
  let paymentIntentLoading = true;
  let stripe: any;
  let elements: any;
  let submittingPayment = false;
  let paymentError = false;
  let errorText = "Payment Error Placeholder";

  let dispatch = createEventDispatcher();

  onMount(() => {
    window.scrollTo({
      left: 0,
      top: 0,
      behavior: "smooth",
    });
  });

  async function initializeStripe() {
    let client_secret = "error";

    if ($bookingStore.payment_intent) {
      //@ts-ignore
      client_secret = $bookingStore.payment_intent.client_secret;
    } else {
      if ($bookingStore.customer) {
        client_secret = await generatePaymentIntent($bookingStore.customer);
      }
    }

    if (client_secret == "error") {
      return;
    }

    //@ts-ignore
    stripe = new window.Stripe(PUBLIC_STR_KEY);

    const appearance = {
      theme: "stripe",
      variables: {
        colorPrimary: "#ae2623",
      },
    };
    elements = stripe.elements({
      appearance,
      clientSecret: client_secret,
    });

    const paymentElementOptions = {
      layout: "tabs",
    };

    paymentIntentLoading = false;

    const paymentElement = elements.create("payment", paymentElementOptions);
    paymentElement.mount("#payment-element");
  }

  async function generatePaymentIntent(customerId: string) {
    // console.log("requesting new payment intent key");

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
      storeData.receipt_date_string = new DateTime().format("MMM-DD-YYYY");

      return storeData;
    });

    $bookingStore.updated = Timestamp.now();

    //@ts-ignore
    await setDoc($bookingStore.document_reference, $bookingStore);

    return serverResponse.client_secret;
  }

  function doubleBookingFound() {
    if (unitObject.bookings) {
      let currentBookingStartDate = new DateTime(
        $bookingStore.start,
        "MMM-DD-YYYY"
      );
      let currentBookingEndDate = new DateTime(
        $bookingStore.end,
        "MMM-DD-YYYY"
      );

      for (let booking of unitObject.bookings) {
        if (booking.confirmed) {
          let prevBookingStartDate = new DateTime(booking.start, "MMM-DD-YYYY");
          let prevBookingEndDate = new DateTime(booking.end, "MMM-DD-YYYY");

          if (
            currentBookingStartDate.isAfter(prevBookingStartDate) &&
            currentBookingStartDate.isBefore(prevBookingEndDate)
          ) {
            // current booking starts in the middle of another
            // console.log("current booking starts in the middle of another");
            return true;
          }
          if (
            currentBookingEndDate.isAfter(prevBookingStartDate) &&
            currentBookingEndDate.isBefore(prevBookingEndDate)
          ) {
            // current booking ends in the middle of another
            // console.log("current booking ends in the middle of another");
            return true;
          }
          if (
            currentBookingStartDate.isAfter(prevBookingStartDate) &&
            currentBookingEndDate.isBefore(prevBookingEndDate)
          ) {
            // current booking lies in the middle of another
            // console.log("current booking lies in the middle of another");
            return true;
          }
        }
      }
      return false;
    }
  }
</script>

<svelte:head>
  <script src="https://js.stripe.com/v3/" on:load={initializeStripe}></script>
</svelte:head>

<div class="checkout-container">
  {#if paymentIntentLoading}
    <div class="spinner" />
    <p class="secure-message">Establishing Secure Connection to Server</p>
  {/if}
  <form
    method="POST"
    id="payment-form"
    class:hidden={paymentIntentLoading}
    use:enhance={async ({ form, data, cancel }) => {
      if (submittingPayment) return;
      submittingPayment = true;

      dispatch("paymentStart", true);

      const paymentResponse = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: $page.url.href,
        },
      });

      if (paymentResponse.error) {
        console.log(paymentResponse.error);
        errorText = "Payment Unsuccessful: " + paymentResponse.error.message;
        paymentError = true;
      }

      cancel();
      submittingPayment = false;
    }}
  >
    <div id="payment-element">
      <!--Stripe.js injects the Payment Element-->
    </div>
    <button id="submit">
      {#if submittingPayment}
        <div class="spinner small" id="spinner" />
      {:else}
        <span id="button-text"
          >${$bookingStore.total_price?.toFixed(2)} &#8226; PAY NOW</span
        >
      {/if}
    </button>
    <div class="payment-message">
      {#if paymentError}
        <p class="error-text" in:fly={{ y: 30 }}>{errorText}</p>
      {/if}
    </div>
  </form>

  <button
    class="left-arrow"
    on:click={() => {
      dispatch("back", true);
    }}><ArrowIcon active={true} /></button
  >
  <div class="agreement-statement">
    {#if $bookingStore.agreement_signed}
      <p>
        Thank you for reviewing the <a
          class="agreement-link"
          href="/unit/{unitObject.id}/agreement/{$bookingStore.id}"
          >Terms and Conditions</a
        >.
      </p>
    {:else}
      <p>
        By making this payment, you agree to review and sign the
        <a
          class="agreement-link"
          href="/unit/{unitObject.id}/agreement/{$bookingStore.id}?ref=checkout"
          >Rental Agreement</a
        >
        prior to your Booking.
      </p>
    {/if}
  </div>
</div>

<style>
  .checkout-container {
    display: flex;
    flex-direction: column;
    min-height: 400px;
  }
  .secure-message {
    align-self: center;
    font-family: font-light;
    font-size: 10px;
    margin-top: 15px;
  }
  .hidden {
    display: none;
  }
  #submit {
    width: 100%;
    margin-top: 25px;
    border-radius: 5px;
    border: 1px solid hsl(var(--p));
    color: hsl(var(--p));
    height: 47px;
    box-shadow:
      0px 1px 1px rgba(0, 0, 0, 0.03),
      0px 3px 6px rgba(0, 0, 0, 0.02);
  }
  #button-text {
    font-family: font-medium;
  }
  .payment-message {
    width: 100%;
    display: flex;
    justify-content: center;
  }
  .error-text {
    font-family: font-bold;
    color: hsl(var(--er));
  }
  .agreement-statement {
    margin-top: 10px;
  }
  .agreement-statement p {
    font-size: 13px;
    font-family: cms-regular;
    text-align: center;
  }
  .agreement-link {
    font-family: cms-semibold;
    border-bottom: 1px solid hsl(var(--p));
  }
  .left-arrow {
    position: absolute;
    left: 15px;
    bottom: 10px;
    transform: rotate(180deg);
  }
  .spinner {
    content: "";
    border-radius: 50%;
    border-top: 3px solid hsl(var(--p));
    border-right: 3px solid transparent;
    animation-name: spinning;
    animation-duration: 1.5s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    opacity: 1;
    transition: all 0.2s;
    width: 100px;
    height: 100px;
    margin: auto;
  }
  .spinner.small {
    width: 20px;
    height: 20px;
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
    #submit {
      margin-bottom: 0px;
    }
    .checkout-container {
      padding: 0 20px;
    }
    .agreement-statement {
      margin-bottom: 40px;
    }
  }

  @media (min-width: 700px) and (max-width: 1200px) {
  }

  @media (min-width: 1200px) and (max-width: 1800px) {
  }
  @media (min-width: 1800px) {
  }
</style>
