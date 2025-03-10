<script lang="ts">
  import { easepick } from "@easepick/bundle";
  import { RangePlugin } from "@easepick/range-plugin";
  import { LockPlugin } from "@easepick/lock-plugin";
  import { onMount, createEventDispatcher } from "svelte";
  import rentalsAvailableCalendar from "$lib/styles/rentalsAvailableCalendar.css?inline";
  import { bookingStore } from "$lib/stores";
  import { DateTime } from "@easepick/datetime";

  let dispatch = createEventDispatcher();
  let screenWidth: number;

  let selectedTripStart = "Start Date";
  let selectedTripEnd = "End Date";
  let calendarInputElement: HTMLInputElement;
  let calendarContainer: HTMLElement;

  onMount(() => {
    if ($bookingStore) {
      if ($bookingStore.start && $bookingStore.end) {
        selectedTripStart = $bookingStore.start;
        selectedTripEnd = $bookingStore.end;

        dispatch("selection", {
          start: new DateTime(selectedTripStart, "MMM-DD-YYYY"),
          end: new DateTime(selectedTripEnd, "MMM-DD-YYYY"),
        });
      }
    }

    buildAvailableCalendar();
  });

  function buildAvailableCalendar() {
    const picker = new easepick.create({
      element: "#calendar-button",
      inline: false,
      css: rentalsAvailableCalendar,
      zIndex: 110,
      firstDay: 0, // sets the calendar to have SUNDAY on the left
      plugins: [RangePlugin, LockPlugin],
      setup(picker) {
        picker.on("select", (e) => {
          calendarSelectionHandler(e.detail);
        });
        // picker.ui = {
        //   wrapper: calendarContainer,
        // };
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

    dispatch("selection", selection);

    if ($bookingStore) {
      bookingStore.update((store) => {
        (store.start = selectedTripStart), (store.end = selectedTripEnd);
        return store;
      });
    } else {
      //@ts-ignore - we don't need to set the rest of the booking up just to get this populated
      bookingStore.set({
        start: selectedTripStart,
        end: selectedTripEnd,
      });
    }
  }

  function dateToString(date: Date) {
    let dateString = date.toDateString();

    dateString = dateString.substring(4);
    dateString = dateString.replaceAll(" ", "-");
    return dateString;
  }
</script>

<div class="rentals-calendar-container">
  <div class="row">
    <svg
      width="20"
      height="20"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="16"
        cy="16"
        r="15.5"
        fill="#AE2623"
        fill-opacity="0.29"
        stroke="#AE2623"
      />
      <path
        d="M11.4875 12.02C12.2608 11.7133 13.0342 11.32 13.8075 10.84C14.5942 10.36 15.2875 9.79333 15.8875 9.14H17.5875V23H15.1675V12.38C14.8075 12.66 14.3542 12.9333 13.8075 13.2C13.2608 13.4667 12.7342 13.6867 12.2275 13.86L11.4875 12.02Z"
        fill="#AE2623"
      />
    </svg>
    <strong class="dates"> Select Your Dates!</strong>
  </div>

  <div class="row indent">
    <button
      on:click={() => {
        calendarInputElement.click();
      }}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="calendar-icon"
      >
        <path
          d="M18.6667 29.3333H13.3334C8.30509 29.3333 5.79095 29.3333 4.22884 27.7712C2.66675 26.2092 2.66675 23.6949 2.66675 18.6667V16C2.66675 10.9717 2.66675 8.45753 4.22884 6.89542C5.79095 5.33333 8.30509 5.33333 13.3334 5.33333H18.6667C23.695 5.33333 26.2093 5.33333 27.7713 6.89542C29.3334 8.45753 29.3334 10.9717 29.3334 16V18.6667C29.3334 23.6949 29.3334 26.2092 27.7713 27.7712C26.9003 28.6421 25.7335 29.0275 24.0001 29.198"
          stroke="#3D3D3D"
          stroke-width="2"
          stroke-linecap="round"
        />
        <path
          d="M9.33325 5.33333V3.33333"
          stroke="#3D3D3D"
          stroke-width="2"
          stroke-linecap="round"
        />
        <path
          d="M22.6667 5.33333V3.33333"
          stroke="#3D3D3D"
          stroke-width="2"
          stroke-linecap="round"
        />
        <path
          d="M28.6667 12H22.1667H14.3334M2.66675 12H7.83341"
          stroke="#3D3D3D"
          stroke-width="2"
          stroke-linecap="round"
        />
        <path
          d="M23.9999 22.6667C23.9999 23.4031 23.403 24 22.6666 24C21.9302 24 21.3333 23.4031 21.3333 22.6667C21.3333 21.9303 21.9302 21.3333 22.6666 21.3333C23.403 21.3333 23.9999 21.9303 23.9999 22.6667Z"
          fill="#3D3D3D"
        />
        <path
          d="M23.9999 17.3333C23.9999 18.0697 23.403 18.6667 22.6666 18.6667C21.9302 18.6667 21.3333 18.0697 21.3333 17.3333C21.3333 16.5969 21.9302 16 22.6666 16C23.403 16 23.9999 16.5969 23.9999 17.3333Z"
          fill="#3D3D3D"
        />
        <path
          d="M17.3334 22.6667C17.3334 23.4031 16.7365 24 16.0001 24C15.2637 24 14.6667 23.4031 14.6667 22.6667C14.6667 21.9303 15.2637 21.3333 16.0001 21.3333C16.7365 21.3333 17.3334 21.9303 17.3334 22.6667Z"
          fill="#3D3D3D"
        />
        <path
          d="M17.3334 17.3333C17.3334 18.0697 16.7365 18.6667 16.0001 18.6667C15.2637 18.6667 14.6667 18.0697 14.6667 17.3333C14.6667 16.5969 15.2637 16 16.0001 16C16.7365 16 17.3334 16.5969 17.3334 17.3333Z"
          fill="#3D3D3D"
        />
        <path
          d="M10.6667 22.6667C10.6667 23.4031 10.0697 24 9.33333 24C8.59696 24 8 23.4031 8 22.6667C8 21.9303 8.59696 21.3333 9.33333 21.3333C10.0697 21.3333 10.6667 21.9303 10.6667 22.6667Z"
          fill="#3D3D3D"
        />
        <path
          d="M10.6667 17.3333C10.6667 18.0697 10.0697 18.6667 9.33333 18.6667C8.59696 18.6667 8 18.0697 8 17.3333C8 16.5969 8.59696 16 9.33333 16C10.0697 16 10.6667 16.5969 10.6667 17.3333Z"
          fill="#3D3D3D"
        />
      </svg>
    </button>
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
    <input id="calendar-button" bind:this={calendarInputElement} />
  </div>
  <div class="calendar-container" bind:this={calendarContainer} />
</div>

<style>
  .rentals-calendar-container {
    display: flex;
    flex-direction: column;
  }
  .row {
    display: flex;
    align-items: center;
  }
  .row.indent {
    padding-left: 30px;
    position: relative;
  }
  #calendar-button {
    height: 0px;
    outline: none;
    position: relative;
  }
  strong.dates {
    margin-left: 10px;
    font-size: 20px;
    max-width: 300px;
  }
  .date-display {
    border: 1px solid hsl(var(--b3));
    border-radius: 10px;
    padding: 10px 10px;
    color: black;
    width: 100%;
    height: 40px;
    z-index: 100;
    display: flex;
    justify-content: space-evenly;
    margin-top: 4px;
  }
  .calendar-icon {
    margin-right: 10px;
  }
  #calendar-button {
    width: 0;
    position: absolute;
  }
  svg#right-arrow {
    height: 100%;
    width: 20px;
  }
  :global(.easepick-wrapper) {
    position: absolute;
    pointer-events: none;
    top: 80px;
    left: -65px;
    width: 100%;
  }
  @media (max-width: 700px) {
    :global(.easepick-wrapper) {
      position: absolute;
      pointer-events: none;
      top: 25px;
      left: -15%;
      width: 130%;
    }
  }
  @media (min-width: 500px) and (max-width: 1000px) {
  }

  @media (min-width: 1000px) {
  }
</style>
