<script lang="ts">
  import type { Booking, Customer, Unit } from "$lib/types";
  import { beforeUpdate, onMount } from "svelte";
  import BookingsOverview from "./BookingsOverview.svelte";
  import { collection, getDocs } from "firebase/firestore";
  import { firebaseStore } from "$lib/stores";
  import { page } from "$app/stores";
  import { fade } from "svelte/transition";
  import BookingSettingsDropdown from "./BookingSettingsDropdown.svelte";
  import BookingsCustomer from "./BookingsCustomer.svelte";
  import PhotosContent from "./PhotosContent.svelte";
  import BookingsPhotos from "./BookingsPhotos.svelte";
  import BookingsAddPhotoDropdown from "./BookingsAddPhotoDropdown.svelte";

  export let unitObject: Unit;
  export let subcategory: string;
  export let option: string;

  let bookingObject: Booking | undefined;
  let showWrapper = true;
  let customerList: Customer[] = [];
  let settingsDropdownShowing = false;
  let addPhotoShowing = false;
  let updatePhotos = false;

  $: bookingObject = unitObject.bookings?.find((booking) => {
    if (booking.id == subcategory) {
      // add customer Object?
      if (customerList.length > 0) {
        customerList.forEach((customer) => {
          if (customer.id == booking.customer) {
            booking.customerObject = customer;
          }
        });
      }
      return booking;
    }
  });

  beforeUpdate(() => {
    if (!option) {
      showWrapper = false;
    }
    if (customerList.length == 0) {
      fetchCustomerData().then(() => {
        customerList.forEach((customer) => {
          if (bookingObject) {
            if (customer.id == bookingObject.customer) {
              bookingObject.customerObject = customer;
            }
          }
        });
      });
    }
  });

  onMount(fetchCustomerData);

  async function fetchCustomerData() {
    console.log("fetching customer data");
    let customerDocs = await getDocs(
      collection($firebaseStore.db, "customers")
    );

    customerDocs.forEach((customerDoc) => {
      customerList.push(customerDoc.data() as Customer);
    });
  }
</script>

