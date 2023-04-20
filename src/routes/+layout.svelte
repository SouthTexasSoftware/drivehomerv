<script lang="ts">
  import Footer from "$lib/components/Footer.svelte";
  import Header from "$lib/components/Header.svelte";
  import NavigationLoader from "$lib/components/NavigationLoader.svelte";

  import "$lib/global.css";
  import { connectToFirebase, populateUnitStore } from "$lib/helpers";
  import { firebaseStore } from "$lib/stores";
  import { onMount } from "svelte";

  onMount(() => {
    loadResources();
  });

  function loadResources() {
    if (!$firebaseStore) {
      console.log("Attempting connection to database...");

      connectToFirebase().then((val) => {
        if (val) {
          console.log("Database connected.");
          populateUnitStore();
        } else {
          console.log("Database connection failed!");
          // TODO: retry failed connection
        }
      });
    }
  }

  // Connect to firebase from root layout, will be needed. Display a nice loader in the mean-time?
  // Emphasize the importance visual queues when transitioning from page to page...

  // we will also manage user state in the root layout, such as being signed in or not.. TBD
</script>

<Header />

<section id="page-content"><slot /></section>

<Footer />

<NavigationLoader />

<style>
  #page-content {
    min-height: 95vh;
    display: flex;
    flex-direction: column;
    /* justify-content: center; */
    align-items: center;
  }
</style>
