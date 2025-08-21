<script lang="ts">
  import Footer from "$lib/components/Footer.svelte";
  import Header from "$lib/components/Header.svelte";
  import NavigationLoader from "$lib/components/NavigationLoader.svelte";
  import "$lib/global.css";
  import { populateUnitStore, connectAnalytics } from "$lib/helpers";

  import { onMount } from "svelte";
  import { dev } from "$app/environment";
  import WinterSpecial from "$lib/components/WinterSpecial.svelte";
  import {
    connectToFirebase,
    firebaseStore,
  } from "$lib/new_stores/firebaseStore";
  import Alert from "$lib/components/Alert.svelte";

  onMount(() => {
    loadResources();
  });

  function loadResources() {
    if (!$firebaseStore) {
      // console.log("Attempting connection to database...");

      connectToFirebase().then((val) => {
        if (val) {
          // console.log("Database connected.");
          if ($firebaseStore) {
            populateUnitStore($firebaseStore).then(() => {
              // console.log("Unit store populated", $unitStore);
            });
          }
          if (!dev) {
            let analytics = connectAnalytics();
            // console.log(analytics);
            firebaseStore.update((storeData) => {
              storeData!.analytics = analytics;
              return storeData;
            });
          }
        } else {
          // console.log("Database connection failed!");
          // TODO: retry failed connection
        }
      });
    }
  }
</script>

<Alert />

<Header />

<section id="page-content"><slot /></section>

<Footer />

<NavigationLoader />

<div class="background-stripe" />

<chat-widget
  location-id="yib8fiHoKhd688afHwys"
  style="--chat-widget-primary-color: #AE2623FF; --chat-widget-active-color:#AE2623FF ;--chat-widget-bubble-color: #AE2623FF ;"
  use-email-field="true"
  agency-name="RappLiteMedia"
  agency-website="rapplitemedia.com"
  locale="en-us"
  primary-color="#AE2623FF"
>
</chat-widget>

<svelte:head>
  <script
    src="https://widgets.leadconnectorhq.com/loader.js"
    data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js"
  >
  </script>
</svelte:head>

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
    background: var(--p);
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
