<script lang="ts">
  import { cmsBookingFilterStore, unitStore } from "$lib/stores";
  import type { BookingDisplayFilter } from "lib/types";
  import BookingsColumn from "./BookingsColumn.svelte";

  let filters = {
    past: false,
    ongoing: true,
    upcoming: true,
    units: [],
  } as BookingDisplayFilter;

  cmsBookingFilterStore.set(filters);

  let setUnitsInFilterStore = unitStore.subscribe((storeData) => {
    if (storeData.units) {
      cmsBookingFilterStore.update((filterStore) => {
        filterStore.units = storeData.units.map((unit) => {
          return {
            name: unit.name,
            id: unit.id,
            visible: true,
            color: unit.information.cms_only.color_scheme.primary,
          };
        });

        return filterStore;
      });
    }
  });

  function handleColumnEvent(evt: CustomEvent) {
    setUnitsInFilterStore();
    cmsBookingFilterStore.set(evt.detail);
  }
</script>

<div class="units-container">
  {#if $unitStore.isPopulated}
    <BookingsColumn on:buttonEvent={handleColumnEvent} {filters} />
    <slot />
  {:else}
    <div class="spinner-container">
      <div class="spinner" />
      <p>Loading Unit Data . . .</p>
    </div>
  {/if}
</div>

<style>
  .units-container {
    width: 100%;
    display: flex;
  }
  .spinner-container {
    margin: auto;
  }
  .spinner {
    content: "";
    border-radius: 50%;
    border-top: 2px solid hsl(var(--p));
    border-right: 2px solid transparent;
    animation-name: spinning;
    animation-duration: 1s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    opacity: 1;
    transition: all 0.2s;
    width: 150px;
    height: 150px;
  }
  p {
    color: hsl(var(--p));
    font-family: font-bold;
    margin-top: 20px;
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
