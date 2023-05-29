<script lang="ts">
  import type { Unit } from "$lib/types";
  import { unitStore } from "$lib/stores";
  import { page } from "$app/stores";
  import { beforeUpdate } from "svelte";
  import Information from "./Information.svelte";

  let unitObject: Unit | undefined;

  beforeUpdate(checkUnitSelected);

  function checkUnitSelected() {
    if ($unitStore.isPopulated) {
      unitObject = $unitStore.getUnit($page.params.unit_id);
      return;
    }

    setTimeout(checkUnitSelected, 200);
  }
</script>

<div class="category-container">
  <div class="options-column">
    {#if unitObject}
      <!-- render category selected options  -->
      {#if $page.params.category == "information"}
        <Information />
      {/if}
    {/if}
  </div>
  <slot />
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
</style>
