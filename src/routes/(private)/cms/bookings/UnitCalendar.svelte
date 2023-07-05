<script lang="ts">
  import { easepick } from "@easepick/bundle";
  import { LockPlugin } from "@easepick/lock-plugin";
  import { onMount } from "svelte";
  import cmsUnitCalendar from "$lib/styles/cmsUnitCalendar.css?inline";
  import type { Unit } from "$lib/types";

  onMount(() => {
    buildOverviewCalendar();
  });

  export let unitObj: Unit;
  let uniqueCssId = unitObj.id.replace(/[0-9]/g, "");

  let calendarInstance: easepick.Core | undefined;

  async function buildOverviewCalendar() {
    let bookedDates = unitObj.bookings;

    calendarInstance = new easepick.create({
      element: "#" + uniqueCssId,
      inline: true, // always visible - TODO: change this in mobile only
      css: cmsUnitCalendar,
      zIndex: 100,
      firstDay: 0, // sets the calendar to have SUNDAY on the left
      plugins: [LockPlugin],
      LockPlugin: {
        filter(date) {
          // return true when booked, false when not..

          try {
            //@ts-ignore
            return date.inArray(bookedDates, "[)");
          } catch (err) {}
        },
      },
    });
  }
</script>

<div class="calendar-container">
  <h3>{unitObj.name}</h3>
  <div id={uniqueCssId} style="height: 0; color: transparent;" />
</div>

<style>
  .calendar-container {
    /* background-color: lightcoral; */
    padding: 25px;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 350px;
    z-index: 1;
  }
  #unit-calendar {
    height: 0;
    color: transparent;
  }
  h3 {
    background-color: hsl(var(--b1));
    width: 100%;
    text-align: center;
    border-radius: 4px;
    box-shadow: 0 1px 2px grey;
    margin-bottom: 3px;
  }
</style>
