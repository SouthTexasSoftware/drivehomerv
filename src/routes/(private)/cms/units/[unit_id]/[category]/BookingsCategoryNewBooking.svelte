<script lang="ts">
  import type { Booking, Unit } from "$lib/types";
  import PopupCalendarInputNoBookings from "$lib/components/PopupCalendarInputNoBookings.svelte";
  import { afterUpdate, createEventDispatcher } from "svelte";
  import { Timestamp, doc, serverTimestamp, setDoc } from "firebase/firestore";
  import { DateTime } from "@easepick/bundle";
  import { bookingStore } from "$lib/stores";
  import { firebaseStore } from "$lib/new_stores/firebaseStore";
  import { fly } from "svelte/transition";
  import type { Customer } from "$lib/new_types/CustomerType";

  export let unitObject: Unit;

  let savingBooking = false;
  let firstNameInput: HTMLInputElement;
  let lastNameInput: HTMLInputElement;
  let emailInput: HTMLInputElement;
  let phoneInput: HTMLInputElement;

  let dispatch = createEventDispatcher();

  let datesValidationError = false;
  let customerValidationError = false;

  let pickup_dropoff_price_addition = 0;
  let selectedTripLength: number = 0;

  let showLineItemDialog = false;
  let new_line_item_name = "";
  let new_line_item_type = "add";
  let new_line_item_amount = 0;

  function sumOfFees(tripLength: number) {
    let sum = 0;
    let service_fee = 0;
    let sales_tax = 0;
    let damage_protection = 0;

    if (tripLength != 0) {
      service_fee = parseInt(
        unitObject.information.rates_and_fees.pricing.service_fee
      );

      sales_tax =
        (parseInt(unitObject.information.rates_and_fees.pricing.sales_tax) /
          100) *
        $bookingStore.nightly_rate_sum!;

      damage_protection =
        parseInt(
          unitObject.information.rates_and_fees.pricing.damage_protection
        ) * tripLength;
    }

    sum = service_fee + sales_tax + damage_protection;

    return sum;
  }

  // initial creation of the store with some default values
  bookingStore.set({
    id: newUUID(),
    start: "",
    end: "",
    status: "manualEntry",
    created: serverTimestamp() as Timestamp,
    photos: [],
    documents: [],
    trip_length: selectedTripLength,
    total_price: 0,
    price_per_night: parseInt(
      unitObject.information.rates_and_fees.pricing.base_rental_fee
    ),
    nightly_rate_sum: 0,
    service_fee: parseInt(
      unitObject.information.rates_and_fees.pricing.service_fee
    ),
    sales_tax: 0,
    damage_protection_per_night: parseInt(
      unitObject.information.rates_and_fees.pricing.damage_protection
    ),
    damage_protection:
      parseInt(
        unitObject.information.rates_and_fees.pricing.damage_protection
      ) * selectedTripLength,
    pickup_dropoff_price_addition: 0,
    unit_name: unitObject.name,
    unit_id: unitObject.id,
    pickup_time: " 4 pm",
    dropoff_time: "10 am",
    in_checkout: false,
    confirmed: true,
    stripe_product_id: unitObject.stripe_product_id,
    created_by: "CMS",
  });

  function updateBookingDates(detail: { start: string; end: string }) {
    if ($bookingStore) {
      $bookingStore.start = detail.start;
      $bookingStore.end = detail.end;

      let startDate = new DateTime(detail.start, "MMM-DD-YYYY");
      let endDate = new DateTime(detail.end, "MMM-DD-YYYY");

      $bookingStore.unix_start = Math.ceil(startDate.getTime() / 1000);
      $bookingStore.unix_end = Math.ceil(endDate.getTime() / 1000);

      let differenceInTime = endDate.getTime() - startDate.getTime();
      let differenceInDays = differenceInTime / (1000 * 3600 * 24);

      selectedTripLength = differenceInDays;
      $bookingStore.trip_length = selectedTripLength;

      bookingStore.update((store) => {
        store.price_per_night = parseInt(
          unitObject.information.rates_and_fees.pricing.base_rental_fee
        );

        store.nightly_rate_sum = store.price_per_night * selectedTripLength;

        store.damage_protection_per_night = parseInt(
          unitObject.information.rates_and_fees.pricing.damage_protection
        );

        store.service_fee = parseInt(
          unitObject.information.rates_and_fees.pricing.service_fee
        );

        store.damage_protection =
          parseInt(
            unitObject.information.rates_and_fees.pricing.damage_protection
          ) * selectedTripLength;

        store.sales_tax =
          (parseInt(unitObject.information.rates_and_fees.pricing.sales_tax) /
            100) *
          store.nightly_rate_sum;

        store.total_price =
          store.nightly_rate_sum +
          store.service_fee +
          store.damage_protection +
          store.sales_tax;

        if (store.additional_line_items) {
          Object.entries(store.additional_line_items).forEach((item) => {
            if (store.total_price) {
              if (item[1].type == "subtract") {
                store.total_price -= item[1].value;
              } else {
                store.total_price += item[1].value;
              }
            }
          });
        }

        // console.log("store dynamically updated", store);
        return store;
      });
    }
  }

  function updateBookingPickupDropoff(detail: { key: string; value: string }) {
    if (detail.key == "pickup_time") {
      $bookingStore.pickup_time = detail.value;
    }
    if (detail.key == "dropoff_time") {
      $bookingStore.dropoff_time = detail.value;
    }
  }

  // create customer / and save booking... attach customerObject to booking
  // create customer in stripe as well..
  async function saveBooking() {
    if (savingBooking) return;
    savingBooking = true;
    datesValidationError = false;
    customerValidationError = false;

    if ($bookingStore.start == "" || $bookingStore.end == "") {
      datesValidationError = true;
      savingBooking = false;
      return;
    }

    if (
      firstNameInput.value == "" ||
      lastNameInput.value == "" ||
      emailInput.value == ""
    ) {
      customerValidationError = true;
      savingBooking = false;
      return;
    }

    //create a 'customerObject'
    let newCustomer = {
      id: newUUID(),
      bookings: [$bookingStore.id],
      contact_form_completed: true,
      email: emailInput.value,
      first_name: firstNameInput.value,
      last_name: lastNameInput.value,
      phone: phoneInput.value,
      preferred_contact_method: {},
      stripe_id: "",
      created: Timestamp.now(),
    } as Customer;

    // send to stripe to establish a stripe_id
    let createStripeCustomer = await fetch("/api/stripe/createCustomer", {
      method: "POST",
      body: JSON.stringify(newCustomer),
      headers: {
        "Content-Type": "application/json",
      },
    });
    let serverResponse = await createStripeCustomer.json();
    if (serverResponse.error) {
      console.error(serverResponse.code);
      // return "error";
    }
    newCustomer.stripe_id = serverResponse.stripe_id;

    // update booking
    bookingStore.update((store) => {
      store.customer = newCustomer.id;
      store.customerObject = newCustomer;
      return store;
    });

    // add customer to our DB
    let newCustomerDocRef = doc($firebaseStore.db, "customers", newCustomer.id);
    await setDoc(newCustomerDocRef, newCustomer);

    //add the unit_img_link to file
    unitObject.photos?.forEach((photoObj) => {
      if (photoObj.index == 1) {
        let photoUrl = photoObj.downloadURL;

        $bookingStore.unit_img_link = photoUrl;

        return;
      }
    });

    // add booking to our DB
    //@ts-ignore
    let bookingDocRef = doc(
      $firebaseStore.db,
      "units",
      $bookingStore.unit_id,
      "bookings",
      $bookingStore.id
    );
    $bookingStore.document_reference = bookingDocRef;

    await setDoc(bookingDocRef, $bookingStore);

    savingBooking = false;
    dispatch("cancel", true);
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

  function createNewLineItem() {
    if (!$bookingStore.additional_line_items) {
      $bookingStore.additional_line_items = {};
    }

    $bookingStore.additional_line_items[new_line_item_name] = {
      value: new_line_item_amount,
      type: new_line_item_type as "add" | "subtract",
    };

    // console.log(
    //   "updated additional line items: ",
    //   $bookingStore.additional_line_items
    // );
    if ($bookingStore.total_price) {
      if (new_line_item_type == "subtract") {
        if ($bookingStore.total_price - new_line_item_amount < 0) {
          window.alert("Total price cannot be less than 0 !");
          return;
        }
        $bookingStore.total_price -= new_line_item_amount;
      } else {
        $bookingStore.total_price += new_line_item_amount;
      }
    }
    new_line_item_name = "";
    new_line_item_amount = 0;
    new_line_item_type = "add";

    showLineItemDialog = false;
  }

  function removeLineItem(item_name: string) {
    if ($bookingStore.additional_line_items) {
      Object.entries($bookingStore.additional_line_items).forEach((item) => {
        if ($bookingStore.total_price) {
          if (item[0] == item_name) {
            if (item[1].type == "subtract") {
              $bookingStore.total_price += item[1].value;
            } else {
              $bookingStore.total_price -= item[1].value;
            }

            //@ts-ignore
            delete $bookingStore.additional_line_items[item[0]];
          }
        }
      });
    }
  }
</script>

<div class="new-booking-option-container">
  <div class="container-header">
    <p class="option-title">Create New Booking</p>
    <button
      class="cancel-creation"
      on:click={() => {
        dispatch("cancel", true);
      }}
      ><svg
        width="25px"
        height="25px"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g id="SVGRepo_iconCarrier">
          <path
            d="M14.5 9.50002L9.5 14.5M9.49998 9.5L14.5 14.5"
            stroke="#262626"
            stroke-width="1.5"
            stroke-linecap="round"
          />
          <path
            d="M22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C21.5093 4.43821 21.8356 5.80655 21.9449 8"
            stroke="#262626"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </g>
      </svg></button
    >
  </div>
  <div class="content-container">
    <div class="section">
      <div class="section-label">Unit</div>
      <p>{unitObject.name}</p>
    </div>
    <div class="section">
      <PopupCalendarInputNoBookings
        on:selection={(event) => {
          updateBookingDates(event.detail);
        }}
      />
      {#if datesValidationError}
        <p class="validation-error">No Dates Selected</p>
      {/if}
    </div>
    <div class="double-row">
      <div class="section">
        <div class="section-label">Departure/Delivery</div>
        <select
          name="pickup"
          id="pickup"
          on:change={({ currentTarget }) => {
            let key = "pickup_time";
            let value = currentTarget.value;
            updateBookingPickupDropoff({ key: key, value: value });
          }}
        >
          <option value=" 1 pm">1 pm</option>
          <option value=" 2 pm">2 pm</option>
          <option value=" 3 pm">3 pm</option>
          <option value=" 4 pm" selected>4 pm</option>
          <option value=" 5 pm">5 pm</option>
          <option value=" 6 pm">6 pm</option>
        </select>
      </div>
      <div class="section">
        <div class="section-label">Return/Pick-up</div>
        <select
          name="dropoff"
          id="dropoff"
          on:change={({ currentTarget }) => {
            let key = "dropoff_time";
            let value = currentTarget.value;
            updateBookingPickupDropoff({ key: key, value: value });
          }}
        >
          <option value="10 am" selected>10 am</option>
          <option value="11 am">11 am</option>
          <option value="12 pm">12 pm</option>
          <option value=" 1 pm">1 pm</option>
          <option value=" 2 pm">2 pm</option>
          <option value=" 3 pm">3 pm</option>
        </select>
      </div>
    </div>
    <div class="pricing-table-header">
      <p class="section-label">Pricing Table</p>
      <button
        class="line-item-button"
        on:click={() => (showLineItemDialog = true)}>Add Line Item</button
      >

      {#if showLineItemDialog}
        <div class="line-item-modal" in:fly={{ y: -20 }}>
          <p class="modal-title">Create New Line Item</p>
          <div class="modal-bar"></div>
          <p class="modal-label">Name</p>
          <input
            class="modal-input"
            type="text"
            bind:value={new_line_item_name}
          />
          <p class="modal-label">Type</p>
          <select class="modal-input" bind:value={new_line_item_type}>
            <option value="add" selected>Addition</option>
            <option value="subtract">Subtraction</option>
          </select>
          <p class="modal-label">Dollar Amount</p>
          <input
            class="modal-input"
            type="number"
            min="0"
            bind:value={new_line_item_amount}
          />
          <div class="modal-button-row">
            <button
              class="modal-cancel"
              on:click={() => {
                new_line_item_amount = 0;
                new_line_item_name = "";
                new_line_item_type = "add";

                showLineItemDialog = false;
              }}>Cancel</button
            >
            <button class="modal-save" on:click={createNewLineItem}>Save</button
            >
          </div>
        </div>
      {/if}
    </div>
    <div class="pricing-container">
      <div class="section pricing">
        {#if $bookingStore.total_price}
          <div class="line-item">
            <p>
              ${$bookingStore.price_per_night} x {$bookingStore.trip_length} nights
            </p>
            <p>${$bookingStore.nightly_rate_sum}</p>
          </div>
          <div class="line-item">
            <p>Service Fee</p>
            <p>${$bookingStore.service_fee}</p>
          </div>
          <div class="line-item">
            <p>Dmg Prot. & Assistance</p>
            <p>${$bookingStore.damage_protection}</p>
          </div>
          <div class="line-item">
            <p>Sales Tax</p>
            <p>${$bookingStore.sales_tax}</p>
          </div>
          {#if $bookingStore.additional_line_items}
            {#each Object.keys($bookingStore.additional_line_items) as item_name}
              <div class="line-item">
                <p>{item_name}</p>
                <p>
                  {#if $bookingStore.additional_line_items[item_name].type == "subtract"}
                    -
                  {/if}
                  ${$bookingStore.additional_line_items[item_name].value}
                </p>
                <button
                  class="remove-line-item"
                  on:click={() => {
                    removeLineItem(item_name);
                  }}>X</button
                >
              </div>
            {/each}
          {/if}

          <div class="line-item-total-bar"></div>
          <div class="line-item total">
            <p>Total</p>
            <p>${$bookingStore.total_price}</p>
          </div>
        {:else}
          <div class="line-item">
            <p>Select</p>
            <p>Dates</p>
          </div>
        {/if}
      </div>
    </div>

    <div class="section">
      <div class="section-label">Customer Info</div>
      {#if customerValidationError}
        <p class="validation-error customer">Customer Details Required</p>
      {/if}
      <input
        type="text"
        placeholder="First Name*"
        name="first-name"
        bind:this={firstNameInput}
        required
      />
      <input
        class="margin-top"
        type="text"
        placeholder="Last Name*"
        name="last-name"
        bind:this={lastNameInput}
        required
      />
      <input
        class="margin-top"
        type="email"
        placeholder="Email*"
        name="email"
        bind:this={emailInput}
        required
      />
      <input
        class="margin-top"
        type="tel"
        placeholder="Phone"
        name="phone"
        bind:this={phoneInput}
      />
    </div>
    <div class="bar" />
    <div class="section">
      <button id="save-button" on:click={saveBooking}>
        {#if savingBooking}
          <div class="spinner" />
        {:else}
          SAVE
        {/if}
      </button>
    </div>
  </div>
</div>

<style>
  .new-booking-option-container {
    background-color: hsl(var(--b1));
    position: relative;
    border-radius: 4px;
    box-shadow: 0 1px 3px var(--cms-boxShadow);
    width: 100%;
    display: flex;
    flex-direction: column;
    width: 450px;
    height: 100%;
    margin-bottom: auto;
  }
  .container-header {
    display: flex;
    justify-content: space-between;
    padding: 8px 10px;
    background-color: #eee;
    border-radius: 4px 4px 0 0;
    position: relative;
  }
  .content-container {
    overflow-y: scroll;
  }
  .option-title {
    font-family: cms-semibold;
    font-size: 14px;
    line-height: 25px;
    color: var(--cms-text);
  }
  .cancel-creation {
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
  .validation-error {
    color: hsl(var(--er));
    font-family: monospace;
    font-size: 12px;
    position: absolute;
    left: 67px;
    top: 16px;
  }
  .validation-error.customer {
    left: 125px;
  }
  .section {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 15px;
    position: relative;
  }
  .section p {
    font-family: cms-regular;
  }
  .section.last {
    margin-bottom: 50%;
  }
  .section-label {
    font-family: cms-semibold;
    align-self: flex-start;
    font-size: 14px;
    display: flex;
  }
  .pricing-table-header {
    margin-top: 15px;
    padding-left: 15px;
    padding-right: 45px;
    display: flex;
    justify-content: space-between;
    position: relative;
  }

  .pricing-container {
    display: flex;
    flex-direction: column;
  }
  .line-item {
    display: flex;
    justify-content: space-between;
    width: 70%;
    padding: 0 20px;
    position: relative;
  }
  .remove-line-item {
    position: absolute;
    right: -10px;
    top: 4px;
    border-radius: 4px;
    font-size: 10px;

    padding: 0px 4px;
    background-color: var(--cms-text);
    color: white;
    font-family: cms-bold;
  }
  .line-item-total-bar {
    width: 70%;
    padding: 0 20px;
    height: 1px;
    background-color: var(--cms-boxShadow);
  }
  .line-item.total p {
    font-family: cms-semibold;
  }
  .line-item-button {
    border-radius: 6px;
    background-color: var(--cms-text);
    padding: 5px 10px;
    color: var(--cms-bgColor);
    font-family: cms-semibold;
    font-size: 14px;
  }
  .line-item-modal {
    position: absolute;
    background-color: white;
    border-radius: 6px;
    z-index: 10;
    padding: 30px;
    padding-bottom: 15px;
    box-shadow: 0 1px 4px grey;
    top: -100px;
    right: 55px;
    width: 350px;
    font-family: cms-light;
  }
  .line-item-modal p {
    font-family: cms-regular;
  }
  p.modal-title {
    font-family: cms-semibold;
    font-size: 18px;
  }
  .modal-bar {
    width: 100%;
    height: 1px;
    background-color: var(--cms-boxShadow);
    margin-bottom: 15px;
    margin-top: 5px;
  }
  .modal-input {
    margin-bottom: 10px;
    width: 100%;
  }
  .modal-button-row {
    margin-top: 20px;
    display: flex;
    justify-content: space-between;
  }
  .modal-cancel {
    border-radius: 4px;
    background-color: var(--cms-boxShadow);
    font-family: cms-semibold;
    padding: 5px 10px;
    color: var(--cms-text);
  }
  .modal-save {
    border-radius: 4px;
    background-color: var(--cms-text);
    font-family: cms-semibold;
    padding: 5px 20px;
    color: white;
  }
  .double-row {
    display: flex;
    width: 100%;
  }
  .double-row .section {
    width: 50%;
  }
  .double-row .section {
    width: 50%;
  }

  select {
    padding: 10px;
    background-color: hsl(var(--b1));
    border: solid 1px hsl(var(--b3));
    border-radius: 4px;
    width: 85%;
    margin-right: 10%;
  }
  select option {
    font-family: cms-regular;
  }
  input {
    border: 1px solid var(--cms-boxShadow);
    font-size: 16px;
    font-family: cms-regular;
    padding: 6px 15px;
    border-radius: 4px;
    outline: none;
    width: 250px;
  }
  input.price {
    width: 100px;
  }
  input.margin-top {
    margin-top: 20px;
  }
  .bar {
    content: "";
    width: 80%;
    height: 1px;
    background-color: hsl(var(--b2));
    margin: 15px auto;
  }
  #save-button {
    background-color: hsl(var(--p));
    font-family: cms-light;
    color: hsl(var(--b1));
    width: 80%;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    font-size: 20px;
    margin: 0px auto 20px;
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
  @media (max-width: 500px) {
    .new-booking-option-container {
      width: 100%;
    }
    select,
    input {
      height: 40px;
    }
  }
</style>
