<script lang="ts">
  import { unitStore } from "$lib/stores";
  import type { PhotoDocument, Unit } from "$lib/types";
  import { page } from "$app/stores";
  import IconArrow from "$lib/components/IconArrow.svelte";
  import { afterNavigate } from "$app/navigation";

  let unitObject: Unit | undefined;
  //create simple carousel sliders to display photos..
  let carouselPhotos: PhotoDocument[];
  let carouselIndex = 0;
  let albumPhotos: PhotoDocument[];
  let albumIndex = 0;
  let loadingImages = true;

  checkUnitSelected();

  function checkUnitSelected() {
    if ($unitStore.isPopulated) {
      unitObject = $unitStore.getUnit($page.params.unit_id);
      populatePhotosLists();
      return;
    }

    setTimeout(checkUnitSelected, 200);
  }

  afterNavigate(checkUnitSelected);

  function populatePhotosLists() {
    loadingImages = true;
    carouselPhotos = [];
    carouselIndex = 0;
    albumPhotos = [];
    albumIndex = 0;

    //@ts-ignore
    carouselPhotos = unitObject?.photos?.filter((photoObj) => {
      if (photoObj.option == "carousel") {
        return photoObj;
      }
    });
    carouselPhotos?.sort((photoA, photoB) => {
      if (photoA.index > photoB.index) {
        return 1;
      }
      return -1;
    });

    //@ts-ignore
    albumPhotos = unitObject?.photos?.filter((photoObj) => {
      if (photoObj.option == "album") {
        return photoObj;
      }
    });
    albumPhotos?.sort((photoA, photoB) => {
      if (photoA.index > photoB.index) {
        return 1;
      }
      return -1;
    });
  }

  function carouselNext() {
    if (carouselPhotos) {
      carouselIndex = (carouselIndex + 1) % carouselPhotos?.length;
    }
  }
  function carouselPrev() {
    if (carouselPhotos) {
      carouselIndex - 1 < 0
        ? (carouselIndex = carouselPhotos.length)
        : carouselIndex;
      carouselIndex = (carouselIndex - 1) % carouselPhotos?.length;
    }
  }

  function albumNext() {
    if (albumPhotos) {
      albumIndex = (albumIndex + 1) % albumPhotos?.length;
    }
  }
  function albumPrev() {
    if (albumPhotos) {
      albumIndex - 1 < 0 ? (albumIndex = albumPhotos.length) : albumIndex;
      albumIndex = (albumIndex - 1) % albumPhotos?.length;
    }
  }
</script>

<!-- Preload all the images into the browser -->
<svelte:head>
  {#if unitObject?.photos}
    {#each unitObject.photos as photoDoc}
      <link
        rel="preload"
        as="image"
        href={photoDoc.downloadURL}
        on:load={() => {
          loadingImages = false;
        }}
      />
    {/each}
  {/if}
</svelte:head>

{#if unitObject}
  <section class="photos-home-container">
    <h3>Carousel</h3>
    <div class="photos-container">
      {#if carouselPhotos.length > 0}
        <button on:click={carouselPrev} class="carousel-prev"
          ><IconArrow active={true} direction={"left"} /></button
        >

        {#each [carouselPhotos[carouselIndex]] as photoDoc (carouselIndex)}
          <div
            class="img-container"
            style="background-image:url('{photoDoc.downloadURL}')"
          >
            <div class="img-index">{photoDoc.index}</div>
            <div class="img-name">{photoDoc.filename}</div>
            {#if loadingImages}
              <div class="spinner"></div>
            {/if}
          </div>
        {/each}

        <button on:click={carouselNext} class="carousel-next">
          <IconArrow active={true} />
        </button>
      {/if}
    </div>

    <h3 class="album">Album</h3>
    <div class="photos-container">
      {#if albumPhotos.length > 0}
        <button on:click={albumPrev} class="carousel-prev"
          ><IconArrow active={true} direction={"left"} /></button
        >

        {#each [albumPhotos[albumIndex]] as photoDoc (albumIndex)}
          <div
            class="img-container"
            style="background-image:url('{photoDoc.downloadURL}')"
          />
        {/each}

        <button on:click={albumNext} class="carousel-next">
          <IconArrow active={true} />
        </button>
      {/if}
    </div>
  </section>
{/if}

<style>
  .photos-home-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    max-width: 450px;
  }
  h3 {
    font-family: cms-semibold;
    font-size: 18px;
    color: var(--text);
    margin-left: 55px;
  }
  .album {
    margin-top: 40px;
  }
  .photos-container {
    display: flex;
    align-items: center;
  }
  .img-container {
    width: 90vw;
    max-width: 400px;
    border-radius: 4px;
    min-height: 220px;
    background-size: contain;
    background-repeat: no-repeat;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--b2);
    background-position: center;
    position: relative;
  }
  .img-index,
  .img-name {
    font-size: 14px;
    font-family: cms-semibold;
    color: white;
    background-color: var(--p);
    position: absolute;
    top: 5px;
    padding: 0 8px;
    border-radius: 5px;
    opacity: 50%;
  }
  .img-index {
    left: 5px;
  }
  .img-name {
    font-size: 12px;
    right: 5px;
  }

  .spinner {
    content: "";
    border-radius: 50%;
    border-top: 2px solid var(--p);
    border-right: 2px solid transparent;
    animation-name: spinning;
    animation-duration: 1s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    opacity: 1;
    transition: all 0.2s;
    width: 50px;
    height: 50px;
    margin: auto;
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
    .photos-home-container {
      max-height: 95%;
      height: 100%;
    }
    .img-container {
      min-height: 175px;
    }
  }
</style>
