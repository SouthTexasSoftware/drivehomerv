<script lang="ts">
  import { fly, slide } from "svelte/transition";
  import { quintOut } from "svelte/easing";

  export let title: string;
  export let timerValue: string | undefined = undefined;
  export let timerStatement: string | undefined = "Holding Dates:";

  export let transitionDirection: string = "movingRight";
  let transitionValue = -300;

  $: if (transitionDirection == "movingRight") {
    transitionValue = 300;
  } else {
    transitionValue = -300;
  }
</script>

<section
  in:fly={{ x: transitionValue, delay: 0, duration: 500, easing: quintOut }}
>
  {#if timerValue}
    <div class="countdown-timer">{timerStatement} {timerValue}</div>
  {/if}
  <div class="section-title">{title}</div>
  <div class="title-divider" />

  <div class="section-content">
    <slot />
  </div>
</section>

<style>
  section {
    box-shadow: 0px 1px 2px grey;
    border-radius: 20px;
    margin: 25px 0 50px;
    background-color: hsl(var(--b1));
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 800px;
    min-height: 300px;
    position: relative;
  }
  .countdown-timer {
    position: absolute;
    top: 5px;
    left: 15px;
    font-family: cms-light;
    font-size: 12px;
  }
  .section-title {
    font-family: font-bold;
    font-size: 26px;
    margin-top: 25px;
  }
  .title-divider {
    width: 100px;
    height: 2px;
    background-color: hsl(var(--b2));
  }
  .section-content {
    width: 80%;
    margin: 40px 0;
  }
  @media (max-width: 700px) {
    section {
      width: 100vw;
      min-height: 300px;
      padding-bottom: 25px;
      padding: 0px;
      border-radius: 0;
      background-color: rgba(255, 255, 255, 0.97);
      margin-top: 0px;
      box-shadow: none;
    }
    .section-title {
      margin-top:15px;
    }
    .section-content {
      width: 95vw;
      margin: 20px 0;
    }
    
  }

  @media (min-width: 700px) and (max-width: 1200px) {
    section {
    }
  }

  @media (min-width: 1200px) and (max-width: 1800px) {
    section {
    }
  }
  @media (min-width: 1800px) {
    section {
    }
  }
</style>
