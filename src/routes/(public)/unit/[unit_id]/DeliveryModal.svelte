<!-- src/components/MapModal.svelte -->
<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let unitObject: {
    information: {
      rates_and_fees: {
        delivery: {
          tier_1_miles: string; // e.g., "10"
          tier_1_fee: string; // e.g., "149"
          tier_2_miles: string; // e.g., "25"
          tier_2_fee: string; // e.g., "249"
          tier_3_miles: string; // e.g., "50"
          tier_3_fee: string; // e.g., "349"
        };
      };
    };
  };

  const dispatch = createEventDispatcher();

  let startLocation = { lat: 41.646900346283076, lng: -74.10566635807811 };
  let distance: string | null = null;
  let addressInputValue: string = "";
  let isLoading: boolean = false;
  let exceedsMax: boolean | null = null;
  let priceForDeliveryAndPickup: number | null = null;

  // Extract tier values and convert to numbers
  const {
    tier_1_miles,
    tier_1_fee,
    tier_2_miles,
    tier_2_fee,
    tier_3_miles,
    tier_3_fee,
  } = unitObject.information.rates_and_fees.delivery;

  // Parse strings to numbers
  const tier1Miles = parseFloat(tier_1_miles);
  const tier1Fee = parseFloat(tier_1_fee);
  const tier2Miles = parseFloat(tier_2_miles);
  const tier2Fee = parseFloat(tier_2_fee);
  const tier3Miles = parseFloat(tier_3_miles);
  const tier3Fee = parseFloat(tier_3_fee);

  async function getCalculatedDistance() {
    if (!addressInputValue) {
      distance = "Please enter an address";
      exceedsMax = null;
      priceForDeliveryAndPickup = null;
      return;
    }

    isLoading = true;
    try {
      const response = await fetch("/api/maps/getDistance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startLat: startLocation.lat,
          startLng: startLocation.lng,
          endAddress: addressInputValue,
        }),
      });

      const data = await response.json();

      if (data.distance) {
        distance = data.distance;
        const distanceValue = parseFloat(
          distance.split(" ")[0].replace(/,/g, "")
        );

        // Determine tier and set price using parsed numbers
        if (distanceValue <= tier1Miles) {
          priceForDeliveryAndPickup = tier1Fee;
          exceedsMax = false;
        } else if (distanceValue <= tier2Miles) {
          priceForDeliveryAndPickup = tier2Fee;
          exceedsMax = false;
        } else if (distanceValue <= tier3Miles) {
          priceForDeliveryAndPickup = tier3Fee;
          exceedsMax = false;
        } else {
          priceForDeliveryAndPickup = null;
          exceedsMax = true;
        }

        // console.log(
        //   "Distance:",
        //   distance,
        //   "Parsed Distance:",
        //   distanceValue,
        //   "Tier 1 (miles/fee):",
        //   tier1Miles,
        //   tier1Fee,
        //   "Tier 2 (miles/fee):",
        //   tier2Miles,
        //   tier2Fee,
        //   "Tier 3 (miles/fee):",
        //   tier3Miles,
        //   tier3Fee,
        //   "Exceeds Max:",
        //   exceedsMax,
        //   "Price for Delivery/Pickup:",
        //   priceForDeliveryAndPickup
        // );
      } else {
        distance = `Error: ${data.error || "Unknown error"}`;
        exceedsMax = null;
        priceForDeliveryAndPickup = null;
      }
    } catch (error) {
      distance = "Error fetching distance";
      exceedsMax = null;
      priceForDeliveryAndPickup = null;
      console.error(error);
    } finally {
      isLoading = false;
    }
  }

  function cancelDelivery() {
    dispatch("cancel", true);
  }

  function addDelivery() {
    dispatch("add", {
      distance, // Fixed typo from .Distance
      address: addressInputValue,
      price_for_delivery: priceForDeliveryAndPickup?.toFixed(2),
    });
  }
</script>

<div
  class="relative z-[200]"
  aria-labelledby="modal-title"
  role="dialog"
  aria-modal="true"
>
  <div
    class="fixed inset-0 bg-gray-500/75 transition-opacity"
    aria-hidden="true"
  ></div>

  <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
    <div
      class="flex min-h-full items-center justify-center p-4 text-center sm:p-0"
    >
      <div
        class="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md"
      >
        <div class="px-6 pt-6 pb-4">
          <h3
            class="text-lg font-semibold text-gray-900 text-center"
            id="modal-title"
          >
            Add Delivery & Pick-up
          </h3>
          <div class="mt-4">
            <p class="text-base text-gray-600">
              Enter address for an estimate:
            </p>
            <div class="input-group mt-2">
              <input
                type="text"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:border-[#ae2623] focus:outline-none disabled:bg-gray-100"
                id="maps-input"
                name="maps-input"
                bind:value={addressInputValue}
                placeholder="Enter destination address"
                disabled={isLoading}
                class:input-error={!addressInputValue && distance}
              />
              <button
                type="button"
                class="mt-2 w-full bg-[#ae2623] text-white px-4 py-2 rounded-md hover:bg-[#8e1f1d] disabled:bg-gray-400 sm:mt-0 sm:w-auto"
                on:click={getCalculatedDistance}
                disabled={isLoading}
              >
                {#if isLoading}
                  Calculating...
                {:else}
                  Calculate
                {/if}
              </button>
            </div>
            <p class="text-base text-gray-600 mt-2">
              Maximum delivery/pickup distance: <span class="font-bold"
                >{tier_3_miles}</span
              > miles
            </p>
            {#if distance}
              <div class="result mt-4">
                <p class="text-gray-700">
                  Distance: <span class="font-semibold text-[#ae2623]"
                    >{distance}</span
                  >
                  {#if exceedsMax === false}
                    <span class="checkmark">✔</span>
                  {/if}
                </p>
                {#if exceedsMax !== null}
                  {#if exceedsMax}
                    <p class="mt-2 text-sm warning">
                      Exceeds max delivery distance of {tier_3_miles} miles
                    </p>
                  {/if}
                  {#if !exceedsMax && priceForDeliveryAndPickup !== null}
                    <p class="mt-2 text-base text-gray-700">
                      Delivery/Pickup Cost: <span
                        class="font-semibold text-[#ae2623]"
                        >${(priceForDeliveryAndPickup || 0).toFixed(2)}</span
                      >
                    </p>
                  {/if}
                {/if}
              </div>
            {/if}
          </div>
        </div>
        <div
          class="bg-gray-50 mt-6 px-6 py-4 sm:flex sm:flex-row-reverse sm:gap-3 sm:mt-0"
        >
          <button
            type="button"
            class="w-full bg-[#ae2623] text-white px-4 py-2 rounded-md hover:bg-[#8e1f1d] disabled:bg-[#ae2623]/50 disabled:cursor-not-allowed sm:w-auto"
            on:click={addDelivery}
            disabled={exceedsMax !== false || isLoading}
          >
            Add
          </button>
          <button
            type="button"
            class="w-full mt-4 bg-white text-gray-900 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100 sm:w-auto sm:mt-0"
            on:click={cancelDelivery}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  @media (min-width: 640px) {
    .input-group {
      flex-direction: row;
      align-items: center;
    }
  }

  .input-error {
    border-color: #ef4444;
  }

  .result {
    text-align: center;
  }

  .warning {
    color: #ef4444;
    font-weight: 500;
  }

  .checkmark {
    color: #22c55e;
    font-size: 1rem;
    margin-left: 0.5rem;
  }
</style>
