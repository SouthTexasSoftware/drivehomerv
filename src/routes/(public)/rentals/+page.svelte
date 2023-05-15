<script lang="ts">
  import { unitStore } from "$lib/stores";
  import type { Booking, Unit } from "$lib/types";
  import DateSelector from "./DateSelector.svelte";
  import UnitCard from "./UnitCard.svelte";
  import PageDataLoading from "$lib/components/PageDataLoading.svelte";
  import type { DateTime } from "@easepick/datetime";

  let loadingUnitStore = true;

  let availableUnits: Unit[];

  unitStore.subscribe((storeData) => {
    if (storeData != undefined) {
      availableUnits = storeData;
      loadingUnitStore = false;
    }
  });

  /**
   * @param selection.detail [start: Date, end: Date]
   * Compares the passed in selection to all units in the $unitStore.
   * Updates the global 'availableUnits'
   */
  function updateAvailableUnits(selection: {
    detail: { start: Date; end: Date };
  }) {
    let selectionStartInteger = selection.detail.start.getTime();
    let selectionEndInteger = selection.detail.end.getTime();

    let tempNewArray: Unit[] = [];

    //@ts-ignore
    $unitStore.forEach((unit: Unit, index: number): Unit => {
      // compare selection to bookings
      // auto set unit to available by default
      let unitIsAvailable = true;

      unit.bookings?.forEach((booking: DateTime[]) => {
        //convert both booking entries to JSDates and then integers for comparison

        let booking0 = booking[0].getTime();
        let booking1 = booking[1].getTime();

        // ternary = if 0 < 1 , return 0 else 1 , etc.
        let bookingStart = booking0 < booking1 ? booking0 : booking1;
        let bookingEnd = booking0 < booking1 ? booking1 : booking0;

        // if selection start or end == a booking start or end, no good.
        if (
          bookingStart == selectionStartInteger ||
          bookingStart == selectionEndInteger
        ) {
          unitIsAvailable = false;
          return;
        }
        // if selection span includes booking start, no good
        if (
          selectionStartInteger < bookingStart &&
          selectionEndInteger > bookingStart
        ) {
          unitIsAvailable = false;
          return;
        }
        // if selection span includes booking end, no good
        if (
          selectionStartInteger < bookingEnd &&
          selectionEndInteger > bookingEnd
        ) {
          unitIsAvailable = false;
          return;
        }
        // if selection is within a booking completely, no good
        if (
          selectionStartInteger > bookingStart &&
          selectionEndInteger < bookingEnd
        ) {
          unitIsAvailable = false;
          return;
        }
      });

      // if unit is still available after comparing all bookings, push to temp array
      if (unitIsAvailable) {
        tempNewArray.push(unit);
      }
    });
    // all units have been analyzed, now set available units to match the temp array
    availableUnits = tempNewArray;
  }
</script>

<h2>Available Rentals</h2>
{#if loadingUnitStore}
  <PageDataLoading />
{:else}
  <div class="flex-card-container">
    <DateSelector on:selection={updateAvailableUnits} />
    {#each availableUnits as unit (unit.id)}
      <UnitCard unitObject={unit} />
    {/each}
  </div>
{/if}

<style>
  h2 {
    font-family: font-bold;
    font-size: 26px;
    height: 0;
  }
  .flex-card-container {
    margin-top: 30px;
    max-width: 1500px;
    width: 90vw;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
  }
</style>
