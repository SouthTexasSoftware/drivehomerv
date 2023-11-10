<script lang="ts">

export let active: boolean = false;

let iconColor = "#3D3D3D"

$:if(active) {
    iconColor = "#ae2623";
} else {
    iconColor = "#3D3D3D"
}

</script>

<svg
  width="19"
  height="19"
  viewBox="0 0 19 19"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <g clip-path="url(#clip0_523_746)">
    <path
      d="M5.9375 18.5609C6.92126 18.5609 7.71875 17.775 7.71875 16.8057C7.71875 15.8363 6.92126 15.0505 5.9375 15.0505C4.95374 15.0505 4.15625 15.8363 4.15625 16.8057C4.15625 17.775 4.95374 18.5609 5.9375 18.5609Z"
      stroke={iconColor}
      stroke-width="0.59375"
      stroke-miterlimit="10"
    />
    <path
      d="M13.0625 18.5609C14.0463 18.5609 14.8438 17.775 14.8438 16.8057C14.8438 15.8363 14.0463 15.0505 13.0625 15.0505C12.0787 15.0505 11.2812 15.8363 11.2812 16.8057C11.2812 17.775 12.0787 18.5609 13.0625 18.5609Z"
      stroke={iconColor}
      stroke-width="0.59375"
      stroke-miterlimit="10"
    />
    <path
      d="M7.71875 16.8057H11.2812"
      stroke={iconColor}
      stroke-width="0.59375"
      stroke-miterlimit="10"
    />
    <path
      d="M4.15625 16.8055L2.96875 0.716553H0"
      stroke={iconColor}
      stroke-width="0.59375"
      stroke-miterlimit="10"
    />
    <path
      d="M3.85938 12.7103L16.625 11.8327L18.7031 3.05688H3.26562"
      stroke={iconColor}
      stroke-width="0.59375"
      stroke-miterlimit="10"
    />
  </g>
  <defs>
    <clipPath id="clip0_523_746">
      <rect
        width="19"
        height="18.7217"
        fill="white"
        transform="translate(0 0.131592)"
      />
    </clipPath>
  </defs>
</svg>
