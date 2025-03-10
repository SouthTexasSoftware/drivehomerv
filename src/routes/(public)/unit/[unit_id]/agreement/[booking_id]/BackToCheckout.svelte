<script lang="ts">
  import type { Booking } from "lib/types";

  export let bookingObject: Booking;
</script>

<div class="link-container">
  {#if bookingObject.in_checkout}
    <a href={bookingObject.payment_link + "&state=checkout"}>Back to Checkout</a
    >
  {/if}
</div>

<style>
  .link-container {
    position: absolute;
    right: 10px;
    top: 10px;
  }
  a {
    font-family: cms-semibold;
    border-bottom: 1px solid hsl(var(--p));
  }
</style>
