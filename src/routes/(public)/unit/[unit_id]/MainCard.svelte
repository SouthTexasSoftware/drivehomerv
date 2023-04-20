<script lang="ts">
  import Carousel from "./Carousel.svelte";
  import TripPlan from "./TripPlan.svelte";
  import type { Unit } from "$lib/types";

  export let unitObject: Unit;
</script>

<div id="card-wrapper">
  <Carousel {unitObject} />

  <TripPlan {unitObject} />
</div>

<style>
  #card-wrapper {
    box-shadow: 0px 1px 2px grey;
    border-radius: 2px;
    margin: 25px 0 50px;
    background-color: hsl(var(--b1));
    position: relative;
    display: grid;
    grid-template-rows: 90vw 1fr;
    grid-template-columns: 1fr;
  }
  @media (max-width: 700px) {
    #card-wrapper {
      width: 90vw;
      min-height: 120vw;
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
