<script lang="ts">
  import { unitStore } from "$lib/stores";
  import DashboardColumn from "./DashboardColumn.svelte";

  /*TODO: use my custom calendar to improve this page.
   * goal: calendar where units can be toggled on / off
   *     bookings are selectable and then show the booking information off to the side
   *
   */
</script>

<div class="units-container">
  {#if $unitStore.isPopulated}
    <DashboardColumn />
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
