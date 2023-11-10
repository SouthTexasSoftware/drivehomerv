<script lang="ts">
  import type { Unit } from "$lib/types";
  import { customerStore, firebaseStore } from "$lib/stores";
  import ArrowIcon from "./zIconArrow.svelte";
  import { enhance } from "$app/forms";
  import { createEventDispatcher, onMount } from "svelte";
  import { page } from "$app/stores";
  import { doc, updateDoc } from "firebase/firestore";
  import { get } from "svelte/store";

  export let unitObject: Unit;
  let paymentIntentLoading = true;
  let stripe: any;
  let elements: any;
  let submittingPayment = false;

  let dispatch = createEventDispatcher();

  //   onMount(generatePaymentIntent);

  async function initializeStripe() {
    let client_secret = "error";

    let currentCustomer = $customerStore.customerObject;

    //@ts-ignore
    if (currentCustomer.paymentIntent != undefined) {
      //@ts-ignore
      client_secret = currentCustomer.paymentIntent;
      console.log("previous intent found");
    } else {
      //@ts-ignore
      client_secret = await generatePaymentIntent(currentCustomer.id);
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
      body: JSON.stringify($customerStore),
      headers: {
        "Content-Type": "application/json",
      },
    });

    let serverResponse = await requestIntentKey.json();
    if (serverResponse.error) {
      console.error(serverResponse.code);
      return "error";
    }

    customerStore.update((storeData) => {
      //@ts-ignore
      storeData.customerObject.paymentIntent = serverResponse.client_secret;

      return storeData;
    });

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

      if (paymentResponse.error.type === "card_error" || paymentResponse.error.type === "validation_error") {
        console.log(paymentResponse.error.message);
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
        <span id="button-text">PAY NOW</span>
      {/if}
    </button>
    <div id="payment-message" class="hidden" />
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
