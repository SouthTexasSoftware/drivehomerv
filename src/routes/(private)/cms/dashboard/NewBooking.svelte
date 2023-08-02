<script lang="ts">
  import { unitStore, firebaseStore } from "$lib/stores";
  import { enhance } from "$app/forms";
  import NewBookingCalendar from "./NewBookingCalendar.svelte";
  import { collection, setDoc, doc, Timestamp } from "firebase/firestore";
  import { createEventDispatcher } from "svelte";
  import { DateTime } from "@easepick/bundle";

  let dispatch = createEventDispatcher();

  let newBookingStart: string | undefined;
  let newBookingEnd: string | undefined;

  let creatingBooking = false;

  function populateDateInputs(selection: { start: string; end: string }) {
    newBookingStart = selection.start;
    newBookingEnd = selection.end;
  }

  // TODO: This needs to be re-written to allow the user to input price, a 'fake' input for unit id..
</script>

<div class="new-booking-container">
  <h4>New Booking</h4>
  <form
    id="new-booking-form"
    name="new-booking-form"
    method="POST"
    use:enhance={async ({ data, cancel, form }) => {
      if (creatingBooking) {
        return;
      }
      console.log(data);
      if (data.get("start-date") == "undefined") {
        cancel();
        return;
      }
      if (!data.get("unit-select")) {
        cancel();
        return;
      }

      creatingBooking = true;

      //   post to firebase
      //@ts-ignore
      let bookingsCollection = collection(
        $firebaseStore.db,
        "units",
        data.get("unit-select"),
        "bookings"
      );
      let newBookingDocRef = doc(bookingsCollection);
      let newBookingId = newBookingDocRef.id;

      let startDate = new DateTime(data.get("start-date"), "MMM-DD-YYYY");
      let endDate = new DateTime(data.get("end-date"), "MMM-DD-YYYY");

      let newBookingRequest = {
        id: newBookingId,
        passengers: null,
        total_price: null,
        start: data.get("start-date"),
        end: data.get("end-date"),
        unix_start: Math.ceil(startDate.getTime() / 1000),
        unix_end: Math.ceil(endDate.getTime() / 1000),
        unit_id: data.get("unit-select"),
        unit_name: null,
        customer: "manualEntry",
        created: Timestamp.now(),
        status: "manualEntry",
      };

      let createBooking = await setDoc(newBookingDocRef, newBookingRequest);

      dispatch("refresh", true);

      creatingBooking = false;

      cancel();
    }}
  >
    <NewBookingCalendar
      on:selection={(event) => {
        populateDateInputs(event.detail);
      }}
    />
    <input
      hidden
      type="text"
      name="start-date"
      value={newBookingStart}
      required
    />
    <input hidden type="text" name="end-date" value={newBookingEnd} required />

    <label for="unit-select"><strong>Unit</strong></label>
    <select
      name="unit-select"
      id="unit-select"
      form="new-booking-form"
      class="select select-bordered w-full max-w-xs"
      required
    >
      <option selected disabled>Choose Unit</option>
      {#if $unitStore.isPopulated}
        {#each $unitStore.units as unitObject}
          <option value={unitObject.id}>{unitObject.name}</option>
        {/each}
      {/if}
    </select>

    <button
      type="submit"
      class="btn btn-primary w-full"
      class:loading={creatingBooking}>CREATE</button
    >
  </form>
</div>

<style>
  .new-booking-container {
    width: 300px;
    height: 350px;
    padding: 15px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    border: 1px solid hsl(var(--b3));
    background-color: hsl(var(--b1));
  }
  h4 {
    font-size: 20px;
  }
  #unit-select {
    font-weight: 100;
  }
  strong {
    font-size: 14px;
    margin-bottom: -5px;
    margin-top: 25px;
    max-width: 300px;
  }
  button {
    margin-top: 15px;
  }
</style>
