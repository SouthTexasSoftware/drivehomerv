<script lang="ts">
  import { onMount } from "svelte";

  import AllBookingsCalendar from "./AllBookingsCalendar.svelte";
  import AllBookingsCalendarV2 from "./AllBookingsCalendarV2.svelte";

  let loadCalendar = false;

  onMount(() => {
    setTimeout(() => {
      loadCalendar = true;
    }, 200);
  });
</script>

{#if loadCalendar}
  <div class="page-container">
    <AllBookingsCalendarV2 />
  </div>
{:else}
  <div class="loading-container">
    <div class="spinner"></div>
    <div class="spinner-label">Starting Engine...</div>
  </div>
{/if}

<style>
  .page-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .loading-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .spinner-label {
    margin: auto auto auto 220px;
    font-family: cms-light;
    font-size: 12px;
    width: 150px;
    margin-top: 20px;
    text-align: center;
  }
  .spinner {
    content: "";
    border-radius: 50%;
    border-top: 2px solid var(--p);
    border-right: 2px solid transparent;
    animation-name: spinning;
    animation-duration: 1s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    opacity: 1;
    transition: all 0.2s;
    width: 100px;
    height: 100px;
    margin: auto auto 0 250px;
  }
  @keyframes spinning {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  @media (max-width: 1000px) {
    .page-container {
      height: 50vh;
      flex-direction: column;
      max-width: 100vw;
    }
    .loading-container {
      height: 50vh;
      width: 100vw;
    }
    .spinner {
      margin: auto auto 15px;
    }
    .spinner-label {
      margin: 5px auto auto;
    }
  }
</style>
