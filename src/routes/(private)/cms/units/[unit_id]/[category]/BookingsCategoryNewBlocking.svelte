<script lang="ts">
  import type { Booking, Customer, Unit } from "$lib/types";
  import PopupCalendarInputNoBookings from "$lib/components/PopupCalendarInputNoBookings.svelte";
  import { afterUpdate, createEventDispatcher } from "svelte";
  import { Timestamp, doc, serverTimestamp, setDoc } from "firebase/firestore";
  import { DateTime } from "@easepick/bundle";
  import { bookingStore, firebaseStore } from "$lib/stores";

  export let unitObject: Unit;

  let savingBooking = false;
  let notesInput: HTMLTextAreaElement;

  let dispatch = createEventDispatcher();

  let datesValidationError = false;

  // initial creation of the store with some default values
  bookingStore.set({
    id: newBlockUUID(),
    start: "",
    end: "",
    unix_start: 0,
    unix_end: 0,
    status: "block",
    created: serverTimestamp() as Timestamp,
    unit_name: unitObject.name,
    unit_id: unitObject.id,
    confirmed: true,
    in_checkout: false,
    notes: "",
  });

  function updateBookingDates(detail: { start: string; end: string }) {
    if ($bookingStore) {
      $bookingStore.start = detail.start;
      $bookingStore.end = detail.end;

      let startDate = new DateTime(detail.start, "MMM-DD-YYYY");
      let endDate = new DateTime(detail.end, "MMM-DD-YYYY");

      $bookingStore.unix_start = Math.ceil(startDate.getTime() / 1000);
      $bookingStore.unix_end = Math.ceil(endDate.getTime() / 1000);
    }
  }

  async function saveBlocking() {
    if (savingBooking) return;
    savingBooking = true;
    datesValidationError = false;

    if ($bookingStore.start == "" || $bookingStore.end == "") {
      datesValidationError = true;
      savingBooking = false;
      return;
    }

    $bookingStore.notes = notesInput.value;

    // add booking to our DB
    //@ts-ignore
    let bookingDocRef = doc(
      $firebaseStore.db,
      "units",
      $bookingStore.unit_id,
      "bookings",
      $bookingStore.id
    );

    await setDoc(bookingDocRef, $bookingStore);

    savingBooking = false;
    dispatch("cancel", true);
  }

  function newBlockUUID(): string {
    // Alphanumeric characters
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let autoId = "";
    for (let i = 0; i < 20; i++) {
      autoId += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    //for blockings only
    let blockingId = "block_" + autoId.slice(6);

    return blockingId;
  }
</script>

<div class="new-booking-option-container">
  <div class="container-header">
    <p class="option-title">Block Dates</p>
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
        on:selection={(event) => {
          updateBookingDates(event.detail);
        }}
      />
      {#if datesValidationError}
        <p class="validation-error">No Dates Selected</p>
      {/if}
    </div>
    <div class="section last">
      <div class="section-label">Notes</div>
      <textarea
        name="notes"
        id="notes-area"
        cols="30"
        rows="10"
        bind:this={notesInput}
      />
    </div>
    <div class="bar" />
    <div class="section">
      <button id="save-button" on:click={saveBlocking}>
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
    width: 100%;
    display: flex;
    flex-direction: column;
    width: 450px;
    height: 100%;
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
    margin-bottom: 30%;
  }
  .section-label {
    font-family: cms-semibold;
    align-self: flex-start;
    font-size: 14px;
    display: flex;
  }
  textarea {
    width: 100%;
    border-radius: 10px;
    border: 1px solid hsl(var(--b2));
    padding: 15px;
    font-family: cms-regular;
    font-size: 18px;
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
