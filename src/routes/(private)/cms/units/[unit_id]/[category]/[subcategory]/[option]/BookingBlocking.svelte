<script lang="ts">
  import { page } from "$app/stores";
  import { deleteDoc, doc } from "firebase/firestore";
  import { firebaseStore } from "$lib/stores";
  import { goto } from "$app/navigation";

  export let blockingObject: any;
  let deleting = false;

  async function removeBlocking() {
    if (deleting) return;
    deleting = true;
    //delete doc is sufficient
    let docRef = doc(
      $firebaseStore.db,
      "units",
      $page.params.unit_id,
      "bookings",
      blockingObject.id
    );

    await deleteDoc(docRef);

    goto("/cms/units/" + $page.params.unit_id + "/bookings");

    deleting = false;
  }
</script>

<div class="blocking-container">
  <div class="section">
    <div class="section-label">From:</div>
    <p>{blockingObject.start}</p>
  </div>
  <div class="section">
    <div class="section-label">To:</div>
    <p>{blockingObject.end}</p>
  </div>
  <div class="section">
    <div class="section-label">Notes</div>

    <p>{blockingObject.notes}</p>
  </div>
  <div class="button-container">
    <button on:click={removeBlocking}>
      {#if deleting}
        <div class="spinner" />
      {:else}
        Remove Blocking
      {/if}
    </button>
  </div>
</div>

<style>
  .blocking-container {
    display: flex;
    flex-direction: column;
    padding: 15px;
    overflow-y: scroll;
  }
  .section {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 15px;
  }
  .section-label {
    font-family: cms-semibold;
    align-self: flex-start;
    font-size: 14px;
    display: flex;
    margin-left: 0 !important;
    position: relative;
  }
  p {
    font-family: cms-regular;
    font-size: 18px;
  }
  button {
    font-family: cms-semibold;
    padding: 3px 15px;
    background-color: hsl(var(--p));
    color: hsl(var(--b1));
    border-radius: 5px;
    margin: 15px;
    margin-top: 150px;
    width: 200px;
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
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
    width: 15px;
    height: 15px;
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
