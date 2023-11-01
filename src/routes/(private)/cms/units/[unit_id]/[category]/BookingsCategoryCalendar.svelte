<script lang="ts">
  import { DateTime } from "@easepick/bundle";
  import type { Unit } from "$lib/types";
  import { onMount } from "svelte";
  import { afterNavigate } from "$app/navigation";
  import { cmsStore, unitStore } from "$lib/stores";

  export let unitObject: Unit;

  let date = new Date();
  let year = date.getFullYear();
  let month = date.getMonth();

  let generatedDatesContainer: HTMLElement;
  let backButton: HTMLSpanElement;
  let forwardButton: HTMLSpanElement;
  let monthYearElement: HTMLElement;

  interface DayIcon {
    value: number;
    pickup: boolean;
    dropoff: boolean;
    inBooking: boolean;
    booking_id?: string;
    isToday?: boolean;
    bookingColor?: string;
    pickupColor?: string;
    dropoffColor?: string;
  }
  //TODO: add in some error/displayed problem when a date is double booked

  let daysArrayShowing: [DayIcon];
  let loadedDays = false;
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

  // retro colors with %50 opacity
  const colorPalette = [
    "rgba(218, 102, 27, 0.5)",
    "rgb(224, 112, 120, 0.5)",
    "rgb(94, 194, 191, 0.5)",
    "rgb(242, 196, 47, 0.5)",
  ];

  onMount(() => {
    generateCalendar();
    cmsStore.subscribe(() => {
      if (loadedDays) {
        generateCalendar();
      }
    });
  });

  afterNavigate(generateCalendar);

  function navigateMonths(previous: boolean) {
    // Check if the icon is "calendar-prev"
    // or "calendar-next"
    if (previous) {
      month = month - 1;
    } else {
      month = month + 1;
    }

    console.log("new month value == ", month);

    // Check if the month is out of range
    if (month < 0 || month > 11) {
      // Set the date to the first day of the
      // month with the new year
      date = new Date(year, month, new Date().getDate());

      // Set the year to the new year
      year = date.getFullYear();

      // Set the month to the new month
      month = date.getMonth();
    } else {
      // Set the date to the current date
      date = new Date();
    }

    // Call the manipulate function to
    // update the calendar display
    generateCalendar();
  }

  function generateCalendar() {
    //@ts-ignore
    daysArrayShowing = [];
    loadedDays = false;

    if (!unitObject) return;
    if (!monthYearElement) return;

    // adding 'Date' object to each booking
    let bookingsArray = unitObject.bookings?.map((booking) => {
      let usableBookingObject = booking;
      //@ts-ignore
      usableBookingObject.startDate = new DateTime(
        booking.start,
        "MMM-DD-YYYY"
      );
      //@ts-ignore
      usableBookingObject.endDate = new DateTime(booking.end, "MMM-DD-YYYY");
      return usableBookingObject;
    });

    // Get the first day of the month
    let dayone = new Date(year, month, 1).getDay(); // day of the week

    // Get the last date of the month
    let lastdate = new Date(year, month + 1, 0).getDate();

    // Get the day of the last date of the month
    let dayend = new Date(year, month, lastdate).getDay();

    // Get the last date of the previous month
    let monthlastdate = new Date(year, month, 0).getDate();

    // PREVIOUS MONTH DATES included in the first 7 day row
    for (let i = dayone; i > 0; i--) {
      let dateReviewing = new Date(year, month - 1, monthlastdate - i + 1);
      let dateTimeReviewing = new DateTime(dateReviewing);
      let pickupBool = false;
      let dropoffBool = false;
      let inBookingBool = false;

      let bookingColorString = "";
      let pickupColorString = "";
      let dropoffColorString = "";

      //compare the date reviewing to all the bookings start & end
      bookingsArray?.forEach((booking, index) => {
        let colorPaletteIndex = index;
        let subtractionModifier = 4 * Math.floor(index / 4);
        if (subtractionModifier > 0) {
          colorPaletteIndex = index - subtractionModifier;
        }
        if (
          booking.startDate?.isBefore(dateTimeReviewing) &&
          booking.endDate?.isAfter(dateTimeReviewing)
        ) {
          inBookingBool = true;
          bookingColorString = colorPalette[colorPaletteIndex];
        }
        if (booking.startDate?.isSame(dateTimeReviewing)) {
          pickupBool = true;
          pickupColorString = colorPalette[colorPaletteIndex];
        }
        if (booking.endDate?.isSame(dateTimeReviewing)) {
          dropoffBool = true;
          dropoffColorString = colorPalette[colorPaletteIndex];
        }
      });

      daysArrayShowing.push({
        value: monthlastdate - i + 1,
        pickup: pickupBool,
        dropoff: dropoffBool,
        inBooking: inBookingBool,
        isToday: false,
        bookingColor: bookingColorString,
        pickupColor: pickupColorString,
        dropoffColor: dropoffColorString,
      });
    }

    // Loop to add the dates of the current month
    for (let i = 1; i <= lastdate; i++) {
      // Check if the current date is today
      let isToday =
        i === date.getDate() &&
        month === new Date().getMonth() &&
        year === new Date().getFullYear()
          ? true
          : false;

      let dateReviewing = new Date(year, month, i);
      let dateTimeReviewing = new DateTime(dateReviewing);
      let pickupBool = false;
      let dropoffBool = false;
      let inBookingBool = false;
      let bookingColorString = "";
      let pickupColorString = "";
      let dropoffColorString = "";

      //compare the date reviewing to all the bookings start & end
      bookingsArray?.forEach((booking, index) => {
        let colorPaletteIndex = index;
        let subtractionModifier = 4 * Math.floor(index / 4);
        if (subtractionModifier > 0) {
          colorPaletteIndex = index - subtractionModifier;
        }
        if (
          booking.startDate?.isBefore(dateTimeReviewing) &&
          booking.endDate?.isAfter(dateTimeReviewing)
        ) {
          inBookingBool = true;
          bookingColorString = colorPalette[colorPaletteIndex];
        }
        if (booking.startDate?.isSame(dateTimeReviewing)) {
          pickupBool = true;
          pickupColorString = colorPalette[colorPaletteIndex];
        }
        if (booking.endDate?.isSame(dateTimeReviewing)) {
          dropoffBool = true;
          dropoffColorString = colorPalette[colorPaletteIndex];
        }
      });

      daysArrayShowing.push({
        value: i,
        pickup: pickupBool,
        dropoff: dropoffBool,
        inBooking: inBookingBool,
        isToday: isToday,
        bookingColor: bookingColorString,
        pickupColor: pickupColorString,
        dropoffColor: dropoffColorString,
      });
    }

    // Loop to add the first dates of the next month
    for (let i = dayend; i < 6; i++) {
      let dateReviewing = new Date(year, month + 1, i - dayend + 1);
      let dateTimeReviewing = new DateTime(dateReviewing);
      let pickupBool = false;
      let dropoffBool = false;
      let inBookingBool = false;
      let bookingColorString = "";
      let pickupColorString = "";
      let dropoffColorString = "";

      //compare the date reviewing to all the bookings start & end
      bookingsArray?.forEach((booking, index) => {
        let colorPaletteIndex = index;
        let subtractionModifier = 4 * Math.floor(index / 4);
        if (subtractionModifier > 0) {
          colorPaletteIndex = index - subtractionModifier;
        }
        if (
          booking.startDate?.isBefore(dateTimeReviewing) &&
          booking.endDate?.isAfter(dateTimeReviewing)
        ) {
          inBookingBool = true;
          bookingColorString = colorPalette[colorPaletteIndex];
        }
        if (booking.startDate?.isSame(dateTimeReviewing)) {
          pickupBool = true;
          pickupColorString = colorPalette[colorPaletteIndex];
        }
        if (booking.endDate?.isSame(dateTimeReviewing)) {
          dropoffBool = true;
          dropoffColorString = colorPalette[colorPaletteIndex];
        }
      });

      daysArrayShowing.push({
        value: i - dayend + 1,
        pickup: pickupBool,
        dropoff: dropoffBool,
        inBooking: inBookingBool,
        isToday: false,
        bookingColor: bookingColorString,
        pickupColor: pickupColorString,
        dropoffColor: dropoffColorString,
      });
    }

    // Update the text of the current date element
    // with the formatted current month and year
    monthYearElement.innerText = `${months[month]} ${year}`;

    loadedDays = true;
  }
