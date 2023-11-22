<script lang="ts">
  import { easepick } from "@easepick/bundle";
  import { DateTime } from "@easepick/datetime";
  import { RangePlugin } from "@easepick/range-plugin";
  import { LockPlugin } from "@easepick/lock-plugin";
  import { onMount, createEventDispatcher } from "svelte";
  import publicPickerCalendar from "$lib/styles/publicPickerCalendar.css?inline";
  import type { Unit } from "$lib/types";
  import { bookingStore, bookingUpdateStore, unitStore } from "$lib/stores";

  export let unitObject: Unit;
  export let loadingBookingRecap: boolean;

  let updatingPickupDropoff = true;
  let pickupElement: HTMLSelectElement;
  let dropoffElement: HTMLSelectElement;
  // used to help build/add price modifiers to the pickup & dropoff selection boxes
  let defaultPickupDropoff = {
    pickup: {
      " 1 pm": { priceMod: 1, selected: false, available: true },
      " 2 pm": { priceMod: 0.5, selected: false, available: true },
      " 3 pm": { priceMod: 0, selected: false, available: true },
      " 4 pm": { priceMod: 0, selected: true, available: true }, // default 4pm selected, hardcoded on lines 214/215 as well
      " 5 pm": { priceMod: 0, selected: false, available: true },
      " 6 pm": { priceMod: 0, selected: false, available: true },
    },
    dropoff: {
      "10 am": { priceMod: 0, selected: true, available: true }, // default 10am selected, hardcoded on lines 214/215 as well
      "11 am": { priceMod: 0, selected: false, available: true },
      "12 pm": { priceMod: 0.25, selected: false, available: true },
      " 1 pm": { priceMod: 0.5, selected: false, available: true },
      " 2 pm": { priceMod: 1, selected: false, available: true },
    },
  };
  let selectedPickupDropoff = structuredClone(defaultPickupDropoff);

  let dispatch = createEventDispatcher();
  let screenWidth: number;

  let selectedTripStart: string = "Start Date";
  let selectedTripEnd: string = "End Date";

  let tripStartLabel = "Departure";
  let tripEndLabel = "Return";

  let pickerGlobal: easepick.Core;
  let calendarBookedDates: Date[][] = [];

  onMount(awaitUnitStorePopulation);

  function awaitUnitStorePopulation() {
    if (!$unitStore.isPopulated) {
      setTimeout(awaitUnitStorePopulation, 200);
      return;
    }

    if ($bookingStore.start && $bookingStore.end) {
      selectedTripStart = $bookingStore.start;
      selectedTripEnd = $bookingStore.end;

      dispatch("selection", {
        start: new DateTime(selectedTripStart, "MMM-DD-YYYY"),
        end: new DateTime(selectedTripEnd, "MMM-DD-YYYY"),
      });
    }

    buildUnitCalendar();
    updatePickupDropoff();
    updateTripStartEndLabels();
  }

  function buildUnitCalendar() {
    unitObject.bookingDates?.forEach((datesObject) => {
      let tempArray = [datesObject.start, datesObject.end];
      calendarBookedDates.push(tempArray);
    });

    let inlineCalendar = false;
    if (screenWidth > 500) {
      inlineCalendar = true;
    }

    pickerGlobal = new easepick.create({
      element: "#calendar-button",
      inline: inlineCalendar, // always visible - TODO: change this in mobile only
      css: publicPickerCalendar,
      zIndex: 110,
      firstDay: 0, // sets the calendar to have SUNDAY on the left
      plugins: [RangePlugin, LockPlugin],
      setup(picker) {
        picker.on("select", (e) => {
          calendarSelectionHandler(e.detail);
        });
      },
      RangePlugin: {
        tooltipNumber(num) {
          return num - 1;
        },
        locale: {
          one: "night",
          other: "nights",
        },
        startDate: new DateTime(selectedTripStart, "MMM-DD-YYYY"),
        endDate: new DateTime(selectedTripEnd, "MMM-DD-YYYY"),
      },
      LockPlugin: {
        minDate: new Date(),
        minDays:
          parseInt(
            unitObject.information.rates_and_fees.pricing.minimum_nights
          ) + 1 || 1,
        inseparable: true,
        filter(date, picked) {
          if (picked.length === 1) {
            //@ts-ignore
            const incl = date.isBefore(picked[0]) ? "[)" : "(]";
            return (
              //@ts-ignore
              !picked[0].isSame(date, "day") &&
              //@ts-ignore
              date.inArray(calendarBookedDates, incl)
            );
          }
          //@ts-ignore
          return date.inArray(calendarBookedDates, "[)");
        },
      },
    });

    createUpdateListener();
  }

  function createUpdateListener() {
    // updates calendar if bookings get refreshed externally.
    let unsub = bookingUpdateStore.subscribe((storeData) => {
      console.log("Calendar rebuild triggered");
      if (loadingBookingRecap) {
        console.log("booking processed through, unsubbing");
        unsub();
        return;
      }
      let unitAffected = $unitStore.getUnit(storeData.unit_id);
      //@ts-ignore
      if (unitAffected?.bookingDates) {
        let tempArray = [];
        for (let bookedDate of unitAffected.bookingDates) {
          let newEntry = [
            new DateTime(bookedDate.start, "MMM-DD-YYYY"),
            new DateTime(bookedDate.end, "MMM-DD-YYYY"),
          ];
          tempArray.push(newEntry);
        }

        calendarBookedDates = tempArray;

        pickerGlobal.renderAll();

        dispatch("selection", { reset: true });
      }
    });
  }

  /*
   * Called from within easepick calendar instance upon user selection of timespan
   */
  function calendarSelectionHandler(selection: {
    start: Date;
    end: Date;
    pickup: { time: string; price: number };
    dropoff: { time: string; price: number };
  }) {
    selectedTripStart = dateToString(selection.start);
    selectedTripEnd = dateToString(selection.end);

    updatePickupDropoff();

    pickupDropoffSelectionHandler();
  }

  function dateToString(date: Date) {
    let dateString = date.toDateString();

    dateString = dateString.substring(4);
    dateString = dateString.replaceAll(" ", "-");
    return dateString;
  }

  function updateTripStartEndLabels() {
    if (
      unitObject.information.bullet_points.summary.vehicle_type.includes(
        "Class"
      )
    ) {
      tripStartLabel = "Departure";
      tripEndLabel = "Return";
    } else {
      tripStartLabel = "Delivery";
      tripEndLabel = "Pick-up";
    }
  }

  // use the bookings list on the unitObject to develop a pricing scheme for the pickupDropoffObject above.
  function updatePickupDropoff() {
    updatingPickupDropoff = true;

    let pickupModified = false;
    let dropoffModified = false;
    // if a previous booking ends on the selected pickup date - dont allow early.
    unitObject.bookings?.forEach((previousBooking) => {
      if (previousBooking.end == selectedTripStart) {
        //console.log("matched end of trip to this pickup date");
        // if so, remove option for early pickup.
        selectedPickupDropoff.pickup[" 1 pm"].available = false;
        selectedPickupDropoff.pickup[" 2 pm"].available = false;
        pickupModified = true;
      }
      // if a previous booking starts on the selected dropoff date - dont allow late dropoff.
      if (previousBooking.start == selectedTripEnd) {
        //console.log("matched start of trip to this dropoff date");
        // if so, remove option for early pickup.
        selectedPickupDropoff.dropoff["12 pm"].available = false;
        selectedPickupDropoff.dropoff[" 1 pm"].available = false;
        selectedPickupDropoff.dropoff[" 2 pm"].available = false;
        dropoffModified = true;
      }
    });

    $unitStore.units.forEach((unit) => {
      // look at every booking for every unit.. see if another start matches this start
      // if so, set the pickup time already used to unavailable
      unit.bookings?.forEach((anyUnitBooking) => {
        if (anyUnitBooking.start == selectedTripStart) {
          //console.log("found matching booking pickup date");
          //console.log(anyUnitBooking);
          if (anyUnitBooking.pickup_time) {
            //@ts-ignore
            selectedPickupDropoff.pickup[anyUnitBooking.pickup_time].available =
              false;

            pickupModified = true;
          }
        }
      });
    });

    if (pickupModified == false) {
      // reset to default
      //console.log("resetting pdObject to default");
      selectedPickupDropoff.pickup = structuredClone(
        defaultPickupDropoff.pickup
      );
    }
    if (dropoffModified == false) {
      // reset to default
      //console.log("resetting pdObject to default");
      selectedPickupDropoff.dropoff = structuredClone(
        defaultPickupDropoff.dropoff
      );
    }
    updatingPickupDropoff = false;
    //console.log(selectedPickupDropoff);
  }

  function pickupDropoffSelectionHandler() {
    let selection = {
      start: new DateTime(),
      end: new DateTime(),
      pickup: { time: "", price: 0 },
      dropoff: { time: "", price: 0 },
    };

    let pickupSelected = pickupElement.value;
    //console.log(pickupSelected);
    let dropoffSelected = dropoffElement.value;
    //console.log(dropoffSelected);
    if (pickupSelected == "disabled") {
      pickupSelected = " 4 pm";
      dropoffSelected = "10 am";
    }

    //check if this is hung up on a now unavailable option
    if (pickupSelected) {
      // on initial date selection, this value is not populated, the process works off of the Objects - selected boolean instead
      //@ts-ignore
      if (!selectedPickupDropoff.pickup[pickupSelected].available) {
        let optionSelectedAlready = false;
        Object.entries(selectedPickupDropoff.pickup)
          .reverse()
          .forEach((timeOption) => {
            if (optionSelectedAlready) return;

            if (timeOption[1].available) {
              timeOption[1].selected = true;
              pickupSelected = timeOption[0];
              console.log("new pickup autoselected = ", pickupSelected);
              optionSelectedAlready = true;
            }
          });
      }
      // Dropoff section
      //@ts-ignore
      if (!selectedPickupDropoff.dropoff[dropoffSelected].available) {
        let optionSelectedAlready = false;
        Object.entries(selectedPickupDropoff.dropoff).forEach((timeOption) => {
          if (optionSelectedAlready) return;

          if (timeOption[1].available) {
            timeOption[1].selected = true;
            dropoffSelected = timeOption[0];
            //console.log("new dropoff autoselected = ", dropoffSelected);
            optionSelectedAlready = true;
          }
        });
      }
    }

    // normal loop checks to set the pickupDropoff object up to align with the selection
    Object.entries(selectedPickupDropoff.pickup).forEach((timeOption) => {
      let time = timeOption[0];
      let options = timeOption[1];
      if (time == pickupSelected) {
        options.selected = true;
        selection.pickup.time = time;
        selection.pickup.price =
          options.priceMod *
          parseInt(
            unitObject.information.rates_and_fees.pricing.base_rental_fee
          );
      } else {
        options.selected = false;
      }
    });

    Object.entries(selectedPickupDropoff.dropoff).forEach((timeOption) => {
      let time = timeOption[0];
      let options = timeOption[1];
      if (time == dropoffSelected) {
        options.selected = true;
        selection.dropoff.time = time;
        selection.dropoff.price =
          options.priceMod *
          parseInt(
            unitObject.information.rates_and_fees.pricing.base_rental_fee
          );
      } else {
        options.selected = false;
      }
    });

    selection.start = new DateTime(selectedTripStart, "MMM-DD-YYYY");
    selection.end = new DateTime(selectedTripEnd, "MMM-DD-YYYY");

    let unixStart = Math.ceil(selection.start.getTime() / 1000);
    let unixEnd = Math.ceil(selection.end.getTime() / 1000);

    bookingStore.update((store) => {
      store.start = selectedTripStart;
      store.end = selectedTripEnd;
      store.pickup_time = selection.pickup.time;
      store.dropoff_time = selection.dropoff.time;
      store.unix_start = unixStart;
      store.unix_end = unixEnd;

      return store;
    });

    dispatch("selection", selection);
  }

  function clearCalendarSelection() {
    if (!pickerGlobal) return;

    pickerGlobal.clear();
  }
