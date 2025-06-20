<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import { formatFirebaseTimestamp } from "$lib/helpers";
  import { firebaseStore, unitStore } from "$lib/stores";
  import type { Booking, Customer } from "$lib/types";
  import {
    collection,
    getDocs,
    query,
    Timestamp,
    where,
  } from "firebase/firestore";
  import { afterUpdate } from "svelte";
  import { writable } from "svelte/store";

  export let customer: Customer | undefined;

  afterUpdate(() => {
    preloadBookings(customer?.bookings);
  });

  // Store for lazy-loaded bookings
  const bookingCache = writable<Map<string, Booking | null>>(new Map());

  function preloadBookings(bookingIds: string[] | undefined) {
    if (!bookingIds || bookingIds.length === 0) return;
    const { units } = $unitStore;
    bookingCache.update((cache) => {
      const newCache = new Map(cache); // Create new Map to ensure reactivity
      for (const bookingId of bookingIds) {
        if (newCache.has(bookingId)) continue;
        for (const unit of units) {
          const booking = unit.bookings?.find((b) => b.id === bookingId);
          if (booking) {
            newCache.set(bookingId, booking);
            break;
          }
        }
      }
  
      return newCache;
    });
  }

  // Fetch booking on button click
  async function loadBooking(bookingId: string) {
    if ($bookingCache.has(bookingId)) return;
    const booking = await getBooking(bookingId);
    bookingCache.update((cache) => {
      cache.set(bookingId, booking ?? null);
      return cache;
    });
  }

  // Fetch a booking by ID, checking unitStore first, then Firebase
  export async function getBooking(
    bookingId: string
  ): Promise<Booking | undefined> {
    try {
      // Check unitStore first
      const { units } = $unitStore;
      for (const unit of units) {
        const booking = unit.bookings?.find((b) => b.id === bookingId);
        if (booking) {
          return booking; // Found in unitStore
        }
      }

      // Not found in unitStore, query Firestore
      const unitsCollection = collection($firebaseStore.db, "units");
      const unitsSnapshot = await getDocs(unitsCollection);

      for (const unitDoc of unitsSnapshot.docs) {
        const unitId = unitDoc.id;
        const bookingsCollection = collection(
          $firebaseStore.db,
          `units/${unitId}/bookings`
        );
        const bookingQuery = query(
          bookingsCollection,
          where("__name__", "==", bookingId)
        );
        const bookingSnapshot = await getDocs(bookingQuery);

        if (!bookingSnapshot.empty) {
          const bookingDoc = bookingSnapshot.docs[0];
          const bookingData: Booking = {
            id: bookingDoc.id,
            ...(bookingDoc.data() as Omit<Booking, "id">), // Spread all fields except id
          };
          // Optionally update unitStore with new booking
          unitStore.update((store) => {
            const unit = store.units.find((u) => u.id === unitId);
            if (unit) {
              // Ensure bookings is an array before spreading
              unit.bookings = [...(unit.bookings ?? []), bookingData];
            }
            return store;
          });
          return bookingData;
        }
      }

      // Booking not found
      return undefined;
    } catch (error) {
      console.error(`Error fetching booking ${bookingId}:`, error);
      return undefined;
    }
  }

  // Shorten booking ID for display (e.g., q01L9xYz7pQrStUv -> q01L...)
  function shortenId(id: string, length: number = 4): string {
    if (id.length <= length) return id;
    return `${id.slice(0, length)}...`;
  }


</script>

<div
  class="card-container rounded-md w-[400px] max-h-[90%] flex flex-col shadow-md"
>
  {#if customer}
    <div class="bg-gray-100 px-[8px] py-[10px]">
      <p class="font-[cms-semibold] text-sm">ID: {customer.id}</p>
    </div>
    <div class="bg-white p-[25px] flex flex-col">
      <p class="font-[cms-semibold] text-sm">Name:</p>
      <p class="font-[cms-regular]">
        {customer.first_name}
        {customer.last_name}
      </p>
      <div class="my-2"></div>
      <p class="font-[cms-semibold] text-sm">Email:</p>
      <p class="font-[cms-regular]">
        {customer.email}
      </p>
      <div class="my-2"></div>
      <p class="font-[cms-semibold] text-sm">Phone:</p>
      <p class="font-[cms-regular]">
        {customer.phone}
      </p>
      <div class="my-2"></div>
      <p class="font-[cms-semibold] text-sm">Created:</p>
      <p class="font-[cms-regular]">
        {formatFirebaseTimestamp(customer.created)}
      </p>
      <div class="my-2"></div>
      <p class="font-[cms-semibold] text-sm">Bookings:</p>

      <div class="flex flex-col">
        {#each customer.bookings ?? [] as bookingId}
          <div class="flex">
            {#if $bookingCache.has(bookingId)}
              {#if $bookingCache.get(bookingId)}
                {@const booking = $bookingCache.get(bookingId)}
                <a
                  href="/cms/units/{booking?.unit_id}/bookings/{booking?.id}/Overview"
                  class="bg-[hsl(var(--p))] font-semibold text-[hsl(var(--b1))] py-1 px-2 text-center self-start rounded border-radius-[4px] mt-2 ml-6 text-sm"
                >
                  View Booking: {shortenId(bookingId)}
                </a>
              {:else}
                <span class="ml-2 text-red-500">Booking not found</span>
              {/if}
            {:else}
              <button
                class="bg-gray-400 font-semibold text-gray-950 py-1 px-2 text-center self-start rounded border-radius-[4px] mt-2 ml-6 text-sm"
                on:click={() => loadBooking(bookingId)}
                disabled={$bookingCache.has(bookingId) &&
                  $bookingCache.get(bookingId) === null}
              >
                Load Booking: {shortenId(bookingId)}
              </button>
            {/if}
          </div>
        {/each}
      </div>

      <div class="my-2"></div>
    </div>
  {:else}
    <p>Customer not found</p>
  {/if}
</div>

<style>
</style>
