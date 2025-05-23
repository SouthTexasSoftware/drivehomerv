<script lang="ts">
  import type { Unit } from "$lib/types";
  import { fade } from "svelte/transition";
  import {
    setDoc,
    doc,
    getDoc,
    deleteDoc,
    updateDoc,
  } from "firebase/firestore";
  import { cmsStore, firebaseStore, unitStore } from "$lib/stores";
  import {
    populateUnitBookings,
    populateUnitStore,
    validateRequiredFields,
  } from "$lib/helpers";
  import { alertStore } from "$lib/stores/alert";

  export let unitObject: Unit;

  let savingChanges = false;
  let cancelingChanges = false;

  async function cancelChanges() {
    if (cancelingChanges) {
      return;
    }
    cancelingChanges = true;

    await populateUnitStore($firebaseStore);

    cancelingChanges = false;
  }

  async function saveChanges() {
    if (savingChanges) {
      return;
    }

    savingChanges = true;

    // validate information on unitObject before proceeding with save
    const requiredFields = [
      "bullet_points.summary.pickup_location",
      "bullet_points.summary.sleeps",
      "bullet_points.summary.year_built",
      "bullet_points.summary.vehicle_type",
      "bullet_points.summary.length",

      "paragraphs.description.content",

      "rates_and_fees.pricing.base_rental_fee",
      "rates_and_fees.pricing.sales_tax",
      "rates_and_fees.pricing.damage_protection",
      "rates_and_fees.pricing.minimum_nights",

      "rates_and_fees.delivery.tier_1_miles",
      "rates_and_fees.delivery.tier_1_fee",
      "rates_and_fees.delivery.tier_2_miles",
      "rates_and_fees.delivery.tier_2_fee",
      "rates_and_fees.delivery.tier_3_miles",
      "rates_and_fees.delivery.tier_3_fee",

      "cms_only.color_scheme.primary",
      // Add more required fields as needed
    ];
    // VALIDATION ONLY REQUIRED IF UNIT IS PUBLIC FACING
    if (unitObject.publicly_visible) {
      const validationErrors = validateRequiredFields(
        unitObject,
        requiredFields
      );

      if (validationErrors.length > 0) {
        validationErrors.forEach((error) => alertStore.error(error.message));
        savingChanges = false;
        return;
      }
    }
    // because photos are in subcollection, we need to check a seperate identifier to see if that is waht was modified
    if ($cmsStore.photosUpdated.deleted) {
      // delete doc using string? and then delete from object..
      let deletedPhoto = doc(
        $firebaseStore.db,
        "units",
        unitObject.id,
        "photos",
        $cmsStore.photosUpdated.deleted
      );
      await deleteDoc(deletedPhoto);
    }

    if ($cmsStore.photosUpdated.unit_id) {
      for (let photoDoc of $cmsStore.photosUpdated.new_array) {
        let updatedPhotoRef = doc(
          $firebaseStore.db,
          "units",
          unitObject.id,
          "photos",
          photoDoc.id
        );
        await updateDoc(updatedPhotoRef, {
          index: photoDoc.index,
        });
      }
    }

    $cmsStore.photosUpdated = Object.assign({});

    //@ts-ignore
    for (let booking of unitObject.bookings) {
      if (booking.document_reference) {
        delete booking.document_reference;
      }
    }

    // remove the booking lines that are added at page load?
    let tempUnit = structuredClone(unitObject);
    tempUnit.cms_edited = false;
    delete tempUnit.photos;
    delete tempUnit.bookings;
    delete tempUnit.bookingDates;
    delete tempUnit.sessionOnly;

    await setDoc(doc($firebaseStore.db, "units", tempUnit.id), tempUnit);

    // repopulate the deleted items?
    //@ts-ignore
    for (let booking of unitObject.bookings) {
      booking.document_reference = doc(
        $firebaseStore.db,
        "units",
        unitObject.id,
        "bookings",
        booking.id
      );
    }
    // delay the fade until after DB operations.

    unitObject.cms_edited = false;
    savingChanges = false;
  }
