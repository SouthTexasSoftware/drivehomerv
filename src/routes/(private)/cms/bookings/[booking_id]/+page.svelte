<script lang="ts">
  import { identity, onMount } from "svelte/internal";
  import BookingsWrapper from "../../units/[unit_id]/[category]/[subcategory]/[option]/BookingsWrapper.svelte";
  import { page } from "$app/stores";
  import { waitForFirebase } from "$lib/new_stores/firebaseStore";
  import { alertStore } from "$lib/stores/alert";
  import { cmsBookingFilterStore, unitStore } from "$lib/stores";
  import { goto } from "$app/navigation";

  //get page params and redirect to appropriate unit booking

  let bookingId = $page.params.booking_id;
  let isLoading = true;
  let error: string | null = null;

  onMount(async () => {
    try {
      await waitForFirebase();
      await delay(500);
      redirectToBookingPage();
    } catch (err) {
      error = "Failed to initialize Firebase or load promotions";
      alertStore.error(error, 5000);
      console.error("Error in onMount:", err);
    } finally {
      isLoading = false;
    }
  });

  function redirectToBookingPage() {
    unitStore.subscribe((storeData) => {
      if (storeData.units) {
        storeData.units.forEach((unitData) => {
          unitData.bookings?.forEach((booking) => {
            if (booking.id == bookingId) {
              goto(`/cms/units/${unitData.id}/bookings/${bookingId}/Overview`, {
                replaceState: true,
              });
            }
          });
        });
      }
    });
  }

  function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
</script>

{#if isLoading}
  <div class="spinner-container">
    <div class="spinner" />
    <p>Loading Booking Data . . .</p>
  </div>
{/if}

<!-- We'll probably import BookingsWrapper here

    might have to restructure the folders to use a similar method of

    subcategory = booking.identity

    option = "Overview, etc."

    put some similar style buttons up at the top of the page, to change from overview, photos, etc.

-->

<style>
  .spinner-container {
    margin: auto;
  }
  .spinner {
    content: "";
    border-radius: 50%;
    border-top: 2px solid hsl(var(--p));
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
    color: hsl(var(--p));
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
  @media (min-width: 700px) and (max-width: 1200px) {
  }

  @media (min-width: 1200px) and (max-width: 1800px) {
  }
  @media (min-width: 1800px) {
  }
</style>
