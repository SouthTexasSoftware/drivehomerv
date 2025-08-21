<script lang="ts">
  import * as easepickPkg from '@easepick/bundle';
  const {easepick , RangePlugin, LockPlugin, DateTime} = easepickPkg;
  import type { Booking, BookingDisplayFilter, Unit } from "$lib/types";
  import { onMount } from "svelte";
  import { afterNavigate } from "$app/navigation";
  import { cmsBookingFilterStore, unitStore } from "$lib/stores";
  import { fade, fly } from "svelte/transition";

  // initial values that get manipulated if the month is navigated
  let date = new Date();
  let year = date.getFullYear();
  let month = date.getMonth();

  let today = new DateTime(); // unlike above, should not get manipulated i.e. readonly

  let generatedDatesContainer: HTMLElement;
  let backButton: HTMLSpanElement;
  let forwardButton: HTMLSpanElement;
  let monthYearElement: HTMLElement;

  interface DayIcon {
    value: number;
    isToday: boolean;
    unitEntries: UnitBookingPiece[];
  }

  interface UnitBookingPiece {
    color: string;
    unit_id: string;
    pickup: {
      bool: boolean;
      id: string;
    };
    dropoff: {
      bool: boolean;
      id: string;
    };
    inBooking: {
      bool: boolean;
      id: string;
    };
    filter: BookingDisplayFilter;
  }

  let daysShowingArray: DayIcon[];
  let daysFullArray: DayIcon[];
  let loadedDays = false;
  let pastBookingsLoaded = false;
  // Array of month names
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  onMount(generateWeek);
  afterNavigate(generateWeek);

  cmsBookingFilterStore.subscribe(async (storeData) => {
    if (storeData) {
      if (storeData.past && !pastBookingsLoaded) {
        pastBookingsLoaded = true;
        generateCalendar();
        return;
      }
      if (daysFullArray) {
        filterDaysShowingArray(storeData);
      }
    }
  });

  // Navigate by weeks instead of months
  function navigateWeeks(previous: boolean) {
    // Adjust the date by 7 days (1 week)
    const currentDate = new Date(date);
    const daysToAdjust = previous ? -7 : 7;
    currentDate.setDate(currentDate.getDate() + daysToAdjust);

    // Update year, month, and date based on the new date
    year = currentDate.getFullYear();
    month = currentDate.getMonth();
    date = currentDate;

    // Generate the new week
    generateWeek();
  }

  // Generate a week's worth of days
  function generateWeek() {
    daysFullArray = [];
    daysShowingArray = [];
    loadedDays = false;

    if (!monthYearElement) return;

    // Get the start of the week (Sunday) based on the current date
    const currentDate = new Date(date);
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - dayOfWeek); // Move to Sunday

    // Define today for comparison
    const today = new DateTime();

    // Generate 7 days starting from the start of the week
    for (let i = 0; i < 7; i++) {
      const dateReviewing = new Date(startOfWeek);
      dateReviewing.setDate(startOfWeek.getDate() + i);
      const dateTimeReviewing = new DateTime(dateReviewing);

      // Check if this day is today
      const isToday =
        dateReviewing.getDate() === new Date().getDate() &&
        dateReviewing.getMonth() === new Date().getMonth() &&
        dateReviewing.getFullYear() === new Date().getFullYear();

      // Create day object
      const dayObject = {
        value: dateReviewing.getDate(),
        isToday,
        unitEntries: [],
      } as DayIcon;

      // Populate unit entries for this day
      $unitStore.units.forEach((unit) => {
        const unitBookingPiece = {
          color: unit.information.cms_only.color_scheme.primary,
          unit_id: unit.id,
          pickup: { bool: false, id: "" },
          dropoff: { bool: false, id: "" },
          inBooking: { bool: false, id: "" },
          filter: { past: false, ongoing: false, upcoming: false },
        };

        unit.bookings?.forEach((booking) => {
          const startDate = new DateTime(booking.start, "MMM-DD-YYYY");
          const endDate = new DateTime(booking.end, "MMM-DD-YYYY");

          // Skip if the day is outside the booking range
          if (
            dateTimeReviewing.isBefore(startDate) ||
            dateTimeReviewing.isAfter(endDate)
          ) {
            return;
          }

          // Set booking flags
          if (
            startDate.isBefore(dateTimeReviewing) &&
            endDate.isAfter(dateTimeReviewing)
          ) {
            unitBookingPiece.inBooking.bool = true;
            unitBookingPiece.inBooking.id = booking.id;
          }
          if (startDate.isSame(dateTimeReviewing)) {
            unitBookingPiece.pickup.bool = true;
            unitBookingPiece.pickup.id = booking.id;
          }
          if (endDate.isSame(dateTimeReviewing)) {
            unitBookingPiece.dropoff.bool = true;
            unitBookingPiece.dropoff.id = booking.id;
          }

          // Set filter flags
          if (today.isAfter(startDate) && today.isBefore(endDate)) {
            unitBookingPiece.filter.ongoing = true;
          }
          if (today.isSame(startDate) || today.isSame(endDate)) {
            unitBookingPiece.filter.ongoing = true;
          }
          if (today.isAfter(endDate)) {
            unitBookingPiece.filter.past = true;
          }
          if (today.isBefore(startDate)) {
            unitBookingPiece.filter.upcoming = true;
          }
        });

        dayObject.unitEntries.push(unitBookingPiece);
      });

      daysFullArray.push(dayObject);
    }

    // Update the month/year display (e.g., "Apr 5 - Apr 11, 2025")
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const startMonth = months[startOfWeek.getMonth()];
    const endMonth = months[endOfWeek.getMonth()];
    const yearDisplay =
      startOfWeek.getFullYear() === endOfWeek.getFullYear()
        ? startOfWeek.getFullYear()
        : `${startOfWeek.getFullYear()} - ${endOfWeek.getFullYear()}`;
    monthYearElement.innerText = `${startMonth} ${startOfWeek.getDate()} - ${endMonth} ${endOfWeek.getDate()}, ${yearDisplay}`;

    // Apply filters and mark as loaded
    filterDaysShowingArray($cmsBookingFilterStore);
    loadedDays = true;
  }

  // this doesn't work for some reason after the Past Bookings get loaded in to the mix.
  // updates the days showing array based on the filter, has to comb through the full days array and produce a modified copy
  function filterDaysShowingArray(filter: BookingDisplayFilter) {
    daysShowingArray = daysFullArray.map((day) => {
      let dayCopy = structuredClone(day);

      dayCopy.unitEntries.forEach((unitEntry) => {
        // if the filter is not active, and this entry falls in that filter, temporarily hide it...
        if (!filter.past && unitEntry.filter.past) {
          unitEntry.dropoff.bool = false;
          unitEntry.pickup.bool = false;
          unitEntry.inBooking.bool = false;
        }
        if (!filter.ongoing && unitEntry.filter.ongoing) {
          unitEntry.dropoff.bool = false;
          unitEntry.pickup.bool = false;
          unitEntry.inBooking.bool = false;
        }
        if (!filter.upcoming && unitEntry.filter.upcoming) {
          unitEntry.dropoff.bool = false;
          unitEntry.pickup.bool = false;
          unitEntry.inBooking.bool = false;
        }

        //check if unitEntry should be visible based on displayFilterStore
        $cmsBookingFilterStore.units.forEach((unit) => {
          if (unit.id == unitEntry.unit_id) {
            if (!unit.visible) {
              unitEntry.dropoff.bool = false;
              unitEntry.pickup.bool = false;
              unitEntry.inBooking.bool = false;
            }
          }
        });
      });

      return dayCopy;
    });
  }

  function filterUnit(id: string) {
    // console.log("filter unit called");
    cmsBookingFilterStore.update((storeData) => {
      storeData.units.forEach((unitEntry) => {
        if (unitEntry.id == id) {
          unitEntry.visible = !unitEntry.visible;
        }
      });

      return storeData;
    });
    filterDaysShowingArray($cmsBookingFilterStore);
  }
