<script lang="ts">
  import type { Unit } from "$lib/types";
  import { unitStore } from "$lib/stores";
  import { page } from "$app/stores";
  import { beforeUpdate } from "svelte";
  import InformationContent from "./InformationContent.svelte";
  import PhotosContent from "./PhotosContent.svelte";
  import BookingsWrapper from "./BookingsWrapper.svelte";

  let unitObject: Unit | undefined;

  beforeUpdate(checkUnitSelected);

  function checkUnitSelected() {
    if ($unitStore.isPopulated) {
      unitObject = $unitStore.getUnit($page.params.unit_id);
      return;
    }

    setTimeout(checkUnitSelected, 200);
  }

  // options will need to be interpreted through the lense of the category
</script>

{#if unitObject}
  {#if $page.params.category == "information"}
    <InformationContent
      {unitObject}
      subcategory={$page.params.subcategory}
      option={$page.params.option}
    />
  {/if}
  {#if $page.params.category == "photos"}
    <PhotosContent
      {unitObject}
      subcategory={$page.params.subcategory}
      option={$page.params.option}
    />
  {/if}
  {#if $page.params.category == "bookings"}
    <BookingsWrapper
      {unitObject}
      subcategory={$page.params.subcategory}
      option={$page.params.option}
    />
  {/if}
{/if}

<style>
</style>
