<script lang="ts">
  import type { Booking, Customer, Unit } from "$lib/types";
  import PopupCalendarInputNoBookings from "$lib/components/PopupCalendarInputNoBookings.svelte";
  import { afterUpdate, createEventDispatcher } from "svelte";
  import { Timestamp, doc, serverTimestamp, setDoc } from "firebase/firestore";
  import { DateTime } from "@easepick/bundle";
  import { firebaseStore } from "$lib/stores";
  import BookingsPhotos from "./BookingsPhotos.svelte";

  export let unitObject: Unit;
  export let bookingObject: Booking;

  let savingBooking = false;
  let firstNameInput: HTMLInputElement;
  let lastNameInput: HTMLInputElement;
  let emailInput: HTMLInputElement;
  let phoneInput: HTMLInputElement;
  let passengersInput: HTMLInputElement;
  let priceInput: HTMLInputElement;
  let datesValidationError = false;
  let newBookingData: Booking | undefined;
  let initialDateObject = {
    start: bookingObject.start,
    end: bookingObject.end,
  };
  const pickupOptions = [" 1 pm", " 2 pm", " 3 pm", " 4 pm", " 5 pm", " 6 pm"];
  const dropoffOptions = ["10 am", "11 am", "12 pm", " 1 pm", " 2 pm", " 3 pm"];

  let dispatch = createEventDispatcher();

  afterUpdate(() => {
    newBookingData = {
      id: bookingObject.id,
      start: bookingObject.start,
      end: bookingObject.end,
      status: bookingObject.status,
      created: bookingObject.created,
      photos: bookingObject.photos,
      documents: bookingObject.documents,
      unix_start: bookingObject.unix_start,
      unix_end: bookingObject.unix_end,
      passengers: bookingObject.passengers,
      total_price: bookingObject.total_price,
      unit_name: unitObject.name,
      unit_id: unitObject.id,
      customer: bookingObject.customer,
      pickup_time: bookingObject.pickup_time,
      dropoff_time: bookingObject.dropoff_time,
    };
    updateBookingDates({
      start: newBookingData.start,
      end: newBookingData.end,
    });
  });

  function updateBookingDates(detail: { start: string; end: string }) {
    if (newBookingData) {
      newBookingData.start = detail.start;
      newBookingData.end = detail.end;

      let startDate = new DateTime(detail.start, "MMM-DD-YYYY");
      let endDate = new DateTime(detail.end, "MMM-DD-YYYY");

      newBookingData.unix_start = Math.ceil(startDate.getTime() / 1000);
      newBookingData.unix_end = Math.ceil(endDate.getTime() / 1000);
    }
  }

  function updateBookingPickupDropoff(detail: { key: string; value: string }) {
    //@ts-ignore
    newBookingData[detail.key] = detail.value;
  }

  async function saveBooking() {
    if (savingBooking) return;
    savingBooking = true;
    datesValidationError = false;

    if (newBookingData) {
      if (!newBookingData.unix_start || !newBookingData.unix_end) {
        datesValidationError = true;
        savingBooking = false;
        return;
      }

      let updatedCustomer: Customer = {
        id: newUUID(),
        first_name: firstNameInput.value,
        last_name: lastNameInput.value,
        email: emailInput.value,
        phone: phoneInput.value,
        bookings: [newBookingData.id],
      };
      if (bookingObject.customer) {
        updatedCustomer.id = bookingObject.customer;
      }

      // add missing data, including the above customer id
      newBookingData.total_price = parseInt(priceInput.value);
      newBookingData.passengers = passengersInput.value;
      newBookingData.customer = updatedCustomer.id;

      let bookingDocRef = doc(
        $firebaseStore.db,
        "units",
        unitObject.id,
        "bookings",
        newBookingData.id
      );

      await setDoc(bookingDocRef, newBookingData);

      let newCustomerDocRef = doc(
        $firebaseStore.db,
        "customers",
        updatedCustomer.id
      );

      await setDoc(newCustomerDocRef, updatedCustomer);

      newBookingData.customerObject = updatedCustomer;
      bookingObject = structuredClone(newBookingData);
    }

    savingBooking = false;
    dispatch("save", bookingObject);
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

<div class="new-booking-option-container">
  <div class="container-header">
    <p class="option-title">Update Booking {bookingObject.id}</p>
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
        {initialDateObject}
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
          {#each pickupOptions as pickupLabel}
            {#if bookingObject.pickup_time == pickupLabel}
              <option selected value={pickupLabel}>{pickupLabel}</option>
            {:else}
              <option value={pickupLabel}>{pickupLabel}</option>
            {/if}
          {/each}
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
          {#each dropoffOptions as dropoffLabel}
            {#if bookingObject.dropoff_time == dropoffLabel}
              <option selected value={dropoffLabel}>{dropoffLabel}</option>
            {:else}
              <option value={dropoffLabel}>{dropoffLabel}</option>
            {/if}
          {/each}
        </select>
      </div>
    </div>
    <div class="double-row">
      <div class="section">
        <div class="section-label">Total Price</div>
        <input
          type="number"
          class="price"
          name="price"
          value={bookingObject.total_price}
          bind:this={priceInput}
        />
      </div>
      <div class="section">
        <div class="section-label">Passengers</div>
        <input
          type="number"
          class="price"
          name="passengers"
          value={bookingObject.passengers}
          bind:this={passengersInput}
        />
      </div>
    </div>
    <div class="section">
      <div class="section-label">Customer Info</div>
      <input
        type="text"
        placeholder="First Name"
        name="first-name"
        value={bookingObject.customerObject?.first_name
          ? bookingObject.customerObject?.first_name
          : ""}
        bind:this={firstNameInput}
      />
      <input
        class="margin-top"
        type="text"
        placeholder="Last Name"
        name="last-name"
        value={bookingObject.customerObject?.last_name
          ? bookingObject.customerObject?.last_name
          : ""}
        bind:this={lastNameInput}
      />
      <input
        class="margin-top"
        type="email"
        placeholder="Email"
        name="email"
        value={bookingObject.customerObject?.email
          ? bookingObject.customerObject?.email
          : ""}
        bind:this={emailInput}
      />
      <input
        class="margin-top"
        type="tel"
        placeholder="Phone"
        name="phone"
        value={bookingObject.customerObject?.phone
          ? bookingObject.customerObject?.phone
          : ""}
        bind:this={phoneInput}
      />
    </div>
    <div class="bar" />
    <div class="section">
      <button id="save-button" on:click={saveBooking}>
        {#if savingBooking}
          <div class="spinner" />
        {:else}
          SAVE
        {/if}
      </button>
    </div>
  </div>
</div>

<style>
  .new-booking-option-container {
    background-color: hsl(var(--b1));
    position: relative;
    border-radius: 4px;
    box-shadow: 0 1px 3px var(--cms-boxShadow);
    display: flex;
    flex-direction: column;
    width: 450px;
    height: 90%;
    margin: 25px;
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
  .section.last {
    margin-bottom: 50%;
  }
  .section-label {
    font-family: cms-semibold;
    align-self: flex-start;
    font-size: 14px;
    display: flex;
  }
  .double-row {
    display: flex;
    width: 100%;
  }
  .double-row .section {
    width: 50%;
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
  input.price {
    width: 100px;
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
    .new-booking-option-container {
      width: 100%;
    }
    select,
    input {
      height: 40px;
    }
  }
</style>