</script>

<div class="header-container">
  <div class="left-column">
    <h1>
      {unitObject.name}
    </h1>
    <p class="api-id">API ID: {unitObject.id}</p>
  </div>
  {#if unitObject.cms_edited}
    <div class="save-button-container" transition:fade>
      <button class="cancel" on:click={cancelChanges}>
        {#if cancelingChanges}
          <p class="spinner cancel" />
        {:else}
          <svg
            width="9"
            height="10"
            viewBox="0 0 9 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M4.73646 6.99179L7.67886 9.82699C7.97404 10.1136 8.16609 10.1165 8.46666 9.82699L9.05702 9.25802C9.34623 8.97942 9.36583 8.79654 9.05702 8.49896L5.94189 5.49772L9.0573 2.49648C9.34907 2.2144 9.35475 2.02404 9.0573 1.73715L8.46695 1.16845C8.16069 0.873271 7.97148 0.886907 7.67915 1.16845L4.73646 4.00365L1.79406 1.16872C1.50173 0.887174 1.31252 0.873538 1.00626 1.16872L0.415904 1.73741C0.118169 2.0243 0.123567 2.21467 0.415904 2.49675L3.53104 5.49772L0.415904 8.49896C0.107089 8.79654 0.123567 8.97942 0.415904 9.25802L1.00597 9.82699C1.30399 10.1165 1.49604 10.1136 1.79378 9.82699L4.73646 6.99179Z"
              fill="#3D3D3D"
            />
          </svg>
          Cancel
        {/if}
      </button>
      <button class="save" on:click={saveChanges}>
        {#if savingChanges}
          <p class="spinner" />
        {:else}
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M1.42259 4.7699C1.09715 4.33601 0.569518 4.33601 0.244076 4.7699C-0.0813585 5.20379 -0.0813585 5.90735 0.244076 6.34124L2.74408 9.67458C3.06952 10.1085 3.59717 10.1085 3.92259 9.67458L9.75594 1.89679C10.0814 1.46287 10.0814 0.759358 9.75594 0.325434C9.43052 -0.108478 8.90285 -0.108478 8.57743 0.325434L3.33334 7.31758L1.42259 4.7699Z"
              fill="white"
            />
          </svg>
          Save
        {/if}
      </button>
    </div>
  {/if}
</div>

<style>
  .header-container {
    padding: 25px;
    width: 100%;
    display: flex;
  }
  h1 {
    font-family: cms-bold;
    color: var(--cms-text);
    font-size: 40px;
    max-height: 60px;
    overflow: scroll;
  }
  p {
    font-family: cms-light;
    font-size: 12px;
  }
  .save-button-container {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-content: center;
    margin-left: 20px;
  }
  button {
    width: 90px;
    border-radius: 4px;
    height: 28px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }
  button.cancel {
    background-color: var(--cms-boxShadow);
  }
  button.save {
    background-color: hsl(var(--p));
    color: white;
  }
  svg {
    margin: 0 10px;
  }
  .spinner {
    content: "";
    border-radius: 50%;
    border-top: 1px solid hsl(var(--b1));
    border-right: 1px solid transparent;
    animation-name: spinning;
    animation-duration: 1s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    opacity: 1;
    transition: all 0.2s;
    width: 15px;
    height: 15px;
    margin: 0 auto;
  }
  .spinner.cancel {
    border-top: 1px solid var(--cms-text);
  }
  @keyframes spinning {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  @media (max-width: 500px) {
    .header-container {
      display: flex;
      position: absolute;
      top: 0px;
      z-index: 100;
      background-color: hsl(var(--b1));
      border-bottom: 1px solid hsl(var(--p));
      padding: 10px 35px;
    }
  }
</style>
