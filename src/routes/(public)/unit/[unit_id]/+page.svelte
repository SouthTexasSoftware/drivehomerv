<script lang="ts">
  import MainCard from "./MainCard.svelte";
  import { page } from "$app/stores";
  import { unitLookup } from "$lib/helpers";
  import type { Unit } from "$lib/types";
  import { unitStore } from "$lib/stores";
  import { onMount } from "svelte";
  import LoadingUnit from "./LoadingUnit.svelte";
  import FeatureList from "./FeatureList.svelte";

  let unitObject: Unit | undefined;
  let loadingUnit = true;
  let unitNotFound = false;

  unitStore.subscribe((storeData) => {
    unitObject = unitLookup($page.params.unit_id);

    // if lookup produced results, allow page to continue loading.
    if (unitObject != undefined) {
      console.log(JSON.stringify(unitObject.description));
      loadingUnit = false;
      return;
    }
  });

  // TODO: no built-in fallback to display unit not found right now..
  // This needs some sort of timer, or check to see if it is still waiting on the unitStore
  // to be populated. Right now, the subscription just keeps it updated live.
</script>

<h2>Plan Your Trip</h2>
<p class="small">with</p>
<p class="unit-name">{unitObject?.name}</p>

{#if loadingUnit}
  <LoadingUnit />
{:else if unitObject}
  <MainCard {unitObject} />
  <div id="information-container">
    <!-- Bullets/Description -->
    <p id="description">
      {unitObject.description}
    </p>
    <!-- How it Works/Rental Process Explained -->
  </div>
{/if}

<div class="background-stripe" />

<style>
  h2 {
    font-size: 32px;
  }
  .background-stripe {
    position: absolute;
    width: 200vw;
    height: 300px;
    left: -50vw;
    background: hsl(var(--p));
    transform: rotate(-16deg);
    z-index: -1;
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
    width: 50vw;
    margin-top: 50px;
  }
  #description {
    white-space: pre-wrap;
    width: 100%;
    margin: 0 25px;
    font-size: 18px;
    line-height: 35px;
  }

  @media (max-width: 500px) {
    .background-stripe {
      top: 250px;
    }
    #description {
    }
  }

  @media (min-width: 500px) and (max-width: 1000px) {
    .background-stripe {
      top: 300px;
    }
  }

  @media (min-width: 1000px) {
    .background-stripe {
      top: 350px;
    }
  }

  /* max-width setpoint at 1800px */
</style>
