<!-- src/routes/cms/promotions/create/+page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import type { PromotionType } from "$lib/new_types/PromotionType";
  import { promotionStore } from "$lib/new_stores/promotionStore";
  import { alertStore } from "$lib/stores/alert";
  import { waitForFirebase } from "$lib/new_stores/firebaseStore";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { unitStore } from "$lib/stores";
  import { formatFirebaseTimestamp, toDateInputString } from "$lib/helpers";
  import { Timestamp } from "firebase/firestore";

  let formData: PromotionType | null = null;
  let editingId: string | null = null;
  let isLoading = true;
  let error: string | null = null;

  onMount(async () => {
    try {
      await waitForFirebase();
      await promotionStore.loadAll();
      editingId = $page.params.promotion_id;
      let promo = await promotionStore.get(editingId);
      if (promo) {
        formData = {
          ...promo,
          startDate: toDateInputString(promo.startDate),
          endDate: toDateInputString(promo.endDate),
        };
      }
      console.log(formData);
    } catch (err) {
      error = "Failed to initialize Firebase or load promotions";
      alertStore.error(error, 5000);
      console.error("Error in onMount:", err);
    } finally {
      isLoading = false;
    }
  });

  async function updatePromotion() {
    if (formData && editingId) {
      await promotionStore.update(editingId, formData, true);
      formData = null;
      editingId = null;
    }
  }

  // Reactive variable to track "All Units" checkbox state
  let selectAllUnits = true;
  // Reactive variable to track individual unit selections
  let selectedUnitIds: string[] = [];

  // Initialize based on formData.applicableUnits
  function initializeUnitsSelection() {
    if (formData!.applicableUnits?.includes("all")) {
      selectAllUnits = true;
      selectedUnitIds = [];
    } else if (
      formData!.applicableUnits &&
      formData!.applicableUnits.length > 0
    ) {
      selectAllUnits = false;
      selectedUnitIds = [...formData!.applicableUnits];
    } else {
      // Handle null/undefined/empty case
      selectAllUnits = true;
      selectedUnitIds = [];
      formData!.applicableUnits = ["all"];
    }
  }

  // Run initialization when component mounts or formData changes
  $: if (formData) {
    if (formData.applicableUnits) {
      initializeUnitsSelection();
    }
  }

  // Function to update applicableUnits based on checkbox states
  function updateApplicableUnits() {
    if (selectAllUnits) {
      formData!.applicableUnits = ["all"];
      selectedUnitIds = []; // Clear individual selections
    } else {
      formData!.applicableUnits = selectedUnitIds;
    }
  }

  // Handle "All Units" checkbox change
  function handleAllUnitsChange(event: Event) {
    selectAllUnits = (event.target as HTMLInputElement).checked;
    updateApplicableUnits();
  }

  // Handle individual unit checkbox change
  function handleUnitChange(unitId: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      selectedUnitIds = [...selectedUnitIds, unitId];
    } else {
      selectedUnitIds = selectedUnitIds.filter((id) => id !== unitId);
    }
    // If any unit is selected, ensure "All Units" is unchecked
    if (selectedUnitIds.length > 0) {
      selectAllUnits = false;
    }
    updateApplicableUnits();
  }
</script>

