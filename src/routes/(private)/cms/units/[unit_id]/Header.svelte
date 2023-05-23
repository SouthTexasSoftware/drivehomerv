<script lang="ts">
  import type { Unit } from "$lib/types";

  export let unitObject: Unit;
</script>

<div class="header-container">
  <h1>
    {unitObject.name}
  </h1>
  <p class="api-id">API ID: {unitObject.id}</p>
</div>

<style>
  .header-container {
    padding: 25px;
  }
  h1 {
    font-family: cms-bold;
    color: var(--cms-text);
    font-size: 40px;
  }
  p {
    font-family: cms-light;
    font-size: 14px;
  }
</style>
