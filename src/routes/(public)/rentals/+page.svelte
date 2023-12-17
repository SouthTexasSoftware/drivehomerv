<script lang="ts">
  import { unitStore } from "$lib/stores";
  import type { Unit } from "$lib/types";
  import WinterSpecial from "$lib/components/WinterSpecial.svelte";
  import DateSelector from "./DateSelector.svelte";
  import UnitCard from "./UnitCard.svelte";
  import UnitCardLoader from "./UnitCardLoader.svelte";

  let loadingUnitStore = true;

  let availableUnits: Unit[];
  let loaderUnits = [0, 1, 2, 3, 4, 5, 6];

  unitStore.subscribe((storeData) => {
    if (storeData.isPopulated) {
      availableUnits = storeData.units.filter((unit) => {
        if (unit.publicly_visible) {
          return unit;
        }
      });
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
    $unitStore.units.forEach((unit: Unit, index: number): Unit | undefined => {
      // if unit is not publicly available, don't add it to the available array or do any math on it
      if(!unit.publicly_visible) return;

      // compare selection to bookings
      // auto set unit to available by default
      let unitIsAvailable = true;

      unit.bookingDates?.forEach((booking: { start: Date; end: Date }) => {
        //convert both booking entries to JSDates and then integers for comparison

        let bookingStart = booking.start.getTime();
        let bookingEnd = booking.end.getTime();

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
<div class="flex-card-container">
  {#if loadingUnitStore}
    {#each loaderUnits as loader}
      <UnitCardLoader />
    {/each}
  {:else}
    <DateSelector on:selection={updateAvailableUnits} />
    {#each availableUnits as unit (unit.id)}
      <UnitCard unitObject={unit} />
    {/each}
  {/if}
</div>

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
    margin-bottom: 100px;
  }
  @media (max-width: 700px) { 
    .flex-card-container {
      width: 97vw;
    }

  }
</style>
