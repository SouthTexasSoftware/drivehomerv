<script lang="ts">
  import { unitStore, firebaseStore } from "$lib/stores";
  import { enhance } from "$app/forms";
  import type { Unit } from "$lib/types";
  import { Timestamp, arrayUnion, doc, updateDoc } from "firebase/firestore";
  import { ref, uploadBytes } from "firebase/storage";
  import { createEventDispatcher } from "svelte";

  export let unitObject: Unit;

  let dispatch = createEventDispatcher();
  let addingPhotos = false;
  let errorMessage = "";
  let showError = false;
</script>

<div class="outer-container">
  <h4>Add Photos</h4>
  <form
    method="POST"
    name="add-unit-photos"
    id="add-unit-photos"
    use:enhance={async ({ data, cancel }) => {
      if (addingPhotos) {
        cancel();
        return;
      }
      addingPhotos = true;
      showError = false;

      for (let entry of data.entries()) {
        let fileObject = entry[1];
        //@ts-ignore
        if (fileObject.name == "") {
          console.warn("No file added");
          addingPhotos = false;
          errorMessage = "No file detected.";
          showError = true;
          cancel();
          return;
        }
        const storagePath =
          //@ts-ignore
          "units/" + unitObject.id + "/photos/" + fileObject.name;

        const storageReference = ref($firebaseStore.storage, storagePath);
        //@ts-ignore
        await uploadBytes(storageReference, fileObject);

        //@ts-ignore
        let docRef = doc($firebaseStore.db, "units", unitObject.id);

        await updateDoc(docRef, {
          photo_list: arrayUnion({
            date_added: Timestamp.now(),
            //@ts-ignore
            filename: fileObject.name,
            index: null,
            primary: false,
          }),
        });
      }
      addingPhotos = false;
      cancel();
      dispatch("refresh", true);
    }}
  >
    <input
      type="file"
      name="photo-files"
      class="file-input file-input-bordered w-full"
      multiple
    />

    <button
      type="submit"
      class="btn btn-primary w-full"
      class:loading={addingPhotos}>ADD</button
    >
  </form>
  {#if showError}
    <p class="error-message">{errorMessage}</p>
  {/if}
</div>

<style>
  .outer-container {
    background-color: hsl(var(--b1));
    padding: 25px;
    display: flex;
    flex-direction: column;
    align-items: center;
    border-radius: 4px;
    border: 1px solid hsl(var(--b3));
    width: 300px;
    height: 200px;
    margin: 0 25px 25px;
  }
  h4 {
    font-size: 20px;
  }
  .file-input {
    font-size: 12px;
  }
  .error-message {
    color: hsl(var(--erc));
    background-color: hsl(var(--er));
    padding: 2px 15px;
    border-radius: 4px;
    margin-top: 5px;
    font-size: 12px;
    opacity: 0.5;
  }
</style>
