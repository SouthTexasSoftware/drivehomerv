<script lang="ts">
  import { unitStore } from "$lib/stores";
  import type { Unit } from "$lib/types";
  import { page } from "$app/stores";

  import EditUnitDetails from "./EditUnitDetails.svelte";
  import EditUnitPhotos from "./EditUnitPhotos.svelte";
  import AddUnitPhotos from "./AddUnitPhotos.svelte";

  let unitObject: Unit | undefined;

  let loadingUnit = true;
  let editUnitDetailsKey = false;
  let addPhotoKey = false;

  $: if ($unitStore.isPopulated) {
    unitObject = $unitStore.getUnit($page.params.unit_id);
  }
</script>

<div class="content-container">
  {#if loadingUnit}
    <div class="spinner" />
  {:else}
    <a class="return-link" href="/cms/units">
      <svg
        id="right-arrow"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g id="Complete">
          <g id="arrow-right">
            <g>
              <polyline
                data-name="Right"
                fill="none"
                id="Right-2"
                points="16.4 7 21.5 12 16.4 17"
                stroke="#000000"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              />

              <line
                fill="none"
                stroke="#000000"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                x1="2.5"
                x2="19.2"
                y1="12"
                y2="12"
              />
            </g>
          </g>
        </g>
      </svg>
    </a>
    {#key editUnitDetailsKey}
      <EditUnitDetails
        {unitObject}
        on:refresh={() => (editUnitDetailsKey = !editUnitDetailsKey)}
      />
    {/key}
    <div class="photos-components">
      {#key addPhotoKey}
        <AddUnitPhotos
          {unitObject}
          on:refresh={() => {
            addPhotoKey = !addPhotoKey;
          }}
        />
        <EditUnitPhotos {unitObject} />
      {/key}
    </div>
  {/if}
</div>

<style>
  .content-container {
    /* background-color: lightblue; */
    width: 100%;
    display: flex;
    justify-content: center;
    /* align-items: center; */
    margin-left: 25px;
  }
  .spinner {
    content: "";
    border-radius: 50%;
    border-top: 2px solid hsl(var(--b3));
    border-right: 2px solid transparent;
    animation-name: spinning;
    animation-duration: 1s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    opacity: 1;
    transition: all 0.2s;
    width: 100px;
    height: 100px;
  }
  @keyframes spinning {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  .return-link {
    height: 50px;
    width: 50px;
  }
  svg#right-arrow {
    height: 20px;
    width: 20px;
    transform: rotate(180deg);
  }
</style>
