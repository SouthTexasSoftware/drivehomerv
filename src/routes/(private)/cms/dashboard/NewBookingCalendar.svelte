<script lang="ts">
  import { easepick } from "@easepick/bundle";
  import { DateTime } from "@easepick/datetime";
  import { RangePlugin } from "@easepick/range-plugin";
  import { LockPlugin } from "@easepick/lock-plugin";
  import { onMount, createEventDispatcher } from "svelte";
  import cmsPickerCalendar from "$lib/styles/cmsPickerCalendar.css?inline";

  let selectedTripStart: string = "StartDate";
  let selectedTripEnd: string = "EndDate";

  let dispatch = createEventDispatcher();

  onMount(() => {
    buildHotelCalendarExample();
  });

  function buildHotelCalendarExample() {
    const picker = new easepick.create({
      element: "#calendar-button",
      inline: false,
      css: cmsPickerCalendar,
      zIndex: 1000,
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
      },
      LockPlugin: {
        minDays: 2,
        inseparable: true,
      },
    });
  }

  /*
   * Called from within easepick calendar instance upon user selection of timespan
   */
  function calendarSelectionHandler(selection: { start: Date; end: Date }) {
    selectedTripStart = dateToString(selection.start);
    selectedTripEnd = dateToString(selection.end);

    dispatch("selection", { start: selectedTripStart, end: selectedTripEnd });
  }

  function dateToString(date: Date) {
    let dateString = date.toDateString();

    dateString = dateString.substring(4);
    dateString = dateString.replaceAll(" ", "-");
    return dateString;
  }
</script>

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

<style>
  #calendar-button {
    height: 0;
    outline: none;
    position: relative;
  }
  .row {
    display: flex;
    justify-content: space-evenly;
    margin: 5px 0px;
  }
  strong.dates {
    font-size: 14px;
    margin-bottom: -5px;
    margin-top: 25px;
    max-width: 300px;
  }
  .date-display {
    border: 1px solid hsl(var(--b3));
    border-radius: 10px;
    padding: 10px 3px;
    color: black;
    /* max-width: 300px; */
    z-index: 100;
    background-color: hsl(var(--b1));
    font-size: 14px;
  }
  svg#right-arrow {
    height: 100%;
    width: 10px;
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
      position: absolute;
      bottom: 50px;
    }
  }

  @media (min-width: 500px) and (max-width: 1000px) {
  }

  @media (min-width: 1000px) {
  }
</style>
