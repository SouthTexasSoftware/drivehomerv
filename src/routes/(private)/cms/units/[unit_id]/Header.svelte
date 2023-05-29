<script lang="ts">
  import type { Unit } from "$lib/types";
  import { fade } from "svelte/transition";
  import { setDoc, doc, getDoc } from "firebase/firestore";
  import { firebaseStore, unitStore } from "$lib/stores";
  import { populateUnitStore } from "$lib/helpers";

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
    unitObject.cms_edited = false;

    // remove the booking lines that are added at page load?
    let tempUnit = unitObject;
    delete tempUnit.bookings;
    delete tempUnit.bookingDates;

    await setDoc(doc($firebaseStore.db, "units", tempUnit.id), tempUnit);

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
          Cancel
        {/if}
      </button>
      <button class="save" on:click={saveChanges}>
        {#if savingChanges}
          <p class="spinner" />
        {:else}
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
    justify-content: center;
    align-items: center;
  }
  button.cancel {
    background-color: var(--cms-boxShadow);
  }
  button.save {
    background-color: hsl(var(--p));
    color: white;
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
</style>
