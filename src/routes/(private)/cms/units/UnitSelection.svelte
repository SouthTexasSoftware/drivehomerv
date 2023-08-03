<script lang="ts">
  import { unitStore } from "$lib/stores";
  import { page } from "$app/stores";
  import { afterUpdate, beforeUpdate } from "svelte";

  $: categorySelected = $page.params.category
    ? $page.params.category
    : "information";

  // these are left out because they do not work with bookings..
  $: subcategorySelected = $page.params.subcategory
    ? "/" + $page.params.subcategory
    : "";

  $: optionSelected = $page.params.option ? "/" + $page.params.option : "";

  beforeUpdate(() => {
    if (categorySelected == "bookings") {
      subcategorySelected = "";
      optionSelected = "";
    }
  });
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
    {/if}
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
      height: 52px;
      display: flex;
      flex-direction: column;
      border: none;
      border-left: 2px solid var(--cms-boxShadow);
      border-top: 1px solid var(--cms-boxShadow);
      width: 200px;
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
      height: 52px !important;
      line-height: 52px;
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
</style>
