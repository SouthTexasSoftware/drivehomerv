<!-- src/routes/cms/promotions/create/+page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import type { PromotionType } from "$lib/new_types/PromotionType";
  import { promotionStore } from "$lib/new_stores/promotionStore";
  import { alertStore } from "$lib/stores/alert";
  import { formatFirebaseTimestamp } from "$lib/helpers";
  import { waitForFirebase } from "$lib/new_stores/firebaseStore";

  let formData: Omit<
    PromotionType,
    "id" | "createdAt" | "usageCount" | "updatedAt"
  > = {
    code: "",
    name: "",
    discountType: "percentage",
    discountValue: 0,
    startDate: new Date().toISOString().split("T")[0],
    isActive: false,
    stackable: false,
    description: "",
    usageLimit: undefined,
    minimumPurchase: undefined,
    applicableUnits: undefined,
    customerEligibility: undefined,
    maxDiscount: undefined,
  };

  let editFormData: PromotionType | null = null;
  let editingId: string | null = null;
  let isLoading = true;
  let error: string | null = null;

  onMount(async () => {
    try {
      await waitForFirebase();
      await promotionStore.loadAll();
    } catch (err) {
      error = "Failed to initialize Firebase or load promotions";
      alertStore.error(error, 5000);
      console.error("Error in onMount:", err);
    } finally {
      isLoading = false;
    }
  });

  function isValidDate(dateInput: Date | string | undefined): boolean {
    if (!dateInput) return true;
    if (dateInput instanceof Date) {
      return !isNaN(dateInput.getTime());
    }
    const date = new Date(dateInput);
    return !isNaN(date.getTime());
  }

  async function createPromotion() {
    if (!isValidDate(formData.startDate) || !isValidDate(formData.endDate)) {
      alertStore.error("Invalid date format for Start Date or End Date", 5000);
      return;
    }
    await promotionStore.create(formData, true);
    formData = {
      code: "",
      name: "",
      discountType: "percentage",
      discountValue: 0,
      startDate: new Date().toISOString().split("T")[0],
      isActive: false,
      stackable: false,
      description: "",
      usageLimit: undefined,
      minimumPurchase: undefined,
      applicableUnits: undefined,
      customerEligibility: undefined,
      maxDiscount: undefined,
    };
  }

  function startEditing(promotion: PromotionType) {
    editFormData = {
      ...promotion,
      startDate:
        promotion.startDate instanceof Date
          ? promotion.startDate.toISOString().split("T")[0]
          : promotion.startDate,
      endDate: promotion.endDate
        ? promotion.endDate instanceof Date
          ? promotion.endDate.toISOString().split("T")[0]
          : promotion.endDate
        : "",
    };
    editingId = promotion.id;
  }

  async function updatePromotion() {
    if (editFormData && editingId) {
      if (
        !isValidDate(editFormData.startDate) ||
        !isValidDate(editFormData.endDate)
      ) {
        alertStore.error(
          "Invalid date format for Start Date or End Date",
          5000
        );
        return;
      }
      await promotionStore.update(editingId, editFormData, true);
      editFormData = null;
      editingId = null;
    }
  }

  async function deletePromotion(id: string) {
    await promotionStore.delete(id, true);
  }

  function cancelEdit() {
    editFormData = null;
    editingId = null;
  }
</script>