</script>

<div class="unit-toggles">
  {#if cmsBookingFilterStore}
    {#each $cmsBookingFilterStore.units as unit}
      {#if unit.visible}
        <button
          class="unit-toggle"
          style="background-color:{unit.color}; border-color:{unit.color}"
          on:click={() => {
            filterUnit(unit.id);
          }}>{unit.name}</button
        >
      {:else}
        <button
          class="unit-toggle"
          style="background-color:rgb(230, 230, 230); border-color: rgb(212, 212, 212);"
          on:click={() => {
            filterUnit(unit.id);
          }}>{unit.name}</button
        >
      {/if}
    {/each}
  {/if}
</div>
<section class="bookings-calendar-container">
  <div class="calendar-header">
    <p class="current-month" bind:this={monthYearElement} in:fly={{ y: 10 }}>
      Month Year
    </p>
    <div class="calendar-navigation">
      <button
        id="calendar-prev"
        class="arrow-container"
        bind:this={backButton}
        on:click={() => {
          loadedDays = false;
          setTimeout(() => {
            navigateWeeks(true);
          }, 100);
        }}
      >
        <svg
          class="chevron-arrow left"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15 6L9 12L15 18"
            stroke="#000000"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <button
        id="calendar-next"
        class="arrow-container"
        bind:this={forwardButton}
        on:click={() => {
          loadedDays = false;
          setTimeout(() => {
            navigateWeeks(false);
          }, 100);
        }}
      >
        <svg
          class="chevron-arrow right"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 6L15 12L9 18"
            stroke="#000000"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>
  </div>
  <div class="calendar-body">
    <ul class="calendar-weekdays">
      <li>Sun</li>
      <li>Mon</li>
      <li>Tue</li>
      <li>Wed</li>
      <li>Thu</li>
      <li>Fri</li>
      <li>Sat</li>
    </ul>
    {#if loadedDays}
      <ul class="calendar-dates" bind:this={generatedDatesContainer}>
        <!-- generated items -->
        {#each daysShowingArray as day}
          <li class:is-today={day?.isToday} in:fly={{ y: 10 }}>
            <p class="day-value">
              {day.value}
            </p>
            <div class="booking-piece-container">
              {#each day.unitEntries as unitBookingPiece}
                {#if unitBookingPiece.inBooking.bool}
                  <div
                    class="unit-booking-row in-booking"
                    style="background-color:{unitBookingPiece.color}"
                    data-id={unitBookingPiece.inBooking.id}
                  ></div>
                {:else}
                  <!-- if not inside a booking, we replace with two empties or a pickup/dropoff -->
                  {#if unitBookingPiece.dropoff.bool}
                    <div
                      class="unit-booking-row dropoff"
                      style="background-color:{unitBookingPiece.color}"
                      data-id={unitBookingPiece.dropoff.id}
                    ></div>
                  {:else}
                    <div class="unit-booking-row empty"></div>
                  {/if}
                  {#if unitBookingPiece.pickup.bool}
                    <div
                      class="unit-booking-row pickup"
                      style="background-color:{unitBookingPiece.color}"
                      data-id={unitBookingPiece.pickup.id}
                    ></div>
                  {:else}
                    <div class="unit-booking-row empty"></div>
                  {/if}
                {/if}
              {/each}
            </div>
          </li>
        {/each}
      </ul>
    {:else}
      <div class="spinner"></div>
      <div class="spinner-label">Building Week...</div>
    {/if}
  </div>
</section>

<style>
  .bookings-calendar-container {
    background: #fff;
    width: 800px;
    border-radius: 10px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
    margin: 30px auto auto;
    height: 300px;
  }

  .unit-toggles {
    display: flex;
    width: 100%;
    justify-content: space-around;
    margin-top: auto;
    flex-wrap: wrap;
    padding: 0 80px;
  }
  .unit-toggle {
    font-family: cms-semibold;
    padding: 3px 20px;
    margin-bottom: 10px;
    border-radius: 10px;
    border: 2px solid grey;
    transition: all 0.4s;
  }

  .bookings-calendar-container .calendar-header {
    display: flex;
    align-items: center;
    padding: 20px 30px 10px;
    justify-content: space-between;
  }

  .calendar-header .calendar-navigation {
    display: flex;
  }

  .calendar-header .calendar-navigation button {
    height: 35px;
    width: 35px;
    margin: 0 1px;
    cursor: pointer;
    text-align: center;
    line-height: 35px;
    border-radius: 50%;
    user-select: none;
    color: #aeabab;
    font-size: 1.9rem;
  }

  .calendar-navigation button:last-child {
    margin-right: -10px;
  }

  .calendar-header .calendar-navigation button:hover {
    background: #f2f2f2;
  }

  .calendar-header .current-month {
    font-weight: 500;
    font-size: 1.45rem;
  }

  .calendar-body {
    padding: 20px;
    padding-top: 0px;
  }

  .calendar-body ul {
    list-style: none;
    flex-wrap: wrap;
    display: flex;
    text-align: center;
  }

  .calendar-body .calendar-dates {
    margin-bottom: 20px;
    height: 220px;
    position: relative;
  }

  .calendar-body li {
    width: calc(100% / 7);
    font-size: 1.07rem;
    color: #414141;
    font-family: font-bold;
  }
  .calendar-body li.is-today {
    border: 1px solid var(--p);
  }

  .calendar-body .calendar-weekdays li {
    cursor: default;
    font-weight: 500;
    font-family: font-medium;
  }

  .calendar-body .calendar-dates li {
    z-index: 1;
    cursor: pointer;
    height: 80%;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: start;
    border-top: 1px solid var(--b2);
  }

  .calendar-body .calendar-dates li.is-today {
    border: 1px solid var(--p);
  }
  .day-value {
    font-family: font-regular;
    z-index: 1;
  }
  /* overlay inside the day div */
  .booking-piece-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    row-gap: 1px;
    padding-top: 1px;
    padding-bottom: 1px;
  }
  /* inherit by all 'pieces' that could contain a booking */
  .unit-booking-row {
    opacity: 100%;
    height: 15px;
  }
  .unit-booking-row.in-booking {
    /* fill entire row i.e. take up all the columns */
    grid-column: 1 / 3;
  }
  .unit-booking-row.pickup {
    filter: brightness(0.8);
    border-bottom-left-radius: 50%;
    border-top-left-radius: 50%;
  }
  .unit-booking-row.dropoff {
    filter: brightness(0.8);
    border-bottom-right-radius: 50%;
    border-top-right-radius: 50%;
  }

  .arrow-container {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .chevron-arrow {
    width: 25px;
    height: 25px;
    transform: translateX(-2px);
  }
  .chevron-arrow.right {
    transform: translateX(2px);
  }
  .spinner {
    content: "";
    border-radius: 50%;
    border-top: 2px solid var(--p);
    border-right: 2px solid transparent;
    animation-name: spinning;
    animation-duration: 1s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    opacity: 1;
    transition: all 0.2s;
    width: 50px;
    height: 50px;
    margin: auto;
    margin-top: 50px;
  }
  .spinner-label {
    margin: auto;
    font-family: cms-light;
    font-size: 12px;
    width: 120px;
    margin-top: 20px;
    text-align: center;
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
    .unit-toggles {
      padding: 0;
      margin-top: 25px;
      display: none;
    }
    .unit-toggle {
      padding: 1px 5px;
      font-size: 13px;
    }
    .bookings-calendar-container {
      height: 45vh;
      width: 95vw;
      margin-top: 1vh;
      margin-left: 2.5vw;
    }
    .bookings-calendar-container .calendar-header {
      padding: 5px 15px 0px;
      font-size: 15px;
    }
    .calendar-header .current-month {
      font-size: 18px;
    }
    .calendar-body {
      padding: 10px;
    }
    .calendar-body .calendar-dates {
      margin-bottom: 0;
    }
    .calendar-body .calendar-dates li {
      height: 5.5vh;
    }
    .spinner {
      margin-top: 10vh;
    }
  }
</style>
