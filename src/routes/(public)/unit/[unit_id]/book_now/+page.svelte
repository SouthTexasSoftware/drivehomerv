<script lang="ts">
  import { page } from "$app/stores";
  import { customerStore, unitStore } from "$lib/stores";
  import type { Unit } from "lib/types";
  import UnitCard from "../../../rentals/UnitCard.svelte";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import StripeCheckout from "./StripeCheckout.svelte";
  import ContactIcon from "./zIconContact.svelte";
  import CheckoutIcon from "./zIconCheckout.svelte";
  import Review from "./Contact.svelte";
  import Contact from "./Contact.svelte";
  import Checkout from "./Checkout.svelte";
  import ThankYou from "./ThankYou.svelte";
  import SectionWrapper from "./SectionWrapper.svelte";

  let unitObject: Unit | undefined = undefined;
  let unitLoadingCounter = 0;
  let paymentIntentKey: string;
  let currentViewNumber = 0;

  let viewArray = ["contact", "checkout", "thankyou"];

  let flowStates = {
    onContact: true,
    onCheckout: false,
    onThankyou: false,
    agreementAccepted: false,
    transitionDirection: "movingRight",
  };

  let tripStartLabel = "Departure";
  let tripEndLabel = "Return";

  onMount(() => {
    if (!$customerStore) {
      //redirect back to unit booking page
      let unitBookingPage = $page.url.pathname;
      unitBookingPage = unitBookingPage.slice(0, -9);
      // goto(unitBookingPage);
    }
    if ($customerStore.total_price == 0) {
      //redirect back to unit booking page
      let unitBookingPage = $page.url.pathname;
      unitBookingPage = unitBookingPage.slice(0, -9);
      // goto(unitBookingPage);
    }
    checkUnitSelected();
  });

  function checkUnitSelected() {
    unitLoadingCounter += 1;
    if ($unitStore.isPopulated) {
      unitObject = $unitStore.getUnit($page.params.unit_id);
      console.log($customerStore);
      console.log(unitObject);
      updateTripStartEndLabels();
      return;
    }

    if (unitLoadingCounter < 300) {
      setTimeout(checkUnitSelected, 200);
    } else {
      // unit store not populated in 1 minute
      //refresh page?
    }
  }

  function updateTripStartEndLabels() {
    if (unitObject) {
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
  }



  function setFlowStateView(viewNumber: number) {
    if (currentViewNumber < viewNumber) {
      flowStates.transitionDirection = "movingRight";
    } else {
      flowStates.transitionDirection = "movingLeft";
    }
    let view = viewArray[viewNumber];

    switch (view) {
      case "contact":
        flowStates.onContact = true;
        flowStates.onCheckout = false;
        flowStates.onThankyou = false;

        break;
      case "checkout":
        flowStates.onContact = false;
        flowStates.onCheckout = true;
        flowStates.onThankyou = false;

        break;
      case "thankyou":
        flowStates.onContact = false;
        flowStates.onCheckout = false;
        flowStates.onThankyou = true;

        break;
    }

    currentViewNumber = viewNumber;
  }
</script>

<div class="book-now-container">
  <div class="progress-header">
    <div class="header-block">
      <ContactIcon active={flowStates.onContact} />
      <p class="block-label" class:active={flowStates.onContact} />
    </div>
    <div class="header-bar" />
    <div class="header-block">
      <CheckoutIcon active={flowStates.onCheckout} />
      <p class="block-label" class:active={flowStates.onCheckout} />
    </div>
  </div>
  {#if unitObject}
    {#if flowStates.onContact}
      <SectionWrapper
        title={"Booking Recap"}
        transitionDirection={flowStates.transitionDirection}
        ><Contact
          {unitObject}
          on:complete={() => setFlowStateView(1)}
        /></SectionWrapper
      >
    {/if}
    {#if flowStates.onCheckout}
      <SectionWrapper
        title={"Checkout"}
        transitionDirection={flowStates.transitionDirection}
        ><Checkout {unitObject} on:back={() => setFlowStateView(0)}/></SectionWrapper
      >
    {/if}
    {#if flowStates.onThankyou}
      <SectionWrapper
        title={"ThankYou"}
        transitionDirection={flowStates.transitionDirection}
        ><ThankYou /></SectionWrapper
      >
    {/if}
  {:else}
    <div class="loading-unit-container"><div class="spinner" /></div>
  {/if}
</div>

<div class="temp-button">
  <button on:click={() => setFlowStateView(0)}>Review</button>
  <button on:click={() => setFlowStateView(1)}>Checkout</button>
  <button on:click={() => setFlowStateView(2)}>Thank You</button>
</div>

<style>
  .book-now-container {
    display: flex;
    width: 100%;
    flex-direction: column;
    align-items: center;
  }
  .progress-header {
    display: flex;
    align-items: center;
  }
  .header-block {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
    width: 50px;
  }
  .block-label {
    font-family: font-regular;
    font-size: 10px;
    position: absolute;
    bottom: -15px;
    width: 100%;
    left: 0;
    text-align: center;
  }
  .block-label.active {
    color: hsl(var(--p));
  }
  .header-bar {
    margin: 0 15px;
    width: 100px;
    height: 1px;
    background-color: hsl(var(--b2));
  }

  section {
    box-shadow: 0px 1px 2px grey;
    border-radius: 2px;
    margin: 25px 0 50px;
    background-color: hsl(var(--b1));
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 600px;
    min-width: 400px;
    max-width: 500px;
  }
  .loading-unit-container {
    width: 100%;
    min-height: 700px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .spinner {
    content: "";
    border-radius: 50%;
    border-top: 3px solid hsl(var(--b1));
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
  @keyframes spinning {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 700px) {
    section {
      width: 90vw;
      min-height: 300px;
      padding-bottom: 25px;
      margin-top: 150px;
      padding: 50px;
    }
  }

  @media (min-width: 700px) and (max-width: 1200px) {
    section {
    }
  }

  @media (min-width: 1200px) and (max-width: 1800px) {
    section {
    }
  }
  @media (min-width: 1800px) {
    section {
    }
  }
</style>
