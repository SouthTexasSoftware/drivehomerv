<script lang="ts">
  import { unitStore } from "$lib/stores";
  import type { Unit } from "$lib/types";
  import { unitLookup } from "$lib/helpers";
  import { page } from "$app/stores";
  import DateSelector from "./DateSelector.svelte";
  import UnitCard from "./UnitCard.svelte";
  import PageDataLoading from "$lib/components/PageDataLoading.svelte";

  let loadingUnitStore = true;

  unitStore.subscribe((storeData) => {
    if (storeData != undefined) {
      loadingUnitStore = false;
    }
  });
</script>

<h2>Available Rentals</h2>
{#if loadingUnitStore}
  <PageDataLoading />
{:else}
  <DateSelector />
  <UnitCard />
{/if}

<style>
  h2 {
    font-family: font-bold;
    font-size: 26px;
    height: 0;
  }
</style>
