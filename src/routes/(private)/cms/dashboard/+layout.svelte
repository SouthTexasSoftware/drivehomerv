<script lang="ts">
  import { goto } from "$app/navigation";
  import { unitStore } from "$lib/stores";
  import DashboardColumn from "./DashboardColumn.svelte";

  goto("/cms/dashboard/revenue_reports");
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
    max-height: 100vh;
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
