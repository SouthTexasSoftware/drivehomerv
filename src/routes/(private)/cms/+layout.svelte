<script lang="ts">
  import { onAuthStateChanged } from "firebase/auth";
  import { firebaseStore } from "$lib/new_stores/firebaseStore";
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
    // console.log($firebaseStore.auth.currentUser);
    onAuthStateChanged($firebaseStore.auth, async (user) => {
      if (user) {
        // console.log("User signed in");
        userLoggedIn = true;
      } else {
        await goto("/owner_login");
      }
    });
  }
</script>

<svelte:head
  ><meta
    name="viewport"
    content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
  /></svelte:head
>

{#if userLoggedIn}
  <div class="cms-container">
    <MenuDrawer />
    <slot />
  </div>
{:else}
  <div class="cms-container">
    <div class="spinner" />
  </div>
{/if}

<style>
  .cms-container {
    display: flex;
    width: 100%;
    min-height: 100vh;
    background-color: var(--cms-bgColor);
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
    width: 100px;
    height: 100px;
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
</style>
