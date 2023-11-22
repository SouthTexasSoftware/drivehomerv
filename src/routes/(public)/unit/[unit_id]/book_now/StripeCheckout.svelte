<script lang="ts">
  import { onMount } from "svelte";

  export let paymentIntentKey: string;

  let stripe: any;

  function initializeStripe() {
    //@ts-ignore
    stripe = new window.Stripe(
      "pk_test_51MfwcCH21MZiaJun12tPhH4CVsJwb43haLWeAwnFHS5l3Mn50pBBYJ3c6ez0pD7soycvq685vAoHEztZEWz6sLy700wayewzKl"
    );

    console.log(paymentIntentKey);

    const appearance = { theme: "stripe" };
    let elements = stripe.elements({
      appearance,
      clientSecret: paymentIntentKey,
    });

    const paymentElementOptions = {
      layout: "tabs",
      fields: {
        billingDetails: {
          name: "never",
          email: "never",
          phone: "never",
        },
      },
    };

    const paymentElement = elements.create("payment", paymentElementOptions);
    paymentElement.mount("#payment-element");
  }
</script>

<svelte:head>
  <script src="https://js.stripe.com/v3/" on:load={initializeStripe}></script>
</svelte:head>

<form id="payment-form">
  <div id="payment-element">
    <!--Stripe.js injects the Payment Element-->
  </div>
  <button id="submit">
    <div class="spinner hidden" id="spinner" />
    <span id="button-text">Pay now</span>
  </button>
  <div id="payment-message" class="hidden" />
</form>

<style>
  #payment-element {
    margin: 25px;
  }
</style>
