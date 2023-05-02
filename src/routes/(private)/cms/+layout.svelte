<script lang="ts">
  import { onAuthStateChanged } from "firebase/auth";
  import { firebaseStore } from "$lib/stores";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import MenuDrawer from "./MenuDrawer.svelte";

  let userLoggedIn = false;

  onMount(authListener);

  async function authListener() {
    if ($firebaseStore == undefined) {
      setTimeout(authListener, 200);
      return;
    }
    console.log($firebaseStore.auth.currentUser);
    onAuthStateChanged($firebaseStore.auth, async (user) => {
      if (user) {
        console.log("User signed in");
        userLoggedIn = true;
      } else {
        await goto("/owner_login");
      }
    });
  }
</script>

{#if userLoggedIn}
  <div class="divider" />
  <div class="cms-container">
    <MenuDrawer />
    <slot />
  </div>
{:else}
  <p>Loading...</p>
{/if}

<style>
  .divider {
    width: 100%;
    height: 1px;
    background-color: hsl(var(--b3));
  }
  .cms-container {
    display: flex;
    width: 100%;
    min-height: 85vh;
    padding: 25px;
    max-width: 1800px;
  }
</style>
