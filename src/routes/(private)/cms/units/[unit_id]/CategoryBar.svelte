<script lang="ts">
  import type { Unit } from "$lib/types";
  import { page } from "$app/stores";

  export let unitObject: Unit;

  // TODO: Incorporate 'DELETE UNIT' into category bar?
  // or in the maintenance category
</script>

<div class="bar-container">
  {#if unitObject}
    <div class="icon-bar">
      <a
        href="/cms/units/{unitObject.id}/information"
        class="category-link"
        class:active={$page.params.category == "information"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 16 16"
          fill="none"
        >
          <g clip-path="url(#clip0_155_667)">
            <path
              d="M7.99975 0.000366211C3.58206 0.000366211 0 3.58218 0 8.00012C0 12.4181 3.58206 15.9999 7.99975 15.9999C12.4185 15.9999 16 12.4181 16 8.00012C16 3.58215 12.4185 0.000366211 7.99975 0.000366211ZM9.40444 11.6729C9.08084 12.032 8.89538 12.2454 8.54609 12.5793C8.01741 13.0849 7.41709 13.2195 6.95038 12.7205C6.27953 12.003 6.98313 9.82034 7.00028 9.73768C7.12628 9.15755 7.37778 7.99809 7.37778 7.99809C7.37778 7.99809 6.83444 8.33071 6.51188 8.44868C6.27397 8.53562 6.00484 8.42146 5.93831 8.19137C5.87631 7.97818 5.92569 7.84259 6.05625 7.69693C6.37981 7.33805 6.56528 7.12462 6.91459 6.79071C7.44378 6.28493 8.04359 6.15062 8.51031 6.64934C9.18116 7.3668 8.68619 8.54721 8.51231 9.38362C8.49519 9.46652 8.08288 11.372 8.08288 11.372C8.08288 11.372 8.62622 11.0393 8.94878 10.9211C9.18716 10.8344 9.45631 10.9488 9.52284 11.1787C9.58487 11.3919 9.535 11.5275 9.40444 11.6729ZM8.53653 5.50396C7.79009 5.56946 7.13234 5.01759 7.06681 4.27062C7.00181 3.52443 7.55369 2.86643 8.30016 2.80143C9.04609 2.7359 9.70434 3.2883 9.76937 4.03449C9.83487 4.78071 9.28247 5.43896 8.53653 5.50396Z"
              fill="#3D3D3D"
            />
          </g>
          <defs>
            <clipPath id="clip0_155_667">
              <rect width="16" height="16" fill="white" />
            </clipPath>
          </defs>
        </svg>
      </a>
      <a
        href="/cms/units/{unitObject.id}/photos"
        class="category-link"
        class:active={$page.params.category == "photos"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 16 16"
          fill="none"
        >
          <g clip-path="url(#clip0_135_327)">
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M11.5556 10.1817V3.80082H0.888889V13.4357L3.42101 10.9451C3.76926 10.6025 4.33375 10.599 4.68566 10.9409L5.38205 11.6175L8.50553 8.47443C8.85231 8.12548 9.41656 8.11605 9.77892 8.46598L11.5556 10.1817ZM12.4444 14.1394L13.2983 14.2595C13.7885 14.3283 14.2403 13.9872 14.3091 13.4978L15.7919 2.94694C15.8608 2.45674 15.5197 2.00491 15.0302 1.93612L4.47944 0.453302C3.98924 0.384408 3.53738 0.725536 3.46859 1.21501L3.23014 2.91193H0.894965C0.399947 2.91193 0 3.31263 0 3.80691V14.4614C0 14.9564 0.400685 15.3564 0.894965 15.3564H11.5495C12.0445 15.3564 12.4444 14.9557 12.4444 14.4614V14.1394ZM12.4444 13.2418L13.4281 13.3801L14.9126 2.81721L4.34972 1.3327L4.12777 2.91193H11.5495C12.0438 2.91193 12.4444 3.31189 12.4444 3.80691V13.2418Z"
              fill="#3D3D3D"
            />
          </g>
          <defs>
            <clipPath id="clip0_135_327">
              <rect width="16" height="16" fill="white" />
            </clipPath>
          </defs>
        </svg></a
      >
      <a
        href="/cms/units/{unitObject.id}/bookings"
        class="category-link"
        class:active={$page.params.category == "bookings"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="M0 13.008C0 13.84 0.293333 14.544 0.88 15.12C1.46667 15.696 2.176 15.9893 3.008 16H13.008C13.8293 16 14.5333 15.7067 15.12 15.12C15.7067 14.5333 16 13.8293 16 13.008V3.008C16 2.35733 15.8133 1.776 15.44 1.264C15.0667 0.752 14.5867 0.394667 14 0.192V1.504C14 1.92 13.856 2.27733 13.568 2.576C13.28 2.87467 12.9227 3.01867 12.496 3.008C12.0693 2.99733 11.7173 2.85333 11.44 2.576C11.1627 2.29867 11.0187 1.94133 11.008 1.504V0H5.008V1.504C5.008 1.92 4.85867 2.27733 4.56 2.576C4.26133 2.87467 3.90933 3.01867 3.504 3.008C3.09867 2.99733 2.74133 2.85333 2.432 2.576C2.12267 2.29867 1.97867 1.94133 2 1.504V0.192C1.41333 0.405333 0.933333 0.762667 0.56 1.264C0.186667 1.76533 0 2.34667 0 3.008L0 13.008ZM2 13.008V5.008H14V13.008C14 13.2853 13.904 13.52 13.712 13.712C13.52 13.904 13.2853 14 13.008 14H3.008C2.73067 14 2.49067 13.904 2.288 13.712C2.08533 13.52 1.98933 13.2853 2 13.008ZM3.008 1.504C3.008 1.64267 3.056 1.76 3.152 1.856C3.248 1.952 3.36533 2 3.504 2C3.64267 2 3.76 1.952 3.856 1.856C3.952 1.76 4 1.64267 4 1.504V0H3.008V1.504ZM10 12H12V10H10V12ZM12 1.504C12 1.64267 12.048 1.76 12.144 1.856C12.24 1.952 12.3573 2 12.496 2C12.6347 2 12.752 1.952 12.848 1.856C12.944 1.76 12.9973 1.64267 13.008 1.504V0H12V1.504Z"
            fill="#3D3D3D"
          />
        </svg>
      </a>
      <a
        href="/cms/units/{unitObject.id}/maintenance"
        class="category-link"
        class:active={$page.params.category == "maintenance"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 18 18"
          fill="none"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M9 1.5C13.1353 1.5 16.5 4.8647 16.5 9C16.5 13.1353 13.1353 16.5 9 16.5C4.8647 16.5 1.5 13.1353 1.5 9C1.5 4.8647 4.8647 1.5 9 1.5ZM9.03213 5.55872C8.32076 5.01769 7.39087 4.8311 6.72444 4.9818L7.87829 6.13565L7.30136 7.28949L6.14752 7.86642L4.99367 6.71257C4.84296 7.37902 5.02958 8.30887 5.57059 9.02026C6.30823 9.58759 7.2157 9.77899 7.87829 9.59719L10.5104 12.0959C11.0095 12.5363 11.5087 12.5069 12.0078 12.0078C12.5381 11.4775 12.5381 10.9471 12.0078 10.4168C10.3859 8.82557 9.58636 7.97543 9.60906 7.86642C9.79084 7.20389 9.59944 6.2964 9.03213 5.55872Z"
            fill="#3D3D3D"
          />
        </svg>
      </a>
    </div>
  {/if}
</div>

<style>
  .bar-container {
    display: flex;
    flex-direction: column;
    width: 300px;
    justify-content: flex-end;
    border-right: 1px solid var(--cms-boxShadow);
    min-width: 300px;
  }
  .icon-bar {
    display: flex;
    width: 100%;
    justify-content: space-evenly;
    border-top: 1px solid var(--cms-boxShadow);
  }
  .category-link.active {
    background-color: var(--cms-highlightPrimary);
    border-bottom: 3px solid hsl(var(--p));
  }
  .category-link {
    width: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 50px;
    transition: all 0.3s;
  }

  @media (max-width: 500px) {
    .bar-container {
      margin-right: 199px;
      width: 100%;
      min-width: 0px;
    }
    .icon-bar {
      flex-direction: row-reverse;
    }
  }
</style>
