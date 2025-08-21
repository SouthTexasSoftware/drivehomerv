<script lang="ts">
  import { fly, slide } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import { bookingStore, bookingTimerStore } from "$lib/stores";

  export let title: string;
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
  {#if title != "Thank You!" && $bookingTimerStore.value}
    <div class="countdown-timer">
      {timerStatement}
      {$bookingTimerStore.value}
      <button
        class="reset-timer-button"
        on:click={() => {
          if ($bookingTimerStore.timer) {
            $bookingTimerStore.timer.reset();
          }
        }}
      >
        <svg
          width="15px"
          height="15px"
          viewBox="0 0 512 512"
          version="1.1"
          xml:space="preserve"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <g id="Layer_1" />

          <g id="Layer_2">
            <g>
              <path
                fill="#333333"
                d="M274.91,47.78c-97.6,0-179.71,67.5-202.15,158.26L58.79,181.4c-4.36-7.69-14.12-10.39-21.81-6.03    c-7.69,4.36-10.39,14.12-6.03,21.81l37.66,66.44c0,0,0,0.01,0.01,0.01l0.15,0.26c0.19,0.34,0.39,0.66,0.6,0.98    c0.01,0.01,0.02,0.03,0.03,0.04c0.04,0.07,0.09,0.13,0.14,0.19c0.23,0.33,0.46,0.64,0.71,0.95c0.04,0.05,0.07,0.1,0.11,0.15    c0,0,0,0.01,0.01,0.01c0.02,0.02,0.04,0.04,0.06,0.07c0.36,0.44,0.75,0.85,1.15,1.24c0.04,0.04,0.07,0.07,0.11,0.1    c0.25,0.23,0.5,0.46,0.76,0.67c0.05,0.04,0.1,0.08,0.15,0.12c0.35,0.28,0.71,0.55,1.08,0.81c0.03,0.02,0.06,0.04,0.09,0.06    c0.17,0.11,0.35,0.22,0.52,0.33c0.09,0.06,0.18,0.11,0.28,0.17c0.12,0.07,0.25,0.14,0.38,0.21c0.11,0.06,0.22,0.12,0.33,0.17    c0.2,0.1,0.39,0.2,0.59,0.3c0.11,0.05,0.22,0.1,0.33,0.15c0,0,0.01,0,0.01,0.01c0.12,0.05,0.24,0.11,0.36,0.16    c0.33,0.14,0.66,0.26,1,0.37c0.04,0.02,0.09,0.03,0.13,0.04c0.02,0.01,0.03,0.01,0.05,0.02c0.15,0.05,0.31,0.09,0.47,0.14    c0.29,0.09,0.59,0.16,0.89,0.23c0.08,0.02,0.15,0.04,0.23,0.06c0.07,0.02,0.14,0.03,0.22,0.05c0.44,0.09,0.89,0.15,1.33,0.2    c0.04,0,0.07,0.01,0.11,0.02c0.08,0.01,0.15,0.01,0.23,0.02c0.49,0.05,0.98,0.08,1.48,0.08c0.42,0,0.84-0.02,1.26-0.06    c0.07-0.01,0.14-0.01,0.21-0.02c0.01,0,0.03,0,0.04,0c0.06-0.01,0.12-0.01,0.19-0.02c0.28-0.03,0.55-0.07,0.83-0.11    c0.08-0.01,0.16-0.02,0.24-0.04c0.13-0.02,0.25-0.04,0.38-0.07c0.06-0.01,0.12-0.03,0.19-0.04c0.4-0.09,0.81-0.19,1.21-0.31    c0.1-0.03,0.2-0.06,0.3-0.09c0.11-0.03,0.21-0.07,0.32-0.11c0.14-0.05,0.28-0.1,0.42-0.15c0.17-0.06,0.33-0.12,0.5-0.19    c0.1-0.04,0.2-0.09,0.3-0.13c0.13-0.06,0.26-0.12,0.39-0.18c0.19-0.09,0.37-0.19,0.56-0.28c0.13-0.07,0.25-0.13,0.38-0.2    c0.28-0.15,0.55-0.33,0.82-0.5c0.15-0.09,0.3-0.18,0.45-0.28c0.06-0.04,0.11-0.08,0.17-0.12c0.17-0.12,0.34-0.25,0.5-0.38    c0.06-0.04,0.12-0.09,0.18-0.13c0.11-0.09,0.23-0.17,0.34-0.26c0,0,0.01-0.01,0.01-0.01l59.04-48.93    c6.8-5.64,7.75-15.72,2.11-22.53c-5.64-6.8-15.73-7.75-22.53-2.11l-28.84,23.9c17.18-79.28,87.87-138.87,172.22-138.87    c97.17,0,176.22,79.05,176.22,176.22s-79.05,176.22-176.22,176.22c-8.84,0-16,7.16-16,16s7.16,16,16,16    c114.81,0,208.22-93.41,208.22-208.22S389.72,47.78,274.91,47.78z"
              />

              <path
                fill="#333333"
                d="M274.91,147.61c-8.84,0-16,7.16-16,16V256c0,8.84,7.16,16,16,16h75.87c8.84,0,16-7.16,16-16s-7.16-16-16-16    h-59.87v-76.39C290.91,154.77,283.74,147.61,274.91,147.61z"
              />
            </g>
          </g>
        </svg>
      </button>
    </div>
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
    background-color: var(--b1);
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
    width: 125px;
  }
  .reset-timer-button {
    position: absolute;
    right: -20px;
    top: 2px;
  }
  .section-title {
    font-family: font-bold;
    font-size: 26px;
    margin-top: 25px;
  }
  .title-divider {
    width: 100px;
    height: 2px;
    background-color: var(--b2);
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
      margin-top: 15px;
      font-size: 35px;
      margin-bottom: 10px;
    }
    .section-content {
      width: 95vw;
      margin: 20px 0;
    }
    .countdown-timer {
      position: absolute;
      top: -50px;
      left: 0px;
      font-family: cms-light;
      font-size: 12px;
      width: 100%;
      display: flex;
      justify-content: center;
    }
    .reset-timer-button {
      position: relative;
      margin-top: -6px;
      margin-left: -15px;
    }
  }

  @media (min-width: 700px) and (max-width: 1200px) {
  }

  @media (min-width: 1200px) and (max-width: 1800px) {
  }
  @media (min-width: 1800px) {
  }
</style>
