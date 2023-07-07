<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { firebaseStore } from "$lib/stores";
  import type { Booking, Unit } from "$lib/types";
  import { collection, deleteDoc, doc } from "firebase/firestore";
  import { deleteObject, ref } from "firebase/storage";
  import { slide } from "svelte/transition";

  export let bookingObject: Booking | undefined;
  export let unitObject: Unit;

  let confirmShowing = false;
  let deleting = false;

  let bookingsSubcollectionRef = collection(
    $firebaseStore.db,
    "units",
    $page.params.unit_id,
    "bookings"
  );

  async function deleteBooking() {
    if (!confirmShowing) {
      confirmShowing = true;
      return;
    }
    if (deleting) return;
    deleting = true;

    if (bookingObject) {
      // delete everything.. firebase and storage
      await deleteDoc(doc(bookingsSubcollectionRef, bookingObject.id));

      let bookingStoragePath =
        "units/" + $page.params.unit_id + "/bookings/" + bookingObject.id;
      let bookingStorageRef = ref($firebaseStore.storage, bookingStoragePath);

      try {
        await deleteObject(bookingStorageRef);
      } catch (e) {
        console.log("bookings storage object does not exist");
      }
      if (unitObject.bookings) {
        unitObject.bookings.forEach((booking, index) => {
          //@ts-ignore
          if (booking.id == bookingObject.id) {
            // remove from array at 'index'
            unitObject.bookings?.splice(index, 1);
          }
        });
      }

      await goto("/cms/units/" + $page.params.unit_id + "/bookings");
    }
  }
</script>

<div class="settings-dropdown-container" in:slide>
  <button class="delete" on:click={deleteBooking}>
    {#if deleting}
      <div class="spinner" />
    {:else if confirmShowing}
      Confirm
    {:else}
      Delete Booking
    {/if}
  </button>
</div>

<style>
  .settings-dropdown-container {
    position: absolute;
    top: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    left: 0;
    padding-top: 10px;
    background-color: #eee;
    border-top: 1px solid var(--cms-boxShadow);
    height: 149px;
    justify-content: center;
  }
  .delete {
    border: 1px solid var(--cms-boxShadow);
    font-size: 16px;
    font-family: cms-regular;
    padding: 6px 15px;
    border-radius: 4px;
    outline: none;
    width: 80%;
    background-color: hsl(var(--p));
    color: hsl(var(--b2));
    justify-content: center;
    display: flex;
    height: 35px;
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
