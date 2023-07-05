<script lang="ts">
  import UnitSelection from "./UnitSelection.svelte";
</script>

<div class="units-container">
  <UnitSelection />
  <slot />
</div>

<style>
  .units-container {
    width: 100%;
    display: flex;
  }
</style>
