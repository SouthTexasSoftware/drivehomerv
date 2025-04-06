<script lang="ts">
  import Carousel from "./Carousel.svelte";
  import TripPlan from "./TripPlan.svelte";
  import type { Unit } from "$lib/types";
  import { bookingStore } from "$lib/stores";


  let screenWidth: number;
  let showRequest = false;
  let showSuccess = false;

  export let unitObject: Unit;

  if (unitObject) {
    if ($bookingStore) {
      bookingStore.update((store) => {
        store.unit_id = unitObject.id;
        store.unit_name = unitObject.name;
        store.stripe_product_id = unitObject.stripe_product_id;
        return store;
      });
    } else {
      //@ts-ignore
      bookingStore.set({
        unit_id: unitObject.id,
        unit_name: unitObject.name,
        stripe_product_id: unitObject.stripe_product_id,
        status: "in checkout",
      });
    }
  }
</script>

<svelte:window bind:innerWidth={screenWidth} />

<div id="card-wrapper">
  {#if screenWidth > 500}
    <Carousel {unitObject} />
    <TripPlan
      {showRequest}
      {unitObject}
      on:showModal={() => {
        showRequest = true;
      }}
    />
  {:else}
    <TripPlan
      {unitObject}
      {showRequest}
      on:showModal={() => {
        showRequest = true;
      }}
    />
    <Carousel {unitObject} />
  {/if}
</div>

<style>
  #card-wrapper {
    box-shadow: 0px 1px 2px grey;
    border-radius: 2px;
    margin: 25px 0 50px;
    background-color: hsl(var(--b1));
    position: relative;
    display: grid;
    grid-template-rows: 1fr 0.8fr;
    grid-template-columns: 1fr;
    min-height: 500px;
  }
  @media (max-width: 700px) {
    #card-wrapper {
      width: 100vw;
      min-height: 120vw;
      padding-bottom: 25px;
      margin: 0;
      box-shadow: none;
      background-color: rgba(255, 255, 255, 0.97);
    }
  }

  @media (min-width: 700px) and (max-width: 1200px) {
    #card-wrapper {
      width: 70vw;
      grid-template-rows: 40vw 1fr;
      grid-template-columns: 1fr;
    }
  }

  @media (min-width: 1200px) and (max-width: 1800px) {
    #card-wrapper {
      width: 90vw;
      max-width: 1700px;
      grid-template-columns: 0.7fr 1fr;
      grid-template-rows: 1fr;
    }
  }
  @media (min-width: 1800px) {
    #card-wrapper {
      width: 70vw;
      max-width: 1700px;
      grid-template-columns: 0.8fr 1fr;
      grid-template-rows: 1fr;
    }
  }

  /* max-width setpoint at 1800px */
</style>
