<script lang="ts">
  import { unitStore, firebaseStore } from "$lib/stores";
  import type { Booking, Customer } from "$lib/types";
  import { DateTime } from "@easepick/bundle";
  import { collection, getDocs } from "firebase/firestore";
  import { onMount } from "svelte";

  // load all bookings into a list, sort by date and display in #each
  let allBookingsList: Booking[] = [];
  let bookingsListGenerated = false;
  let customersList: Customer[] = [];

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
</script>

<div class="bookings-container">
  <div class="booking-element title">
    <button class="unit-name" on:click={sortByUnit}>Unit Name</button>
    <!-- <p class="customer-id">Customer ID</p> -->
    <p class="customer-name">Customer</p>
    <p class="customer-phone">Phone</p>
    <p class="customer-email">Email</p>
    <button class="start-date" on:click={sortByStart}>Start Date</button>
    <p class="end-date">End Date</p>
  </div>
  {#if bookingsListGenerated}
    {#each allBookingsList as booking}
      <div class="booking-element">
        <p class="unit-name">{booking.unit_name}</p>
        {#if booking.customerObject}
          <p class="customer-name">{booking.customerObject.first_name}</p>
          <p class="customer-phone">{booking.customerObject.phone}</p>
          <p class="customer-email">{booking.customerObject.email}</p>
        {:else}
          <p class="customer-name">*manual entry</p>
          <p class="customer-phone">-</p>
          <p class="customer-email">-</p>
        {/if}
        <p class="start-date">{booking.start}</p>
        <p class="end-date">{booking.end}</p>
      </div>
    {/each}
  {/if}
</div>

<style>
  .bookings-container {
    width: 100%;
    display: flex;
    flex-direction: column;
  }
  .bookings-container .booking-element.title * {
    font-size: 18px;
    font-family: font-bold;
    text-align: left;
  }
  button {
    text-decoration: underline;
    color: #497ee3;
  }
  .booking-element {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    font-family: font-regular;
    border: 1px solid #eaeaea;
    padding: 15px;
    border-radius: 4px;
    margin: 8px 0;
    background-color: #f7f7f7;
    /* color: #444; */
  }
</style>
