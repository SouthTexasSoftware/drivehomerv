<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { unitStore, bookingTimerStore } from "$lib/stores";
  import { setBookingTimer } from "$lib/helpers";
  import type { Booking } from "$lib/types";
  import { onMount } from "svelte";
  import ReviewIcon from "./zIconReview.svelte";
  import SectionWrapper from "../../book_now/SectionWrapper.svelte";
  import ReestablishingSession from "../../book_now/ReestablishingSession.svelte";
  import Agreement from "./Agreement.svelte";
  import { dev } from "$app/environment";
  import { arrayUnion, updateDoc, deleteDoc } from "firebase/firestore";
  import { DateTime } from "@easepick/bundle";
  import AgreementSigned from "./AgreementSigned.svelte";
  import BackToCheckout from "./BackToCheckout.svelte";

  let bookingObject: Booking;
  let agreementSigned = false;

  let redirectToCheckout = false;

  if ($page.url.searchParams.get("ref") == "checkout") {
    redirectToCheckout = true;
  }

  onMount(populateBookingObject);

  // await the unitStore load and then populate the bookingObject
  function populateBookingObject() {
    if (!$unitStore.isPopulated) {
      setTimeout(populateBookingObject, 200);
      return;
    }

    let unit = $unitStore.getUnit($page.params.unit_id);

    let booking = unit?.bookings?.find((booking) => {
      if (booking.id == $page.params.booking_id) {
        return booking;
      }
    });

    if (!booking) {
      console.error("Booking ID does not match");
      return;
    }

    bookingObject = booking;

    if (bookingObject.agreement_details) {
      if (booking.agreement_signed) {
        agreementSigned = true;
      }
    }

    // handle timer situation if still in checkout
    if (bookingObject.in_checkout) {
      if ($bookingTimerStore.timer) {
        $bookingTimerStore.timer.reset();
      } else {
        setBookingTimer(bookingObject.id, 10, cancelBooking);
      }
    }

    agreementViewedListener();
  }

  function agreementViewedListener() {
    if (!dev) {
      let todaysDate = new DateTime();
      let formatDate = todaysDate.format("MMM-DD-YYYY");
      //@ts-ignore
      updateDoc(bookingObject.document_reference, {
        agreement_viewed: arrayUnion(formatDate),
      });
    }
  }

  async function cancelBooking() {
    if (bookingObject) {
      // call to firebase to delete doc
      //@ts-ignore
      await deleteDoc(bookingObject.document_reference);
    }

    $bookingTimerStore.timer?.stop();
    // return to unitView
    await goto("/unit/" + bookingObject.unit_id);
  }
</script>

<div class="agreement-container">
  <div class="progress-header">
    <div class="header-block">
      <ReviewIcon />
    </div>
  </div>
  {#if !bookingObject}
    <SectionWrapper title={"Spinning Our Wheels"}
      ><ReestablishingSession /></SectionWrapper
    >
  {:else if agreementSigned}
    <SectionWrapper title={"Rental Agreement: Accepted"}>
      <BackToCheckout {bookingObject} />
      <AgreementSigned {bookingObject} />
    </SectionWrapper>
  {:else}
    <SectionWrapper title={"Terms and Conditions"}>
      <BackToCheckout {bookingObject} />
      <Agreement {bookingObject} />
    </SectionWrapper>
  {/if}
</div>

<style>
  .agreement-container {
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

  @media (max-width: 700px) {
  }
</style>
