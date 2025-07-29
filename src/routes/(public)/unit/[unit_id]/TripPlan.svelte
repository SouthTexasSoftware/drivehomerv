<script lang="ts">
  import { bookingStore } from "$lib/stores";
  import { firebaseStore } from "$lib/new_stores/firebaseStore";
  import type { Unit, Booking } from "$lib/types";
  import Calendar from "./Calendar.svelte";
  import TempFeatureList from "./TempFeatureList.svelte";
  import ReserveButton from "./ReserveButton.svelte";
  import { createEventDispatcher, onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { newUUID } from "$lib/helpers";
  import { Timestamp, doc, setDoc } from "firebase/firestore";
  import { fade, slide } from "svelte/transition";

  export let unitObject: Unit;
  export let showRequest: boolean;

  let dispatch = createEventDispatcher();
  let screenWidth: number;
  let selectedTripLength: number = 0;
  let pickup_dropoff_price_addition = 0;

  let loadingBookingRecap = false;

  let winterSpecial = false;
  let originalPrice = 0;
  let additionalFeesTotal = 0;
  let nightlyRateSum = 0;
  let totalBookingPrice = 0;

  function handleNewCalendarSelection(event: CustomEvent) {
    if (event.detail.reset) {
      selectedTripLength = 0;
      return;
    }
    // calculate trip length prior to performing updates to the cost variables
    let differenceInTime =
      event.detail.end.getTime() - event.detail.start.getTime();
    let differenceInDays = differenceInTime / (1000 * 3600 * 24);

    selectedTripLength = Math.round(differenceInDays);

    nightlyRateSum =
      parseInt(unitObject.information.rates_and_fees.pricing.base_rental_fee) *
      selectedTripLength;

    let service_fee = parseInt(
      unitObject.information.rates_and_fees.pricing.service_fee
    );

    let damage_protection =
      parseInt(
        unitObject.information.rates_and_fees.pricing.damage_protection
      ) * selectedTripLength;

    let sales_tax =
      (parseInt(unitObject.information.rates_and_fees.pricing.sales_tax) /
        100) *
      nightlyRateSum;

    var added_line_items = 0;

    // pickup dropoff gets added into added_line_items if there
    // this also picks up delivery/pickup charges if theyve been added.
    pickup_dropoff_price_addition = 0;
    if (event.detail.pickup) {
      if (event.detail.pickup.price > 0) {
        pickup_dropoff_price_addition += event.detail.pickup.price;
      }
      if (event.detail.dropoff.price > 0) {
        pickup_dropoff_price_addition += event.detail.dropoff.price;
      }

      if (!$bookingStore.additional_line_items) {
        $bookingStore.additional_line_items = {};
      }

      $bookingStore.additional_line_items["Early/Late Request"] = {
        value: pickup_dropoff_price_addition,
        type: "add",
      };

      if (pickup_dropoff_price_addition == 0) {
        if ($bookingStore.additional_line_items["Early/Late Request"]) {
          delete $bookingStore.additional_line_items["Early/Late Request"];
        }
      }
    }

    if ($bookingStore.additional_line_items) {
      let additional_line_items = Object.values(
        $bookingStore.additional_line_items
      ).forEach((data) => {
        if (data.type == "add") {
          added_line_items += data.value;
        } else {
          added_line_items -= data.value;
        }
      });
    }

    // console.log($bookingStore.additional_line_items);

    totalBookingPrice = parseFloat(
      (
        nightlyRateSum +
        service_fee +
        damage_protection +
        sales_tax +
        added_line_items
      ).toFixed(2)
    );

    // always set orignal price at this point
    originalPrice = structuredClone(totalBookingPrice);

    // handle the winter special - which will modify the total price if necessary
    // if (totalBookingPrice > 1895) {
    //   if (selectedTripLength < 22) {
    //     winterSpecial = true;
    //     totalBookingPrice = 1895;

    //     // manage additional line item
    //     if (!$bookingStore.additional_line_items) {
    //       $bookingStore.additional_line_items = {};
    //     }

    //     $bookingStore.additional_line_items["Winter Special"] = {
    //       value: originalPrice - totalBookingPrice,
    //       type: "subtract",
    //     };
    //   }
    // } else {
    //   winterSpecial = false;
    //   if ($bookingStore.additional_line_items) {
    //     if ($bookingStore.additional_line_items["Winter Special"]) {
    //       delete $bookingStore.additional_line_items["Winter Special"];
    //     }
    //   }
    // }

    bookingStore.update((store) => {
      store.pickup_dropoff_price_addition = pickup_dropoff_price_addition;

      store.total_price = totalBookingPrice;
      store.original_price = originalPrice;

      (store.price_per_night = parseFloat(
        unitObject.information.rates_and_fees.pricing.base_rental_fee
      )),
        (store.trip_length = selectedTripLength);
      store.nightly_rate_sum = nightlyRateSum;
      store.service_fee = parseFloat(
        unitObject.information.rates_and_fees.pricing.service_fee
      );
      store.damage_protection =
        parseFloat(
          unitObject.information.rates_and_fees.pricing.damage_protection
        ) * selectedTripLength;

      let sales_tax_percentage =
        parseFloat(unitObject.information.rates_and_fees.pricing.sales_tax) /
        100;
      let sales_tax_unrounded = sales_tax_percentage * store.nightly_rate_sum;
      store.sales_tax = parseFloat(sales_tax_unrounded.toFixed(2));

      return store;
    });
  }

  async function bookNowRequested() {
    if (loadingBookingRecap) return;
    loadingBookingRecap = true;

    await new Promise((resolve) => setTimeout(resolve, 200));

    // CREATE CUSTOMER ID if not already available
    if (!$bookingStore.customer) {
      let newCustomerId = newUUID();
      $bookingStore.customer = newCustomerId;
    } else {
      // console.log("previous customer ID found");
    }

    // CREATE BOOKING ID and SUBMIT TO FIREBASE
    let newBookingID = newUUID();
    $bookingStore.id = newBookingID;
    $bookingStore.confirmed = false;
    $bookingStore.in_checkout = true;
    $bookingStore.created = Timestamp.now();
    $bookingStore.created_by = "Customer";
    $bookingStore.pickup_location =
      unitObject.information.bullet_points.summary.pickup_location;

    //@ts-ignore
    let docRef = doc(
      $firebaseStore.db,
      "units",
      $bookingStore.unit_id,
      "bookings",
      $bookingStore.id
    );

    $bookingStore.document_reference = docRef;

    await setDoc(docRef, $bookingStore);

    let currentUrl = $page.url.href;

    setTimeout(() => {
      goto(currentUrl + "/book_now?id=" + docRef.id);
      loadingBookingRecap = false;
    }, 300);
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
        <p>Damage Protection & Roadside Assistance</p>
        {#if selectedTripLength == 0}
          <p>$0</p>
        {:else}
          <p>${$bookingStore.damage_protection}</p>
        {/if}
      </div>
      <div class="row fee">
        <p>Sales Tax</p>
        {#if selectedTripLength == 0}
          <p>$0</p>
        {:else}
          <p>${$bookingStore.sales_tax?.toFixed(2)}</p>
        {/if}
      </div>
      {#if $bookingStore.additional_line_items}
        {#each Object.keys($bookingStore.additional_line_items) as item_name}
          <div class="row fee">
            <p>{item_name}</p>
            <p>
              {#if $bookingStore.additional_line_items[item_name].type == "subtract"}
                -
              {/if}
              ${$bookingStore.additional_line_items[item_name].value}
            </p>
          </div>
        {/each}
      {/if}
      {#if winterSpecial == false}
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
            <p>${totalBookingPrice.toFixed(2)}</p>
          {/if}
        </div>
      {:else}
        <div class="banner winter">
          <div class="row fee miles-included">
            <p>Miles included</p>
            <p>Unlimited</p>
          </div>
        </div>
        <div class="bar" />
        <div class="row total">
          <p class="winter-special">Total</p>
          {#if selectedTripLength == 0}
            <p>Select Dates</p>
          {:else}
            <p class="winter-special price">${totalBookingPrice}</p>
            <p class="strikethrough">${originalPrice}</p>
          {/if}
        </div>
      {/if}

      {#if screenWidth > 500}
        {#if !selectedTripLength}
          <button class="reserve-button"><p>SELECT DATES</p></button>
        {:else}
          <button class="reserve-button" on:click={bookNowRequested}
            ><p>
              {#if loadingBookingRecap}
                <div class="spinner" />
              {:else}
                BOOK NOW
              {/if}
            </p></button
          >
        {/if}
      {/if}
    </div>

    <div class="col calendar">
      {#if unitObject.bookings != undefined}
        <Calendar
          {unitObject}
          {loadingBookingRecap}
          on:selection={(e) => handleNewCalendarSelection(e)}
        />
      {/if}
    </div>
  </section>

  {#if screenWidth < 500}
    <ReserveButton
      {showRequest}
      {selectedTripLength}
      on:showModal={bookNowRequested}
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
  .banner.winter {
    background-color: #d3e3f7;
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
    height: 40px;
  }
  .reserve-button p {
    font-family: font-light;
  }

  .winter-special {
    color: #3c618b;
  }
  .winter-special.price {
    margin-left: auto;
    margin-right: 10px;
  }
  .strikethrough {
    text-decoration: line-through;
    font-family: font-light;
  }
  .spinner {
    content: "";
    border-radius: 50%;
    border-top: 2px solid hsl(var(--b1));
    border-right: 2px solid transparent;
    animation-name: spinning;
    animation-duration: 1s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    opacity: 1;
    transition: all 0.2s;
    width: 20px;
    height: 20px;
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

  @media (max-width: 500px) {
    .col {
      margin: 20px 25px;
    }
    .reserve-button {
      padding: 12px 0;
    }
    .trip-plan-container {
      background-color: transparent;
    }
  }

  @media (min-width: 500px) and (max-width: 1000px) {
  }

  @media (min-width: 1000px) {
  }

  /* max-width setpoint at 1800px */
</style>
