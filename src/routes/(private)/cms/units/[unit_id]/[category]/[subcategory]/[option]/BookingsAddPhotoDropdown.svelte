<script lang="ts">
  import { firebaseStore, unitStore } from "$lib/stores";
  import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
  import { page } from "$app/stores";
  import {
    doc,
    updateDoc,
    Timestamp,
    collection,
    addDoc,
    setDoc,
  } from "firebase/firestore";
  import { createEventDispatcher } from "svelte";
  import type { Booking, Unit } from "$lib/types";
  import { slide } from "svelte/transition";

  export let bookingObject: Booking | undefined;

  let fileReady = false;
  let buttonText = "Choose File ...";
  let labelInput = "";
  let readyToUpload = false;
  let fileHolder: File;
  let uploadingPhoto = false;

  let dispatch = createEventDispatcher();

  $: if (labelInput != "" && fileReady) {
    readyToUpload = true;
  }

  async function uploadPhoto() {
    if (uploadingPhoto) {
      return;
    }
    uploadingPhoto = true;

    let storagePath =
      "units/" +
      $page.params.unit_id +
      "/bookings/" +
      $page.params.subcategory +
      "/photos/" +
      fileHolder.name;

    let fileSizeKB = Math.round(fileHolder.size / 1000);

    let storageRef = ref($firebaseStore.storage, storagePath);

    await uploadBytes(storageRef, fileHolder);

    // get download URL to store in database object.
    let photoDownloadURL = await getDownloadURL(storageRef);

    // the photo has it's own document. in a subcollection on the unit.
    // get a reference to this subcollection
    let bookingPhotosSubcollectionRef = collection(
      $firebaseStore.db,
      "units",
      $page.params.unit_id,
      "bookings",
      $page.params.subcategory,
      "photos"
    );

    let newPhotoIndex = 0;
    if (bookingObject) {
      newPhotoIndex = bookingObject.photos.length + 1;
    }
    let newPhotoId = newUUID();
    let newPhotoDocRef = doc(bookingPhotosSubcollectionRef, newPhotoId);

    let newPhotoDoc = {
      id: newPhotoId,
      label: labelInput,
      filename: fileHolder.name,
      file_size: fileSizeKB,
      date_added: Timestamp.now(),
      file_path: storagePath,
      downloadURL: photoDownloadURL,
      unit_id: $page.params.unit_id,
      subcategory: $page.params.subcategory,
      option: $page.params.option,
      index: newPhotoIndex,
    };

    await setDoc(newPhotoDocRef, newPhotoDoc);
    if (bookingObject) {
      bookingObject.photos.push(newPhotoDoc);
    }

    bookingObject?.photos.push(newPhotoDoc);

    console.log("added photo to bookingObject", bookingObject);

    dispatch("added", true);

    uploadingPhoto = false;
  }

  function newUUID(): string {
    // Alphanumeric characters
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let autoId = "";
    for (let i = 0; i < 20; i++) {
      autoId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return autoId;
  }
</script>

<div class="add-photo-container" transition:slide>
  <h3>ADD PHOTO</h3>
  <div class="message-box">
    <p>Square photos preferred.</p>
    <p>Aspect ratio 1 : 1</p>
    <p>File size &lt; 3MB preferred.</p>
  </div>
  <div class="property">
    <p class="label">Photo Label</p>
    <input bind:value={labelInput} type="text" />
  </div>

  <label class="file-input-button" for="file-input">
    {buttonText}
  </label>
  <input
    on:change={(evt) => {
      if (evt) {
        //@ts-ignore
        buttonText = evt?.target?.files[0].name;
        //@ts-ignore
        fileHolder = evt?.target?.files[0];
        fileReady = true;
      }
    }}
    hidden
    name="file-input"
    id="file-input"
    type="file"
  />

  <button
    class="upload-button"
    class:ready={readyToUpload}
    on:click={() => {
      if (!readyToUpload) {
        return;
      }
      uploadPhoto();
    }}
  >
    {#if uploadingPhoto}
      <div class="spinner" />
    {:else}
      UPLOAD
    {/if}</button
  >
</div>

<style>
  .add-photo-container {
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
  }
  h3 {
    font-family: cms-semibold;
    font-size: 18px;
    color: var(--cms-text);
    margin-bottom: 5px;
  }
  .message-box {
    text-align: center;
    font-size: 14px;
    line-height: 24px;
  }
  .property {
    width: 300px;
    padding: 0 25px;
    margin-top: 10px;
    scroll-snap-align: center;
  }
  .label {
    font-family: cms-semibold;
    font-size: 13px;
    color: var(--cms-text);
    width: 100%;
  }

  input {
    border: 1px solid var(--cms-boxShadow);
    font-size: 16px;
    font-family: cms-regular;
    padding: 6px 15px;
    border-radius: 4px;
    margin-top: -10px;
    outline: none;
    width: 100%;
  }
  .file-input-button {
    font-family: cms-light;
    margin: 20px 20px;
    width: 250px;
    padding: 7px;
    border-radius: 4px;
    background-color: var(--cms-boxShadow);
    color: var(--cms-text);
    font-size: 14px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    border: 1px solid #ccc;
  }
  .upload-button {
    font-family: cms-semibold;
    margin-bottom: 20px;
    width: 250px;
    height: 37px;
    border-radius: 4px;
    background-color: var(--cms-highlightPrimary);
    color: hsl(var(--b1));
    font-size: 14px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  }
  .upload-button.ready {
    background-color: hsl(var(--p));
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
