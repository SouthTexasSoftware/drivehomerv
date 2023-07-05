<script lang="ts">
  import { easepick } from "@easepick/bundle";
  import { DateTime } from "@easepick/datetime";
  import { RangePlugin } from "@easepick/range-plugin";
  import { LockPlugin } from "@easepick/lock-plugin";
  import { onMount, createEventDispatcher } from "svelte";
  import publicPickerCalendar from "$lib/styles/publicPickerCalendar.css?inline";
  import type { Unit } from "$lib/types";
  import { customerStore } from "$lib/stores";

  export let unitObject: Unit;

  let dispatch = createEventDispatcher();
  let screenWidth: number;

  let selectedTripStart: string = "Start Date";
  let selectedTripEnd: string = "End Date";

  onMount(() => {
    if ($customerStore.start && $customerStore.end) {
      selectedTripStart = $customerStore.start;
      selectedTripEnd = $customerStore.end;

      dispatch("selection", {
        start: new DateTime(selectedTripStart, "MMM-DD-YYYY"),
        end: new DateTime(selectedTripEnd, "MMM-DD-YYYY"),
      });
    }
    buildUnitCalendar();
  });

  function buildUnitCalendar() {
    const bookedDates: Date[][] = [];

    unitObject.bookingDates?.forEach((datesObject) => {
      let tempArray = [datesObject.start, datesObject.end];
      bookedDates.push(tempArray);
    });

    let inlineCalendar = false;
    if (screenWidth > 500) {
      inlineCalendar = true;
    }

    const picker = new easepick.create({
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
        minDays: unitObject.min_booking_days,
        inseparable: true,
        filter(date, picked) {
          if (picked.length === 1) {
            //TODO: why is TS not picking these methods up?
            //@ts-ignore
            const incl = date.isBefore(picked[0]) ? "[)" : "(]";
            return (
              //@ts-ignore
              !picked[0].isSame(date, "day") && date.inArray(bookedDates, incl)
            );
          }
          //@ts-ignore
          return date.inArray(bookedDates, "[)");
        },
      },
    });
  }

  /*
   * Called from within easepick calendar instance upon user selection of timespan
   */
  function calendarSelectionHandler(selection: { start: Date; end: Date }) {
    selectedTripStart = dateToString(selection.start);
    selectedTripEnd = dateToString(selection.end);

    dispatch("selection", selection);

    customerStore.update((storeData) => {
      storeData.start = selectedTripStart;
      storeData.end = selectedTripEnd;

      return storeData;
    });
  }

  function dateToString(date: Date) {
    let dateString = date.toDateString();

    dateString = dateString.substring(4);
    dateString = dateString.replaceAll(" ", "-");
    return dateString;
  }
</script>

<svelte:window bind:innerWidth={screenWidth} />

<div class="row stack dates">
  <strong class="dates">Dates</strong>

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

<style>
  #calendar-button {
    height: 0;
    outline: none;
    position: relative;
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
  }
  strong.dates {
    font-size: 16px;
    margin-bottom: -5px;
    margin-top: 25px;
    max-width: 300px;
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
