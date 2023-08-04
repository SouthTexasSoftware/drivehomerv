<script lang="ts">
  import { easepick } from "@easepick/bundle";
  import { RangePlugin } from "@easepick/range-plugin";
  import { LockPlugin } from "@easepick/lock-plugin";
  import { onMount, createEventDispatcher } from "svelte";
  import cmsPickerCalendar from "$lib/styles/cmsPickerCalendar.css?inline";

  let selectedTripStart: string = "StartDate";
  let selectedTripEnd: string = "EndDate";

  let dispatch = createEventDispatcher();

  onMount(buildCalendar);

  function buildCalendar() {
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

<div class="section-label">Dates</div>

<label for="calendar-button" class="fake-input-box">
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
  .section-label {
    font-family: cms-semibold;
    align-self: flex-start;
    font-size: 14px;
    display: flex;
  }
  .fake-input-box {
    display: flex;
    justify-content: space-evenly;
    margin: 5px 0px;
    border: 1px solid hsl(var(--b3));
    border-radius: 4px;
    padding: 10px 3px;
    color: var(--cms-text);
    z-index: 100;
    background-color: hsl(var(--b1));
    font-size: 14px;
    width: 250px;
  }
  .fake-input-box p {
    font-family: cms-regular;
    font-size: 16px;
  }
  svg#right-arrow {
    height: 100%;
    width: 15px;
  }
  :global(.easepick-wrapper) {
    opacity: 1 !important;
    z-index: 100;
    display: flex;
    justify-content: center;
  }
  @media (max-width: 500px) {
    :global(.easepick-wrapper) {
      position: absolute;
      bottom: 150px;
    }
    .fake-input-box {
      height: 40px;
      line-height: 18px;
    }
  }
</style>
