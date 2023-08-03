<script lang="ts">
  import type { Unit } from "$lib/types";
  import { unitStore } from "$lib/stores";
  import { page } from "$app/stores";
  import { beforeUpdate } from "svelte";
  import CategoryColumn from "./CategoryColumn.svelte";
  import { afterNavigate, beforeNavigate } from "$app/navigation";

  let unitObject: Unit | undefined;

  let mobileHideOptions = false;

  beforeUpdate(checkUnitSelected);

  function checkUnitSelected() {
    if ($unitStore.isPopulated) {
      unitObject = $unitStore.getUnit($page.params.unit_id);
      return;
    }

    setTimeout(checkUnitSelected, 200);
  }
</script>

<div class="category-container">
  {#if unitObject}
    {#key $page.params.category}
      <div class="options-column" class:hide={mobileHideOptions}>
        <button
          class="mobile-show-button"
          on:click={() => (mobileHideOptions = !mobileHideOptions)}
        >
          <svg
            fill="#000000"
            width="25px"
            height="25px"
            viewBox="0 0 32 32"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M28.106 19.944h-0.85c-0.069-0.019-0.131-0.050-0.2-0.063-1.788-0.275-3.2-1.762-3.319-3.506-0.137-1.95 0.975-3.6 2.787-4.137 0.238-0.069 0.488-0.119 0.731-0.181h0.85c0.056 0.019 0.106 0.050 0.169 0.056 1.65 0.269 2.906 1.456 3.262 3.081 0.025 0.125 0.063 0.25 0.094 0.375v0.85c-0.019 0.056-0.050 0.113-0.056 0.169-0.262 1.625-1.419 2.863-3.025 3.238-0.156 0.038-0.3 0.081-0.444 0.119zM4.081 12.056l0.85 0c0.069 0.019 0.131 0.050 0.2 0.056 1.8 0.281 3.206 1.775 3.319 3.537 0.125 1.944-1 3.588-2.819 4.119-0.231 0.069-0.469 0.119-0.7 0.175h-0.85c-0.056-0.019-0.106-0.050-0.162-0.063-1.625-0.3-2.688-1.244-3.194-2.819-0.069-0.206-0.106-0.425-0.162-0.637v-0.85c0.019-0.056 0.050-0.113 0.056-0.169 0.269-1.631 1.419-2.863 3.025-3.238 0.15-0.037 0.294-0.075 0.437-0.113zM15.669 12.056h0.85c0.069 0.019 0.131 0.050 0.2 0.063 1.794 0.281 3.238 1.831 3.313 3.581 0.087 1.969-1.1 3.637-2.931 4.106-0.194 0.050-0.387 0.094-0.581 0.137h-0.85c-0.069-0.019-0.131-0.050-0.2-0.063-1.794-0.275-3.238-1.831-3.319-3.581-0.094-1.969 1.1-3.637 2.931-4.106 0.2-0.050 0.394-0.094 0.588-0.137z"
            />
          </svg></button
        >

        <!-- render categorys subcategories and options  -->

        <CategoryColumn
          {unitObject}
          on:closeMobileColumn={() => {
            mobileHideOptions = true;
          }}
        />
      </div>
      <slot {unitObject} />
    {/key}
  {/if}
</div>

<style>
  .category-container {
    display: flex;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  .options-column {
    flex-direction: column;
    width: 300px;
    justify-content: flex-end;
    border-right: 1px solid var(--cms-boxShadow);
    overflow-y: scroll;
    padding-bottom: 30%;
    min-width: 300px;
    -ms-overflow-style: none; /* Internet Explorer 10+ */
    scrollbar-width: none; /* Firefox */
  }
  .options-column::-webkit-scrollbar {
    display: none;
  }
  .mobile-show-button {
    display: none;
  }

  @media (max-width: 500px) {
    .category-container {
      flex-direction: row-reverse;
    }
    .category-container:last-child {
      width: 100vw !important;
    }
    .options-column {
      padding-bottom: 0%;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      width: 230px;
      min-width: 230px;
      max-height: 200px;
      align-self: flex-end;
      /* border-top: 1px solid hsl(var(--b2));
      border-left: 1px solid hsl(var(--b2)); */
      height: 200px;
      position: absolute;
      transition: all 0.3s;
      z-index: 1;
    }
    .options-column.hide {
      height: 20px;
    }
    :global(.options-column.hide .column-container) {
      display: none;
    }

    .mobile-show-button {
      display: block;
      font-family: font-regular;
      font-size: 15px;
      height: 25px;
      text-align: start;
      padding: 0 15px;
      margin-left: auto;
    }
    .category-container {
      background-color: #fafafa;
    }
  }
</style>
