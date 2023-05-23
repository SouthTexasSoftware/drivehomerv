<script lang="ts">
  import type { Unit } from "$lib/types";
  import { unitStore } from "$lib/stores";
  import { page } from "$app/stores";
  import { beforeUpdate } from "svelte";

  let unitObject: Unit | undefined;

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
  <div class="options-column">
    <div class="column-subcategory">
      <p class="subcategory-title">
        BULLET POINTS
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="9"
          height="5"
          viewBox="0 0 9 5"
          fill="none"
        >
          <g clip-path="url(#clip0_135_337)">
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M3.65331 4.5284C3.54996 4.49149 3.4643 4.43796 3.40524 4.37336L0.55403 1.25485C0.371356 1.05505 0.482421 0.800525 0.802099 0.686354C0.902831 0.650378 1.01684 0.631455 1.13286 0.631455L6.83529 0.631455C7.20348 0.631455 7.50195 0.818003 7.50195 1.04812C7.50195 1.12063 7.47168 1.19189 7.41412 1.25485L4.5629 4.37336C4.38023 4.57316 3.97299 4.64257 3.65331 4.5284Z"
              fill="#3D3D3D"
            />
          </g>
          <defs>
            <clipPath id="clip0_135_337">
              <rect
                width="8"
                height="5"
                fill="white"
                transform="matrix(-1 0 0 -1 8.00195 5)"
              />
            </clipPath>
          </defs>
        </svg>
      </p>
    </div>
  </div>
  <slot />
</div>

<style>
  .category-container {
    display: flex;
    width: 100%;
    height: 100%;
  }
  .options-column {
    flex-direction: column;
    width: 300px;
    justify-content: flex-end;
    border-right: 1px solid var(--cms-boxShadow);
    height: 100%;
  }
</style>
