<script lang="ts">
  import { unitStore } from "$lib/stores";
</script>

<div class="table-container">
  <h4>Units Table</h4>
  <div class="table-header">
    <p class="col-title">Name</p>
    <p class="col-title">ID</p>
    <p class="col-title">Links</p>
    <p class="col-title" />
  </div>

  {#if $unitStore != undefined}
    {#each $unitStore as unit}
      <div class="table-row">
        <p class="col-data">{unit.name}</p>

        <p class="col-data">{unit.id}</p>
        <a href="/cms/units/edit/{unit.id}" class="col-data">Edit</a>
        <a href="/unit/{unit.id}" class="col-data">Live</a>
      </div>
    {/each}
  {/if}
</div>

<style>
  .table-container {
    /* background-color: lightblue; */
    width: 100%;
    max-width: 600px;
    height: auto;
    padding: 25px;
    display: flex;
    flex-direction: column;
  }
  h4 {
    text-align: center;
    font-size: 20px;
  }
  .table-header,
  .table-row {
    display: grid;
    grid-template-columns: 100px 1fr repeat(2, 75px);
  }
  .table-header {
    border-bottom: 1px solid hsl(var(--b3));
    padding: 0 10px;
  }
  .table-row {
    height: 25px;
    border: 1px solid hsl(var(--b2));
    border-radius: 4px;
    padding: 5px;
    height: 40px;
    margin: 5px 10px;
  }
  .col-data,
  .col-title {
    margin: 0 10px;
  }
  a {
    border: 1px solid hsl(var(--b3));
    border-radius: 4px;
    padding: 0 5px;
    text-align: center;
    background-color: hsl(var(--b2));
  }
</style>
