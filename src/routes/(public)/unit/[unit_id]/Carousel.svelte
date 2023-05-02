<script lang="ts">
  import type { Photo, Unit } from "$lib/types";
  import { firebaseStore, unitStore } from "$lib/stores";
  import { ref, listAll, getDownloadURL } from "firebase/storage";
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  // carousel needs a loader/shimmer effect, while we bring in photos/files

  // photos can be assigned as backgrounds to generated divs, in order to keep the sizing the same always..
  // import Siema from "siema";

  export let unitObject: Unit;

  let showingPhotoIndex = 0;
  let carouselPhotoUrls: string[] = [];
  let photosLoaded = false;

  onMount(() => {
    if (unitObject.photo_list) {
      createPhotoElements(unitObject.photo_list);
    }
  });

  /*
   * Uses the filenames to retrieve/generate Urls to the storage reference
   * @params
   */
  async function createPhotoElements(photos: Photo[]) {
    // generate storage path based on current unitObject information
    let storagePath = "units/" + unitObject.id + "/photos";

    for (let photo of photos) {
      let fileRef = ref(
        $firebaseStore.storage,
        storagePath + "/" + photo.filename
      );
      let photoUrl = await getDownloadURL(fileRef);

      carouselPhotoUrls.push(photoUrl);
    }
    photosLoaded = true;
  }

  function previousPhoto() {
    let newIndex = showingPhotoIndex - 1;
    if (newIndex < 0) {
      newIndex = carouselPhotoUrls.length - 1;
    }
    showingPhotoIndex = newIndex;
  }
  function nextPhoto() {
    let newIndex = showingPhotoIndex + 1;
    if (newIndex > carouselPhotoUrls.length - 1) {
      newIndex = 0;
    }
    showingPhotoIndex = newIndex;
  }
</script>

<div class="carousel-container">
  <button class="arrow left" on:click={previousPhoto}>
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M15.7071 4.29289C16.0976 4.68342 16.0976 5.31658 15.7071 5.70711L9.41421 12L15.7071 18.2929C16.0976 18.6834 16.0976 19.3166 15.7071 19.7071C15.3166 20.0976 14.6834 20.0976 14.2929 19.7071L7.29289 12.7071C7.10536 12.5196 7 12.2652 7 12C7 11.7348 7.10536 11.4804 7.29289 11.2929L14.2929 4.29289C14.6834 3.90237 15.3166 3.90237 15.7071 4.29289Z"
      />
    </svg>
  </button>
  <button class="arrow right" on:click={nextPhoto}>
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M15.7071 4.29289C16.0976 4.68342 16.0976 5.31658 15.7071 5.70711L9.41421 12L15.7071 18.2929C16.0976 18.6834 16.0976 19.3166 15.7071 19.7071C15.3166 20.0976 14.6834 20.0976 14.2929 19.7071L7.29289 12.7071C7.10536 12.5196 7 12.2652 7 12C7 11.7348 7.10536 11.4804 7.29289 11.2929L14.2929 4.29289C14.6834 3.90237 15.3166 3.90237 15.7071 4.29289Z"
      />
    </svg>
    <div class="carousel-loader" class:carousel-photo={false} />
  </button>
  <div class="photos-wrapper">
    {#if photosLoaded}
      {#each [carouselPhotoUrls[showingPhotoIndex]] as src (showingPhotoIndex)}
        <div
          class="carousel-photo"
          style="background-image:url('{src}')"
          in:fade
        />
      {/each}
    {/if}
  </div>
</div>

<style>
  .carousel-container {
    height: 100%;
    background-color: hsl(var(--b1));
    position: relative;
  }
  .photos-wrapper {
    width: 100%;
    height: 100%;
  }
  :global(.carousel-photo) {
    width: 100%;
    height: 100%;
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
  }
  svg {
    width: 60px;
    height: 60px;
  }
  svg path {
    fill: hsl(var(--b3));
    opacity: 0.7;
  }
  .arrow {
    position: absolute;
    top: 45%;
  }
  .arrow.left {
    left: -15px;
  }
  .arrow.right {
    right: -15px;
    transform: rotate(180deg);
  }
</style>
