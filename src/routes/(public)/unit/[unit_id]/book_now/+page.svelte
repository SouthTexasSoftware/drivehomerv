<script lang="ts">
  import { navigating, page } from "$app/stores";
  import { bookingStore, firebaseStore, unitStore } from "$lib/stores";
  import type { Booking, Customer, Unit } from "lib/types";
  import { onMount } from "svelte";
  import { beforeNavigate, goto } from "$app/navigation";
  import ContactIcon from "./zIconContact.svelte";
  import CheckoutIcon from "./zIconCheckout.svelte";
  import Contact from "./Contact.svelte";
  import Checkout from "./Checkout.svelte";
  import ThankYou from "./ThankYou.svelte";
  import SectionWrapper from "./SectionWrapper.svelte";
  import type { PageData } from "./$types";
  import ReestablishingSession from "./ReestablishingSession.svelte";
  import {
    Timestamp,
    deleteDoc,
    doc,
    getDoc,
    setDoc,
    updateDoc,
  } from "firebase/firestore";

  let unitObject: Unit | undefined = undefined;
  let unitLoadingCounter = 0;
  let currentViewNumber = 0;
  let timerStatement = "Holding Dates:";
  let timerValue = "5:00";
  let timer = 1000 * 60 * 5;
  let cancellingBooking = false;
  let confirmingPaymentNavigation = false;

  export let data: PageData;

  console.log("server loaded data = ", data);

  let viewArray = ["contact", "connecting", "checkout", "thankyou"];

  let flowStates = {
    onContact: true,
    onCheckout: false,
    onThankyou: false,

    onConnecting: false,
    transitionDirection: "movingRight",

    agreementAccepted: false,
  };

  let tripStartLabel = "Departure";
  let tripEndLabel = "Return";

  //intercept a redirect and hit pause for now.
  async function checkForRedirect(): Promise<boolean> {
    if (data.paymentIntentObject) {
      console.log("redirect detected", data);
      confirmingPaymentNavigation = true;
      setFlowStateView(1);
      checkUnitSelected();
      recreateSession(); // this may take some time.. but we cannot await here

      return true;
    }
    return false;
  }

  async function recreateSession() {
    if (!unitObject) {
      setTimeout(recreateSession, 200);
      return;
    }
    console.log("recreating session");
    let bookingId = data.paymentIntentObject?.metadata.cms_booking_id;
    let unitId = $page.params.unit_id;
    if (bookingId) {
      let bookingRef = doc(
        $firebaseStore.db,
        "units",
        unitId,
        "bookings",
        bookingId
      );
      let oldBookingObject = await getDoc(bookingRef);
      if (oldBookingObject.exists()) {
        bookingStore.set(oldBookingObject.data() as Booking);

        // retrieve customer information - needed to send out email confirmation if succeeded
        let customerId = $bookingStore.customer;
        //@ts-ignore
        let customerRef = doc($firebaseStore.db, "customers", customerId);
        let customerObject = await getDoc(customerRef);
        if (customerObject.exists()) {
          $bookingStore.customerObject = customerObject.data() as Customer;
        }

        //@ts-ignore
        $bookingStore.payment_intent = data.paymentIntentObject;
        //@ts-ignore
        if ($bookingStore.payment_intent?.status == "succeeded") {
          $bookingStore.status = "paid";
          // send confirmation emails..
          // check to see if this has already been triggered????
          if (!$bookingStore.confirmation_email_sent) {
            let sendConfirmationEmail = await fetch(
              "/api/email/customerConfirmation",
              {
                method: "POST",
                body: JSON.stringify($bookingStore),
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            let serverResponse = await sendConfirmationEmail.json();
            if (serverResponse.error) {
              console.error(serverResponse.code);
              return "error";
            }

            $bookingStore.confirmation_email_sent = true;
            $bookingStore.confirmed = true;
            $bookingStore.updated = Timestamp.now();

            await setDoc($bookingStore.document_reference, $bookingStore);
          } else {
            console.log("records show confirmation email already sent");
          }
          // show thank you page, AFTER we receive confirmation of the email...
          setFlowStateView(3);
          return;
        }

        // this hits on redirects and internally generated payment links
        // if this payment link exists, the booking was made internally
        if ($bookingStore.payment_link) {
          timerStatement = "Timer Disabled: ";
          timerValue = "Internal Booking";
        } else {
          timerIntervalHandler();
        }

        setFlowStateView(2);
        return;
      }
    }
  }

  onMount(async () => {
    if (await checkForRedirect()) return;

    if (!$bookingStore) {
      //redirect back to unit booking page
      let unitBookingPage = $page.url.pathname;
      unitBookingPage = unitBookingPage.slice(0, -9);
      goto(unitBookingPage);
    }
    if ($bookingStore.total_price == 0) {
      //redirect back to unit booking page
      let unitBookingPage = $page.url.pathname;
      unitBookingPage = unitBookingPage.slice(0, -9);
      goto(unitBookingPage);
    }
    checkUnitSelected();
    timerIntervalHandler();
  });

  function checkUnitSelected() {
    unitLoadingCounter += 1;
    if ($unitStore.isPopulated) {
      unitObject = $unitStore.getUnit($page.params.unit_id);
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
        flowStates.onConnecting = false;

        break;
      case "checkout":
        flowStates.onContact = false;
        flowStates.onCheckout = true;
        flowStates.onThankyou = false;
        flowStates.onConnecting = false;
        timer = 5 * 60 * 1000;
        break;

      case "connecting":
        flowStates.onContact = false;
        flowStates.onCheckout = false;
        flowStates.onThankyou = false;
        flowStates.onConnecting = true;

        break;
      case "thankyou":
        flowStates.onContact = false;
        flowStates.onCheckout = false;
        flowStates.onThankyou = true;
        flowStates.onConnecting = false;

        break;
    }

    currentViewNumber = viewNumber;
  }

  function timerIntervalHandler() {
    setInterval(() => {
      timer -= 1000;
      updateTimerValue(timer);
      if (timer == 0) {
        // deleteBooking and return to unit view
        cancelBooking();
      }
    }, 1000);
  }

  function updateTimerValue(timerNum: number) {
    var minutes = Math.floor(timerNum / 60000);
    var seconds = Math.floor((timerNum % 60000) / 1000);

    timerValue =
      seconds == 60
        ? minutes + 1 + ":00"
        : minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
  }

  async function cancelBooking() {
    // call to firebase to delete doc
    await deleteDoc($bookingStore.document_reference);
    // return to unitView
    let removeBookNow = $page.url.href.slice(0, -8);
    cancellingBooking = true;
    await goto(removeBookNow);
  }

  beforeNavigate(async (navigation) => {
    console.log(navigation);
    if (cancellingBooking) {
      return;
    }
    if (confirmingPaymentNavigation) {
      return;
    }
    if (navigation.type == "link") {
      console.log("going to another link");
      await cancelBooking();
    }
    if (navigation.type == "popstate") {
      console.log("trying to return a page");
      await cancelBooking();
    }
    if (navigation.type == "leave") {
      console.log("leaving site");
      await cancelBooking();
    }
    navigation.cancel();
  });
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
        {timerStatement}
        {timerValue}
        ><Contact
          {unitObject}
          on:complete={() => setFlowStateView(2)}
        /></SectionWrapper
      >
    {/if}
    {#if flowStates.onCheckout}
      <SectionWrapper
        title={"Checkout"}
        transitionDirection={flowStates.transitionDirection}
        {timerStatement}
        {timerValue}
        ><Checkout
          {unitObject}
          on:back={() => setFlowStateView(0)}
          on:paymentStart={() => {
            confirmingPaymentNavigation = true;
          }}
        /></SectionWrapper
      >
    {/if}
    {#if flowStates.onThankyou}
      <SectionWrapper
        title={"Thank You!"}
        transitionDirection={flowStates.transitionDirection}
        ><ThankYou /></SectionWrapper
      >
    {/if}
    {#if flowStates.onConnecting}
      <SectionWrapper
        title={"Spinning Our Wheels"}
        transitionDirection={flowStates.transitionDirection}
        ><ReestablishingSession /></SectionWrapper
      >
    {/if}
  {:else}
    <div class="loading-unit-container"><div class="spinner" /></div>
  {/if}
</div>

<!-- <div class="temp-button">
  <button on:click={() => setFlowStateView(0)}>Review</button>
  <button on:click={() => setFlowStateView(1)}>Checkout</button>
  <button on:click={() => setFlowStateView(3)}>Thank You</button>
  <button on:click={() => setFlowStateView(2)}>Connecting</button>
</div> -->

<style>
  .book-now-container {
    display: flex;
    width: 100%;
    flex-direction: column;
    align-items: center;
    position: relative;
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
