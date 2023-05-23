<script lang="ts">
  import Header from "./Header.svelte";
  import CategoryBar from "./CategoryBar.svelte";
  import { beforeUpdate } from "svelte";
  import type { Unit } from "$lib/types";
  import { unitStore } from "$lib/stores";
  import { page } from "$app/stores";

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

<section>
  {#if unitObject}
    <div class="header-container">
      <CategoryBar {unitObject} />
      <Header {unitObject} />
    </div>
    <slot {unitObject} />
  {/if}
</section>

<style>
  section {
    width: 100%;
    display: flex;
    flex-direction: column;
  }
  .header-container {
    width: 100%;
    display: flex;
    border-bottom: 1px solid var(--cms-boxShadow);
  }
</style>
