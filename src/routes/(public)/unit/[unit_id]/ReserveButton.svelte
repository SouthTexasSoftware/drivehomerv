<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { fly } from "svelte/transition";

  export let showRequest: boolean;
  export let selectedTripLength: number;
  let showLoader = false;

  let dispatch = createEventDispatcher();

  function dispatchShowModal() {
    showLoader = true;
    dispatch("showModal", true);
  }
</script>

<!-- {#if !selectedTripLength}
  <button class="reserve fixed"> <p>SELECT DATES</p></button> -->
{#if selectedTripLength && !showRequest}
  <button
    class="reserve fixed"
    on:click={dispatchShowModal}
    in:fly={{ y: 100 }}
  >
    {#if !showLoader}
      <svg
        width="20px"
        height="20px"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g id="Calendar / Calendar_Check">
          <path
            id="Vector"
            d="M4 8H20M4 8V16.8002C4 17.9203 4 18.4801 4.21799 18.9079C4.40973 19.2842 4.71547 19.5905 5.0918 19.7822C5.5192 20 6.07899 20 7.19691 20H16.8031C17.921 20 18.48 20 18.9074 19.7822C19.2837 19.5905 19.5905 19.2842 19.7822 18.9079C20 18.4805 20 17.9215 20 16.8036V8M4 8V7.2002C4 6.08009 4 5.51962 4.21799 5.0918C4.40973 4.71547 4.71547 4.40973 5.0918 4.21799C5.51962 4 6.08009 4 7.2002 4H8M20 8V7.19691C20 6.07899 20 5.5192 19.7822 5.0918C19.5905 4.71547 19.2837 4.40973 18.9074 4.21799C18.4796 4 17.9203 4 16.8002 4H16M8 4H16M8 4V2M16 4V2M15 12L11 16L9 14"
            stroke="#fff"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </g>
      </svg>
      <p>BOOK NOW</p>
    {:else}
      <div class="spinner" />
    {/if}
  </button>
{/if}

<style>
  button {
    background-color: hsl(var(--p));
    /* border-radius: 3px; */
    color: hsl(var(--b1));
    width: 90%;
    padding: 8px 0;
    margin-top: 25px;
    position: fixed;
    bottom: 20px;
    z-index: 100;
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 15px;
  }
  button p {
    font-family: font-light;
    font-size: 20px;
    /* border-bottom: 1px solid hsl(var(--b3)); */
  }
  svg {
    margin-right: 10px;
  }
  .spinner {
    content: "";
    border-radius: 50%;
    border-top: 2px solid hsl(var(--b1));
    border-right: 2px solid transparent;
    animation-name: spinning;
    animation-duration: 1s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    opacity: 1;
    transition: all 0.2s;
    width: 20px;
    height: 20px;
    margin: 0 auto;
  }
  @keyframes spinning {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