{#if isLoading || formData == null}
  <div
    class="card-container rounded-md w-full max-w-2xl mx-auto p-6 flex flex-col shadow-md"
  >
    <p class="font-[cms-regular] text-sm text-gray-600">Loading Promotion...</p>
  </div>
{:else if error}
  <div
    class="card-container rounded-md w-full max-w-2xl mx-auto p-6 flex flex-col shadow-md"
  >
    <p class="font-[cms-regular] text-sm text-red-600">{error}</p>
  </div>
{:else}
  <a
    href="/cms/promotions"
    id="back-button"
    class="ml-auto absolute top-0 right-0"
  >
    <button
      class="bg-[hsl(var(--p))] text-[hsl(var(--b1))] font-[cms-semibold] py-2 px-4 rounded"
      ><svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="lucide lucide-undo2-icon lucide-undo-2"
        ><path d="M9 14 4 9l5-5" /><path
          d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"
        /></svg
      ></button
    ></a
  >
  <div class="flex gap-6">
    <!-- MAIN FORM -->
    <div
      class="card-container mt-6 rounded-md w-full max-w-2xl mx-auto p-6 flex flex-col shadow-md"
    >
      <div class=" p-4 rounded-md mb-6">
        <h2 class="font-[cms-semibold] text-xl mb-2">Update Promotion</h2>
        <form
          on:submit|preventDefault={updatePromotion}
          class="flex flex-col gap-4"
        >
          <div class="flex gap-8" id="columns-container">
            <div class="flex flex-col gap-4" id="left-column">
              <label class="flex flex-col">
                <span class="font-[cms-semibold] text-sm">Code*</span>
                <input
                  bind:value={formData.code}
                  required
                  class="mt-1 p-2 rounded border border-gray-300"
                  placeholder="SAVE10"
                />
              </label>
              <label class="flex flex-col">
                <span class="font-[cms-semibold] text-sm">Name*</span>
                <input
                  bind:value={formData.name}
                  required
                  class="mt-1 p-2 rounded border border-gray-300"
                  placeholder="10% Off"
                />
              </label>
              <label class="flex flex-col">
                <span class="font-[cms-semibold] text-sm">Description</span>
                <textarea
                  bind:value={formData.description}
                  class="mt-1 p-2 rounded border border-gray-300"
                />
              </label>
              <label class="flex flex-col">
                <span class="font-[cms-semibold] text-sm">Discount Type</span>
                <select
                  bind:value={formData.discountType}
                  class="mt-1 p-2 rounded border border-gray-300"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed</option>
                </select>
              </label>
              <label class="flex flex-col">
                <span class="font-[cms-semibold] text-sm"
                  >Discount Value {#if formData.discountType == "percentage"}(%){:else}($)
                  {/if}</span
                >
                <input
                  type="number"
                  bind:value={formData.discountValue}
                  required
                  class="mt-1 p-2 rounded border border-gray-300"
                />
              </label>
              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  bind:checked={formData.isActive}
                  class="h-5 w-5"
                />
                <span class="font-[cms-semibold] text-md">Active</span>
              </label>
              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  bind:checked={formData.stackable}
                  class="h-5 w-5"
                />
                <span class="font-[cms-semibold] text-md">Stackable</span>
              </label>
            </div>
            <div class="flex flex-col gap-4" id="right column">
              <label class="flex flex-col">
                <span class="font-[cms-semibold] text-sm">Start Date</span>
                <input
                  type="date"
                  bind:value={formData.startDate}
                  required
                  class="mt-1 p-2 rounded border border-gray-300"
                />
              </label>
              <label class="flex flex-col">
                <span class="font-[cms-semibold] text-sm">End Date</span>
                <input
                  type="date"
                  bind:value={formData.endDate}
                  class="mt-1 p-2 rounded border border-gray-300"
                />
              </label>
              <label class="flex flex-col">
                <span class="font-[cms-semibold] text-sm">Usage Limit</span>
                <input
                  type="number"
                  bind:value={formData.usageLimit}
                  class="mt-1 p-2 rounded border border-gray-300"
                />
              </label>
              <label class="flex flex-col">
                <span class="font-[cms-semibold] text-sm">Minimum Purchase</span
                >
                <input
                  type="number"
                  bind:value={formData.minimumPurchase}
                  class="mt-1 p-2 rounded border border-gray-300"
                />
              </label>
              <label class="flex flex-col">
                <span class="font-[cms-semibold] text-sm">Minimum Nights</span>
                <input
                  type="number"
                  bind:value={formData.minimumNights}
                  class="mt-1 p-2 rounded border border-gray-300"
                />
              </label>
            </div>
          </div>
          <button
            type="submit"
            class="bg-[hsl(var(--p))] text-[hsl(var(--b1))] font-[cms-semibold] py-2 px-4 rounded mt-2"
            >Update</button
          >
        </form>
      </div>
    </div>
    <!-- UNITS SELECTION -->
    <div
      class="card-container mt-6 rounded-md w-[500px] mx-auto p-6 flex flex-col shadow-md gap-4"
    >
      <div class="p-4 rounded-md mb-0">
        <h2 class="font-[cms-semibold] text-xl mb-0">Applicable Units</h2>
      </div>
      <label class="flex items-center gap-2 ml-6">
        <input
          type="checkbox"
          class="h-4 w-4"
          checked={selectAllUnits}
          on:change={handleAllUnitsChange}
        />
        <span class="font-[cms-semibold] text-md">All Units</span>
      </label>
      <div class="w-60 h-[1px] bg-slate-200 ml-8"></div>
      {#if !selectAllUnits}
        {#each $unitStore.units as unit}
          <label class="flex items-center gap-2 ml-6">
            <input
              type="checkbox"
              class="h-4 w-4"
              checked={selectedUnitIds.includes(unit.id)}
              on:change={(event) => handleUnitChange(unit.id, event)}
              disabled={selectAllUnits}
            />
            <span class="font-[cms-semibold] text-sm">{unit.name}</span>
          </label>
        {/each}
      {/if}
    </div>
  </div>
{/if}
