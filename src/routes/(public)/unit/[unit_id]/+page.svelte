<script lang="ts">
  import MainCard from "./MainCard.svelte";
  import type { Unit } from "$lib/types";
  import { unitStore } from "$lib/stores";
  import { unitLookup } from "$lib/helpers";
  import { page } from "$app/stores";
  import PageDataLoading from "../../../../lib/components/PageDataLoading.svelte";

  export let unitObject: Unit;

  let loadingUnit = true;

  unitStore.subscribe((storeData) => {
    let lookupResult = unitLookup($page.params.unit_id);

    if (lookupResult != undefined) {
      unitObject = lookupResult;
    }

    // if lookup produced results, allow page to continue loading.

    if (unitObject != undefined) {
      loadingUnit = false;
      return;
    }
  });
</script>

{#if unitObject}
  <h2>Plan Your Trip</h2>
  <p class="small">with</p>
  <p class="unit-name">{unitObject?.name}</p>
  <MainCard {unitObject} />
  <div id="information-container">
    <h2>More Info</h2>
    <p id="description">
      {unitObject.description}
    </p>
  </div>
{:else}
  <PageDataLoading />
{/if}

<style>
  h2 {
    font-size: 32px;
  }

  p.small {
    font-size: 14px;
    margin-top: -10px;
  }
  p.unit-name {
    font-family: font-medium;
    color: hsl(var(--p));
    font-size: 32px;
    margin-top: -10px;
  }
  #information-container {
    max-width: 1700px;
    margin-top: 50px;
    margin-bottom: 50px;
  }
  #description {
    white-space: pre-wrap;
    width: 100%;
    /* margin: 0 25px; */
    font-size: 18px;
    /* line-height: 35px; */
  }

  @media (max-width: 1000px) {
    #information-container {
      margin-top: 0px;
      width: 90vw;
    }
  }
  @media (min-width: 1000px) and (max-width: 1400px) {
    #information-container {
      width: 900px;
    }
  }

  @media (min-width: 1400px) {
    #information-container {
      width: 1200px;
    }
  }

  /* max-width setpoint at 1800px */
</style>
