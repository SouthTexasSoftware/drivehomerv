<script lang="ts">
  import type { Photo, Unit } from "$lib/types";
  import { firebaseStore, unitStore } from "$lib/stores";
  import { ref, listAll, getDownloadURL } from "firebase/storage";
  import { onMount } from "svelte";
  // carousel needs a loader/shimmer effect, while we bring in photos/files

  // photos can be assigned as backgrounds to generated divs, in order to keep the sizing the same always..
  // import Siema from "siema";

  export let unitObject: Unit;

  let carouselElement: HTMLElement;

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

      let newElem = document.createElement("div");
      newElem.className = "carousel-photo";
      newElem.style.backgroundImage = "url(" + photoUrl + ")";

      carouselElement.append(newElem);
    }
  }
</script>

<div class="carousel-container" bind:this={carouselElement}>
  <div class="carousel-loader" class:carousel-photo={false} />
</div>

<style>
  .carousel-container {
    height: 100%;
    background-color: hsl(var(--b2));
  }
  :global(.carousel-photo) {
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
  }
</style>
