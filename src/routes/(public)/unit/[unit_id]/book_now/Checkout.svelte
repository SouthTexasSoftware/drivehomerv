<script lang="ts">
  import type { Unit } from "$lib/types";
  import { bookingStore, firebaseStore } from "$lib/stores";
  import ArrowIcon from "./zIconArrow.svelte";
  import { enhance } from "$app/forms";
  import { createEventDispatcher, onMount } from "svelte";
  import { page } from "$app/stores";
  import { doc, setDoc, updateDoc } from "firebase/firestore";
  import { get } from "svelte/store";
  import { fly } from "svelte/transition";
  import { DateTime } from "@easepick/bundle";

  export let unitObject: Unit;
  let paymentIntentLoading = true;
  let stripe: any;
  let elements: any;
  let submittingPayment = false;
  let paymentError = false;
  let errorText = "Payment Error Placeholder";

  let dispatch = createEventDispatcher();

  //   onMount(generatePaymentIntent);

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
    stripe = new window.Stripe(
      "pk_test_51MfwcCH21MZiaJun12tPhH4CVsJwb43haLWeAwnFHS5l3Mn50pBBYJ3c6ez0pD7soycvq685vAoHEztZEWz6sLy700wayewzKl"
    );

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
    console.log("requesting new payment intent key");

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

    bookingStore.update((storeData) => {
      //@ts-ignore
      storeData.payment_intent = serverResponse.payment_intent;

      storeData.receipt_date_string = new DateTime().format("MMM-DD-YYYY");

      delete storeData.customerObject;

      return storeData;
    });

    await setDoc($bookingStore.document_reference, $bookingStore);

    return serverResponse.client_secret;
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
          >${$bookingStore.total_price} &#8226; PAY NOW</span
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
    box-shadow: 0px 1px 1px rgba(0, 0, 0, 0.03), 0px 3px 6px rgba(0, 0, 0, 0.02);
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
</style>
