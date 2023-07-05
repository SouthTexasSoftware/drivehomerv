<script lang="ts">
  import { unitStore, firebaseStore } from "$lib/stores";
  import { ref, getDownloadURL, deleteObject } from "firebase/storage";
  import type { Unit } from "$lib/types";
  import { onMount } from "svelte";
  import { arrayRemove, collection, doc, updateDoc } from "firebase/firestore";

  export let unitObject: Unit;

  let loadingObj: {
    [photoFilename: string]: {
      loaded: boolean;
      deleting: boolean;
      src: string;
    };
  } = {};

  onMount(() => {
    unitObject.photo_list?.forEach((photo) => {
      loadingObj[photo.filename] = {
        deleting: false,
        loaded: false,
        src: "",
      };
    });
    unitObject.photo_list?.forEach(async (photo) => {
      loadingObj[photo.filename].src = await getSrcUrl(photo.filename);
      loadingObj[photo.filename].loaded = true;
    });
  });

  async function getSrcUrl(photoFilename: string): Promise<string> {
    let storagePath = "units/" + unitObject.id + "/photos";

    let fileRef = ref(
      $firebaseStore.storage,
      storagePath + "/" + photoFilename
    );
    let photoUrl = await getDownloadURL(fileRef);

    return photoUrl;
  }

  async function deletePhoto(filename: string) {
    loadingObj[filename].deleting = true;

    const storagePath = "units/" + unitObject.id + "/photos/" + filename;
    const storageObject = ref($firebaseStore.storage, storagePath);

    await deleteObject(storageObject);

    unitObject.photo_list?.forEach((photo, index) => {
      if (photo.filename == filename) {
        unitObject.photo_list?.splice(index, 1);
      }
    });

    let collRef = collection($firebaseStore.db, "units");
    let docRef = doc(collRef, unitObject.id);

    await updateDoc(docRef, {
      photo_list: unitObject.photo_list,
    });

    unitStore.update((data) => {
      data.units.forEach((unit) => {
        if (unit.id == unitObject.id) {
          unit.photo_list = unitObject.photo_list;
        }
      });
      return data;
    });
  }
</script>

<div class="outer-container">
  <h4>Unit Photos</h4>
  <div class="card-container">
    {#if unitObject.photo_list}
      {#each unitObject.photo_list as photoObj (photoObj.filename)}
        <div class="card">
          <figure>
            {#if loadingObj[photoObj.filename]}
              {#if loadingObj[photoObj.filename].loaded}
                <div
                  class="card-photo"
                  style="background-image: url({loadingObj[photoObj.filename]
                    .src})"
                />
              {:else}
                <div class="spinner" />
              {/if}
            {/if}
          </figure>
          <div class="card-info">
            <h2 class="card-filename">
              Filename: <p>{photoObj.filename}</p>
            </h2>
            <button
              class="delete btn btn-primary"
              on:click={() => deletePhoto(photoObj.filename)}
            >
              {#if loadingObj[photoObj.filename]}
                {#if loadingObj[photoObj.filename].deleting}
                  <div class="spinner small" />
                {:else}
                  Delete
                {/if}
              {/if}
            </button>
          </div>
        </div>
      {/each}
    {/if}
  </div>
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
    width: auto;
    margin: 0 25px;
  }
  h4 {
    font-size: 20px;
  }
  .card-container {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    max-width: 1000px;
  }
  .card {
    border-radius: 4px;
    border: 1px solid hsl(var(--b3));
    width: 300px;

    margin: 10px;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
  }
  figure {
    height: 300px;
    width: 300px;
    background-color: hsl(var(--b2));
    display: flex;
    justify-content: center;
    border: 1px solid hsl(var(--b3));
  }
  .card-photo {
    width: 100%;
    height: 100%;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
  }
  .card-info {
    display: flex;
    flex-direction: column;
  }
  .card-filename p {
    width: 100%;
    overflow: scroll;
    font-size: 14px;
    padding-bottom: 15px;
  }

  button.delete {
    margin-bottom: 15px;
  }

  .spinner {
    content: "";
    border-radius: 50%;
    border-top: 2px solid hsl(var(--p));
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
  .spinner.small {
    border-top: 2px solid hsl(var(--b1));
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
