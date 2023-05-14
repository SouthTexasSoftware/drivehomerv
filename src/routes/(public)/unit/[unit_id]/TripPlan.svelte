<script lang="ts">
  import { bookingStore } from "$lib/stores";
  import type { Unit, Booking } from "$lib/types";
  import Calendar from "./Calendar.svelte";
  import TempFeatureList from "./TempFeatureList.svelte";
  import ReserveButton from "./ReserveButton.svelte";
  import { createEventDispatcher } from "svelte";

  export let unitObject: Unit;
  export let showRequest: boolean;

  let dispatch = createEventDispatcher();
  let screenWidth: number;
  let selectedTripLength: number = unitObject.min_booking_days;

  $: nightlyRateSum = unitObject.default_price * selectedTripLength;
  $: additionalFeesTotal = calculateAdditionalFeesSum(selectedTripLength);
  $: totalBookingPrice = nightlyRateSum + additionalFeesTotal;

  $: {
    bookingStore.update((storeData) => {
      storeData.total_price = totalBookingPrice;
      return storeData;
    });
  }

  function calculateAdditionalFeesSum(tripLength: number) {
    let sum = 0;

    unitObject.additional_fees?.forEach((fee) => {
      if (fee.per_day) {
        sum += fee.amount * tripLength;
      } else {
        sum += fee.amount;
      }
    });

    return sum;
  }

  function handleNewCalendarSelection(event: CustomEvent) {
    let differenceInTime =
      event.detail.end.getTime() - event.detail.start.getTime();
    let differenceInDays = differenceInTime / (1000 * 3600 * 24);

    selectedTripLength = differenceInDays;
  }

  function dispatchShowModal() {
    dispatch("showModal", true);
  }
</script>

<div class="trip-plan-container">
  <section class="col-container">
    <div class="col estimate">
      <div class="row stack location">
        <strong id="state">New York</strong>
        <p id="pickup-location">Modena Pickup Location</p>
      </div>
      <TempFeatureList {unitObject} />
      <div class="row fee nightly-rate">
        <p>
          ${unitObject.default_price} x {selectedTripLength} Nights
        </p>
        <p>
          ${nightlyRateSum}
        </p>
      </div>

      {#if unitObject.additional_fees}
        {#each unitObject.additional_fees as fee}
          <div class="row fee">
            <p>{fee.name}</p>
            {#if fee.per_day}
              <p>${fee.amount * selectedTripLength}</p>
            {:else}
              <p>${fee.amount}</p>
            {/if}
          </div>
        {/each}
      {/if}

      <div class="row fee mi-per-night">
        <p>100 mi per night ($0.00/night)</p>
        <p class="green-highlight">FREE</p>
      </div>
      <div class="banner">
        <div class="row fee miles-included">
          <p>Miles included</p>
          <p>{100 * selectedTripLength} mi</p>
        </div>
        <p class="row fee small-note">Additional miles: $0.58/mi</p>
      </div>
      <div class="bar" />
      <div class="row total">
        <p>Total</p>
        <p>${totalBookingPrice}</p>
      </div>
      {#if screenWidth > 500}
        <button class="reserve-button" on:click={dispatchShowModal}
          ><p>REQUEST NOW</p></button
        >
      {/if}
    </div>

    <div class="col calendar">
      {#if unitObject.bookings != undefined}
        <Calendar
          {unitObject}
          on:selection={(e) => handleNewCalendarSelection(e)}
        />
      {/if}
    </div>
  </section>

  {#if screenWidth < 500}
    <ReserveButton {showRequest} on:showModal={dispatchShowModal} />
  {/if}
</div>

<svelte:window bind:innerWidth={screenWidth} />

<style>
  .trip-plan-container {
    width: 100%;
    background-color: hsl(var(--b1));
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    position: relative;
    font-size: 16px;
  }
  .col-container {
    display: flex;
    flex-wrap: wrap-reverse;
    width: 100%;
    justify-content: space-evenly;
    height: 100%;
  }
  .col {
    flex-basis: 300px;
    flex-grow: 2;
    margin: auto 15px;
    display: flex;
    flex-direction: column;
    max-width: 450px;
  }
  .row {
    display: flex;
    justify-content: space-between;
    margin: 5px 0px;
    z-index: 1;
    /* left/right margin for the rows is set in .col */
  }
  .row.stack {
    flex-direction: column;
  }
  .row.stack.location {
    margin-bottom: 20px;
  }
  strong {
    font-size: 20px;
    color: hsl(var(--nf));
  }
  p#pickup-location {
    margin-top: -10px;
    padding-left: 10px;
  }

  .row.fee {
    color: hsl(var(--n));
    opacity: 0.8;
    font-size: 16px;
  }

  .green-highlight {
    color: hsl(var(--suc));
    font-family: font-light;
  }
  .banner {
    border-radius: 10px;
    background-color: hsl(var(--b2));
    padding: 4px 10px;
    margin-bottom: 10px;
    color: hsl(var(--b3));
  }
  .row.miles-included {
    font-size: 17px;
  }
  .row.fee.small-note {
    font-size: 13px;
    margin-top: -7px;
    margin-left: 5px;
    font-family: font-light;
  }

  .bar {
    content: "";
    width: 100%;
    height: 1px;
    background-color: hsl(var(--b2));
  }
  .row.total {
    color: hsl(var(--pf));
    font-size: 22px;
    margin-top: 10px;
  }
  .reserve-button {
    background-color: hsl(var(--p));
    border-radius: 3px;
    color: hsl(var(--b1));
    width: 100%;
    padding: 8px 0;
    margin-top: 25px;
  }
  .reserve-button p {
    font-family: font-light;
  }

  @media (max-width: 500px) {
    .col {
      margin: 0px 25px;
    }

    .reserve-button {
      padding: 12px 0;
    }
  }

  @media (min-width: 500px) and (max-width: 1000px) {
  }

  @media (min-width: 1000px) {
  }

  /* max-width setpoint at 1800px */
</style>
