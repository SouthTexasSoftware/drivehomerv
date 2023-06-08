<script lang="ts">
  import { newUnitModel, objectKeyToLabel } from "$lib/helpers";
  import { page } from "$app/stores";

  // list of unaltered keys
  //@ts-ignore
  let subcategoryList = Object.keys(newUnitModel[$page.params.category]);

  // list of formatted string keys
  let subcategoryLabels = subcategoryList.map((key) => {
    return objectKeyToLabel(key);
  });

  // used to un/collapse subcategories
  let showingSubcategory: { [key: string]: boolean } = {};
  subcategoryList.forEach((key: string) => {
    showingSubcategory[key] = false;
  });

  function getOptions(key: string) {
    //@ts-ignore
    return Object.keys(newUnitModel[$page.params.category][key]);
  }
</script>

<div class="column-container">
  {#each subcategoryLabels as subcategory, index}
    <button
      class="subcategory-title"
      on:click={() =>
        (showingSubcategory[subcategory] = !showingSubcategory[subcategory])}
    >
      <p class:active={$page.params.subcategory == subcategoryList[index]}>
        {subcategory.toUpperCase()}
      </p>
      <svg
        class:showing={showingSubcategory[subcategory]}
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
    </button>
    {#if showingSubcategory[subcategory]}
      <div class="subcategory-options">
        {#each getOptions(subcategoryList[index]) as option}
          <a
            href="/cms/units/{$page.params
              .unit_id}/information/{subcategoryList[index]}/{option}"
            class:active={$page.params.option == option}
            class="option-link"
          >
            {objectKeyToLabel(option)}
          </a>
        {/each}
      </div>
    {/if}
  {/each}
</div>

<style>
  .column-container {
    overflow-y: scroll;
    padding-bottom: 100px;
  }
  .subcategory-title {
    display: flex;
    align-items: flex-end;
    margin-top: 15px;
    padding: 0px 20px;
  }
  .subcategory-title p {
    font-family: cms-semibold;
    font-size: 14px;
  }
  .subcategory-title p.active {
    color: hsl(var(--p));
  }
  svg {
    margin-left: 15px;
    margin-bottom: 8px;
    transition: 0.4s all;
  }
  svg.showing {
    transform: rotate(180deg);
  }
  .subcategory-options {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .option-link {
    font-family: cms-regular;
    transition: all 0.3s;
    padding: 5px 30px;
  }
  .option-link.active {
    background-color: var(--cms-highlightPrimary);
    border-right: 3px solid hsl(var(--p));
  }
</style>
