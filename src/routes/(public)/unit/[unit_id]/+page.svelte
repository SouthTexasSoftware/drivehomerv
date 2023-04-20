<script lang="ts">
  import MainCard from "./MainCard.svelte";
  import { page } from "$app/stores";
  import { unitLookup } from "$lib/helpers";
  import type { Unit } from "$lib/types";
  import { unitStore } from "$lib/stores";
  import { onMount } from "svelte";
  import LoadingUnit from "./LoadingUnit.svelte";

  let unitObject: Unit | undefined;
  let loadingUnit = true;
  let unitNotFound = false;

  unitStore.subscribe((storeData) => {
    unitObject = unitLookup($page.params.unit_id);

    // if lookup produced results, allow page to continue loading.
    if (unitObject != undefined) {
      loadingUnit = false;
      return;
    }
  });

  // TODO: no built-in fallback to display unit not found right now..
  // This needs some sort of timer, or check to see if it is still waiting on the unitStore
  // to be populated. Right now, the subscription just keeps it updated live.
</script>

<h2>Availability & Pricing</h2>

{#if loadingUnit}
  <LoadingUnit />
{:else if unitObject}
  <MainCard {unitObject} />
  <div id="information-container">
    <!-- Bullets/Description -->
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

  @media (max-width: 500px) {
    .background-stripe {
      top: 250px;
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
