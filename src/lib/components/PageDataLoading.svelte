<script>
  // TODO: make this a shimmer of the main card...

  // For now, this can just be a spinner of some sorts.
</script>

<div class="spinner" />

<style>
  .spinner {
    content: "";
    border-radius: 50%;
    border-top: 2px solid var(--b1);
    border-right: 2px solid transparent;
    animation-name: spinning;
    animation-duration: 1s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    opacity: 1;
    transition: all 0.2s;
  }
  @keyframes spinning {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  @media (max-width: 500px) {
    .spinner {
      margin-top: 275px;
      width: 100px;
      height: 100px;
    }
  }

  @media (min-width: 500px) and (max-width: 1000px) {
    .spinner {
      margin-top: 325px;
      width: 100px;
      height: 100px;
    }
  }

  @media (min-width: 1000px) {
    .spinner {
      margin-top: 350px;
      width: 100px;
      height: 100px;
    }
  }

  /* max-width setpoint at 1800px */
</style>
