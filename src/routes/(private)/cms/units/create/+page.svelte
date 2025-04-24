<script lang="ts">
  import { enhance } from "$app/forms";
  import { collection, doc, setDoc } from "firebase/firestore";
  import { newUnitModel, populateUnitStore } from "$lib/helpers";
  import { firebaseStore } from "$lib/stores";

  let formSubmitting = false;

  let formObject: { [key: string]: any };

  /*
list of things required to build new unit object and throw no errors!  all under unitObject. -> 
    name 
    information.paragraphs.description.content
    information.rates_and_fees.pricing.base_rental_fee 
    unitObject.information.rates_and_fees.pricing.taxes_and_fees @deprecated
    unitObject.information.rates_and_fees.pricing.damage_protection
    unitObject.information.rates_and_fees.pricing.sales_tax 
    unitObject.information.rates_and_fees.pricing.service_fee
    unitObject.information.bullet_points.summary.pickup_location
    unitObject.information.rates_and_fees.pricing.mileage_overage
    unitObject.information.summary.pickup_location
    unitObject.information.summary.sleeps
    unitObject.information.summary.year_built
    unitObject.information.summary.vehicle_type
    unitObject.information.summary.length
    unitObject.information.rates_and_fees.pricing.minimum_nights
*/
</script>

<form
  method="POST"
  name="create-new-unit"
  class="new-unit-container"
  use:enhance={async ({ form, data, cancel }) => {
    if (formSubmitting) {
      return;
    }

    formSubmitting = true;

    formObject = {};

    for (const [key, value] of data) {
      //@ts-ignore
      formObject[key] = value;
    }

    let newUnitObject = newUnitModel;
    newUnitObject.name = formObject.name;
    newUnitObject.information.paragraphs.description.content =
      formObject.description;
    newUnitObject.information.rates_and_fees.pricing.base_rental_fee =
      formObject.base_rental_fee;
    newUnitObject.information.rates_and_fees.pricing.damage_protection =
      formObject.damage_protection;
    newUnitObject.information.rates_and_fees.pricing.sales_tax =
      formObject.sales_tax;
    newUnitObject.information.rates_and_fees.pricing.service_fee =
      formObject.service_fee;
    newUnitObject.information.bullet_points.summary.pickup_location =
      formObject.pickup_location;
    newUnitObject.information.rates_and_fees.pricing.mileage_overage =
      formObject.mileage_overage;
    newUnitObject.information.bullet_points.summary.sleeps = formObject.sleeps;
    newUnitObject.information.bullet_points.summary.year_built =
      formObject.year_built;
    newUnitObject.information.bullet_points.summary.vehicle_type =
      formObject.vehicle_type;
    newUnitObject.information.bullet_points.summary.length = formObject.length;
    newUnitObject.information.rates_and_fees.pricing.minimum_nights =
      formObject.min_nights;

    let unitsCollection = collection($firebaseStore.db, "units");
    let newUnitDocRef = doc(unitsCollection);
    let newUnitId = newUnitDocRef.id;

    newUnitObject.id = newUnitId;

    //***  CREATE PRODUCT IN STRIPE  ***
    let createStripeProduct = await fetch("/api/stripe/createProduct", {
      method: "POST",
      body: JSON.stringify(newUnitObject),
      headers: {
        "Content-Type": "application/json",
      },
    });
    let stripeResponse = await createStripeProduct.json();

    if (stripeResponse.error) {
      console.error(stripeResponse.code);
    } else {
      //@ts-ignore
      newUnitObject.stripe_product_id = stripeResponse.stripe_product_id;
    }

    let createNewUnit = await setDoc(newUnitDocRef, newUnitObject);

    await populateUnitStore($firebaseStore, { cms: true });

    form.reset();

    cancel();

    formSubmitting = false;
  }}
