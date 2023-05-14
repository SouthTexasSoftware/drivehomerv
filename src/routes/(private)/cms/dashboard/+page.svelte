<script lang="ts">
  import UnitsTable from "../units/UnitsTable.svelte";
  import NewBooking from "./NewBooking.svelte";
  import NewUnit from "./NewUnit.svelte";
  import OverviewCalendar from "./OverviewCalendar.svelte";

  let newBookingKey = false;
  let newUnitKey = false;
</script>

<div class="dashboard-container">
  <div class="utilities-column">
    <!-- <p>Tools and Info</p> -->
    <!-- New Booking -->
    {#key newBookingKey}
      <NewBooking on:refresh={() => (newBookingKey = !newBookingKey)} />
    {/key}
    <!-- eventually Active Requests, Upcoming Events, etc -->
    <UnitsTable />
  </div>

  <div class="calendar-view">
    <!-- <OverviewCalendar /> -->
    {#key newUnitKey}
      <NewUnit on:refresh={() => (newUnitKey = !newUnitKey)} />
    {/key}
  </div>
</div>

<style>
  .dashboard-container {
    /* background-color: lightblue; */
    width: 100%;
    padding: 25px;
    margin-left: 25px;
    display: flex;
  }
  .utilities-column {
    flex-basis: 600px;
    padding: 25px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
  }
  :global(.utilities-column div) {
    margin-bottom: 25px;
  }
  .calendar-view {
    flex-grow: 2;
    padding: 25px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>
