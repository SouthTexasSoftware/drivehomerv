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
  import { firebaseStore } from "$lib/stores";
  import { onMount } from "svelte";
  import { dev } from "$app/environment";
  import Alert from "$lib/components/Alert.svelte";
  import { alertStore } from "$lib/stores/alert";

  onMount(() => {
    loadResources();
  });

  function loadResources() {
    if (!$firebaseStore) {
      // console.log("Attempting connection to database...");

      connectToFirebase().then((val) => {
        if (val) {
          // console.log("Database connected.");
          populateUnitStore($firebaseStore, { cms: true });
          if (!dev) {
            let analytics = connectAnalytics();
            // console.log(analytics);
            firebaseStore.update((storeData) => {
              storeData.analytics = analytics;
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
<!-- Test button
<button
  class="btn btn-primary"
  on:click={() => {
    alertStore.success("Test success message!");
    alertStore.info("Test info message!");
    alertStore.warning("Test warning message!");
    alertStore.error("Test error message!");
  }}
>
  Test Alerts
</button> -->

<slot />

<style></style>