>
  <div class="container-header">
    <p class="option-title">Create New Unit</p>
  </div>
  <p class="note">
    Please follow the examples provided for formatting. When only a number is
    present it is used in a mathematical formula. Thank you.
  </p>
  <div class="properties-list">
    <div class="property">
      <p class="label">Unit Name</p>
      <input class="property-input" type="text" name="name" required />
    </div>
    <div class="property">
      <p class="label">Pickup Location</p>
      <input
        class="property-input"
        type="text"
        name="pickup_location"
        placeholder="e.g. Modena"
        required
      />
    </div>
    <div class="double-row">
      <div class="property">
        <p class="label">Base Rental Fee</p>
        <input
          class="property-input"
          type="text"
          name="base_rental_fee"
          placeholder="e.g. 137"
          required
        />
      </div>
      <div class="property">
        <p class="label">Service Fee</p>
        <input
          class="property-input"
          type="text"
          name="service_fee"
          placeholder="e.g. 125"
          required
        />
      </div>
    </div>

    <div class="double-row">
      <div class="property">
        <p class="label">Protect & Assist</p>
        <input
          class="property-input"
          type="text"
          name="damage_protection"
          placeholder="e.g. 29"
          required
        />
      </div>

      <div class="property">
        <p class="label">Mileage Overage</p>
        <input
          class="property-input"
          type="text"
          name="mileage_overage"
          placeholder="e.g. 0.58"
          required
        />
      </div>
    </div>

    <div class="double-row">
      <div class="property">
        <p class="label">Sleeps</p>
        <input
          class="property-input"
          type="text"
          name="sleeps"
          placeholder="e.g. 4"
          required
        />
      </div>

      <div class="property">
        <p class="label">Year Built</p>
        <input
          class="property-input"
          type="text"
          name="year_built"
          placeholder="e.g. 2021"
          required
        />
      </div>
    </div>

    <div class="double-row">
      <div class="property">
        <p class="label">Vehicle Type</p>
        <input
          class="property-input"
          type="text"
          name="vehicle_type"
          placeholder="e.g. Travel Trailer"
          required
        />
      </div>

      <div class="property">
        <p class="label">Length</p>
        <input
          class="property-input"
          type="text"
          name="length"
          placeholder="e.g. 21.0 ft"
          required
        />
      </div>
    </div>

    <div class="double-row">
      <div class="property">
        <p class="label">Min. Booking Nights</p>
        <input
          class="property-input"
          type="text"
          name="min_nights"
          placeholder="e.g. 3"
          required
        />
      </div>
      <div class="property">
        <p class="label">Sales Tax (%)</p>
        <input
          class="property-input"
          type="text"
          name="sales_tax"
          placeholder="e.g. 8"
          required
        />
      </div>
    </div>

    <div class="property textarea">
      <p class="label">Description / More Info</p>
      <textarea class="property-input textarea" name="description" required />
    </div>
  </div>
  <button type="submit">
    {#if formSubmitting}
      <div class="spinner" />
    {:else}
      CREATE
    {/if}
  </button>
</form>

<style>
  .new-unit-container {
    background-color: hsl(var(--b1));
    margin: 25px;
    position: relative;
    border-radius: 4px;
    box-shadow: 0 1px 3px var(--cms-boxShadow);
    width: 100%;
    display: flex;
    flex-direction: column;
    width: 450px;
    height: 90%;
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
  .option-title {
    font-family: cms-semibold;
    font-size: 14px;
    line-height: 25px;
    color: var(--cms-text);
  }
  .properties-list {
    display: flex;
    flex-wrap: wrap;
    flex-direction: column;
    -ms-overflow-style: none;
    scrollbar-width: none;
    scroll-snap-type: x mandatory;
    max-height: 95%;
    overflow: hidden;
    flex-grow: 1;
  }
  .property {
    width: 450px;
    padding: 0 25px;
    scroll-snap-align: center;
  }
  .property.textarea {
    height: auto;
    flex-grow: 1;
  }
  .double-row {
    display: flex;
  }
  .double-row .property {
    width: 225px;
  }
  .label {
    font-family: cms-semibold;
    font-size: 13px;
    color: var(--cms-text);
    width: 100%;
  }
  .note {
    padding: 6px 15px;
    text-align: center;
    font-family: font-light;
    font-size: 13px;
  }
  .property-input {
    border: 1px solid var(--cms-boxShadow);
    font-size: 16px;
    font-family: cms-regular;
    padding: 6px 15px;
    border-radius: 4px;
    margin-top: -10px;
    outline: none;
    width: 100%;
  }
  .property-input.textarea {
    height: 69%;
  }
  button {
    background-color: hsl(var(--p));
    border-radius: 3px;
    color: hsl(var(--b1));
    width: 90%;
    align-self: center;
    padding: 8px 0;
    margin: 25px;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 40px;
  }
  .spinner {
    content: "";
    border-radius: 50%;
    border-top: 2px solid var(--cms-bgColor);
    border-right: 2px solid transparent;
    animation-name: spinning;
    animation-duration: 1.2s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    opacity: 1;
    transition: all 0.2s;
    width: 20px;
    height: 20px;
  }
  @keyframes spinning {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 1000px) {
    .new-unit-container {
      width: 100%;
      max-height: 90%;
    }
    .property {
      width: 100%;
    }
  }
</style>
