<script lang="ts">
  import { page } from "$app/stores";
  import { formatFirebaseTimestamp } from "$lib/helpers";
  import { customerStore, unitStore } from "$lib/stores";
</script>

<div class="customers-selection-container">
  <h2>Customers</h2>
  <div class="divider" />
  <div class="customer-links">
    {#if $customerStore.isPopulated}
      {#each $customerStore.customers as customer}
        <a
          href="/cms/customers/{customer.id}"
          class="flex flex-col"
          class:active={$page.url.pathname.includes(customer.id)}
          >{customer.first_name + " " + customer.last_name}
          <span class="text-xs font-[cms-light] -mt-1"
            >{formatFirebaseTimestamp(customer.created, true)}</span
          >
        </a>
      {/each}
    {/if}
  </div>
</div>

<style>
  .customers-selection-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--cms-boxShadow);
    width: 250px;
  }
  .customer-links {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  h2 {
    font-family: cms-bold;
    color: var(--cms-text);
    font-size: 24px;
    margin: 100px 20px 0px 20px;
  }
  .divider {
    margin: 0 0 20px 20px;
    width: 50px;
    height: 2px;
  }
  a {
    font-family: cms-medium;
    color: var(--cms-text);
    padding: 10px 40px 10px 20px;
    width: 250px;
    transition: all 0.3s;
  }
  a.create-link {
    color: hsl(var(--p));
    font-family: cms-semibold;
  }
  a.active {
    background-color: var(--cms-highlightPrimary);
    border-right: 3px solid hsl(var(--p));
  }

  @media (max-width: 1000px) {
    .customers-selection-container {
      height: 51px;
      display: flex;
      flex-direction: row;
      border: none;
      border-left: 2px solid var(--cms-boxShadow);
      border-top: 1px solid var(--cms-boxShadow);
      width: 50vw;
      position: fixed;
      bottom: 60px;
      right: 0;
      background-color: transparent;
      overflow: scroll;
      scroll-snap-type: x mandatory;
      z-index: 10;
    }
    h2,
    .divider {
      display: none;
    }
    .customer-links {
      position: relative;
      width: auto;
      height: auto;
      /* overflow-y: scroll; */
      scroll-snap-type: x mandatory;
      background-color: transparent;
      gap: 0;
      flex-direction: row;
    }
    a {
      font-family: cms-bold;
      color: var(--cms-text);
      width: 50vw;
      padding-right: 20px;
      font-size: 20px;
      height: 50px !important;
      line-height: 52px;
      padding: 0;
      /* margin-right: 40px; */
      overflow: clip;
      scroll-snap-align: start;
      text-align: center;
    }
    a.active {
      background-color: transparent;
      border: none;
      text-decoration: underline;
      text-decoration-color: hsl(var(--p));
      text-decoration-thickness: 3px;
    }
  }
</style>
