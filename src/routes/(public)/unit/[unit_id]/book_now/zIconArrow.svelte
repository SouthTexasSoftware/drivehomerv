<script lang="ts">
  export let active: boolean = false;

  let iconColor = "#eaeaea";

  $: if (active) {
    iconColor = "#3D3D3D";
  } else {
    iconColor = "#eaeaea";
  }
</script>

<svg
  width="38"
  height="38"
  viewBox="0 0 38 38"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="M6.33301 19H10.2913M31.6663 19L22.1663 9.5M31.6663 19L22.1663 28.5M31.6663 19H15.0413"
    stroke={iconColor}
    stroke-width="2.375"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>
