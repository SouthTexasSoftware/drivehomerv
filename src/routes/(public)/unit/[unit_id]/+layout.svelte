<script lang="ts">
  // TODO: no built-in fallback to display unit not found right now..
  // This needs some sort of timer, or check to see if it is still waiting on the unitStore
  // to be populated. Right now, the subscription just keeps it updated live.
</script>

<slot />

<div class="background-stripe" />

<style>
  .background-stripe {
    position: absolute;
    width: 200vw;
    height: 300px;
    left: -50vw;
    background: hsl(var(--p));
    transform: rotate(-16deg);
    z-index: -1;
  }

  @media (max-width: 500px) {
    .background-stripe {
      top: 250px;
    }
  }

  @media (min-width: 500px) and (max-width: 1000px) {
    .background-stripe {
      top: 300px;
    }
  }

  @media (min-width: 1000px) {
    .background-stripe {
      top: 350px;
    }
  }
</style>
