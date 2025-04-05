<script lang="ts">
  import type { Booking } from "lib/types";

  export let bookingObject: Booking;
  // console.log(bookingObject);
</script>

<div class="link-container">
  {#if bookingObject.payment_link && bookingObject.status != "paid"}
    <a href={bookingObject.payment_link + "&state=checkout"}>Back to Checkout</a
    >
  {:else if bookingObject.in_checkout && bookingObject.status != "paid"}
    <a href={`/unit/${bookingObject.unit_id}/book_now?id=${bookingObject.id}`}
      >Back to Contact</a
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
