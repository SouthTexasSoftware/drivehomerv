<script lang="ts">
  import type { Booking, PhotoDocument, Unit } from "$lib/types";
  import AddPhotoDropdown from "./AddPhotoDropdown.svelte";
  import { fade, fly, slide } from "svelte/transition";
  import { afterUpdate, beforeUpdate, onMount } from "svelte";
  import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    updateDoc,
  } from "firebase/firestore";
  import { unitStore } from "$lib/stores";
  import { firebaseStore } from "$lib/new_stores/firebaseStore";
  import { page, updated } from "$app/stores";
  import { deleteObject, ref } from "firebase/storage";
  //@ts-ignore
  import Sortable from "sortablejs";
  import { afterNavigate, beforeNavigate } from "$app/navigation";

  export let bookingObject: Booking;
  export let updatePhotos: boolean;

  let sortableContainer: HTMLElement;
  let bookingPhotos: PhotoDocument[] = [];
  let photoElementHolder: { [id: string]: HTMLElement } = {};
  let photosLoaded = false;
  let indexUpdated = false;
  let loading = false;
  let saved = false;
  let saving = false;

  $: bookingPhotosSubcollectionRef = collection(
    $firebaseStore.db,
    "units",
    $page.params.unit_id,
    "bookings",
    $page.params.subcategory,
    "photos"
  );

  afterNavigate(loadPhotos);

  $: if (updatePhotos != undefined) {
    if (bookingObject?.photos) {
      bookingPhotos = structuredClone(bookingObject.photos);
    }
  }

  async function loadPhotos() {
    loading = true;
    // empty the silly array.
    while (bookingPhotos.length > 0) {
      bookingPhotos.pop();
    }
    if (bookingObject?.photos) {
      if (bookingObject?.photos.length > 0) {
        // console.log(bookingObject);
        bookingPhotos = bookingObject.photos;
        loading = false;
        return;
      }
    }

    let photoDocs = await getDocs(bookingPhotosSubcollectionRef);

    photoDocs.forEach((doc) => {
      bookingPhotos.push(doc.data() as PhotoDocument);
    });

    bookingObject.photos = structuredClone(bookingPhotos);

    loading = false;
  }

  function makeSortable() {
    var sortable = Sortable.create(sortableContainer, {
      handle: ".drag-handle",
      animation: 150,
      direction: "vertical",
      ghostClass: "ghost",
      onEnd: (evt: CustomEvent) => {
        //@ts-ignore
        if (evt.newIndex == evt.oldIndex) {
          return;
        }
        updatePhotosIndexes();
      },
    });
  }

  async function updatePhotosIndexes() {
    saving = true;

    let photoElementsArray = Array.from(sortableContainer.children);

    //loop through the sortableContainer, and set index to loop count
    for (let index = 0; index < photoElementsArray.length; index++) {
      //@ts-ignore
      let photoObjectID = photoElementsArray[index].attributes["data-id"].value;

      for (let photoObj of bookingObject.photos) {
        if (photoObj.id == photoObjectID) {
          photoObj.index = index + 1;

          //update the firebase
          let photoDoc = doc(bookingPhotosSubcollectionRef, photoObj.id);
          await updateDoc(photoDoc, {
            index: index + 1,
          });
        }
      }
    }
    indexUpdated = !indexUpdated;
    saving = false;
    saved = true;
    setTimeout(() => {
      saved = false;
    }, 2000);
  }

  async function deletePhoto(photoDocument: PhotoDocument) {
    loading = true;

    let photoDocRef = doc(bookingPhotosSubcollectionRef, photoDocument.id);
    await deleteDoc(photoDocRef);

    try {
      let storageRef = ref($firebaseStore.storage, photoDocument.file_path);
      await deleteObject(storageRef);
    } catch (e) {
      // console.log("error deleting storage file --- ", e);
    }

    bookingObject.photos.forEach((photo, index) => {
      if (photo.id == photoDocument.id) {
        bookingObject.photos.splice(index, 1);
      }
    });

    bookingPhotos = structuredClone(bookingObject.photos);

    loading = false;
  }
</script>