{#if showWrapper}
  <div class="bookings-option-container">
    <div class="container-header">
      <p class="option-title">Booking {$page.params.option}</p>

      {#if option == "PhotosOnHold***"}
        <button
          class="add-photo"
          on:click={() => (addPhotoShowing = !addPhotoShowing)}
        >
          {#if addPhotoShowing}
            <svg
              in:fade
              width="11"
              height="12"
              viewBox="0 0 11 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M4.58403 1.04084C4.86064 1.31746 4.86064 1.76595 4.58403 2.04258L2.9599 3.66671H6.56234C8.71397 3.66671 10.4582 5.41091 10.4582 7.56254C10.4582 9.71417 8.71397 11.4584 6.56234 11.4584H4.7915C4.40029 11.4584 4.08317 11.1413 4.08317 10.75C4.08317 10.3588 4.40029 10.0417 4.7915 10.0417H6.56234C7.93155 10.0417 9.0415 8.93175 9.0415 7.56254C9.0415 6.19333 7.93155 5.08337 6.56234 5.08337H2.9599L4.58403 6.70751C4.86064 6.98412 4.86064 7.43263 4.58403 7.70924C4.30743 7.98584 3.85893 7.98584 3.5823 7.70924L0.748968 4.87591C0.472349 4.59928 0.472349 4.1508 0.748968 3.87417L3.5823 1.04084C3.85893 0.764219 4.30743 0.764219 4.58403 1.04084Z"
                fill="#E8E8E8"
              />
            </svg>
          {:else}
            +
          {/if}
        </button>
      {/if}

      <button
        class="booking-settings-button"
        on:click={() => (settingsDropdownShowing = !settingsDropdownShowing)}
      >
        {#if settingsDropdownShowing}
          <svg
            in:fade
            width="13"
            height="14"
            viewBox="0 0 11 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M4.58403 1.04084C4.86064 1.31746 4.86064 1.76595 4.58403 2.04258L2.9599 3.66671H6.56234C8.71397 3.66671 10.4582 5.41091 10.4582 7.56254C10.4582 9.71417 8.71397 11.4584 6.56234 11.4584H4.7915C4.40029 11.4584 4.08317 11.1413 4.08317 10.75C4.08317 10.3588 4.40029 10.0417 4.7915 10.0417H6.56234C7.93155 10.0417 9.0415 8.93175 9.0415 7.56254C9.0415 6.19333 7.93155 5.08337 6.56234 5.08337H2.9599L4.58403 6.70751C4.86064 6.98412 4.86064 7.43263 4.58403 7.70924C4.30743 7.98584 3.85893 7.98584 3.5823 7.70924L0.748968 4.87591C0.472349 4.59928 0.472349 4.1508 0.748968 3.87417L3.5823 1.04084C3.85893 0.764219 4.30743 0.764219 4.58403 1.04084Z"
              fill="#262626"
            />
          </svg>
        {:else}
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9.16667 2.5H10.8333C11.2936 2.5 11.6667 2.8731 11.6667 3.33333V3.80732C11.6667 4.16382 11.9059 4.47354 12.2352 4.61023C12.5646 4.74698 12.9481 4.69487 13.2002 4.44269L13.5355 4.10742C13.8609 3.78198 14.3886 3.78198 14.714 4.10742L15.8925 5.28593C16.218 5.61137 16.2179 6.13901 15.8925 6.46445L15.5573 6.79967C15.3051 7.05186 15.253 7.43539 15.3897 7.76478C15.5264 8.09406 15.8362 8.33333 16.1927 8.33333H16.6667C17.1269 8.33333 17.5 8.70642 17.5 9.16667V10.8333C17.5 11.2936 17.1269 11.6667 16.6667 11.6667H16.1927C15.8362 11.6667 15.5265 11.9059 15.3897 12.2352C15.253 12.5646 15.3051 12.9481 15.5573 13.2002L15.8925 13.5355C16.218 13.8609 16.218 14.3886 15.8925 14.714L14.714 15.8925C14.3886 16.218 13.8609 16.218 13.5355 15.8925L13.2002 15.5573C12.9481 15.3051 12.5646 15.253 12.2352 15.3897C11.9059 15.5265 11.6667 15.8362 11.6667 16.1927V16.6667C11.6667 17.1269 11.2936 17.5 10.8333 17.5H9.16667C8.70642 17.5 8.33333 17.1269 8.33333 16.6667V16.1927C8.33333 15.8362 8.09406 15.5264 7.76478 15.3897C7.43539 15.253 7.05186 15.3051 6.79967 15.5573L6.46443 15.8925C6.13899 16.218 5.61136 16.218 5.28593 15.8925L4.10741 14.714C3.78198 14.3886 3.78198 13.8609 4.10741 13.5355L4.44269 13.2002C4.69487 12.9481 4.74698 12.5646 4.61023 12.2352C4.47354 11.9059 4.16382 11.6667 3.80732 11.6667H3.33333C2.8731 11.6667 2.5 11.2936 2.5 10.8333V9.16667C2.5 8.70642 2.8731 8.33333 3.33333 8.33333H3.80731C4.16382 8.33333 4.47354 8.09407 4.61024 7.7648C4.747 7.43542 4.69488 7.05191 4.44269 6.79972L4.10742 6.46445C3.78198 6.13901 3.78198 5.61138 4.10742 5.28594L5.28593 4.10742C5.61137 3.78199 6.13901 3.78199 6.46445 4.10742L6.79972 4.44269C7.0519 4.69488 7.43542 4.747 7.7648 4.61024C8.09407 4.47354 8.33333 4.16382 8.33333 3.8073V3.33333C8.33333 2.8731 8.70642 2.5 9.16667 2.5Z"
              stroke="#262626"
              stroke-width="1.25"
            />
            <path
              d="M11.6673 9.99992C11.6673 10.9204 10.9212 11.6666 10.0007 11.6666C9.08015 11.6666 8.33398 10.9204 8.33398 9.99992C8.33398 9.07942 9.08015 8.33325 10.0007 8.33325C10.9212 8.33325 11.6673 9.07942 11.6673 9.99992Z"
              stroke="#262626"
              stroke-width="1.25"
            />
          </svg>
        {/if}
      </button>
      {#if addPhotoShowing}
        <BookingsAddPhotoDropdown
          {bookingObject}
          on:added={() => {
            addPhotoShowing = false;
            updatePhotos = !updatePhotos;
          }}
        />
      {/if}
      {#if settingsDropdownShowing}
        <BookingSettingsDropdown {bookingObject} {unitObject} />
      {/if}
    </div>
    {#if option == "Overview"}
      <BookingsOverview {bookingObject} />
    {/if}
    {#if option == "Customer"}
      <BookingsCustomer {bookingObject} />
    {/if}
    {#if option == "Photos"}
      <BookingsPhotos {bookingObject} {updatePhotos} />
    {/if}
  </div>
{/if}

<style>
  .bookings-option-container {
    background-color: hsl(var(--b1));
    margin: 25px;
    position: relative;
    border-radius: 4px;
    box-shadow: 0 1px 3px var(--cms-boxShadow);
    width: 100%;
    display: flex;
    flex-direction: column;
    width: 300px;
  }
  .container-header {
    display: flex;
    justify-content: space-between;
    padding: 8px 10px;
    background-color: #eee;
    border-radius: 4px 4px 0 0;
    position: relative;
  }
  .option-title {
    font-family: cms-semibold;
    font-size: 14px;
    line-height: 25px;
    color: var(--cms-text);
  }
  .booking-settings-button {
    font-family: cms-light;
    width: 25px;
    border-radius: 4px;
    font-size: 25px;
    height: 25px;
    line-height: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .add-photo {
    font-family: cms-light;
    color: hsl(var(--b2));
    background-color: hsl(var(--p));
    width: 20px;
    border-radius: 4px;
    font-size: 25px;
    height: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: auto 5px 3px auto;
  }
</style>
