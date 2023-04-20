<script lang="ts">
  import companyLogo from "$lib/photos/company-logo.png";
  import { fade, slide } from "svelte/transition";

  let screenWidth: number | undefined;
  let mobileMenuElement: HTMLElement;

  let showMobileMenu = false;
  let mobileNavShowing = false;
  let clickListener = false;
  let scrollListener = false;

  $: if (mobileNavShowing) {
    document.addEventListener("click", closeMobileMenu);
    console.log(document.body);
    clickListener = true;
    document.addEventListener("scroll", closeMobileMenu);
    scrollListener = true;
  }
  $: if (!showMobileMenu) {
    if (clickListener) {
      document.removeEventListener("click", closeMobileMenu);
      clickListener = false;
    }
    if (scrollListener) {
      document.removeEventListener("scroll", closeMobileMenu);
      scrollListener = false;
    }
    mobileNavShowing = false;
  }

  function closeMobileMenu(event: Event) {
    if (!showMobileMenu) return;
    if (mobileMenuElement.contains(event.target as Node)) return;

    showMobileMenu = false;
  }
</script>

<svelte:window bind:innerWidth={screenWidth} />

<header>
  <a id="logo-link" href="https://drivehomerv.com/"
    ><img src={companyLogo} alt="Company Logo" /></a
  >

  <nav>
    {#if screenWidth}
      {#if screenWidth < 800}
        <!-- MOBILE NAVIGATION -->
        <button
          class="btn btn-square btn-ghost nav-button"
          in:fade
          on:click={() => {
            showMobileMenu = !showMobileMenu;
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            class="inline-block w-8 h-8 stroke-current"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            /></svg
          >
        </button>
        {#if showMobileMenu}
          <div
            class="mobile-nav-link-container"
            transition:slide
            on:introend={() => (mobileNavShowing = true)}
            bind:this={mobileMenuElement}
          >
            <a
              href="https://drivehomerv.com/#section-jQ3IZF8px"
              class="mobile-nav-link">About Us</a
            >
            <a
              href="https://drivehomerv.com/#section-UBMrEP5rr"
              class="mobile-nav-link">Rentals</a
            >
            <a
              href="https://drivehomerv.com/#section-vCVCUb6is"
              class="mobile-nav-link">Team</a
            >
            <a
              href="https://drivehomerv.com/consignments"
              class="mobile-nav-link">Consignments</a
            >
            <a
              href="https://drivehomerv.com/#section-J18w1PZX4"
              class="mobile-nav-link">Contact Us</a
            >
          </div>
        {/if}
      {:else}
        <!-- DESKTOP NAVIGATION -->
        <div class="nav-link-container" in:fade>
          <a href="https://drivehomerv.com/#section-jQ3IZF8px" class="nav-link"
            >About Us</a
          >
          <a href="https://drivehomerv.com/#section-UBMrEP5rr" class="nav-link"
            >Rentals</a
          >
          <a href="https://drivehomerv.com/#section-vCVCUb6is" class="nav-link"
            >Team</a
          >
          <a href="https://drivehomerv.com/consignments" class="nav-link"
            >Consignments</a
          >
          <a href="https://drivehomerv.com/#section-J18w1PZX4" class="nav-link"
            >Contact Us</a
          >
        </div>
      {/if}
    {/if}
  </nav>
</header>

<div>{screenWidth}</div>

<style>
  header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    max-width: 1800px;
    margin: 10px auto 0;
  }
  #logo-link {
    transition: all 1s;
    margin-left: 15px;
  }
  button {
    margin-right: 10px;
    background-color: transparent !important;
  }
  .nav-link-container {
    font-size: 16px;
    display: flex;
    justify-content: space-around;
    align-items: center;
    height: 100%;
  }
  .nav-link,
  .mobile-nav-link {
    padding: 5px 25px;
    cursor: pointer;
  }
  .mobile-nav-link-container {
    display: flex;
    flex-direction: column;
    font-size: 16px;
    height: 300px;
    position: absolute;
    right: 10px;
    top: 75px;
    justify-content: space-around;
    border-radius: 10px;
    padding: 10px;
    box-shadow: 0px 0px 2px grey;
    z-index: 100;
    background-color: hsl(var(--b1));
  }

  @media (max-width: 500px) {
    #logo-link {
      width: 60px;
    }
  }

  @media (min-width: 500px) and (max-width: 1000px) {
    #logo-link {
      width: 60px;
    }
  }

  @media (min-width: 1000px) {
    #logo-link {
      width: 80px;
    }
  }
</style>
