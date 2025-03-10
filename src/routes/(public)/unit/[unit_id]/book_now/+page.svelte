<script lang="ts">
  import { navigating, page } from "$app/stores";
  import {
    bookingStore,
    bookingTimerStore,
    firebaseStore,
    unitStore,
  } from "$lib/stores";
  import type { Booking, Customer, Unit } from "$lib/types";
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
  import { DateTime } from "@easepick/bundle";
  import { setBookingTimer } from "$lib/helpers";

  let unitObject: Unit | undefined = undefined;
  let unitLoadingCounter = 0;
  let currentViewNumber = 0;

  let cancellingBooking = false;
  let confirmingPaymentNavigation = false;

  let timerStatement = "Holding Dates:";
  let defaultTimerMinutes = 10;

  export let data: PageData;

  let viewArray = ["connecting", "contact", "checkout", "thankyou"];

  let flowStates = {
    onContact: false,
    onCheckout: false,
    onThankyou: false,

    onConnecting: true,
    transitionDirection: "movingRight",

    agreementAccepted: false,
  };

  let tripStartLabel = "Departure";
  let tripEndLabel = "Return";

  //intercept a redirect and hit pause for now.
  async function checkForRedirect(): Promise<boolean> {
    if (data.paymentIntentObject) {
      confirmingPaymentNavigation = true;
      setFlowStateView(0);
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
          $bookingStore.receipt_date_string = new DateTime().format(
            "MMM-DD-YYYY"
          );
          // send confirmation emails..
          // format sales_tax and total_price on bookingStore just for emails?
          let emailObject = stripMethods($bookingStore);

          // @ts-ignore
          emailObject.sales_tax = emailObject.sales_tax?.toFixed(2);
          // @ts-ignore
          emailObject.total_price = emailObject.total_price?.toFixed(2);

          // check to see if this has already been triggered????
          if (!$bookingStore.confirmation_email_sent) {
            let sendConfirmationEmail = await fetch(
              "/api/email/customerConfirmation",
              {
                method: "POST",
                body: JSON.stringify(emailObject),
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            let sendOwnerNewBooking = await fetch(
              "/api/email/ownerNewBooking",
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
              console.log(serverResponse);
              console.error(serverResponse.code);
              return "error";
            }

            $bookingStore.confirmation_email_sent = true;
            $bookingStore.confirmed = true;
            $bookingStore.updated = Timestamp.now();
            $bookingStore.in_checkout = false;

            $bookingStore.agreement_link =
              $page.url.origin +
              "/unit/" +
              $bookingStore.unit_id +
              "/agreement/" +
              $bookingStore.id;
            $bookingStore.agreement_notification = false;
            $bookingStore.agreement_signed = false;

            //@ts-ignore
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
        if ($bookingStore.created_by == "CMS") {
          timerStatement = "Timer Disabled: ";
          $bookingTimerStore.value = "Internal Booking";
        }

        if ($page.url.searchParams.get("state") == "checkout") {
          setTimeout(() => setFlowStateView(2), 1000);
        } else {
          setTimeout(() => setFlowStateView(1), 1000);
        }
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
      return;
    }

    if ($bookingStore.total_price == 0) {
      //redirect back to unit booking page
      let unitBookingPage = $page.url.pathname;
      unitBookingPage = unitBookingPage.slice(0, -9);
      goto(unitBookingPage);
    }
    checkUnitSelected();
    setFlowStateView(1);

    if (!$bookingTimerStore.timer) {
      setBookingTimer($bookingStore.id, defaultTimerMinutes, cancelBooking);
    }
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
        if ($bookingTimerStore.timer) {
          $bookingTimerStore.timer.reset();
        }
        break;
      case "checkout":
        flowStates.onContact = false;
        flowStates.onCheckout = true;
        flowStates.onThankyou = false;
        flowStates.onConnecting = false;
        if ($bookingTimerStore.timer) {
          $bookingTimerStore.timer.reset();
        }
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

  async function cancelBooking() {
    if ($bookingStore) {
      // call to firebase to delete doc
      //@ts-ignore
      await deleteDoc($bookingStore.document_reference);
    }

    $bookingTimerStore.timer?.stop();
    // return to unitView
    let unitBookingPage = $page.url.pathname;
    unitBookingPage = unitBookingPage.slice(0, -9);
    cancellingBooking = true;
    await goto(unitBookingPage);
  }

  beforeNavigate(async (navigation) => {
    if (cancellingBooking) {
      return;
    }
    if (confirmingPaymentNavigation) {
      return;
    }
    if (navigation.type == "link") {
      console.log("going to another link");
      if (navigation.to?.url.pathname.includes("agreement")) {
        if ($bookingTimerStore.timer) {
          $bookingTimerStore.timer.reset();
        }
        return;
      }
      await cancelBooking();
    }
    if (navigation.type == "popstate") {
      await cancelBooking();
    }
    if (navigation.type == "leave") {
      await cancelBooking();
    }
    // navigation.cancel();
  });

  const stripMethods = (obj: Booking) => {
    return Object.keys(obj).reduce((acc, key) => {
      // @ts-ignore
      if (typeof obj[key] !== "function") {
        // @ts-ignore
        acc[key] = obj[key];
      }
      return acc;
    }, {});
  };
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
        ><Checkout
          {unitObject}
          on:back={() => setFlowStateView(1)}
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
    .book-now-container {
      margin-top: 40px;
    }
  }

  @media (min-width: 700px) and (max-width: 1200px) {
  }

  @media (min-width: 1200px) and (max-width: 1800px) {
  }
  @media (min-width: 1800px) {
  }
</style>
