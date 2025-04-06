<script lang="ts">
  import { goto } from "$app/navigation";
  import { unitStore } from "$lib/stores";

  if ($unitStore.units[0]) {
    goto("/cms/units/" + $unitStore.units[0].id + "/bookings");
  }
</script>

<style>
  @media (max-width: 1000px) {
  }
</style>
