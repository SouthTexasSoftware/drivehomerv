<script lang="ts">
  import { customerStore, firebaseStore } from "$lib/stores";
  import { createEventDispatcher, onMount } from "svelte";
  import { enhance } from "$app/forms";
  import {
    collection,
    setDoc,
    Timestamp,
    doc,
    arrayUnion,
  } from "firebase/firestore";
  import { fade } from "svelte/transition";

  let dispatch = createEventDispatcher();
  let submittingForm = false;
  let formElement: HTMLFormElement;

  onMount(() => {
    window.scrollTo(0, 150);
  });

  function dispatchCloseModal() {
    dispatch("close", true);
  }

  function dispatchRequestSuccess() {
    dispatch("requestSuccess", true);
  }

  // form submission handled inline on form element via use:enhance
</script>

<section class="request-container" in:fade={{ duration: 200 }}>
  <h3>Request this Trip</h3>
  <button class="close-modal" on:click={dispatchCloseModal}>
    <svg
      width="30px"
      height="30px"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="Menu / Close_MD">
        <path
          id="Vector"
          d="M18 18L12 12M12 12L6 6M12 12L18 6M12 12L6 18"
          stroke="#000000"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
    </svg>
  </button>
  <form
    method="POST"
    use:enhance={async ({ form, data, action, cancel, submitter }) => {
      if (submittingForm) {
        return;
      }
      submittingForm = true;

      // create references and establish new unique IDs
      let customerCollection = collection($firebaseStore.db, "customers");
      let newCustomerDocRef = doc(customerCollection);
      const newCustomerId = newCustomerDocRef.id;

      let unitId = $customerStore.unit_id;
      if (!unitId) {
        unitId = "unitIdWasNotFound";
      }

      let bookingsCollection = collection(
        $firebaseStore.db,
        "units",
        unitId,
        "bookings"
      );
      let newBookingDocRef = doc(bookingsCollection);
      let newBookingId = newBookingDocRef.id;

      let newCustomer = {
        id: newCustomerId,
        first_name: data.get("first-name"),
        last_name: data.get("last-name"),
        email: data.get("email"),
        phone: data.get("phone"),
        created: Timestamp.now(),
        bookings: [newBookingId],
      };

      //@ts-ignore
      //customerStore.set(newCustomer);

      let newBookingRequest = {
        id: newBookingId,
        passengers: data.get("passengers"),
        total_price: data.get("total-price"),
        start: data.get("start-date"),
        end: data.get("end-date"),
        unit_id: data.get("unit-id"),
        unit_name: data.get("unit-name"),
        customer: newCustomerId,
        created: Timestamp.now(),
        status: "requested",
      };

      let createCustomer = await setDoc(newCustomerDocRef, newCustomer);
      let createBooking = await setDoc(newBookingDocRef, newBookingRequest);

      submittingForm = false;

      dispatchRequestSuccess();
      dispatchCloseModal();
      // close the request modal and trigger a success window...
    }}
  >
    <label for="first-name">FIRST NAME</label>
    <input type="text" name="first-name" autocomplete="given-name" required />

    <label for="last-name">LAST NAME</label>
    <input type="text" name="last-name" autocomplete="family-name" required />

    <label for="email">EMAIL</label>
    <input type="email" name="email" autocomplete="email" required />

    <label for="phone">PHONE</label>
    <input type="tel" name="phone" autocomplete="tel" required />

    <label for="passengers"> PASSENGER COUNT </label>
    <input
      id="passenger-input"
      type="number"
      name="passengers"
      autocomplete="off"
      value="1"
      required
    />

    <p class="label">DATES</p>
    <div class="dates-row">
      <p>{$customerStore.start}</p>
      <div class="arrow-container">
        <svg
          id="right-arrow"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g id="Complete">
            <g id="arrow-right">
              <g>
                <polyline
                  data-name="Right"
                  fill="none"
                  id="Right-2"
                  points="16.4 7 21.5 12 16.4 17"
                  stroke="#000000"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                />

                <line
                  fill="none"
                  stroke="#000000"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  x1="2.5"
                  x2="19.2"
                  y1="12"
                  y2="12"
                />
              </g>
            </g>
          </g>
        </svg>
      </div>
      <p>{$customerStore.end}</p>
    </div>

    <input hidden name="start-date" value={$customerStore.start} />
    <input hidden name="end-date" value={$customerStore.end} />
    <input hidden name="total-price" value={$customerStore.total_price} />
    <input hidden name="unit-id" value={$customerStore.unit_id} />
    <input hidden name="unit-name" value={$customerStore.unit_name} />

    <p class="label">PICKUP</p>
    <p class="info">Modena, New York</p>

    <p class="label">VEHICLE</p>
    <p class="info">{$customerStore.unit_name}</p>

    <p class="terms">
      By clicking ‘Request to Book’, you agree to receive follow up
      communications from our sales team to answer any further questions, and
      receive an invoice of 50% of the total booking value of ${$customerStore.total_price}.
    </p>

    <button id="submit" type="submit">
      {#if submittingForm}
        <div class="spinner" />
      {:else}
        REQUEST TO BOOK
      {/if}
    </button>
  </form>
</section>

<style>
  .request-container {
    position: absolute;
    top: 200px;
    background-color: white;
    /* width: 90vw; */
    max-width: 800px;
    z-index: 101;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    box-shadow: 0px 2px 3px grey;
    border-radius: 4px;
    padding: 25px 100px;
  }
  .close-modal {
    position: absolute;
    top: 25px;
    right: 25px;
  }
  form {
    display: flex;
    flex-direction: column;
  }
  h3 {
    font-size: 36px;
    margin-bottom: 25px;
  }
  svg#right-arrow {
    height: 100%;
    width: 20px;
  }
  label,
  .label {
    color: grey;
    font-size: 14px;
    margin-bottom: -4px;
    font-family: font-light;
  }
  input {
    border-bottom: 1px solid hsl(var(--b2));
    border-radius: 2px;
    outline: none;
    font-size: 20px;
    margin-bottom: 20px;
  }
  #passenger-input {
    width: 75px;
  }
  .dates-row {
    display: flex;
    width: 100%;
    justify-content: space-around;
    font-size: 20px;
  }
  p.info {
    font-size: 20px;
    margin-left: 15px;
  }
  p.terms {
    width: 100%;
    text-align: center;
    margin: 25px auto 45px;
    font-family: font-light;
    font-size: 16px;
  }
  button#submit {
    background-color: hsl(var(--p));
    font-size: 24px;
    color: hsl(var(--b1));
    width: 100%;
    position: absolute;
    bottom: 0;
    left: 0;
    height: 50px;
    font-family: font-light;
  }
  @media (max-width: 500px) {
    .request-container {
      position: absolute;
      width: 90vw;
      padding: 25px;
    }
    h3 {
      font-size: 24px;
    }
    .close-modal {
      top: 10px;
      right: 10px;
    }
  }

  @media (min-width: 500px) and (max-width: 1000px) {
  }

  @media (min-width: 1000px) {
  }

  .spinner {
    content: "";
    border-radius: 50%;
    border-top: 2px solid hsl(var(--b1));
    border-right: 2px solid transparent;
    animation-name: spinning;
    animation-duration: 1s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    opacity: 1;
    transition: all 0.2s;
    width: 20px;
    height: 20px;
    margin: 0 auto;
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
