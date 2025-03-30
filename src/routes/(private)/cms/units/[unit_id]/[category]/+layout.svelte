<script lang="ts">
  import type { Unit } from "$lib/types";
  import { unitStore } from "$lib/stores";
  import { page } from "$app/stores";
  import { beforeUpdate } from "svelte";
  import CategoryColumn from "./CategoryColumn.svelte";
  import { afterNavigate } from "$app/navigation";

  let unitObject: Unit | undefined;

  let mobileHideOptions = true;

  beforeUpdate(checkUnitSelected);

  afterNavigate(() => {
    mobileHideOptions = false;
  });

  function checkUnitSelected() {
    if ($unitStore.isPopulated) {
      unitObject = $unitStore.getUnit($page.params.unit_id);

      return;
    }

    setTimeout(checkUnitSelected, 200);
  }
</script>

<div class="category-container">
  {#if unitObject}
    {#key $page.params.category}
      <div class="options-column" class:hide={mobileHideOptions}>
        <button
          class="mobile-show-button"
          on:click={() => (mobileHideOptions = !mobileHideOptions)}
        >
          {#if mobileHideOptions}
            Show
          {:else}
            Hide
          {/if}
          Options
        </button>

        <!-- render categorys subcategories and options  -->

        <CategoryColumn
          {unitObject}
          on:closeMobileColumn={() => {
            mobileHideOptions = true;
          }}
        />
      </div>
      <slot {unitObject} />
    {/key}
  {/if}
</div>

<style>
  .category-container {
    display: flex;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  .options-column {
    flex-direction: column;
    width: 300px;
    justify-content: flex-end;
    border-right: 1px solid var(--cms-boxShadow);
    overflow-y: scroll;
    padding-bottom: 30%;
    min-width: 300px;
    -ms-overflow-style: none; /* Internet Explorer 10+ */
    scrollbar-width: none; /* Firefox */
  }
  .options-column::-webkit-scrollbar {
    display: none;
  }
  .mobile-show-button {
    display: none;
  }

  @media (max-width: 500px) {
    .category-container {
      flex-direction: row-reverse;
      margin-top: 90px;
      scroll-behavior: none;
    }
    .category-container:last-child {
      width: 100vw !important;
    }
    .options-column {
      padding-bottom: 0%;
      display: flex;
      flex-direction: column-reverse;
      min-width: 230px;
      height: 70%;
      position: absolute;
      transition: all 0.3s;
      z-index: 5;
      bottom: 125px;
      justify-content: flex-start;
      border-right: none;
    }
    .options-column.hide {
      height: 36px;
    }
    :global(.options-column.hide .column-container) {
      display: none;
    }

    .mobile-show-button {
      display: block;
      font-family: cms-semibold;
      font-size: 15px;
      height: 25px;
      text-align: start;
      padding: 0 48px;
      margin-left: auto;
      background-color: hsl(var(--p));
      border-radius: 5px;
      color: white;
      margin-top: 20px;
    }
  }
</style>
