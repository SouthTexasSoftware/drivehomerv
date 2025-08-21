<script>
  import { navigating } from "$app/stores";

  let showLoadingBar = false;

  $: if (navigating) {
    showLoadingBar = true;
  } else {
    showLoadingBar = false;
  }
</script>

<div class="loading-bar" />

<style>
  .loading-bar {
    position: fixed;
    height: 2px;
    background-color: var(--p);
    bottom: 0;
    animation: loading ease-out 1s;
    animation-fill-mode: forwards;
  }

  @keyframes loading {
    0% {
      width: 0;
    }
    100% {
      width: 100vw;
    }
  }
</style>
