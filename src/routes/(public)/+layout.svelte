<script lang="ts">
  import Footer from "$lib/components/Footer.svelte";
  import Header from "$lib/components/Header.svelte";
  import NavigationLoader from "$lib/components/NavigationLoader.svelte";
  import "$lib/global.css";
  import {
    connectToFirebase,
    populateUnitStore,
    connectAnalytics,
  } from "$lib/helpers";
  import { firebaseStore, unitStore } from "$lib/stores";
  import { onMount } from "svelte";
  import { dev } from "$app/environment";
  import WinterSpecial from "$lib/components/WinterSpecial.svelte";

  onMount(() => {
    loadResources();
  });

  function loadResources() {
    if (!$firebaseStore) {
      console.log("Attempting connection to database...");

      connectToFirebase().then((val) => {
        if (val) {
          console.log("Database connected.");
          populateUnitStore($firebaseStore).then(() => {
            console.log("Unit store populated", $unitStore);
          });

          if (!dev) {
            let analytics = connectAnalytics();
            console.log(analytics);
            firebaseStore.update((storeData) => {
              storeData.analytics = analytics;
              return storeData;
            });
          }
        } else {
          console.log("Database connection failed!");
          // TODO: retry failed connection
        }
      });
    }
  }
</script>

<Header />

<section id="page-content"><slot /></section>

<Footer />

<NavigationLoader />

<div class="background-stripe" />

<style>
  #page-content {
    min-height: 95vh;
    display: flex;
    flex-direction: column;
    /* justify-content: center; */
    align-items: center;
  }

  .background-stripe {
    position: absolute;
    width: 200vw;
    height: 300px;
    left: -50vw;
    background: hsl(var(--p));
    transform: rotate(-16deg);
    z-index: -1;
  }

  @media (max-width: 500px) {
    .background-stripe {
      top: 250px;
    }
  }

  @media (min-width: 500px) and (max-width: 1000px) {
    .background-stripe {
      top: 300px;
    }
  }

  @media (min-width: 1000px) {
    .background-stripe {
      top: 350px;
    }
  }
</style>
