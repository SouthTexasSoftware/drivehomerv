<script lang="ts">
  import { page } from "$app/stores";
  import { firebaseStore } from "$lib/stores";
  import type { Booking, Customer } from "$lib/types";
  import {
    Timestamp,
    collection,
    doc,
    setDoc,
    updateDoc,
  } from "firebase/firestore";
  import { beforeUpdate } from "svelte";
  import { fade } from "svelte/transition";

  export let bookingObject: Booking | undefined;

  let customerObjectCopy: { [prop: string]: any } = {};
  let dataLoaded = false;
  let saving = false;
  let saved = false;
  let timerOn = false;

  let customerCollectionRef = collection($firebaseStore.db, "customers");
  let bookingsSubcollectionRef = collection(
    $firebaseStore.db,
    "units",
    $page.params.unit_id,
    "bookings"
  );

  beforeUpdate(() => {
    dataLoaded = false;
    if (!bookingObject) {
      return;
    }
    if (bookingObject?.customerObject) {
      customerObjectCopy = bookingObject.customerObject;
      dataLoaded = true;
      return;
    }

    customerObjectCopy = {
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      created: Timestamp.now(),
      //@ts-ignore
      bookings: [bookingObject.id],
    };
    dataLoaded = true;
  });

  function triggerTimer() {
    if (timerOn) return;
    timerOn = true;
    setTimeout(saveCustomerInfo, 5000);
  }

  async function saveCustomerInfo() {
    timerOn = false;
    saving = true;
    if (!customerObjectCopy.id) {
      customerObjectCopy.id = newUUID();
      let newCustomerDoc = doc(customerCollectionRef, customerObjectCopy.id);
      await setDoc(newCustomerDoc, customerObjectCopy);

      //@ts-ignore
      let bookingDoc = doc(bookingsSubcollectionRef, bookingObject.id);
      await updateDoc(bookingDoc, {
        customer: customerObjectCopy.id,
      });

      if (bookingObject) {
        bookingObject.customerObject = customerObjectCopy as Customer;
      }

      doneSaving();
      return;
    }

    let customerDoc = doc(customerCollectionRef, customerObjectCopy.id);
    await setDoc(customerDoc, customerObjectCopy);

    if (bookingObject) {
      bookingObject.customerObject = customerObjectCopy as Customer;
    }

    doneSaving();
    return;
  }

  function doneSaving() {
    saving = false;
    saved = true;
    setTimeout(() => {
      saved = false;
    }, 2000);
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

<div class="customer-container">
  {#if dataLoaded}
    <div class="section">
      <div class="section-label">First Name</div>
      <input
        type="text"
        on:input={triggerTimer}
        bind:value={customerObjectCopy.first_name}
      />
    </div>
    <div class="section">
      <div class="section-label">Last Name</div>
      <input
        type="text"
        on:input={triggerTimer}
        bind:value={customerObjectCopy.last_name}
      />
    </div>
    <div class="section">
      <div class="section-label">Phone</div>
      <input
        type="text"
        on:input={triggerTimer}
        bind:value={customerObjectCopy.phone}
      />
    </div>
    <div class="section">
      <div class="section-label">Email</div>
      <input
        type="text"
        on:input={triggerTimer}
        bind:value={customerObjectCopy.email}
      />
    </div>
  {/if}
  <div class="saving-container">
    {#if saving}
      <div class="spinner" />
    {/if}
    {#if saved}
      <svg
        width="14"
        height="12"
        viewBox="0 0 14 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        transition:fade
      >
        <path
          d="M1 5.95654L5.16047 9.74893L12.0943 1.10277"
          stroke="#AE2623"
          stroke-width="2.77358"
        />
      </svg>
    {/if}
  </div>
</div>

<style>
  .customer-container {
    display: flex;
    flex-direction: column;
    padding: 0 15px;
  }
  .section {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 15px;
  }
  .section-label {
    font-family: cms-semibold;
    align-self: flex-start;
    font-size: 14px;
  }
  p {
    font-family: cms-regular;
  }
  input {
    border: 1px solid var(--cms-boxShadow);
    font-size: 16px;
    font-family: cms-regular;
    padding: 6px 15px;
    border-radius: 4px;
    outline: none;
    width: 100%;
  }

  .saving-container {
    position: absolute;
    bottom: 5px;
    right: -25px;
  }
  .spinner {
    content: "";
    border-radius: 50%;
    border-top: 2px solid hsl(var(--p));
    border-right: 2px solid transparent;
    animation-name: spinning;
    animation-duration: 1.2s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    opacity: 1;
    transition: all 0.2s;
    width: 15px;
    height: 15px;
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
