<!-- src/lib/components/Alert.svelte -->
<script lang="ts">
  import { alertStore } from "$lib/stores/alert";
  import { fade } from "svelte/transition";

  const typeStyles = {
    success: "bg-green-50 text-green-800 border-green-200",
    info: "bg-blue-50 text-blue-800 border-blue-200",
    warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
    error: "bg-red-50 text-red-800 border-red-200",
  };
</script>

<div class="fixed top-4 right-4 z-50 space-y-2">
  {#each $alertStore as alert (alert.id)}
    <div
      transition:fade={{ duration: 300 }}
      class="{typeStyles[
        alert.type
      ]} border rounded-md px-4 py-2 text-sm shadow-sm max-w-sm"
      role="alert"
    >
      <div class="flex items-center justify-between">
        <span>{alert.message}</span>
        <button
          class="ml-3 text-gray-500 hover:text-gray-700 text-lg leading-none"
          on:click={() => alertStore.remove(alert.id)}
        >
          ×
        </button>
      </div>
    </div>
  {/each}
</div>
