<script lang="ts">
  import type { Unit } from "$lib/types";
  import { objectKeyToLabel } from "$lib/helpers";
  import AddPhotoDropdown from "./AddPhotoDropdown.svelte";
  import { fade } from "svelte/transition";

  export let unitObject: Unit;
  export let subcategory: string;
  export let option: string;

  let addDropdownShowing = false;

  console.log(unitObject);

  // necessary info is in unitObject,
  //use subcategory and option to filter the photos array
  // then use filtered array to build out photos-option-container

  // add in dragable feature

  // add in listener for drag, and a save/update index?

  // how to handle recently added photos with no index?
  // put them at the end or the beginning?
</script>

{#if option}
  <div class="photos-option-container">
    <div class="container-header">
      <p class="option-title">{objectKeyToLabel(option)} Photos</p>

      <button
        class="add-photo"
        on:click={() => (addDropdownShowing = !addDropdownShowing)}
      >
        {#if addDropdownShowing}
          <svg
            in:fade
            width="13"
            height="14"
            viewBox="0 0 11 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M4.58403 1.04084C4.86064 1.31746 4.86064 1.76595 4.58403 2.04258L2.9599 3.66671H6.56234C8.71397 3.66671 10.4582 5.41091 10.4582 7.56254C10.4582 9.71417 8.71397 11.4584 6.56234 11.4584H4.7915C4.40029 11.4584 4.08317 11.1413 4.08317 10.75C4.08317 10.3588 4.40029 10.0417 4.7915 10.0417H6.56234C7.93155 10.0417 9.0415 8.93175 9.0415 7.56254C9.0415 6.19333 7.93155 5.08337 6.56234 5.08337H2.9599L4.58403 6.70751C4.86064 6.98412 4.86064 7.43263 4.58403 7.70924C4.30743 7.98584 3.85893 7.98584 3.5823 7.70924L0.748968 4.87591C0.472349 4.59928 0.472349 4.1508 0.748968 3.87417L3.5823 1.04084C3.85893 0.764219 4.30743 0.764219 4.58403 1.04084Z"
              fill="#E8E8E8"
            />
          </svg>
        {:else}
          +
        {/if}
      </button>

      {#if addDropdownShowing}
        <AddPhotoDropdown on:added={() => (addDropdownShowing = false)} />
      {/if}
    </div>
  </div>
{/if}

<style>
  .photos-option-container {
    background-color: hsl(var(--b1));
    margin: 25px;
    position: relative;
    border-radius: 4px;
    box-shadow: 0 1px 3px var(--cms-boxShadow);
    width: 100%;
    display: flex;
    flex-direction: column;
    width: 300px;
  }
  .container-header {
    display: flex;
    justify-content: space-between;
    padding: 8px 10px;
    background-color: #eee;
    border-radius: 4px 4px 0 0;
    position: relative;
  }
  .option-title {
    font-family: cms-semibold;
    font-size: 14px;
    line-height: 25px;
    color: var(--cms-text);
  }
  .add-photo {
    font-family: cms-light;
    color: hsl(var(--b2));
    background-color: hsl(var(--p));
    width: 25px;
    border-radius: 4px;
    font-size: 25px;
    height: 25px;
    line-height: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
