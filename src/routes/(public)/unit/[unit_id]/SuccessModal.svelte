<script lang="ts">
  import { customerStore } from "$lib/stores";
  import companyLogo from "$lib/photos/company-logo.png";
  import { createEventDispatcher } from "svelte";

  let dispatch = createEventDispatcher();

  function dispatchCloseModal() {
    dispatch("close", true);
  }
</script>

<section class="success-modal">
  <button class="close-modal" on:click={dispatchCloseModal}>
    <svg
      width="30px"
      height="30px"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="Menu / Close_MD">
        <path
          id="Vector"
          d="M18 18L12 12M12 12L6 6M12 12L18 6M12 12L6 18"
          stroke="#000000"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
    </svg>
  </button>
  {#if $customerStore}
    <h3>Thank you {$customerStore.first_name}!</h3>
  {/if}
  <a class="logo-link" href="https://drivehomerv.com/"
    ><img src={companyLogo} alt="Company Logo" /></a
  >

  <p>
    Your request has been submitted. A member of our team will contact you soon
    to confirm your reservation!
  </p>
</section>

<style>
  .success-modal {
    position: fixed;
    top: 200px;
    background-color: white;
    width: 90vw;
    max-width: 600px;
    z-index: 101;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    box-shadow: 0px 2px 3px grey;
    border-radius: 4px;
    padding: 25px 100px;
  }
  h3 {
    font-size: 36px;
    margin-bottom: 25px;
  }
  .close-modal {
    position: absolute;
    top: 25px;
    right: 25px;
  }
  p {
    font-size: 18px;
    text-align: center;
    max-width: 450px;
  }

  @media (max-width: 1000px) {
    .success-modal {
      padding: 25px;
    }
    h3 {
      font-size: 30px;
      margin-bottom: 5px;
    }
    .close-modal {
      position: absolute;
      top: 10px;
      right: 10px;
    }
  }
</style>
