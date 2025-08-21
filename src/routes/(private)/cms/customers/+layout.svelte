<script lang="ts">
  import { customerStore, unitStore } from "$lib/stores";
  import { onMount } from "svelte";
  import CustomersColumn from "./CustomersColumn.svelte";
  import { populateCustomerStore } from "$lib/helpers";
  import {
    firebaseStore,
    waitForFirebase,
  } from "$lib/new_stores/firebaseStore";

  onMount(async () => {
    populateCustomerStore($firebaseStore);
  });
  
</script>

<div class="units-container">
  {#if $customerStore.isPopulated}
    <CustomersColumn />
    <slot />
  {:else}
    <div class="spinner-container">
      <div class="spinner" />
      <p>Loading Customer Data . . .</p>
    </div>
  {/if}
</div>

<style>
  .units-container {
    width: 100%;
    display: flex;
  }
  .spinner-container {
    margin: auto;
  }
  .spinner {
    content: "";
    border-radius: 50%;
    border-top: 2px solid var(--p);
    border-right: 2px solid transparent;
    animation-name: spinning;
    animation-duration: 1s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    opacity: 1;
    transition: all 0.2s;
    width: 150px;
    height: 150px;
  }
  p {
    color: var(--p);
    font-family: font-bold;
    margin-top: 20px;
  }
  @keyframes spinning {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
