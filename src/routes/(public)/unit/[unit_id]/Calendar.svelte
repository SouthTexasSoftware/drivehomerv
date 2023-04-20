<script lang="ts">
  import { easepick } from "@easepick/bundle";
  import { DateTime } from "@easepick/datetime";
  import { RangePlugin } from "@easepick/range-plugin";
  import { LockPlugin } from "@easepick/lock-plugin";
  import { onMount } from "svelte";
  import basicCalendarCss from "$lib/styles/basicCalendar.css?inline";
  import rangeCalendarCss from "$lib/styles/rangeCalendar.css?inline";

  onMount(() => {
    buildHotelCalendarExample();

    // const picker = new easepick.create({
    //   element: "#calendar",
    //   zIndex: 10,
    //   inline: true,
    //   css: basicCalendarCss,
    // });
  });

  function buildHotelCalendarExample() {
    // const DateTime = easepick.DateTime;
    const bookedDates = [
      "2023-04-02",
      ["2023-04-06", "2023-04-11"],
      "2023-04-18",
      "2023-04-19",
      "2023-04-20",
      "2023-04-25",
      "2023-04-28",
    ].map((d) => {
      if (d instanceof Array) {
        const start = new DateTime(d[0], "YYYY-MM-DD");
        const end = new DateTime(d[1], "YYYY-MM-DD");

        return [start, end];
      }

      return new DateTime(d, "YYYY-MM-DD");
    });

    const picker = new easepick.create({
      element: "#calendar",
      inline: true,
      css: basicCalendarCss,
      firstDay: 0,
      plugins: [RangePlugin, LockPlugin],
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
        minDate: new Date(),
        minDays: 2,
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
</script>

<input id="calendar" />

<div class="catch-paragraph">
  <strong class="catch-paragraph">Simple Rental Process</strong>
  <p class="catch-paragraph">
    Pay only 50% of the booking value now and the rest 14 days before your trip.
  </p>
</div>

<style>
  #calendar {
    height: 0;
  }
  div.catch-paragraph {
    margin-top: 10px;
    position: absolute;
    bottom: 15px;
  }
  strong.catch-paragraph {
    font-size: 20px;
  }
  p.catch-paragraph {
    padding: 0 10px;
  }
  @media (max-width: 500px) {
    div.catch-paragraph {
      width: 100%;
      padding: 0 25px;
    }
  }

  @media (min-width: 500px) and (max-width: 1000px) {
  }

  @media (min-width: 1000px) {
  }
</style>
