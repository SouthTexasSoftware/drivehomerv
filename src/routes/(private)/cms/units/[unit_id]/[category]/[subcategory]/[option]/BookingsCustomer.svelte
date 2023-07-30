<script lang="ts">
  import { page } from "$app/stores";
  import { firebaseStore } from "$lib/stores";
  import type { Booking, Customer } from "$lib/types";
  import { collection, doc, setDoc, updateDoc } from "firebase/firestore";
  import { beforeUpdate } from "svelte";
  import { fade } from "svelte/transition";

  export let bookingObject: Booking | undefined;

  let customerObject: Customer | undefined = bookingObject?.customerObject;

  let changesMade = false;
  let savingChanges = false;
  let cancelingChanges = false;

  let inputElements: { [label: string]: HTMLInputElement | null } = {
    firstNameElement: null,
    lastNameElement: null,
    phoneElement: null,
    emailElement: null,
  };

  let customerCollectionRef = collection($firebaseStore.db, "customers");
  let bookingsSubcollectionRef = collection(
    $firebaseStore.db,
    "units",
    $page.params.unit_id,
    "bookings"
  );

  beforeUpdate(() => {});

  function handleChangedValue() {
    changesMade = true;
  }

  async function saveChanges() {
    if (savingChanges) {
      return;
    }
    savingChanges = true;

    if (!customerObject) {
      // create a new customer object in the db...
      let newCustomer: Customer = {
        id: newUUID(),
        first_name: inputElements.firstNameElement?.value
          ? inputElements.firstNameElement.value
          : "",
        last_name: inputElements.lastNameElement?.value
          ? inputElements.lastNameElement.value
          : "",
        phone: inputElements.phoneElement?.value
          ? inputElements.phoneElement.value
          : "",
        email: inputElements.emailElement?.value
          ? inputElements.emailElement.value
          : "",
      };
      let newCustomerDocRef = doc(customerCollectionRef, newCustomer.id);
      await setDoc(newCustomerDocRef, newCustomer);

      //@ts-ignore
      let bookingDoc = doc(bookingsSubcollectionRef, bookingObject.id);
      await updateDoc(bookingDoc, {
        customer: newCustomer.id,
      });

      //@ts-ignore
      bookingObject.customerObject = newCustomer;
      customerObject = newCustomer;
    } else {
      //just update the existing customer
      let customerDocRef = doc(customerCollectionRef, customerObject.id);

      let updatedCustomer: Customer = {
        id: customerObject.id,
        first_name: inputElements.firstNameElement?.value
          ? inputElements.firstNameElement.value
          : "",
        last_name: inputElements.lastNameElement?.value
          ? inputElements.lastNameElement.value
          : "",
        phone: inputElements.phoneElement?.value
          ? inputElements.phoneElement.value
          : "",
        email: inputElements.emailElement?.value
          ? inputElements.emailElement.value
          : "",
      };

      await setDoc(customerDocRef, updatedCustomer);

      //@ts-ignore
      bookingObject.customerObject = updatedCustomer;
      customerObject = updatedCustomer;
    }

    changesMade = false;
    savingChanges = false;
  }

  function cancelChanges() {
    if (cancelingChanges) {
      return;
    }
    cancelingChanges = true;

    // reset values back to original = customerObject at beginning. (it doesn't like switching from strings to undefined..)
    //@ts-ignore
    inputElements.firstNameElement.value = customerObject?.first_name
      ? customerObject?.first_name
      : "";
    //@ts-ignore
    inputElements.lastNameElement.value = customerObject?.last_name
      ? customerObject?.last_name
      : "";
    //@ts-ignore
    inputElements.phoneElement.value = customerObject?.phone
      ? customerObject?.phone
      : "";
    //@ts-ignore
    inputElements.emailElement.value = customerObject?.email
      ? customerObject?.email
      : "";

    changesMade = false;
    cancelingChanges = false;
  }

  function newUUID(): string {
    // Alphanumeric characters
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let autoId = "";
    for (let i = 0; i < 20; i++) {
      autoId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return autoId;
  }
</script>

<div class="customer-container">
  <div class="section">
    <div class="section-label">First Name</div>
    <input
      type="text"
      on:input={handleChangedValue}
      name="first-name"
      value={customerObject?.first_name ? customerObject.first_name : ""}
      bind:this={inputElements.firstNameElement}
    />
  </div>
  <div class="section">
    <div class="section-label">Last Name</div>
    <input
      type="text"
      on:input={handleChangedValue}
      name="last-name"
      value={customerObject?.last_name ? customerObject.last_name : ""}
      bind:this={inputElements.lastNameElement}
    />
  </div>
  <div class="section">
    <div class="section-label">Phone</div>
    <input
      type="tel"
      on:input={handleChangedValue}
      name="phone"
      value={customerObject?.phone ? customerObject.phone : ""}
      bind:this={inputElements.phoneElement}
    />
  </div>
  <div class="section">
    <div class="section-label">Email</div>
    <input
      type="email"
      on:input={handleChangedValue}
      name="email"
      value={customerObject?.email ? customerObject.email : ""}
      bind:this={inputElements.emailElement}
    />
  </div>
  {#if changesMade}
    <div class="save-button-container" transition:fade>
      <button class="cancel" on:click={cancelChanges}>
        {#if cancelingChanges}
          <p class="spinner cancel" />
        {:else}
          <svg
            width="9"
            height="10"
            viewBox="0 0 9 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M4.73646 6.99179L7.67886 9.82699C7.97404 10.1136 8.16609 10.1165 8.46666 9.82699L9.05702 9.25802C9.34623 8.97942 9.36583 8.79654 9.05702 8.49896L5.94189 5.49772L9.0573 2.49648C9.34907 2.2144 9.35475 2.02404 9.0573 1.73715L8.46695 1.16845C8.16069 0.873271 7.97148 0.886907 7.67915 1.16845L4.73646 4.00365L1.79406 1.16872C1.50173 0.887174 1.31252 0.873538 1.00626 1.16872L0.415904 1.73741C0.118169 2.0243 0.123567 2.21467 0.415904 2.49675L3.53104 5.49772L0.415904 8.49896C0.107089 8.79654 0.123567 8.97942 0.415904 9.25802L1.00597 9.82699C1.30399 10.1165 1.49604 10.1136 1.79378 9.82699L4.73646 6.99179Z"
              fill="#3D3D3D"
            />
          </svg>
          Cancel
        {/if}
      </button>
      <button class="save" on:click={saveChanges}>
        {#if savingChanges}
          <p class="spinner" />
        {:else}
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M1.42259 4.7699C1.09715 4.33601 0.569518 4.33601 0.244076 4.7699C-0.0813585 5.20379 -0.0813585 5.90735 0.244076 6.34124L2.74408 9.67458C3.06952 10.1085 3.59717 10.1085 3.92259 9.67458L9.75594 1.89679C10.0814 1.46287 10.0814 0.759358 9.75594 0.325434C9.43052 -0.108478 8.90285 -0.108478 8.57743 0.325434L3.33334 7.31758L1.42259 4.7699Z"
              fill="white"
            />
          </svg>
          Save
        {/if}
      </button>
    </div>
  {/if}
</div>

<style>
  .customer-container {
    display: flex;
    flex-direction: column;
    padding: 0 15px;
    margin-bottom: 65px;
    overflow-y: scroll;
  }
  .section {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 15px;
  }
  .section-label {
    font-family: cms-semibold;
    align-self: flex-start;
    font-size: 14px;
  }
  p {
    font-family: cms-regular;
  }
  input {
    border: 1px solid var(--cms-boxShadow);
    font-size: 16px;
    font-family: cms-regular;
    padding: 6px 15px;
    border-radius: 4px;
    outline: none;
    width: 100%;
  }
  .save-button-container {
    display: flex;

    justify-content: space-around;
    align-content: center;

    position: absolute;
    bottom: 0;
    width: 100%;
    left: 0;
    padding: 15px;
    background-color: hsl(var(--b1));
  }
  button {
    width: 90px;
    border-radius: 4px;
    height: 28px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }
  button.cancel {
    background-color: var(--cms-boxShadow);
  }
  button.save {
    background-color: hsl(var(--p));
    color: white;
  }
  svg {
    margin: 0 10px;
  }
  .spinner {
    content: "";
    border-radius: 50%;
    border-top: 1px solid hsl(var(--b1));
    border-right: 1px solid transparent;
    animation-name: spinning;
    animation-duration: 1s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    opacity: 1;
    transition: all 0.2s;
    width: 15px;
    height: 15px;
    margin: 0 auto;
  }
  .spinner.cancel {
    border-top: 1px solid var(--cms-text);
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
