<script lang="ts">
  import { unitStore } from "$lib/stores";
  import { onMount } from "svelte";
  import UnitCalendar from "./UnitCalendar.svelte";
  import NewBooking from "../dashboard/NewBooking.svelte";

  let bookingsCollected = false;
  let newBookingKey = false;

  onMount(() => {
    setTimeout(() => {
      bookingsCollected = true;
    }, 1000);
  });

  function refreshPage() {
    newBookingKey = !newBookingKey;
    bookingsCollected = false;
    setTimeout(() => (bookingsCollected = true), 200);
  }
</script>

<div class="bookings-container">
  {#key newBookingKey}
    <NewBooking on:refresh={refreshPage} />
  {/key}
  {#if bookingsCollected}
    {#if $unitStore != undefined}
      {#each $unitStore as unit}
        <UnitCalendar unitObj={unit} />
      {/each}
    {/if}
  {:else}
    <div class="spinner" />
  {/if}
</div>

<style>
  .bookings-container {
    /* background-color: lightblue; */
    width: 100%;
    padding: 25px;
    display: flex;
    flex-wrap: wrap;
  }

  .spinner {
    content: "";
    border-radius: 50%;
    border-top: 2px solid hsl(var(--b3));
    border-right: 2px solid transparent;
    animation-name: spinning;
    animation-duration: 1s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    opacity: 1;
    transition: all 0.2s;
    width: 100px;
    height: 100px;
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
