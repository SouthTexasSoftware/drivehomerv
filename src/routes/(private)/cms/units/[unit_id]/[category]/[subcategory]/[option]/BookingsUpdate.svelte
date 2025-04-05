<script lang="ts">
  import type { Booking, Customer, Unit } from "$lib/types";
  import PopupCalendarInputNoBookings from "$lib/components/PopupCalendarInputNoBookings.svelte";
  import { afterUpdate, createEventDispatcher, onMount } from "svelte";
  import { Timestamp, doc, serverTimestamp, setDoc } from "firebase/firestore";
  import { DateTime } from "@easepick/bundle";
  import { bookingStore, firebaseStore } from "$lib/stores";
  import { page } from "$app/stores";

  export let unitObject: Unit;

  let savingBooking = false;
  let firstNameInput: HTMLInputElement;
  let lastNameInput: HTMLInputElement;
  let emailInput: HTMLInputElement;
  let phoneInput: HTMLInputElement;

  let dispatch = createEventDispatcher();

  let datesValidationError = false;
  let customerValidationError = false;

  let pickup_dropoff_price_addition = 0;
  let selectedTripLength: number = 0;

  $: nightlyRateSum =
    parseInt(unitObject.information.rates_and_fees.pricing.base_rental_fee) *
    selectedTripLength;
  $: additionalFeesTotal = sumOfFees(selectedTripLength); // must pass in the dynamic value to rerun
  $: totalBookingPrice = nightlyRateSum + additionalFeesTotal;

  // load booking data from unitObject?
  let filteredBookings = unitObject.bookings?.filter((booking) => {
    if (booking.id == $page.params.subcategory) {
      return booking;
    }
  });

  delete filteredBookings![0].document_reference;
  let bookingCopy = structuredClone(filteredBookings![0]);

  //@ts-ignore
  bookingStore.set(bookingCopy);
  updateBookingDates({ start: $bookingStore.start, end: $bookingStore.end });

  onMount(() => {
    //@ts-ignore
    firstNameInput.value = $bookingStore.customerObject?.first_name;
    //@ts-ignore
    lastNameInput.value = $bookingStore.customerObject?.last_name;
    //@ts-ignore
    emailInput.value = $bookingStore.customerObject?.email;
    //@ts-ignore
    phoneInput.value = $bookingStore.customerObject?.phone;
  });

  // listener/dynamic update when the calendar get's changed
  $: {
    bookingStore.update((store) => {
      store.total_price = totalBookingPrice;
      store.price_per_night = parseInt(
        unitObject.information.rates_and_fees.pricing.base_rental_fee
      );
      (store.nightly_rate_sum = nightlyRateSum),
        (store.service_fee = parseInt(
          unitObject.information.rates_and_fees.pricing.service_fee
        ));
      store.damage_protection_per_night = parseInt(
        unitObject.information.rates_and_fees.pricing.damage_protection
      );
      store.damage_protection =
        parseInt(
          unitObject.information.rates_and_fees.pricing.damage_protection
        ) * selectedTripLength;
      store.sales_tax =
        (parseInt(unitObject.information.rates_and_fees.pricing.sales_tax) /
          100) *
        store.nightly_rate_sum;

      // console.log("store dynamically updated", store);
      return store;
    });
  }

  function updateBookingDates(detail: { start: string; end: string }) {
    if ($bookingStore) {
      $bookingStore.start = detail.start;
      $bookingStore.end = detail.end;

      let startDate = new DateTime(detail.start, "MMM-DD-YYYY");
      let endDate = new DateTime(detail.end, "MMM-DD-YYYY");

      $bookingStore.unix_start = Math.ceil(startDate.getTime() / 1000);
      $bookingStore.unix_end = Math.ceil(endDate.getTime() / 1000);

      let differenceInTime = endDate.getTime() - startDate.getTime();
      let differenceInDays = differenceInTime / (1000 * 3600 * 24);

      selectedTripLength = differenceInDays;
      $bookingStore.trip_length = selectedTripLength;
    }
  }

  function updateBookingPickupDropoff(detail: { key: string; value: string }) {
    if (detail.key == "pickup_time") {
      $bookingStore.pickup_time = detail.value;
    }
    if (detail.key == "dropoff_time") {
      $bookingStore.dropoff_time = detail.value;
    }
  }

  function sumOfFees(tripLength: number) {
    let sum = 0;
    let service_fee = 0;
    let sales_tax = 0;
    let damage_protection = 0;

    if (tripLength != 0) {
      service_fee = parseInt(
        unitObject.information.rates_and_fees.pricing.service_fee
      );

      sales_tax =
        (parseInt(unitObject.information.rates_and_fees.pricing.sales_tax) /
          100) *
        $bookingStore.nightly_rate_sum!;

      damage_protection =
        parseInt(
          unitObject.information.rates_and_fees.pricing.damage_protection
        ) * tripLength;
    }

    sum = service_fee + sales_tax + damage_protection;

    return sum;
  }

  // create customer / and save booking... attach customerObject to booking
  // create customer in stripe as well..

  async function updateBooking() {
    if (savingBooking) return;
    savingBooking = true;
    datesValidationError = false;
    customerValidationError = false;

    if ($bookingStore.start == "" || $bookingStore.end == "") {
      datesValidationError = true;
      savingBooking = false;
      return;
    }

    if (
      firstNameInput.value == "" ||
      lastNameInput.value == "" ||
      emailInput.value == ""
    ) {
      customerValidationError = true;
      savingBooking = false;
      return;
    }

    //create a 'customerObject'
    let updatedCustomer = {
      id: $bookingStore.customer,
      email: emailInput.value,
      first_name: firstNameInput.value,
      last_name: lastNameInput.value,
      phone: phoneInput.value,
      stripe_id: $bookingStore.customerObject?.stripe_id,
    } as Customer;

    // send to stripe to establish a stripe_id
    let updateStripeCustomer = await fetch("/api/stripe/updateCustomer", {
      method: "POST",
      body: JSON.stringify(updatedCustomer),
      headers: {
        "Content-Type": "application/json",
      },
    });
    let serverResponse = await updateStripeCustomer.json();
    if (serverResponse.error) {
      console.error(serverResponse.code);
      // return "error";
    }

    // update booking
    bookingStore.update((store) => {
      store.customerObject = updatedCustomer;
      return store;
    });

    // add customer to our DB
    let newCustomerDocRef = doc(
      $firebaseStore.db,
      "customers",
      updatedCustomer.id
    );
    await setDoc(newCustomerDocRef, updatedCustomer);

    // add booking to our DB
    //@ts-ignore
    let bookingDocRef = doc(
      $firebaseStore.db,
      "units",
      $bookingStore.unit_id,
      "bookings",
      $bookingStore.id
    );

    $bookingStore.updated = serverTimestamp() as Timestamp;
    $bookingStore.document_reference = bookingDocRef;

    await setDoc(bookingDocRef, $bookingStore);

    savingBooking = false;
    dispatch("save", $bookingStore);
  }

  function newUUID(): string {
    // Alphanumeric characters
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let autoId = "";
    for (let i = 0; i < 20; i++) {
      autoId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return autoId;
  }
</script>

<div class="update-booking-option-container">
  <div class="container-header">
    <p class="option-title">Update Booking ID:{$bookingStore.id}</p>
    <button
      class="cancel-creation"
      on:click={() => {
        dispatch("cancel", true);
      }}
      ><svg
        width="25px"
        height="25px"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g id="SVGRepo_iconCarrier">
          <path
            d="M14.5 9.50002L9.5 14.5M9.49998 9.5L14.5 14.5"
            stroke="#262626"
            stroke-width="1.5"
            stroke-linecap="round"
          />
          <path
            d="M22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C21.5093 4.43821 21.8356 5.80655 21.9449 8"
            stroke="#262626"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </g>
      </svg></button
    >
  </div>
  <div class="content-container">
    <div class="section">
      <div class="section-label">Unit</div>
      <p>{unitObject.name}</p>
    </div>
    <div class="section">
      <PopupCalendarInputNoBookings
        selectedTripStart={$bookingStore.start}
        selectedTripEnd={$bookingStore.end}
        on:selection={(event) => {
          updateBookingDates(event.detail);
        }}
      />
      {#if datesValidationError}
        <p class="validation-error">No Dates Selected</p>
      {/if}
    </div>
    <div class="double-row">
      <div class="section">
        <div class="section-label">Departure/Delivery</div>
        <select
          name="pickup"
          id="pickup"
          on:change={({ currentTarget }) => {
            let key = "pickup_time";
            let value = currentTarget.value;
            updateBookingPickupDropoff({ key: key, value: value });
          }}
        >
          <option value=" 1 pm" selected={$bookingStore.pickup_time == " 1 pm"}
            >1 pm</option
          >
          <option value=" 2 pm" selected={$bookingStore.pickup_time == " 2 pm"}
            >2 pm</option
          >
          <option value=" 3 pm" selected={$bookingStore.pickup_time == " 3 pm"}
            >3 pm</option
          >
          <option value=" 4 pm" selected={$bookingStore.pickup_time == " 4 pm"}
            >4 pm</option
          >
          <option value=" 5 pm" selected={$bookingStore.pickup_time == " 5 pm"}
            >5 pm</option
          >
          <option value=" 6 pm" selected={$bookingStore.pickup_time == " 6 pm"}
            >6 pm</option
          >
        </select>
      </div>
      <div class="section">
        <div class="section-label">Return/Pick-up</div>
        <select
          name="dropoff"
          id="dropoff"
          on:change={({ currentTarget }) => {
            let key = "dropoff_time";
            let value = currentTarget.value;
            updateBookingPickupDropoff({ key: key, value: value });
          }}
        >
          <option value="10 am" selected={$bookingStore.dropoff_time == "10 am"}
            >10 am</option
          >
          <option value="11 am" selected={$bookingStore.dropoff_time == "11 am"}
            >11 am</option
          >
          <option value="12 pm" selected={$bookingStore.dropoff_time == "12 pm"}
            >12 pm</option
          >
          <option value=" 1 pm" selected={$bookingStore.dropoff_time == " 1 pm"}
            >1 pm</option
          >
          <option value=" 2 pm" selected={$bookingStore.dropoff_time == " 2 pm"}
            >2 pm</option
          >
          <option value=" 3 pm" selected={$bookingStore.dropoff_time == " 3 pm"}
            >3 pm</option
          >
        </select>
      </div>
    </div>
    <p class="section-label individual">Pricing Table</p>
    <div class="pricing-table">
      {#if $bookingStore.total_price}
        <div class="line-item">
          <p>
            ${$bookingStore.price_per_night} x {$bookingStore.trip_length} nights
          </p>
          <p>${$bookingStore.nightly_rate_sum}</p>
        </div>
        <div class="line-item">
          <p>Service Fee</p>
          <p>${$bookingStore.service_fee}</p>
        </div>
        <div class="line-item">
          <p>Dmg Prot. & Assistance</p>
          <p>${$bookingStore.damage_protection || "null"}</p>
        </div>
        <div class="line-item">
          <p>Sales Tax</p>
          <p>${$bookingStore.sales_tax || $bookingStore.taxes_and_fees}</p>
        </div>
        {#if $bookingStore.additional_line_items}
          {#each Object.keys($bookingStore.additional_line_items) as item_name}
            <div class="line-item">
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

        <div class="line-item-total-bar"></div>
        <div class="line-item total">
          <p>Total</p>
          <p>${$bookingStore.total_price}</p>
        </div>
      {:else}
        <div class="line-item">
          <p>Not</p>
          <p>Added</p>
        </div>
      {/if}
    </div>

    <div class="section">
      <div class="section-label">Customer Info</div>
      {#if customerValidationError}
        <p class="validation-error customer">Customer Details Required</p>
      {/if}
      <input
        type="text"
        placeholder="First Name*"
        name="first-name"
        bind:this={firstNameInput}
        required
      />
      <input
        class="margin-top"
        type="text"
        placeholder="Last Name*"
        name="last-name"
        bind:this={lastNameInput}
        required
      />
      <input
        class="margin-top"
        type="email"
        placeholder="Email*"
        name="email"
        bind:this={emailInput}
        required
      />
      <input
        class="margin-top"
        type="tel"
        placeholder="Phone"
        name="phone"
        bind:this={phoneInput}
      />
    </div>
    <div class="bar" />
    <div class="section">
      <button id="save-button" on:click={updateBooking}>
        {#if savingBooking}
          <div class="spinner" />
        {:else}
          UPDATE
        {/if}
      </button>
    </div>
  </div>
</div>

<style>
  .update-booking-option-container {
    background-color: hsl(var(--b1));
    margin: 25px;
    margin-bottom: 25px;
    border-radius: 4px;
    box-shadow: 0 1px 3px var(--cms-boxShadow);
    width: 100%;
    display: flex;
    flex-direction: column;
    width: 450px;
    max-height: 90%;
    margin-bottom: auto;
  }
  .container-header {
    display: flex;
    justify-content: space-between;
    padding: 8px 10px;
    background-color: #eee;
    border-radius: 4px 4px 0 0;
    position: relative;
  }
  .content-container {
    overflow-y: scroll;
  }
  .option-title {
    font-family: cms-semibold;
    font-size: 14px;
    line-height: 25px;
    color: var(--cms-text);
  }
  .cancel-creation {
    font-family: cms-light;
    width: 25px;
    border-radius: 4px;
    font-size: 25px;
    height: 25px;
    line-height: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .validation-error {
    color: hsl(var(--er));
    font-family: monospace;
    font-size: 12px;
    position: absolute;
    left: 67px;
    top: 16px;
  }
  .validation-error.customer {
    left: 125px;
  }
  .section {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 15px;
    position: relative;
  }
  .section p {
    font-family: cms-regular;
  }

  .section-label {
    font-family: cms-semibold;
    align-self: flex-start;
    font-size: 14px;
    display: flex;
  }
  .section-label.individual {
    padding-left: 15px;
    margin-top: 15px;
  }

  .double-row {
    display: flex;
    width: 100%;
  }
  .double-row .section {
    width: 50%;
  }
  .double-row .section {
    width: 50%;
  }
  .pricing-table {
    margin: 0 auto;
    min-width: 80%;
    width: 60%;
    margin-top: 15px;
    margin-bottom: 100px;
  }
  .line-item {
    display: flex;
    justify-content: space-between;
    width: 100%;
    padding: 0 20px;
    position: relative;
  }
  .line-item p {
    font-size: 16px;
  }
  .line-item-total-bar {
    width: 100%;
    padding: 0 20px;
    height: 1px;
    background-color: var(--cms-boxShadow);
  }
  .line-item.total p {
    font-family: cms-semibold;
  }
  select {
    padding: 10px;
    background-color: hsl(var(--b1));
    border: solid 1px hsl(var(--b3));
    border-radius: 4px;
    width: 85%;
    margin-right: 10%;
  }
  select option {
    font-family: cms-regular;
  }
  input {
    border: 1px solid var(--cms-boxShadow);
    font-size: 16px;
    font-family: cms-regular;
    padding: 6px 15px;
    border-radius: 4px;
    outline: none;
    width: 250px;
  }

  input.margin-top {
    margin-top: 20px;
  }
  .bar {
    content: "";
    width: 80%;
    height: 1px;
    background-color: hsl(var(--b2));
    margin: 15px auto;
  }
  #save-button {
    background-color: hsl(var(--p));
    font-family: cms-light;
    color: hsl(var(--b1));
    width: 80%;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    font-size: 20px;
    margin: 0px auto 20px;
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
    margin: 0 auto;
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
    .update-booking-option-container {
      position: absolute;
      left: 0;
      width: 90vw;
      max-height: 74%;
    }
    select,
    input {
      height: 40px;
    }
  }
</style>