</script>

<section class="bookings-calendar-container">
  <div class="calendar-header">
    <p class="current-month" bind:this={monthYearElement}>Month Year</p>
    <div class="calendar-navigation">
      <button
        id="calendar-prev"
        class="arrow-container"
        bind:this={backButton}
        on:click={() => navigateMonths(true)}
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
        on:click={() => navigateMonths(false)}
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
    <ul class="calendar-dates" bind:this={generatedDatesContainer}>
      <!-- generated items -->
      {#if loadedDays}
        {#each daysArrayShowing as day}
          <li class:is-today={day?.isToday}>
            <p
              class="day-value"
              class:in-booking={day?.inBooking}
              class:pickup={day?.pickup}
              class:dropoff={day?.dropoff}
            >
              {day.value}
            </p>
            {#if day?.inBooking}
              <div
                class="overlay in-booking"
                style="background-color:{day?.bookingColor};"
              />
            {/if}
            {#if day?.pickup}
              <div
                class="overlay pickup"
                style="border-top-color:{day?.pickupColor};"
              />
            {/if}
            {#if day?.dropoff}
              <div
                class="overlay dropoff"
                style="border-bottom-color:{day?.dropoffColor};"
              />
            {/if}
          </li>
        {/each}
      {/if}
    </ul>
  </div>
</section>

<style>
  .bookings-calendar-container {
    background: #fff;
    width: 450px;
    border-radius: 10px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  }

  .bookings-calendar-container .calendar-header {
    display: flex;
    align-items: center;
    padding: 25px 30px 10px;
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
  }

  .calendar-body ul {
    list-style: none;
    flex-wrap: wrap;
    display: flex;
    text-align: center;
  }

  .calendar-body .calendar-dates {
    margin-bottom: 20px;
  }

  .calendar-body li {
    width: calc(100% / 7);
    font-size: 1.07rem;
    color: #414141;
    font-family: font-bold;
    border-radius: 4px;
  }
  .calendar-body li.is-today {
    border: 1px solid hsl(var(--p));
  }

  .calendar-body .calendar-weekdays li {
    cursor: default;
    font-weight: 500;
    font-family: font-medium;
  }

  .calendar-body .calendar-dates li {
    margin-top: 5px;
    z-index: 1;
    cursor: pointer;
    height: 50px;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .calendar-dates li div.in-booking {
    background-color: hsl(var(--b2));
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
  }
  .calendar-dates li div.pickup {
    width: 0;
    height: 0;
    border-top: 50px solid hsl(var(--b2));
    border-left: 50px solid transparent;
    position: absolute;
    top: 0;
    right: 0;
  }
  .calendar-dates li div.dropoff {
    width: 0;
    height: 0;
    border-bottom: 50px solid hsl(var(--b2));
    border-right: 50px solid transparent;
    position: absolute;
    top: 0;
    left: 0;
  }
  .day-value {
    font-family: font-regular;
    z-index: 1;
  }
  .day-value.in-booking,
  .day-value.pickup,
  .day-value.dropoff {
    color: var(--cms-text);
    font-family: font-medium;
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

  @media (max-width: 500px) {
    .bookings-calendar-container {
      width: 100%;
    }
  }
</style>