{#if isLoading}
  <div
    class="card-container rounded-md w-full max-w-2xl mx-auto p-6 flex flex-col shadow-md"
  >
    <p class="font-[cms-regular] text-sm text-gray-600">
      Loading promotions...
    </p>
  </div>
{:else if error}
  <div
    class="card-container rounded-md w-full max-w-2xl mx-auto p-6 flex flex-col shadow-md"
  >
    <p class="font-[cms-regular] text-sm text-red-600">{error}</p>
  </div>
{:else}
  {#if editFormData}
    <div class="bg-gray-100 p-4 rounded-md mb-6">
      <h2 class="font-[cms-semibold] text-lg mb-2">Edit Promotion</h2>
      <form
        on:submit|preventDefault={updatePromotion}
        class="flex flex-col gap-4"
      >
        <label class="flex flex-col">
          <span class="font-[cms-semibold] text-sm">Code</span>
          <input
            bind:value={editFormData.code}
            required
            class="mt-1 p-2 rounded border border-gray-300"
          />
        </label>
        <label class="flex flex-col">
          <span class="font-[cms-semibold] text-sm">Name</span>
          <input
            bind:value={editFormData.name}
            required
            class="mt-1 p-2 rounded border border-gray-300"
          />
        </label>
        <label class="flex flex-col">
          <span class="font-[cms-semibold] text-sm">Description</span>
          <textarea
            bind:value={editFormData.description}
            class="mt-1 p-2 rounded border border-gray-300"
          />
        </label>
        <label class="flex flex-col">
          <span class="font-[cms-semibold] text-sm">Discount Type</span>
          <select
            bind:value={editFormData.discountType}
            class="mt-1 p-2 rounded border border-gray-300"
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed</option>
          </select>
        </label>
        <label class="flex flex-col">
          <span class="font-[cms-semibold] text-sm">Discount Value</span>
          <input
            type="number"
            bind:value={editFormData.discountValue}
            required
            class="mt-1 p-2 rounded border border-gray-300"
          />
        </label>
        <label class="flex flex-col">
          <span class="font-[cms-semibold] text-sm">Start Date</span>
          <input
            type="date"
            bind:value={editFormData.startDate}
            required
            class="mt-1 p-2 rounded border border-gray-300"
          />
        </label>
        <label class="flex flex-col">
          <span class="font-[cms-semibold] text-sm">End Date</span>
          <input
            type="date"
            bind:value={editFormData.endDate}
            class="mt-1 p-2 rounded border border-gray-300"
          />
        </label>
        <label class="flex flex-col">
          <span class="font-[cms-semibold] text-sm">Usage Limit</span>
          <input
            type="number"
            bind:value={editFormData.usageLimit}
            class="mt-1 p-2 rounded border border-gray-300"
          />
        </label>
        <label class="flex flex-col">
          <span class="font-[cms-semibold] text-sm">Minimum Purchase</span>
          <input
            type="number"
            bind:value={editFormData.minimumPurchase}
            class="mt-1 p-2 rounded border border-gray-300"
          />
        </label>
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            bind:checked={editFormData.isActive}
            class="h-4 w-4"
          />
          <span class="font-[cms-semibold] text-sm">Active</span>
        </label>
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            bind:checked={editFormData.stackable}
            class="h-4 w-4"
          />
          <span class="font-[cms-semibold] text-sm">Stackable</span>
        </label>
        <div class="flex gap-2">
          <button
            type="submit"
            class="bg-[hsl(var(--p))] text-[hsl(var(--b1))] font-[cms-semibold] py-2 px-4 rounded mt-2"
            >Update Promotion</button
          >
          <button
            type="button"
            on:click={cancelEdit}
            class="bg-gray-400 text-gray-950 font-[cms-semibold] py-2 px-4 rounded mt-2"
            >Cancel</button
          >
        </div>
      </form>
    </div>
  {/if}
  <a href="/cms/promotions/create" class="ml-auto absolute top-0 right-0">
    <button
      class="bg-[hsl(var(--p))] text-[hsl(var(--b1))] font-[cms-semibold] py-2 px-4 rounded"
      >Create Promotion</button
    ></a
  >
  <div
    class="card-container mt-6 rounded-md w-full min-w-[90vw] max-w-2xl mx-auto p-6 flex flex-col shadow-md"
  >
    <div class="bg-gray-100 p-4 rounded-md">
      <h2 class="font-[cms-semibold] text-lg mb-2">All Promotions</h2>
      {#if $promotionStore.length === 0}
        <p class="font-[cms-regular] text-sm text-gray-600">
          No promotions found.
        </p>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-gray-200">
                <th class="font-[cms-semibold] text-sm p-2 text-left">Code</th>
                <th class="font-[cms-semibold] text-sm p-2 text-left">Name</th>
                <th class="font-[cms-semibold] text-sm p-2 text-left"
                  >Discount</th
                >
                <th class="font-[cms-semibold] text-sm p-2 text-left"
                  >Start Date</th
                >
                <th class="font-[cms-semibold] text-sm p-2 text-left"
                  >End Date</th
                >
                <th class="font-[cms-semibold] text-sm p-2 text-left"
                  >Created At</th
                >
                <th class="font-[cms-semibold] text-sm p-2 text-left"
                  >Updated At</th
                >
                <th class="font-[cms-semibold] text-sm p-2 text-left">Active</th
                >
                <th class="font-[cms-semibold] text-sm p-2 text-left"
                  >Actions</th
                >
              </tr>
            </thead>
            <tbody>
              {#each $promotionStore as promotion}
                <tr class="border-b border-gray-300">
                  <td class="font-[cms-regular] text-sm p-2"
                    >{promotion.code}</td
                  >
                  <td class="font-[cms-regular] text-sm p-2"
                    >{promotion.name}</td
                  >
                  <td class="font-[cms-regular] text-sm p-2">
                    {promotion.discountValue}
                    {promotion.discountType === "percentage" ? "%" : "$"}
                  </td>
                  <td class="font-[cms-regular] text-sm p-2">
                    {formatFirebaseTimestamp(promotion.startDate, true)}
                  </td>
                  <td class="font-[cms-regular] text-sm p-2">
                    {promotion.endDate
                      ? formatFirebaseTimestamp(promotion.endDate, true)
                      : "N/A"}
                  </td>
                  <td class="font-[cms-regular] text-sm p-2">
                    {formatFirebaseTimestamp(promotion.createdAt, true)}
                  </td>
                  <td class="font-[cms-regular] text-sm p-2">
                    {promotion.updatedAt
                      ? formatFirebaseTimestamp(promotion.updatedAt, true)
                      : "N/A"}
                  </td>
                  <td class="font-[cms-regular] text-sm p-2"
                    >{promotion.isActive ? "Yes" : "No"}</td
                  >
                  <td class="font-[cms-regular] text-sm p-2">
                    <button
                      on:click={() => startEditing(promotion)}
                      class="bg-[hsl(var(--p))] text-[hsl(var(--b1))] font-[cms-semibold] py-1 px-2 rounded mr-2"
                    >
                      Edit
                    </button>
                    <button
                      on:click={() => deletePromotion(promotion.id)}
                      class="bg-red-500 text-white font-[cms-semibold] py-1 px-2 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
{/if}
