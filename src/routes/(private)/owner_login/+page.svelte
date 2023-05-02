<script lang="ts">
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import { firebaseStore } from "$lib/stores";
  import { signInWithEmailAndPassword } from "firebase/auth";
  import { fade } from "svelte/transition";

  let signInError = false;
  let errorMessage = "";
</script>

<section>
  <h3>DriveHome RV Owner Login</h3>
  <form
    method="POST"
    use:enhance={async ({ form, data, action, cancel, submitter }) => {
      signInError = false;

      let userEmail = data.get("email");
      let userPassword = data.get("password");

      //@ts-ignore
      signInWithEmailAndPassword($firebaseStore.auth, userEmail, userPassword)
        .then((userCredential) => {
          goto("/cms/dashboard");
        })
        .catch((error) => {
          errorMessage = error.code;
          signInError = true;
        });
    }}
  >
    <div class="form-group">
      <label for="email">EMAIL</label>
      <input
        type="email"
        autocomplete="email"
        name="email"
        class="input input-bordered w-full max-w-xs"
      />
    </div>
    <div class="form-group">
      <label for="password">PASSWORD</label>
      <input
        type="password"
        autocomplete="password"
        name="password"
        class="input input-bordered w-full max-w-xs"
      />
    </div>
    <button type="submit" class="btn btn-primary">LOGIN</button>
  </form>
</section>
{#if signInError}
  <p class="errors" transition:fade>{errorMessage}</p>
{/if}

<style>
  section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 90vw;
    max-width: 600px;
    border-radius: 4px;
    box-shadow: 0px 1px 2px grey;
    margin-top: 50px;
    padding: 25px;
  }
  h3 {
    font-size: 26px;
  }
  form {
    display: flex;
    flex-direction: column;
    min-height: 300px;
    justify-content: space-around;
  }
  .form-group {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  label {
    font-family: font-light;
  }
  .errors {
    margin-top: 15px;
    text-align: center;
    background-color: hsl(var(--er));
    border-radius: 4px;
    color: hsl(var(--erc));
    padding: 3px 35px;
  }
</style>
