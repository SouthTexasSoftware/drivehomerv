<script lang="ts">
  import { enhance } from "$app/forms";
  import { unitStore, firebaseStore } from "$lib/stores";
  import {
    Timestamp,
    arrayUnion,
    collection,
    doc,
    updateDoc,
  } from "firebase/firestore";
  import { ref, uploadBytes } from "firebase/storage";
  import { createEventDispatcher } from "svelte";

  let addingPhotos = false;
  let dispatch = createEventDispatcher();
</script>

<div class="add-photos-container">
  <h4>Add Photos</h4>
  <form
    method="POST"
    name="add-photos"
    id="add-photos"
    use:enhance={async ({ data, cancel }) => {
      // console.log(data);
      if (addingPhotos) {
        cancel();
        return;
      }
      addingPhotos = true;

      if (!data.get("unit-select")) {
        cancel();
        addingPhotos = false;
        return;
      }
      let unitId = data.get("unit-select");
      let fileObj = data.get("photo-file");
      if (!fileObj) {
        cancel();
        addingPhotos = false;
        return;
      }

      //@ts-ignore
      const storagePath =
        //@ts-ignore
        "units/" + data.get("unit-select") + "/photos/" + fileObj.name;

      const storageReference = ref($firebaseStore.storage, storagePath);
      //TODO: move this inline function into the TS script tag, so that we can assert types...
      //@ts-ignore
      await uploadBytes(storageReference, fileObj);
      //@ts-ignore
      let docRef = doc($firebaseStore.db, "units", unitId);

      await updateDoc(docRef, {
        photo_list: arrayUnion({
          date_added: Timestamp.now(),
          //@ts-ignore
          filename: fileObj.name,
          index: null,
          primary: false,
        }),
      });

      addingPhotos = false;
      cancel();
      dispatch("refresh", true);
    }}
  >
    <label for="unit-select"><strong>Unit</strong></label>
    <select
      name="unit-select"
      id="unit-select"
      form="add-photos"
      class="select select-bordered w-full max-w-xs"
      required
    >
      <option selected disabled>Choose Unit</option>
      {#if $unitStore.isPopulated}
        {#each $unitStore.units as unitObject}
          <option value={unitObject.id}>{unitObject.name}</option>
        {/each}
      {/if}
    </select>

    <input
      type="file"
      name="photo-file"
      class="file-input file-input-bordered w-full max-w-xs"
    />

    <button
      type="submit"
      class="btn btn-primary w-full"
      class:loading={addingPhotos}>ADD</button
    >
  </form>
</div>

<style>
  .add-photos-container {
    border: 1px solid hsl(var(--b3));
    border-radius: 4px;
    width: 100%;
    max-width: 400px;
    padding: 25px;
    display: flex;
    flex-direction: column;
    align-items: center;
    max-height: 50vh;
    background-color: hsl(var(--b1));
  }
  h4 {
    font-size: 20px;
  }
  button {
    margin-top: 15px;
  }
  input {
    margin-top: 15px;
  }
</style>
