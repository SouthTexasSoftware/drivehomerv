<script lang="ts">
  import { onMount } from "svelte";
  import type {
    PromotionType,
    PromotionUsage,
  } from "$lib/new_types/PromotionType";
  import { promotionStore } from "$lib/new_stores/promotionStore";
  import { alertStore } from "$lib/stores/alert";
  import { formatFirebaseTimestamp } from "$lib/helpers";
  import {
    firebaseStore,
    waitForFirebase,
  } from "$lib/new_stores/firebaseStore";
  import { Timestamp } from "firebase/firestore";
  import { customerStore } from "$lib/stores";

  let isLoading = true;
  let error: string | null = null;

  let loadingUsedList = true;
  let usedPromotionsList: ExtendedPromotionUsage[] = [];

  onMount(async () => {
    try {
      await waitForFirebase();
      await promotionStore.loadAll();
      usedPromotionsList = buildRecentlyUsedList($promotionStore, 10);
      loadingUsedList = false;
    } catch (err) {
      error = "Failed to initialize Firebase or load promotions";
      alertStore.error(error, 5000);
      console.error("Error in onMount:", err);
    } finally {
      isLoading = false;
    }
  });

  async function deletePromotion(id: string) {
    await promotionStore.delete(id, true);
  }

  // Helper function to format applicableUnits for display
  function formatApplicableUnits(applicableUnits?: string[]): string {
    if (!applicableUnits || applicableUnits.length === 0) {
      return "None";
    }
    if (applicableUnits.includes("all")) {
      return "All";
    }
    return applicableUnits.length.toString();
  }

  // Helper function to convert Timestamp or string to Date
  function toDate(timestamp: Timestamp | string): Date {
    if (typeof timestamp === "string") {
      return new Date(timestamp);
    }
    return timestamp.toDate();
  }

  interface ExtendedPromotionUsage extends PromotionUsage {
    promotionCode: string;
    promotionName: string;
  }

  function buildRecentlyUsedList(
    promotions: PromotionType[],
    limit: number = Infinity
  ): ExtendedPromotionUsage[] {
    // Create temporary array of all usage entries with promotion data
    const allUsages: ExtendedPromotionUsage[] = promotions
      .filter(
        (promo) => promo.promotionUsage && promo.promotionUsage.length > 0
      )
      .flatMap((promo) =>
        promo.promotionUsage!.map((usage) => ({
          ...usage,
          promotionCode: promo.code,
          promotionName: promo.name,
        }))
      );

    // Sort by timestamp (most recent first)
    return allUsages
      .sort(
        (a, b) =>
          toDate(b.usedTimestamp).getTime() - toDate(a.usedTimestamp).getTime()
      )
      .slice(0, limit);
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
  <a href="/cms/promotions/create" class="ml-auto absolute top-0 right-0">
    <button
      class="bg-[hsl(var(--p))] text-[hsl(var(--b1))] font-[cms-semibold] py-2 px-4 rounded"
      >Create Promotion</button
    ></a
  >
  <div
    class="card-container mt-6 rounded-md w-full min-w-[90vw] max-w-2xl mx-auto p-6 flex flex-col shadow-md"
  >
    <div class="p-4 rounded-md">
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
                  >Created</th
                >
                <th class="font-[cms-semibold] text-sm p-2 text-left"
                  >Updated</th
                >
                <th class="font-[cms-semibold] text-sm p-2 text-left"
                  >For Units</th
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
                  <td class="font-[cms-regular] text-sm p-2">
                    {formatApplicableUnits(promotion.applicableUnits)}
                  </td>
                  <td class="font-[cms-regular] text-sm p-2">
                    <p
                      class="rounded-md bg-green-200 p-2 w-fit"
                      class:bg-red-200={!promotion.isActive}
                    >
                      {promotion.isActive ? "Yes" : "No"}
                    </p>
                  </td>
                  <td class="font-[cms-regular] text-sm p-2">
                    <a href="/cms/promotions/edit/{promotion.id}">
                      <button
                        class="bg-[hsl(var(--p))] text-[hsl(var(--b1))] font-[cms-semibold] py-1 px-2 rounded mr-2"
                      >
                        Edit
                      </button>
                    </a>
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
{#if loadingUsedList}
  <div
    class="card-container rounded-md w-full max-w-2xl mx-auto p-6 flex flex-col shadow-md"
  >
    <p class="font-[cms-regular] text-sm text-gray-600">
      Recently Used Loading...
    </p>
  </div>
{:else if error}
  <div
    class="card-container rounded-md w-full max-w-2xl mx-auto p-6 flex flex-col shadow-md"
  >
    <p class="font-[cms-regular] text-sm text-red-600">{error}</p>
  </div>
{:else}
  <div
    class="card-container mt-6 rounded-md w-full min-w-[90vw] max-w-2xl mx-auto p-6 flex flex-col shadow-md"
  >
    <div class="p-4 rounded-md">
      <h2 class="font-[cms-semibold] text-lg mb-2">Recently Used</h2>
      {#if usedPromotionsList.length === 0}
        <p class="font-[cms-regular] text-sm text-gray-600">
          No promotions to use yet.
        </p>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-gray-200">
                <th class="font-[cms-semibold] text-sm p-2 text-left">Code</th>
                <th class="font-[cms-semibold] text-sm p-2 text-left">Name</th>
                <th class="font-[cms-semibold] text-sm p-2 text-left"
                  >Used On</th
                >
                <th class="font-[cms-semibold] text-sm p-2 text-left"
                  >Customer</th
                >
                <th class="font-[cms-semibold] text-sm p-2 text-left"
                  >Booking</th
                >
              </tr>
            </thead>
            <tbody>
              {#each usedPromotionsList as usedPromotion}
                <tr class="border-b border-gray-300">
                  <td class="font-[cms-regular] text-sm p-2"
                    >{usedPromotion.promotionCode}</td
                  >
                  <td class="font-[cms-regular] text-sm p-2"
                    >{usedPromotion.promotionName}</td
                  >
                  <td class="font-[cms-regular] text-sm p-2">
                    {formatFirebaseTimestamp(usedPromotion.usedTimestamp, true)}
                  </td>
                  <td class="font-[cms-regular] text-sm p-2"
                    ><a
                      href="/cms/customers/{usedPromotion.customerId}"
                      class="underline text-red-800"
                      >{usedPromotion.customerId}</a
                    ></td
                  >
                  <td class="font-[cms-regular] text-sm p-2"
                    ><a
                      href="/cms/bookings/{usedPromotion.bookingId}"
                      class="underline text-red-800"
                      >{usedPromotion.bookingId}</a
                    ></td
                  >
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
{/if}
