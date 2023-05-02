<script lang="ts">
  import AddPhotos from "./AddPhotos.svelte";
  import UnitsTable from "./UnitsTable.svelte";

  let addPhotosKey = false;
</script>

<div class="units-container">
  <UnitsTable />
  {#key addPhotosKey}
    <AddPhotos
      on:refresh={() => {
        addPhotosKey = !addPhotosKey;
      }}
    />
  {/key}
</div>

<style>
  .units-container {
    /* background-color: lightblue; */
    width: 100%;
    padding: 25px;
    display: flex;
  }
</style>
