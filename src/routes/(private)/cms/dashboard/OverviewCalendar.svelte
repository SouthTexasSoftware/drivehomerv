<script lang="ts">
  import { easepick } from "@easepick/bundle";
  import { LockPlugin } from "@easepick/lock-plugin";
  import { onMount } from "svelte";
  import cmsOverviewCalendar from "$lib/styles/cmsOverviewCalendar.css?inline";
  import { unitStore, firebaseStore } from "$lib/stores";

  onMount(() => {
    buildOverviewCalendar();
  });

  let calendarInstance: easepick.Core | undefined;

  async function buildOverviewCalendar() {
    if (!$unitStore.isPopulated) {
      setTimeout(buildOverviewCalendar, 200);
      return;
    }

    let bookedDates = $unitStore.units[0].bookings;

    calendarInstance = new easepick.create({
      element: "#overview-calendar",
      inline: true, // always visible - TODO: change this in mobile only
      css: cmsOverviewCalendar,
      zIndex: 100,
      firstDay: 0, // sets the calendar to have SUNDAY on the left
      plugins: [LockPlugin],
      LockPlugin: {
        filter(date) {
          // return true when booked, false when not..
          //@ts-ignore
          return date.inArray(bookedDates, "[)");
        },
      },
    });
  }
</script>

<div class="calendar-container">
  <div id="overview-calendar" />
  <div class="unit-selection-container">
    {#if $unitStore.isPopulated}
      {#each $unitStore.units as unitObject}
        <button class:active={true}>{unitObject.name}</button>
      {/each}
    {/if}
  </div>
</div>

<style>
  .calendar-container {
    /* background-color: lightcoral; */
    width: 100%;
    padding: 25px;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
  }
  #overview-calendar {
    height: 0;
    color: transparent;
  }
  .unit-selection-container {
    display: flex;
    justify-content: space-around;
    flex-wrap: wrap;
  }
  button {
    border-radius: 10px;
    border: 1px solid hsl(var(--b3));
    padding: 3px 15px;
    margin: 5px 10px;
    background-color: hsl(var(--b1));
    color: hsl(var(--b3));
  }
  button.active {
    color: hsl(var(--n));
  }
</style>
