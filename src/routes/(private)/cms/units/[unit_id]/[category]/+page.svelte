<script lang="ts">
  import { page } from "$app/stores";

  import BookingsCategoryHome from "./BookingsCategoryHome.svelte";
  import InformationCategoryHome from "./InformationCategoryHome.svelte";
  import PhotosCategoryHome from "./PhotosCategoryHome.svelte";
</script>

<div class="category-overview-container">
  {#if $page.params.category == "bookings"}
    <BookingsCategoryHome />
  {/if}
  {#if $page.params.category == "photos"}
    <PhotosCategoryHome />
  {/if}
  {#if $page.params.category == "information"}
    <InformationCategoryHome />
  {/if}
</div>

<style>
  .category-overview-container {
    padding: 15px;
    font-family: cms-semibold;
  }
  @media (max-width: 500px) {
    .category-overview-container {
      width: 100%;
      max-height: 87%;
      overflow-y:scroll;
      border-bottom: 1px solid var(--p);
    }
  }
</style>