</script>

<svelte:window bind:innerWidth={screenWidth} />

<div class="row stack dates">
  <strong class="dates">Select Your Dates</strong>
  <button class="clear-selection" on:click={clearCalendarSelection}
    >Reset</button
  >

  <label for="calendar-button" class="row date-display">
    <p>{selectedTripStart}</p>
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
    <p>{selectedTripEnd}</p>
  </label>

  <input id="calendar-button" />
</div>
<div class="row pickup-dropoff">
  <div class="row stack">
    <label class="p-d" for="pickup-time"
      >{tripStartLabel}
      {#if updatingPickupDropoff}
        <div class="spinner" />
      {/if}
    </label>

    <select
      name="pickup-time"
      id="pickup-time"
      disabled={updatingPickupDropoff}
      on:change={pickupDropoffSelectionHandler}
      bind:this={pickupElement}
    >
      {#if selectedTripStart == "Start Date"}
        <option value="disabled">Select</option>
      {:else}
        {#each Object.entries(selectedPickupDropoff.pickup) as [time, options]}
          {#if options.available}
            <option value={time} selected={options.selected}
              >{time}
              <span>
                &nbsp; +${options.priceMod *
                  parseInt(
                    unitObject.information.rates_and_fees.pricing
                      .base_rental_fee
                  )}</span
              ></option
            >
          {/if}
        {/each}
      {/if}
    </select>
  </div>
  <div class="row stack">
    <label class="p-d" for="dropoff-time"
      >{tripEndLabel}
      {#if updatingPickupDropoff}
        <div class="spinner" />
      {/if}
    </label>
    <select
      name="dropoff-time"
      id="dropoff-time"
      disabled={updatingPickupDropoff}
      on:change={pickupDropoffSelectionHandler}
      bind:this={dropoffElement}
    >
      {#if selectedTripStart == "Start Date"}
        <option value="disabled">Dates</option>
      {:else}
        {#each Object.entries(selectedPickupDropoff.dropoff) as [time, options]}
          {#if options.available}
            <option value={time} selected={options.selected}
              >{time}
              <span>
                &nbsp; +${options.priceMod *
                  parseInt(
                    unitObject.information.rates_and_fees.pricing
                      .base_rental_fee
                  )}</span
              ></option
            >
          {/if}
        {/each}
      {/if}
    </select>
  </div>
</div>

<style>
  #calendar-button {
    height: 0;
    outline: none;
    position: relative;
    transform: translateY(-50px);
  }
  .row {
    display: flex;
    justify-content: space-between;
    margin: 5px 0px;
    position: relative;
    /* left/right margin for the rows is set in .col */
  }
  .row.stack {
    flex-direction: column;
  }
  .row.stack.dates {
    align-items: center;
    justify-content: center;
    margin: auto 0;
    position: relative;
  }
  strong.dates {
    font-size: 18px;
    margin-bottom: -5px;
    margin-top: 10px;
    max-width: 300px;
    z-index: 1;
  }
  .clear-selection {
    position: absolute;
    font-size: 12px;
    width: 50px;
    border-radius: 5px;
    top: 10px;
    right: 10%;
    font-family: cms-semibold;
    cursor: pointer;
    border: 1px solid #ae25238d;
    background-color: #ae262336;
    color: #ae25238d;
    z-index: 2;
  }
  .date-display {
    border: 1px solid hsl(var(--b3));
    border-radius: 10px;
    padding: 10px 10px;
    color: black;

    max-width: 300px;
    z-index: 100;
  }
  svg#right-arrow {
    height: 100%;
    width: 20px;
  }
  :global(.easepick-wrapper) {
    opacity: 1 !important;
    z-index: 100;
    display: flex;
    justify-content: center;
    transform: translateY(0px) scale(0.9);
    left: 0 !important;
    top: 0 !important;
  }
  .pickup-dropoff {
    width: 300px;
    margin: 0 auto;
    /* margin-top: 25px; */
  }
  .pickup-dropoff .row {
    width: 50%;
  }
  label.p-d {
    font-family: font-medium;
    font-size: 14px;
    position: relative;
    width: auto;
    align-self: flex-start;
  }
  select {
    padding: 10px;
    background-color: hsl(var(--b1));
    border: solid 1px hsl(var(--b3));
    border-radius: 10px;
    width: 85%;
    margin-right: 10%;
  }

  .spinner {
    content: "";
    border-radius: 50%;
    border-top: 2px solid hsl(var(--b3));
    border-right: 2px solid transparent;
    animation-name: spinning;
    animation-duration: 1s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    opacity: 1;
    transition: all 0.2s;
    width: 10px;
    height: 10px;
    position: absolute;
    right: -15px;
    top: 5px;
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
    .row.stack.dates {
      align-items: center;
    }
    :global(.easepick-wrapper) {
      width: 90vw;
    }
  }

  @media (min-width: 500px) and (max-width: 1000px) {
  }

  @media (min-width: 1000px) {
  }
</style>
