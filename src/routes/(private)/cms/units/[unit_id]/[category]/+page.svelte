<script lang="ts">
  import { page } from "$app/stores";

  import BookingsCategoryHome from "./BookingsCategoryHome.svelte";
</script>

<div class="category-overview-container">
  {#if $page.params.category == "bookings"}
    <BookingsCategoryHome />
  {/if}
</div>

<style>
  .category-overview-container {
    padding: 15px;
    font-family: cms-semibold;
  }
</style>
