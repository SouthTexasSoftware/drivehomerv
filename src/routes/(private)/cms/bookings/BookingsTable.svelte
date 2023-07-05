<script lang="ts">
  import type { Booking } from "$lib/types";
  import { onMount } from "svelte";

  let bookingsLoaded = false;
  let allBookingsList: Booking[] = [];

  // bookingStore.subscribe((data) => {
  //   let keys = Object.keys(data);
  //   keys.forEach((key) => {
  //     allBookingsList = [...allBookingsList, ...data[key]];
  //   });
  //   bookingsLoaded = true;
  // });
</script>

<div class="table-container">
  <div class="table-header">
    <p>Unit</p>
    <p>Customer</p>
    <p>Start</p>
    <p>End</p>
    <p>Price</p>
  </div>
  {#if bookingsLoaded}
    {#each allBookingsList as booking}
      <div class="table-row">
        <p>{booking.unit_id}</p>
        <p>{booking.customer}</p>
        <p>{booking.start}</p>
        <p>{booking.end}</p>
        <p>${booking.total_price}</p>
      </div>
    {/each}
  {/if}
</div>

<style>
  .table-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    background-color: hsl(var(--b1));
    border-radius: 4px;
    padding: 25px;
    margin-top: 25px;
    max-width: 900px;
  }
  .table-header,
  .table-row {
    display: grid;
    grid-template-columns: 0.8fr 1fr 0.5fr 0.5fr 0.3fr;
  }
  .table-header {
    border-bottom: 1px solid hsl(var(--b2));
    padding: 0px 15px;
  }
  .table-header p {
    font-family: "font-medium";
  }
  .table-row {
    margin: 5px 0;
    border-radius: 4px;
    border: 1px solid hsl(var(--b3));
    padding: 10px 15px;
    background-color: hsl(var(--b2));
  }
</style>
