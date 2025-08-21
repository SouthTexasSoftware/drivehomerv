<script lang="ts">
  import BookingsCategoryCalendar from "./BookingsCategoryCalendar.svelte";
  import BookingsCategoryNewBooking from "./BookingsCategoryNewBooking.svelte";
  import { unitStore } from "$lib/stores";
  import type { Unit } from "$lib/types";
  import { page } from "$app/stores";
  import { afterNavigate } from "$app/navigation";
  import { afterUpdate } from "svelte";
  import BookingsCategoryNewBlocking from "./BookingsCategoryNewBlocking.svelte";

  let creatingNewBooking = false;
  let creatingNewBlocking = false;
  let unitObject: Unit | undefined;

  checkUnitSelected();

  function checkUnitSelected() {
    if ($unitStore.isPopulated) {
      unitObject = $unitStore.getUnit($page.params.unit_id);
      return;
    }

    setTimeout(checkUnitSelected, 200);
  }

  afterUpdate(checkUnitSelected);
</script>

{#if unitObject}
  <section class="bookings-home-container">
    {#if creatingNewBooking}
      <BookingsCategoryNewBooking
        {unitObject}
        on:cancel={() => {
          creatingNewBooking = false;
        }}
      />
    {:else if creatingNewBlocking}
      <BookingsCategoryNewBlocking
        {unitObject}
        on:cancel={() => {
          creatingNewBlocking = false;
        }}
      />
    {:else}
      <BookingsCategoryCalendar {unitObject} />
      <div class="button-container">
        <button on:click={() => (creatingNewBooking = true)}
          >Create New Booking</button
        >
      </div>
      <div class="button-container">
        <button class="block" on:click={() => (creatingNewBlocking = true)}
          >Block Dates</button
        >
      </div>
    {/if}
  </section>
{/if}

<style>
  .bookings-home-container {
    height: 100%;
  }
  .button-container {
    width: 450px;
    margin-top: 25px;
    display: flex;
    flex-wrap: wrap;
  }
  button {
    width: 180px;
    border-radius: 4px;
    height: 28px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--p);
    color: white;
  }
  .block {
    background-color: var(--wa);
  }
  @media (max-width: 500px) {
    .button-container {
      width: 100%;
    }
    .bookings-home-container {
      max-height: 95%;
      height: 100%;
    }
  }
</style>
