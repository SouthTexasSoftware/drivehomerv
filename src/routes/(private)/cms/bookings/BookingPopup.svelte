<script lang="ts">
  import type { Booking } from "$lib/types";
  import { createEventDispatcher } from "svelte";
  import { objectKeyToLabel, formatPhoneNumber, newUUID } from "$lib/helpers";
  import { deleteDoc, setDoc, doc } from "firebase/firestore";
  import { firebaseStore, unitStore } from "$lib/stores";

  export let popupBooking: Booking;
  let savingBooking = false;
  let confirmDelete = false;
  let deletingBooking = false;

  if (popupBooking.customerObject == undefined) {
    popupBooking.customerObject = {
      id: newUUID(),
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
    };
  }

  let dispatch = createEventDispatcher();

  let keys = Object.keys(popupBooking);

  async function saveBooking() {
    if (savingBooking) return;

    savingBooking = true;

    //update / create customer object within both collections?
    await updateCustomer();

    let bookingRef = doc(
      $firebaseStore.db,
      "units",
      popupBooking.unit_id,
      "bookings",
      popupBooking.id
    );

    await setDoc(bookingRef, popupBooking);

    unitStore.update((unitsList) => {
      unitsList.forEach((unit) => {
        unit.bookingObjects?.forEach((booking) => {
          if (booking.id == popupBooking.id) {
            booking = popupBooking;
          }
        });
      });
      return unitsList;
    });

    savingBooking = false;

    dispatch("close", true);
  }

  async function updateCustomer() {
    if (popupBooking.customerObject) {
      let updating = await setDoc(
        doc($firebaseStore.db, "customers", popupBooking.customerObject.id),
        popupBooking.customerObject
      );
    }
  }

  async function deleteBooking() {
    if (!confirmDelete) {
      confirmDelete = true;
      return;
    }
    if (deletingBooking) {
      return;
    }
    deletingBooking = true;

    await deleteDoc(
      doc(
        $firebaseStore.db,
        "units",
        popupBooking.unit_id,
        "bookings",
        popupBooking.id
      )
    );

    unitStore.update((unitsList) => {
      unitsList.forEach((unit) => {
        unit.bookingObjects?.forEach((booking, index) => {
          if (booking.id == popupBooking.id) {
            unit.bookingObjects?.splice(index, 1);
          }
        });
      });
      return unitsList;
    });

    confirmDelete = false;
    deletingBooking = false;

    dispatch("close", true);
  }
</script>

<div class="popup-container">
  <div class="small-info">
    <p>Created</p>
    <p>: {popupBooking.created?.toDate()}</p>
  </div>
  <h3>Booking Details</h3>
  <button
    class="close"
    on:click={() => {
      dispatch("close", true);
    }}>X</button
  >
  <div class="information-container">
    <div class="property">
      <p class="key">Unit Name</p>
      <p class="value">{popupBooking.unit_name}</p>
    </div>
    <div class="property">
      <p class="key">Customer First Name</p>
      <input
        class="value input"
        bind:value={popupBooking.customerObject.first_name}
      />
    </div>
    <div class="property">
      <p class="key">Customer Last Name</p>
      <input
        class="value input"
        bind:value={popupBooking.customerObject.last_name}
      />
    </div>
    <div class="property">
      <p class="key">Customer Email</p>
      <input
        class="value input"
        bind:value={popupBooking.customerObject.email}
      />
    </div>
    <div class="property">
      <p class="key">Customer Phone</p>
      <input
        class="value input"
        bind:value={popupBooking.customerObject.phone}
      />
    </div>
    <div class="property">
      <p class="key">Customer Quoted</p>
      <input class="value input" bind:value={popupBooking.total_price} />
    </div>
    <div class="property">
      <p class="key">Booking Start</p>
      <p class="value">
        {popupBooking.start}
      </p>
    </div>
    <div class="property">
      <p class="key">Booking End</p>
      <p class="value">
        {popupBooking.end}
      </p>
    </div>
    <div class="property">
      <p class="key">Booking Status</p>
      <input class="value input" bind:value={popupBooking.status} />
    </div>
    <div class="property">
      <p class="key">Pickup Time</p>
      <input class="value input" bind:value={popupBooking.pickup_time} />
    </div>
    <div class="property">
      <p class="key">Pickup Location</p>
      <input class="value input" bind:value={popupBooking.pickup_location} />
    </div>
    <div class="property">
      <p class="key">Dropoff Time</p>
      <input class="value input" bind:value={popupBooking.dropoff_time} />
    </div>
    <div class="property">
      <p class="key">Dropoff Location</p>
      <input class="value input" bind:value={popupBooking.dropoff_location} />
    </div>
    <div class="property">
      <p class="key">Platform Booked On</p>
      <input class="value input" bind:value={popupBooking.platform_booked_on} />
    </div>
  </div>

  <div class="button-container">
    <button class="delete" on:click={deleteBooking}>
      {#if deletingBooking}
        <div class="spinner" />
      {:else if confirmDelete}
        CONFIRM
      {:else}
        DELETE
      {/if}
    </button>
    <button class="save" on:click={saveBooking}>
      {#if savingBooking}
        <div class="spinner" />
      {:else}
        SAVE
      {/if}
    </button>
  </div>
</div>

<style>
  .popup-container {
    position: fixed;
    width: 90vw;
    height: 95vh;
    top: 3vh;
    left: 5vw;
    background-color: hsl(var(--b1));
    z-index: 150;
    border-radius: 4px;
    padding: 20px;
    box-shadow: 0px 1px 3px #b9b9b9;
    max-width: 1200px;
  }
  h3 {
    text-align: center;
    font-size: 24px;
    font-family: font-bold;
    color: hsl(var(--p));
  }
  .close {
    position: absolute;
    top: 20px;
    right: 20px;
    color: hsl(var(--p));
    font-size: 20px;
  }
  .property {
    margin-bottom: 8px;
    max-width: 350px;
    width: 100%;
  }
  .information-container {
    display: flex;
    max-height: 69vh;
    margin: 2vh auto;
    overflow-y: scroll;
    /* max-width: 800px; */
    flex-direction: column;
    flex-wrap: wrap;
    align-items: center;
  }
  .key {
    font-size: 12px;
    font-family: font-light;
  }
  .value {
    font-size: 20px;
    /* margin-left: 10px; */
    /* margin-top: -5px; */
    outline: none;
    border-radius: 4px;
    padding: 0 10px;
    width: 95%;
  }
  .value.input {
    border: 1px solid hsl(var(--b2));
    height: 35px;
  }
  .button-container {
    margin-top: 5vh;
    display: flex;
    justify-content: flex-end;
  }
  .save,
  .delete {
    width: 100px;
    height: 25px;
    background: hsl(var(--su));
    border-radius: 4px;
    color: white;
    margin-left: 50px;
  }
  .delete {
    background-color: lightcoral;
  }
  .small-info {
    position: absolute;
    font-size: 12px;
    font-family: font-light;
    bottom: 8px;
    left: 0;
    display: flex;
    width: 100%;
    justify-content: center;
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
    width: 15px;
    height: 15px;
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
</style>
