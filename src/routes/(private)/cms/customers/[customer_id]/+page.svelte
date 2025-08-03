<script lang="ts">
  import type { PageData } from "./$types";
  import CustomerCard from "./CustomerCard.svelte";
  import { beforeUpdate, onMount } from "svelte";
  import { customerStore } from "$lib/stores";
  import { firebaseStore } from "$lib/new_stores/firebaseStore";
  import PageDataLoading from "$lib/components/PageDataLoading.svelte";
  import { afterNavigate } from "$app/navigation";
  import { Timestamp } from "firebase/firestore";
  import type { Customer } from "$lib/new_types/CustomerType";

  export let data: PageData;
  let customer: Customer | undefined;
  let loading = true;
  let error: string | null = null;
  let lastCustomerId: string | undefined; // Track last fetched ID

  // Fetch customer when customer_id changes
  async function fetchCustomer(customerId: string) {
    if (customerId === lastCustomerId) return; // Skip if same ID
    loading = true;
    error = null;
    customer = await $customerStore.getCustomer(customerId, $firebaseStore);
    if (!customer) {
      error = `Customer with ID ${customerId} not found`;
    }
    lastCustomerId = customerId; // Update last fetched ID
    loading = false;
  }

  // Initial fetch
  fetchCustomer(data.customer_id);

  // Refetch on navigation when customer_id changes
  afterNavigate((navigation) => {
    // Check if navigation.to exists and has params
    if (navigation.to?.params && "customer_id" in navigation.to.params) {
      const newCustomerId = navigation.to.params.customer_id as string;
      fetchCustomer(newCustomerId);
    }
  });
</script>

<div class="p-[25px] w-full flex flex-col border-b-1">
  <h1 class="font-[cms-bold] text-3xl pt-16 pb-6">Customer Details</h1>
  {#if loading}
    <p class="font-[cms-light]">Loading...</p>
  {:else if error}
    <p class="font-[cms-regular] text-red-800">Error: {error}</p>
  {:else if customer}
    <CustomerCard {customer}></CustomerCard>
    <!-- Add other fields -->
  {:else}
    <p>Customer not found</p>
  {/if}
</div>