<div class="sortable-photo-container" bind:this={sortableContainer}>
  {#if bookingPhotos.length > 0}
    {#each bookingPhotos as photoObject}
      <div
        class="photo-container"
        data-id={photoObject.id}
        class:disabled={loading}
        bind:this={photoElementHolder[photoObject.id]}
      >
        <div
          class="image-container"
          style="background-image:url({photoObject.downloadURL})"
        />
        <div class="label-column">
          <h4 class="photo-label">{photoObject.label}</h4>
          <p class="photo-size">{photoObject.file_size} KB</p>
          <button
            class="delete-photo"
            on:click={() => {
              deletePhoto(photoObject);
            }}
            ><svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M4 0C3.64638 0 3.30724 0.140476 3.05719 0.390524C2.80714 0.640573 2.66667 0.979711 2.66667 1.33333V2.66667H0.666667C0.489856 2.66667 0.320286 2.7369 0.195262 2.86193C0.0702379 2.98695 0 3.15652 0 3.33333C0 3.51014 0.0702379 3.67971 0.195262 3.80474C0.320286 3.92976 0.489856 4 0.666667 4H1.256C1.28 4.22533 1.308 4.50267 1.336 4.80867C1.40933 5.61 1.48133 6.58467 1.48133 7.33333C1.48133 8.31333 1.35933 9.672 1.27133 10.5173C1.25184 10.7042 1.27178 10.8932 1.32987 11.0719C1.38796 11.2506 1.48291 11.4152 1.60857 11.5549C1.73423 11.6947 1.88782 11.8065 2.0594 11.8831C2.23098 11.9598 2.41674 11.9996 2.60467 12H9.39533C9.58326 11.9996 9.76902 11.9598 9.9406 11.8831C10.1122 11.8065 10.2658 11.6947 10.3914 11.5549C10.5171 11.4152 10.612 11.2506 10.6701 11.0719C10.7282 10.8932 10.7482 10.7042 10.7287 10.5173C10.6407 9.672 10.5187 8.31333 10.5187 7.33333C10.5187 6.58467 10.59 5.61 10.664 4.80867C10.692 4.50267 10.72 4.22533 10.744 4H11.3333C11.5101 4 11.6797 3.92976 11.8047 3.80474C11.9298 3.67971 12 3.51014 12 3.33333C12 3.15652 11.9298 2.98695 11.8047 2.86193C11.6797 2.7369 11.5101 2.66667 11.3333 2.66667H9.33333V1.33333C9.33333 0.979711 9.19286 0.640573 8.94281 0.390524C8.69276 0.140476 8.35362 0 8 0H4ZM8 2.66667V1.33333H4V2.66667H8ZM2.664 4.68667C2.64067 4.43467 2.61733 4.20133 2.59667 4H9.40333C9.37966 4.22875 9.35744 4.45764 9.33667 4.68667C9.262 5.49467 9.18533 6.52 9.18533 7.33333C9.18533 8.38933 9.31467 9.80933 9.402 10.6547V10.6593C9.40133 10.6614 9.40019 10.6632 9.39867 10.6647L9.39667 10.6667H2.60333C2.60098 10.665 2.59914 10.6627 2.598 10.66V10.6547C2.68533 9.80933 2.81467 8.38933 2.81467 7.33333C2.81467 6.52 2.738 5.49467 2.664 4.68667ZM4.66667 4.66667C4.84348 4.66667 5.01305 4.7369 5.13807 4.86193C5.2631 4.98695 5.33333 5.15652 5.33333 5.33333V9.33333C5.33333 9.51014 5.2631 9.67971 5.13807 9.80474C5.01305 9.92976 4.84348 10 4.66667 10C4.48986 10 4.32029 9.92976 4.19526 9.80474C4.07024 9.67971 4 9.51014 4 9.33333V5.33333C4 5.15652 4.07024 4.98695 4.19526 4.86193C4.32029 4.7369 4.48986 4.66667 4.66667 4.66667ZM8 5.33333C8 5.15652 7.92976 4.98695 7.80474 4.86193C7.67971 4.7369 7.51014 4.66667 7.33333 4.66667C7.15652 4.66667 6.98695 4.7369 6.86193 4.86193C6.73691 4.98695 6.66667 5.15652 6.66667 5.33333V9.33333C6.66667 9.51014 6.73691 9.67971 6.86193 9.80474C6.98695 9.92976 7.15652 10 7.33333 10C7.51014 10 7.67971 9.92976 7.80474 9.80474C7.92976 9.67971 8 9.51014 8 9.33333V5.33333Z"
                fill="#3D3D3D"
              />
            </svg></button
          >
        </div>
        <div class="index-column">
          <!-- {#key indexUpdated}
            <div class="index-marker">
              {photoObject.index}
            </div>
          {/key} -->
          <!-- <button class="drag-handle"
            ><svg
              width="12"
              height="14"
              viewBox="0 0 12 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 5.66667H11M7.42857 11.6667L6 13L4.57143 11.6667M7.42857 2.33333L6 1L4.57143 2.33333M1 8.33333H11"
                stroke="#3D3D3D"
                stroke-width="1.40278"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            </button
          > -->
        </div>
      </div>
    {/each}
  {/if}
</div>

<div class="loading-container">
  {#if loading}
    <div class="spinner" />
  {/if}
  {#if saved}
    <svg
      width="14"
      height="12"
      viewBox="0 0 14 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      transition:fade
    >
      <path
        d="M1 5.95654L5.16047 9.74893L12.0943 1.10277"
        stroke="#AE2623"
        stroke-width="2.77358"
      />
    </svg>
  {/if}
</div>

<style>
  .sortable-photo-container {
    display: flex;
    flex-direction: column;
    overflow: scroll;
  }

  .photo-container {
    display: flex;
    padding: 10px;
    border-bottom: 1px solid var(--cms-boxShadow);
  }
  .photo-container.disabled {
    cursor: progress;
    filter: blur(1px);
    pointer-events: none;
  }
  .image-container {
    width: 70px;
    height: 70px;
    border-radius: 4px;
    background-position: center;
    background-size: cover;
  }
  .label-column {
    display: flex;
    flex-direction: column;
    margin-right: auto;
    margin-left: 10px;
  }
  .photo-label {
    font-family: cms-regular;
    font-size: 16px;
  }
  .photo-size {
    font-family: cms-light;
    font-size: 10px;
    margin-top: -3px;
  }
  .index-column {
    display: flex;
    flex-direction: column;
  }
  .delete-photo,
  .drag-handle {
    margin-top: auto;
  }
  .index-marker {
    border-radius: 4px;
    background-color: #fcf5e4;
    border: 1px solid #ece5d2;
    color: #ccbd97;
    width: 15px;
    font-size: 12px;
    text-align: center;
  }

  .loading-container {
    position: absolute;
    bottom: 5px;
    right: -25px;
  }
  .spinner {
    content: "";
    border-radius: 50%;
    border-top: 2px solid var(--p);
    border-right: 2px solid transparent;
    animation-name: spinning;
    animation-duration: 1.2s;
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
