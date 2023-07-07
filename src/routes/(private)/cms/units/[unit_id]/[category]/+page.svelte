<script lang="ts">
  // we could show other stuff here for 'home' views of each category
  // mainly bookings, like add a booking, or a calendar view, etc.

  import { page } from "$app/stores";
</script>

<div class="category-overview-container">
  <p>unit specific {$page.params.category} overview page coming soon</p>
  <p>Please use Category Column to select next view.</p>
</div>

<style>
  .category-overview-container {
    padding: 15px;
    font-family: cms-semibold;
  }
</style>
