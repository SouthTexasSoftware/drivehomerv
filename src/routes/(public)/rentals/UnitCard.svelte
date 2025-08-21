<script lang="ts">
  import type { Unit } from "$lib/types";
  import { fade } from "svelte/transition";

  export let unitObject: Unit;

  let photoUrl: string | undefined = undefined;
  let photoLoaded = false;

  unitObject.photos.forEach((photoObj) => {
    if (photoObj.index == 1) {
      photoUrl = photoObj.downloadURL;
      photoLoaded = true;
      return;
    }
  });

  if (photoLoaded == false) {
    photoLoaded = true;
  }
</script>

<a class="card-container" href="/unit/{unitObject.id}" in:fade>
  <div class="first-image" style="background-image:url('{photoUrl}')">
    {#if !photoLoaded}
      <div class="spinner small" />
    {/if}
    {#if photoLoaded && !photoUrl}
      <p class="no-photos-tag">Photos coming soon!</p>
    {/if}
  </div>

  <p class="unit-name">{unitObject.name}</p>
  <div class="grid grid-cols-2 gap-4">
    <!-- First Row -->
    <div class="flex items-center">
      <div class="flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-bed-double-icon lucide-bed-double stroke-red-800 w-5"
          ><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" /><path
            d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"
          /><path d="M12 4v6" /><path d="M2 18h20" /></svg
        >
        <p class="ml-2">
          Sleeps {unitObject.information.bullet_points.summary.sleeps}
        </p>
      </div>
    </div>
    <div class="flex items-center justify-start">
      <div class="flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-caravan-icon lucide-caravan stroke-red-800 w-5"
          ><path
            d="M18 19V9a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v8a2 2 0 0 0 2 2h2"
          /><path d="M2 9h3a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2" /><path
            d="M22 17v1a1 1 0 0 1-1 1H10v-9a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v9"
          /><circle cx="8" cy="19" r="2" /></svg
        >
        <p class="ml-2">
          {unitObject.information.bullet_points.summary.vehicle_type}
        </p>
      </div>
    </div>
    <!-- Second Row -->
    <div class="flex items-center">
      <div class="flex items-start">
        <p class="price">
          ${unitObject.information.rates_and_fees.pricing.base_rental_fee}&nbsp;
        </p>
        <p>per night</p>
      </div>
    </div>
    <div class="flex items-center justify-start">
      <div id="minimum-nights">
        {unitObject.information.rates_and_fees.pricing.minimum_nights} Night Min.
      </div>
    </div>
  </div>
</a>

<style>
  .card-container {
    background-color: var(--b1);
    border-radius: 4px;
    box-shadow: 0 3px 5px #80808087;
    padding: 25px;
    display: flex;
    flex-direction: column;
    margin: 25px;
    width: 350px;
    min-height: 320px;
  }

  .first-image {
    width: 100%;
    border-radius: 4px;
    min-height: 175px;
    background-size: contain;
    background-repeat: no-repeat;
    display: flex;
    justify-content: center;
    align-items: center;
    /* background-color: var(--b2); */
    background-position: center;
  }
  .no-photos-tag {
    font-family: "font-medium";
    color: var(--b3);
  }
  .unit-name {
    font-family: "font-medium";
    color: var(--p);
    font-size: 18px;
  }
  .features-row {
    display: flex;
    width: 100%;
    justify-content: space-between;
    margin: 10px 0;
  }
  .feature-item {
    display: flex;
    align-items: center;
    width: 50%;
    justify-content: flex-start;
  }
  .feature-label {
    margin-left: 5px;
  }
  .unit-price-row {
    display: flex;
  }
  .price {
    font-family: "font-medium";
  }
  @media (max-width: 480px) {
    .card-container {
      margin: 15px 0;
    }
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
    width: 50px;
    height: 50px;
    margin: auto;
  }
  .spinner.small {
    border-top: 2px solid var(--p);
    width: 30px;
    height: 30px;
  }
  @keyframes spinning {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  @media (max-width: 700px) {
    .card-container {
      width: 90vw;
    }
    .first-image {
      height: 55vw;
    }
  }
</style>
