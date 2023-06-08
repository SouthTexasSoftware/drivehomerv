<script lang="ts">
  import { unitStore } from "$lib/stores";
  import type { Unit } from "$lib/types";
  import { page } from "$app/stores";

  $: categorySelected = $page.params.category
    ? $page.params.category
    : "information";

  $: subcategorySelected = $page.params.subcategory
    ? "/" + $page.params.subcategory
    : "";

  $: optionSelected = $page.params.option ? "/" + $page.params.option : "";
</script>

<div class="unit-selection-container">
  <h2>Units</h2>
  <div class="divider" />
  <div class="unit-links">
    {#if $unitStore.isPopulated}
      {#each $unitStore.units as unit}
        <a
          href="/cms/units/{unit.id}/{categorySelected}{subcategorySelected}{optionSelected}"
          class:active={$page.url.pathname.includes(unit.id)}>{unit.name}</a
        >
      {/each}
    {:else}
      <div class="spinner" />
    {/if}
    <a class="create-link" href="/cms/units/create">+ Create Unit</a>
  </div>
</div>

<style>
  .unit-selection-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--cms-boxShadow);
    width: 250px;
  }
  .unit-links {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  h2 {
    font-family: cms-bold;
    color: var(--cms-text);
    font-size: 24px;
    margin: 100px 20px 0px 20px;
  }
  .divider {
    margin: 0 0 20px 20px;
    width: 25%;
  }
  a {
    font-family: cms-medium;
    color: var(--cms-text);
    padding: 10px 40px 10px 20px;
    width: 250px;
    transition: all 0.3s;
  }
  a.create-link {
    color: hsl(var(--p));
    font-family: cms-semibold;
  }
  a.active {
    background-color: var(--cms-highlightPrimary);
    border-right: 3px solid hsl(var(--p));
  }

  @media (max-width: 1000px) {
    .unit-selection-container {
      height: 60px;
      display: flex;
      flex-direction: column;
      border: none;
      border-left: 2px solid var(--cms-boxShadow);
      border-top: 1px solid var(--cms-boxShadow);
      width: 145px;
      position: fixed;
      bottom: 60px;
      right: 0;
      background-color: transparent;
      overflow: scroll;
      scroll-snap-type: y mandatory;
      /* z-index: 10; */
    }
    h2,
    .divider {
      display: none;
    }
    .unit-links {
      position: relative;
      width: 100%;
      height: auto;
      /* overflow-y: scroll; */
      scroll-snap-type: y mandatory;
      background-color: transparent;
      gap: 0;
    }
    a {
      font-family: cms-bold;
      color: var(--cms-text);
      width: 100%;
      padding-right: 20px;
      font-size: 20px;
      height: 60px !important;
      line-height: 60px;
      padding: 0;
      /* margin-right: 40px; */
      overflow: clip;
      scroll-snap-align: start;
      text-align: center;
    }
    a.active {
      background-color: transparent;
      border: none;
      text-decoration: underline;
      text-decoration-color: hsl(var(--p));
      text-decoration-thickness: 3px;
    }
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
    width: 30px;
    height: 30px;
    margin: 25px;
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
