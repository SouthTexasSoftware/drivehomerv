<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  // shimmer loader of the '/' page within our extension
  // we can eventually make this a display of all the rentals, and a lookup feature for destination, passenger count etc

  onMount(() => {
    goto("/rentals");
  });
</script>

<style>
</style>
