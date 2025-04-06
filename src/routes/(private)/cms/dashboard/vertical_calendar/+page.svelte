<script lang="ts">
  import { unitStore } from "$lib/stores";
  import type { Booking, Unit } from "$lib/types";

  // Define interfaces for the data structure
  interface ScheduleEntry {
    delivery?: string;
    departure?: string;
    pickup?: string;
    return?: string;
    count?: number;
  }

  interface ScheduleData {
    [date: string]: {
      [unit: string]: ScheduleEntry;
    };
  }

  // Function to transform raw data into scheduleData
  function transformToScheduleData(rawData: Unit[]): ScheduleData {
    const scheduleData: ScheduleData = {};
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 30); // 31 days total, including today

    // Filter bookings for the 31-day window
    const filteredData = rawData.map((unit) => ({
      ...unit,
      bookings: filterBookingsWithinWindow(unit.bookings!, today, endDate),
    }));

    filteredData.forEach((unit) => {
      const unitName = unit.name;
      unit.bookings.forEach((booking: Booking) => {
        const startDate = new Date(booking.start.replace("-", " "));
        const endDate = new Date(booking.end.replace("-", " "));
        const currentDate = new Date(startDate);

        let dayCount = 1;

        while (currentDate <= endDate) {
          const dateStr = currentDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });

          if (!scheduleData[dateStr]) {
            scheduleData[dateStr] = {};
          }

          if (!scheduleData[dateStr][unitName]) {
            scheduleData[dateStr][unitName] = {};
          }

          if (currentDate.toDateString() === startDate.toDateString()) {
            scheduleData[dateStr][unitName].pickup =
              booking.pickup_time?.trim();
          }

          if (currentDate.toDateString() === endDate.toDateString()) {
            scheduleData[dateStr][unitName].return =
              booking.dropoff_time?.trim();
          }

          if (
            currentDate.toDateString() !== startDate.toDateString() &&
            currentDate.toDateString() !== endDate.toDateString()
          ) {
            dayCount++;
            scheduleData[dateStr][unitName].count = dayCount;
          }

          currentDate.setDate(currentDate.getDate() + 1);
        }
      });
    });

    return scheduleData;
  }
  // Generate date range and schedule data
  const dates = generateDateRange();
  const scheduleData = transformToScheduleData($unitStore.units);
  const units = $unitStore.units.map((unit) => unit.name);
  // Create a mapping of unit names to their primary colors with opacity
  const unitColors: { [unitName: string]: string } = {};
  const opacity = 0.2; // Adjust opacity here (0 = fully transparent, 1 = fully opaque)

  $unitStore.units.forEach((unit) => {
    const rgbColor = unit.information.cms_only.color_scheme.primary; // e.g., "rgb(218, 25, 27)"
    // Extract RGB values using a regular expression
    const match = rgbColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const r = match[1]; // e.g., "218"
      const g = match[2]; // e.g., "25"
      const b = match[3]; // e.g., "27"
      // Convert to rgba with opacity
      unitColors[unit.name] = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    } else {
      // Fallback if the color format is invalid
      unitColors[unit.name] = "rgba(200, 200, 200, 0.2)"; // Light gray with opacity
    }
  });

  // Determine today's date in the same format as the dates array
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day
  const todayStr = today.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Compute the grid template columns and rows as inline styles
  $: gridTemplateColumns = `150px repeat(${units.length}, 100px)`;
  $: gridTemplateRows = `33px repeat(${dates.length}, 25px)`;

  // Function to generate a 31-day date range starting from today
  function generateDateRange(): string[] {
    const today = new Date();
    const dates: string[] = [];
    for (let i = 0; i < 31; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      dates.push(
        currentDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      );
    }
    return dates;
  }

  // Helper function to format the date as "day + suffix"
  function formatDateText(dateStr: string) {
    const day = parseInt(dateStr.split(" ")[1], 10); // Get the day (e.g., 18 from "Mar 18, 2025")
    let suffix = "th";
    if (day % 10 === 1 && day !== 11) suffix = "st";
    else if (day % 10 === 2 && day !== 12) suffix = "nd";
    else if (day % 10 === 3 && day !== 13) suffix = "rd";
    return `${day}${suffix}`;
  }

  // Function to filter bookings within the 31-day window
  function filterBookingsWithinWindow(
    bookings: Booking[],
    windowStart: Date,
    windowEnd: Date
  ): Booking[] {
    return bookings.filter((booking) => {
      // Parse booking start and end dates
      const bookingStart = new Date(booking.start.replace("-", " "));
      const bookingEnd = new Date(booking.end.replace("-", " "));

      // Normalize dates to start of day for comparison
      bookingStart.setHours(0, 0, 0, 0);
      bookingEnd.setHours(0, 0, 0, 0);
      windowStart.setHours(0, 0, 0, 0);
      windowEnd.setHours(0, 0, 0, 0);

      // Check if the booking overlaps with the window
      const startsBeforeWindowEnds = bookingStart <= windowEnd;
      const endsAfterWindowStarts = bookingEnd >= windowStart;

      const overlaps = startsBeforeWindowEnds && endsAfterWindowStarts;

      return overlaps;
    });
  }
