<script lang="ts">
  import { onMount } from "svelte";

  import AllBookingsCalendar from "./AllBookingsCalendar.svelte";

  let loadCalendar = false;

  onMount(() => {
    setTimeout(() => {
      loadCalendar = true;
    }, 200);
  });
</script>

{#if loadCalendar}
<div class="page-container">
  <AllBookingsCalendar />
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
    border-top: 2px solid hsl(var(--p));
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
  @media (min-width: 700px) and (max-width: 1200px) {
  }

  @media (min-width: 1200px) and (max-width: 1800px) {
  }
  @media (min-width: 1800px) {
  }
</style>
