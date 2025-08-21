<script lang="ts">
  import { unitStore } from "$lib/stores";
  import type { Unit } from "$lib/types";
  import WinterSpecial from "$lib/components/WinterSpecial.svelte";
  import DateSelector from "./DateSelector.svelte";
  import UnitCard from "./UnitCard.svelte";
  import UnitCardLoader from "./UnitCardLoader.svelte";
  import NoUnitsAvailableCard from "./NoUnitsAvailableCard.svelte";

  let loadingUnitStore = true;
  let recalculatingUnits = false;

  let availableUnits: Unit[] = [];
  let loaderUnits = [0, 1, 2, 3, 4, 5, 6];

  let noUnitsAvailable = false;

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

  // Helper function to normalize dates to midnight
  function normalizeDate(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  interface Selection {
    detail: { start: Date; end: Date };
  }

  // Helper function to calculate nights between two dates
  function calculateNights(start: Date, end: Date): number {
    const timeDiff = end.getTime() - start.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
  }

  /**
   * Compares the passed-in selection to all units in the $unitStore.
   * Updates the global 'availableUnits' based on booking conflicts and minimum nights requirement.
   * @param selection Object containing start and end dates
   */
  function updateAvailableUnits(selection: Selection): void {
    // Show loaders during recalculation
    recalculatingUnits = true;

    const selectionStart = normalizeDate(selection.detail.start);
    const selectionEnd = normalizeDate(selection.detail.end);

    // Calculate selection duration in nights
    const selectionNights = calculateNights(selectionStart, selectionEnd);

    // Validate selection dates
    if (selectionEnd < selectionStart) {
      console.error("End date cannot be before start date");
      availableUnits = [];
      noUnitsAvailable = true;
      setTimeout(() => {
        recalculatingUnits = false;
      }, 200);
      return;
    }

    const tempNewArray: Unit[] = [];

    // Get units from store
    const units = $unitStore.units || [];

    units.forEach((unit: Unit) => {
      // Skip non-public units
      if (!unit.publicly_visible) return;

      let unitIsAvailable = true;

      // Check minimum nights requirement
      const minimumNights = parseInt(
        unit.information.rates_and_fees.pricing.minimum_nights,
        10
      );
      if (isNaN(minimumNights) || selectionNights < minimumNights) {
        unitIsAvailable = false;
        return; // No need to check bookings if minimum nights not met
      }

      // Check for booking conflicts
      if (unit.bookingDates && unit.bookingDates.length > 0) {
        for (const booking of unit.bookingDates) {
          const bookingStart = normalizeDate(booking.start);
          const bookingEnd = normalizeDate(booking.end);

          // Check for conflict:
          // Conflict occurs if:
          // 1. Selection starts before booking ends AND
          // 2. Selection ends after booking starts
          // Allow same-day start/end connections
          if (selectionStart <= bookingEnd && selectionEnd >= bookingStart) {
            // Allow same-day connections
            if (
              (selectionStart.getTime() === bookingEnd.getTime() &&
                selectionEnd.getTime() !== bookingStart.getTime()) ||
              (selectionEnd.getTime() === bookingStart.getTime() &&
                selectionStart.getTime() !== bookingEnd.getTime())
            ) {
              continue;
            }
            unitIsAvailable = false;
            break; // No need to check further bookings
          }
        }
      }

      if (unitIsAvailable) {
        tempNewArray.push(unit);
      }
    });

    // Update available units
    availableUnits = tempNewArray;

    // Update no units available flag
    noUnitsAvailable = availableUnits.length === 0;

    // Remove loading state after minimum 200ms
    setTimeout(() => {
      recalculatingUnits = false;
    }, 200);
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
    {#if recalculatingUnits}
      {#each availableUnits as unit}
        <UnitCardLoader />
      {/each}
    {:else}
      {#each availableUnits as unit (unit.id)}
        <UnitCard unitObject={unit} />
      {/each}
    {/if}
    {#if noUnitsAvailable}
      <NoUnitsAvailableCard />
    {/if}
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