</script>

<div class="calendar-wrapper overflow-auto">
  <div
    class="calendar-grid"
    style="grid-template-columns: 150px repeat({units.length}, 120px);"
  >
    <!-- Header Row -->
    <div
      class="header-cell sticky top-0 z-20 bg-primary text-white font-bold flex items-center justify-center"
    >
      <!-- Empty cell above dates -->
    </div>
    {#each units as unit}
      <div
        class="header-cell sticky top-0 z-20 bg-primary text-white font-bold flex items-center justify-start overflow-x-auto whitespace-nowrap"
      >
        {unit}
      </div>
    {/each}

    <!-- Data Rows -->
    {#each dates as date}
      <div
        class="date-cell relative bg-gray-200 font-semibold flex items-center justify-center {date ===
        todayStr
          ? 'today-row'
          : ''}"
      >
        {date}
      </div>
      {#each units as unit}
        <div
          class="data-cell relative flex flex-col items-center justify-center gap-1 p-1 border border-gray-300 {date ===
          todayStr
            ? 'today-row'
            : ''}"
          style={scheduleData[date] && scheduleData[date][unit]
            ? `background-color: ${unitColors[unit]};`
            : "background-color: white;"}
        >
          {#if scheduleData[date] && scheduleData[date][unit]}
            {#if scheduleData[date][unit].delivery}
              <span>Delivery {scheduleData[date][unit].delivery}</span>
            {/if}
            {#if scheduleData[date][unit].departure}
              <span>Depart {scheduleData[date][unit].departure}</span>
            {/if}
            {#if scheduleData[date][unit].pickup}
              <span>Pick up {scheduleData[date][unit].pickup}</span>
            {/if}
            {#if scheduleData[date][unit].return}
              <span>Return {scheduleData[date][unit].return}</span>
            {/if}
            {#if scheduleData[date][unit].count}
              <span class="bg-gray-300 text-gray-700 rounded px-1"
                >Day {scheduleData[date][unit].count}</span
              >
            {/if}
          {:else}
            <!-- Subtle date text for blank cells -->
            <span class="text-xs text-gray-500 opacity-30"
              >{formatDateText(date)}</span
            >
          {/if}
        </div>
      {/each}
    {/each}
  </div>
</div>

<style>
  .calendar-wrapper {
    height: 80vh;
    overflow: auto;
  }

  .calendar-grid {
    display: grid;
    grid-auto-rows: 35px;
    gap: 4px;
  }

  .header-cell {
    position: sticky;
    top: 0;
    z-index: 20;
    background-color: #ae2623; /* Primary color */
    color: white;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 35px;
    box-sizing: border-box;
  }

  .date-cell,
  .data-cell {
    position: relative;
    height: 35px;
    box-sizing: border-box;
  }

  .date-cell {
    background-color: #f9fafb;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .data-cell {
    border: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4px;
  }

  .today-row::before,
  .today-row::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background-color: #ae2623;
  }

  .today-row::before {
    top: 0;
  }

  .today-row::after {
    bottom: 0;
  }
</style>
