<script lang="ts">
  import { customerStore } from "$lib/stores";
  import type { Unit, Booking } from "$lib/types";
  import Calendar from "./Calendar.svelte";
  import TempFeatureList from "./TempFeatureList.svelte";
  import ReserveButton from "./ReserveButton.svelte";
  import { createEventDispatcher, onMount } from "svelte";

  export let unitObject: Unit;
  export let showRequest: boolean;

  let dispatch = createEventDispatcher();
  let screenWidth: number;
  let selectedTripLength: number = 0;
  let pickup_dropoff_price_addition = 0;

  $: nightlyRateSum =
    unitObject.information.rates_and_fees.pricing.base_rental_fee *
    selectedTripLength;
  $: additionalFeesTotal = sumOfFees(selectedTripLength); // must pass in the dynamic value to rerun
  $: totalBookingPrice = nightlyRateSum + additionalFeesTotal;

  $: {
    customerStore.update((storeData) => {
      storeData.total_price = totalBookingPrice;
      return storeData;
    });
  }

  function sumOfFees(tripLength: number) {
    let sum = 0;
    let service_fee = 0;

    let taxes_and_insurance =
      unitObject.information.rates_and_fees.pricing.taxes_and_insurance *
      tripLength;

    if (tripLength != 0) {
      service_fee = unitObject.information.rates_and_fees.pricing.service_fee;
    }

    sum =
      //@ts-ignore
      parseInt(taxes_and_insurance) +
      //@ts-ignore
      parseInt(service_fee) +
      //@ts-ignore
      parseInt(pickup_dropoff_price_addition);

    return sum;
  }

  function handleNewCalendarSelection(event: CustomEvent) {
    pickup_dropoff_price_addition = 0;
    if (event.detail.pickup) {
      if (event.detail.pickup.price > 0) {
        pickup_dropoff_price_addition += event.detail.pickup.price;
      }
      if (event.detail.dropoff.price > 0) {
        pickup_dropoff_price_addition += event.detail.dropoff.price;
      }
    }

    customerStore.update((storeData) => {
      storeData.pickup_dropoff_price_addition = pickup_dropoff_price_addition;

      return storeData;
    });

    let differenceInTime =
      event.detail.end.getTime() - event.detail.start.getTime();
    let differenceInDays = differenceInTime / (1000 * 3600 * 24);

    selectedTripLength = differenceInDays;
    console.log(selectedTripLength);

    additionalFeesTotal = sumOfFees(selectedTripLength);

    // handle pickup_dropoff modifiers...
    console.log($customerStore);
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
        <p id="pickup-location">
          {unitObject.information.bullet_points.summary.pickup_location} Pickup Location
        </p>
      </div>
      <TempFeatureList {unitObject} />
      <div class="row fee nightly-rate">
        <p>
          ${unitObject.information.rates_and_fees.pricing.base_rental_fee} x {selectedTripLength}
          Nights
        </p>
        <p>
          ${nightlyRateSum}
        </p>
      </div>

      <div class="row fee">
        <p>Service Fee</p>
        {#if selectedTripLength == 0}
          <p>$0</p>
        {:else}
          <p>${unitObject.information.rates_and_fees.pricing.service_fee}</p>
        {/if}
      </div>
      <div class="row fee">
        <p>Taxes & Insurance</p>
        <p>
          ${unitObject.information.rates_and_fees.pricing.taxes_and_insurance *
            selectedTripLength}
        </p>
      </div>

      <div class="row fee mi-per-night">
        <p>100 mi per night ($0.00/night)</p>
        <p class="green-highlight">FREE</p>
      </div>
      <div class="banner">
        <div class="row fee miles-included">
          <p>Miles included</p>
          <p>{100 * selectedTripLength} mi</p>
        </div>
        <p class="row fee small-note">
          Additional miles: ${unitObject.information.rates_and_fees.pricing
            .mileage_overage}/mi
        </p>
      </div>
      <div class="bar" />
      <div class="row total">
        <p>Total</p>
        {#if selectedTripLength == 0}
          <p>Select Dates</p>
        {:else}
          <p>${totalBookingPrice}</p>
        {/if}
      </div>
      {#if screenWidth > 500}
        {#if !selectedTripLength}
          <button class="reserve-button"><p>SELECT DATES</p></button>
        {:else}
          <button class="reserve-button" on:click={dispatchShowModal}
            ><p>REQUEST NOW</p></button
          >
        {/if}
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
    <ReserveButton
      {showRequest}
      {selectedTripLength}
      on:showModal={dispatchShowModal}
    />
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
    padding-bottom: 15px;
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
