<script lang="ts">
  import type { PhotoDocument, Unit } from "$lib/types";
  import AddPhotoDropdown from "./AddPhotoDropdown.svelte";
  import { fade, fly, slide } from "svelte/transition";
  import { beforeUpdate, onMount } from "svelte";
  import { collection, deleteDoc, doc, updateDoc } from "firebase/firestore";
  import { firebaseStore, unitStore } from "$lib/stores";
  import { page } from "$app/stores";
  import { deleteObject, ref } from "firebase/storage";
  //@ts-ignore
  import Sortable from "sortablejs";

  export let unitObject: Unit;
  export let subcategory: string;
  export let option: string;

  let sortableContainer: HTMLElement;
  let addDropdownShowing = false;
  let photosToShowArray: PhotoDocument[] = [];
  let indexUpdated = false;
  let saving = false;
  let saved = false;

  let photosSubcollectionRef = collection(
    $firebaseStore.db,
    "units",
    $page.params.unit_id,
    "photos"
  );

  $: if ($page.params.option) {
    //if option changes, refresh photos array
    updateAndSortShowingArray();
  }

  onMount(() => {
    updateAndSortShowingArray();
    if (sortableContainer) {
      makeSortable();
    }
  });

  function updateAndSortShowingArray() {
    photosToShowArray = [];
    for (let photoObject of unitObject.photos) {
      if (
        photoObject.option == option &&
        photoObject.subcategory == subcategory
      ) {
        photosToShowArray.push(photoObject);
      }
    }

    photosToShowArray = photosToShowArray.sort((photoA, photoB) => {
      if (photoA.index < photoB.index) {
        return -1;
      }
      return 1;
    });
    indexUpdated = !indexUpdated;
  }

  //
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

  async function updatePhotosOnDelete(deletedIndex: number) {
    // loop through everything left in the photoToShowArray
    // update the indexed following only..
    for (let photo of photosToShowArray) {
      if (photo.index > deletedIndex + 1) {
        let newPhotoIndex = photo.index - 1;
        photo.index = newPhotoIndex;

        let photoDoc = doc(photosSubcollectionRef, photo.id);
        await updateDoc(photoDoc, {
          index: newPhotoIndex,
        });
      }
    }
  }

  async function deletePhoto(photoDocument: PhotoDocument) {
    saving = true;

    let photoDocRef = doc(photosSubcollectionRef, photoDocument.id);
    await deleteDoc(photoDocRef);

    try {
      let storageRef = ref($firebaseStore.storage, photoDocument.file_path);
      await deleteObject(storageRef);
    } catch (e) {
      console.log("error deleting storage file --- ", e);
    }

    for (
      let photoIndex = 0;
      photoIndex < unitObject.photos.length;
      photoIndex++
    ) {
      let photo = unitObject.photos[photoIndex];

      if (photo.id == photoDocument.id) {
        unitObject.photos.splice(photoIndex, 1);

        let querySelectorString = '[data-id="' + photoDocument.id + '"]';
        let photoElement = document.querySelector(querySelectorString);
        console.log(photoElement);
        if (photoElement) {
          photoElement.remove();
        }

        await updatePhotosIndexes();
      }
    }
  }

  async function updatePhotosIndexes() {
    saving = true;

    let photoElementsArray = Array.from(sortableContainer.children);

    //loop through the sortableContainer, and set index to loop count
    for (let index = 0; index < photoElementsArray.length; index++) {
      //@ts-ignore
      let photoObjectID = photoElementsArray[index].attributes["data-id"].value;

      for (let photoObj of unitObject.photos) {
        if (photoObj.id == photoObjectID) {
          photoObj.index = index + 1;

          //update the firebase
          let photoDoc = doc(photosSubcollectionRef, photoObj.id);
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

  function objectKeyToLabel(key: string) {
    let label = key.replaceAll("_", " ");
    label = label.replaceAll("and", "&");

    return label.replace(/(^|\s)\S/g, function (t) {
      return t.toUpperCase();
    });
  }
</script>

{#if option}
  <div class="photos-option-container">
    <div class="container-header">
      <p class="option-title">{objectKeyToLabel(option)} Photos</p>

      <button
        class="add-photo"
        on:click={() => (addDropdownShowing = !addDropdownShowing)}
      >
        {#if addDropdownShowing}
          <svg
            in:fade
            width="13"
            height="14"
            viewBox="0 0 11 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M4.58403 1.04084C4.86064 1.31746 4.86064 1.76595 4.58403 2.04258L2.9599 3.66671H6.56234C8.71397 3.66671 10.4582 5.41091 10.4582 7.56254C10.4582 9.71417 8.71397 11.4584 6.56234 11.4584H4.7915C4.40029 11.4584 4.08317 11.1413 4.08317 10.75C4.08317 10.3588 4.40029 10.0417 4.7915 10.0417H6.56234C7.93155 10.0417 9.0415 8.93175 9.0415 7.56254C9.0415 6.19333 7.93155 5.08337 6.56234 5.08337H2.9599L4.58403 6.70751C4.86064 6.98412 4.86064 7.43263 4.58403 7.70924C4.30743 7.98584 3.85893 7.98584 3.5823 7.70924L0.748968 4.87591C0.472349 4.59928 0.472349 4.1508 0.748968 3.87417L3.5823 1.04084C3.85893 0.764219 4.30743 0.764219 4.58403 1.04084Z"
              fill="#E8E8E8"
            />
          </svg>
        {:else}
          +
        {/if}
      </button>

      {#if addDropdownShowing}
        <AddPhotoDropdown
          {unitObject}
          {option}
          {subcategory}
          on:added={() => {
            addDropdownShowing = false;
            updateAndSortShowingArray();
          }}
        />
      {/if}
    </div>

    <div class="sortable-photo-container" bind:this={sortableContainer}>
      {#each photosToShowArray as photoObject (photoObject.index)}
        <div
          class="photo-container"
          data-id={photoObject.id}
          class:disabled={saving}
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
            {#key indexUpdated}
              <div class="index-marker">
                {photoObject.index}
              </div>
            {/key}
            <button class="drag-handle"
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
              </svg></button
            >
          </div>
        </div>
      {/each}
    </div>

    <div class="saving-container">
      {#if saving}
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
  </div>
{/if}

<style>
  .photos-option-container {
    background-color: hsl(var(--b1));
    margin: 25px;
    position: relative;
    border-radius: 4px;
    box-shadow: 0 1px 3px var(--cms-boxShadow);
    width: 100%;
    display: flex;
    flex-direction: column;
    width: 450px;
    max-height: 90%;
    margin-bottom: auto;
  }
  .container-header {
    display: flex;
    justify-content: space-between;
    padding: 8px 10px;
    background-color: #eee;
    border-radius: 4px 4px 0 0;
    position: relative;
  }
  .option-title {
    font-family: cms-semibold;
    font-size: 14px;
    line-height: 25px;
    color: var(--cms-text);
  }
  .add-photo {
    font-family: cms-light;
    color: hsl(var(--b2));
    background-color: hsl(var(--p));
    width: 25px;
    border-radius: 4px;
    font-size: 25px;
    height: 25px;
    line-height: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
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

  .saving-container {
    position: absolute;
    bottom: 5px;
    right: -25px;
  }
  .spinner {
    content: "";
    border-radius: 50%;
    border-top: 2px solid hsl(var(--p));
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

  @media (max-width: 500px) {
    .photos-option-container {
      width: 100%;
      max-height: 90%;
    }
  }
</style>
