<script lang="ts">
  import { unitStore } from "$lib/stores";
  import type { Booking, Unit } from "$lib/types";

  let jsonData: string;

  unitStore.subscribe((storeData) => {
    jsonData = JSON.stringify(storeData.units);
  });

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

  function copyJson() {
    navigator.clipboard
      .writeText(jsonData)
      .then(() => {
        alert("Data has been copied to the clipboard as JSON!");
      })
      .catch((err) => {
        console.error("Failed to copy to clipboard:", err);
        alert(
          "Failed to copy data to clipboard. Check the console for details or use the download option."
        );
      });
  }
</script>

<!-- <button class="fixed bottom-4 right-4" on:click={copyJson}>Copy JSON</button> -->

<div
  class="calendar grid gap-1 border border-gray-500 text-center text-xs font-sans"
  style="grid-template-columns: {gridTemplateColumns}; grid-template-rows: {gridTemplateRows};"
>
  <!-- Headers -->
  <div class="header bg-primary text-white font-bold sticky top-0 z-10"></div>
  {#each units as unit}
    <div
      class="header bg-primary text-white font-bold text-lg sticky top-0 z-10"
    >
      {unit}
    </div>
  {/each}

  <!-- Rows for each date -->
  {#each dates as date, rowIndex}
    <div
      class="date-header bg-gray-200 font-semiibold text-md sticky left-0 z-10"
      style="{date === todayStr
        ? 'border-top: 2px solid #ae2623; border-bottom: 2px solid #ae2623;'
        : ''}
      "
    >
      {date}
    </div>
    {#each units as unit, colIndex}
      <div
        class="cell flex flex-col items-center justify-center gap-1 p-1 border border-gray-300"
        style="{scheduleData[date] && scheduleData[date][unit]
          ? `background-color: ${unitColors[unit]};`
          : 'background-color: white;'} 

          {date === todayStr
          ? 'border-top: 2px solid #ae2623; border-bottom: 2px solid #ae2623;'
          : ''}"
      >
        {#if scheduleData[date] && scheduleData[date][unit]}
          {#if scheduleData[date][unit].delivery}
            <span class="delivery"
              >Delivery {scheduleData[date][unit].delivery}</span
            >
          {/if}
          {#if scheduleData[date][unit].departure}
            <span class="departure"
              >Depart {scheduleData[date][unit].departure}</span
            >
          {/if}
          {#if scheduleData[date][unit].pickup}
            <span class="pickup">Pick up {scheduleData[date][unit].pickup}</span
            >
          {/if}
          {#if scheduleData[date][unit].return}
            <span class="return">Return {scheduleData[date][unit].return}</span>
          {/if}
          {#if scheduleData[date][unit].count}
            <span class="count bg-gray-300 text-gray rounded px-1"
              >Day {scheduleData[date][unit].count}</span
            >
          {/if}
        {/if}
      </div>
    {/each}
  {/each}
</div>
