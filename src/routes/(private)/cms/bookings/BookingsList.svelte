<script lang="ts">
  import { unitStore, firebaseStore } from "$lib/stores";
  import type { Booking, Customer } from "$lib/types";
  import { DateTime } from "@easepick/bundle";
  import { collection, getDocs } from "firebase/firestore";
  import { onMount } from "svelte";
  import BookingPopup from "./BookingPopup.svelte";

  // load all bookings into a list, sort by date and display in #each
  let allBookingsList: Booking[] = [];
  let bookingsListGenerated = false;
  let customersList: Customer[] = [];
  let showPopup = false;
  let popupBooking: Booking;

  onMount(getCustomerData);

  async function getCustomerData() {
    let customersRef = collection($firebaseStore.db, "customers");
    let customersQuery = await getDocs(customersRef);

    customersQuery.forEach((doc) => {
      customersList.push(doc.data() as Customer);
    });

    createBookingsList("dateStart");
  }

  function createBookingsList(sortBy: string) {
    if ($unitStore == undefined) {
      setTimeout(createBookingsList, 200);
      return;
    }

    allBookingsList = [];

    for (let unit of $unitStore) {
      if (unit.bookingObjects) {
        for (let booking of unit.bookingObjects) {
          if (!booking.unit_name) {
            booking.unit_name = unit.name;
          }
          for (let customer of customersList) {
            if (customer.id == booking.customer) {
              booking.customerObject = customer;
            }
          }
          allBookingsList.push(booking);
        }
      }
    }

    if (sortBy == "dateStart") {
      allBookingsList = allBookingsList.sort((bookingA, bookingB) => {
        let bookingAstart = new DateTime(bookingA.start, "MMM-DD-YYYY");
        let bookingBstart = new DateTime(bookingB.start, "MMM-DD-YYYY");

        if (bookingAstart.isBefore(bookingBstart)) {
          return 1;
        } else {
          return 0;
        }
      });
    }
    console.log(allBookingsList);
    bookingsListGenerated = true;
  }

  function sortByUnit() {
    createBookingsList("unit");
  }

  function sortByStart() {
    createBookingsList("dateStart");
  }

  function isPast(endDate: string) {
    let now = new DateTime();
    console.log(now);
    let end = new DateTime(endDate, "MMM-DD-YYYY");

    if (end.isAfter(now, "MMM-DD-YYYY")) {
      return true;
    }

    return false;
  }
</script>

<div class="bookings-container">
  <div class="title">
    <button class="unit-name sort-button" on:click={sortByUnit}
      >Unit Name</button
    >
    <!-- <p class="customer-id">Customer ID</p> -->
    <p class="customer-name">Customer</p>
    <p class="customer-name">Status</p>
    <button class="start-date sort-button" on:click={sortByStart}
      >Start Date</button
    >
    <p class="end-date">End Date</p>
  </div>
  {#if bookingsListGenerated}
    {#each allBookingsList as booking}
      <button
        class="booking-element"
        on:click={() => {
          popupBooking = booking;
          showPopup = true;
        }}
      >
        <p class="unit-name">{booking.unit_name}</p>
        {#if booking.customerObject}
          <p class="customer-name">
            {booking.customerObject.first_name}
            {booking.customerObject.last_name}
          </p>
        {:else}
          <p class="customer-name" />
        {/if}
        <p class="booking-status">{booking.status}</p>
        <p class="start-date">{booking.start}</p>
        <p class="end-date">{booking.end}</p>
      </button>
    {/each}
  {/if}
</div>

{#if showPopup}
  <BookingPopup
    {popupBooking}
    on:close={() => {
      showPopup = false;
      createBookingsList("dateStart");
    }}
  />
{/if}

<style>
  .bookings-container {
    width: 100%;
    display: flex;
    flex-direction: column;
  }
  .title * {
    font-size: 18px;
    font-family: font-bold;
    text-align: left;
  }
  .sort-button {
    text-decoration: underline;
    color: #497ee3;
  }

  .booking-element,
  .title {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    font-family: font-regular;
    border: 1px solid #eaeaea;
    padding: 15px;
    border-radius: 4px;
    margin: 8px 0;
    background-color: #f7f7f7;
    text-align: left;
  }
  .title {
    border: none;
    background-color: transparent;
    border-bottom: 1px solid black;
    border-radius: 0px;
  }
  .booking-element:hover {
    background-color: #f3f3f3;
  }
</style>
