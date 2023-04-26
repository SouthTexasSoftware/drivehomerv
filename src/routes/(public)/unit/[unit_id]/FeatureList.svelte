<script lang="ts">
  import type { Unit } from "$lib/types";
  // this will iterate the feature_list attribute

  export let unitObject: Unit;
</script>

<div class="feature-list-container">
  {#if unitObject.feature_list}
    {#each unitObject.feature_list as feature}
      <div class="feature-item">
        {@html feature.icon}
        <p>{feature.shorthand}</p>
      </div>
    {/each}
  {/if}
</div>

<style>
  .feature-list-container {
    display: grid;
    grid-template-columns: 1.3fr 0.7fr;
    grid-template-rows: repeat(2, 20px);
    row-gap: 20px;
    margin: -5px 40px 25px 40px;
  }
  .feature-item {
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }
  p {
    margin-left: 5px;
  }

  @media (max-width: 500px) {
  }

  @media (min-width: 500px) and (max-width: 1000px) {
  }

  @media (min-width: 1000px) {
  }
</style>
