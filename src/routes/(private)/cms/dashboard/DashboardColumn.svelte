<script lang="ts">
  import { page } from "$app/stores";
</script>

<div class="dashboard-selection-container">
  <h2>Dashboards</h2>
  <div class="divider" />
  <div id="dashboard-links" class="flex flex-col gap-6">
    <a
      href="/cms/dashboard/revenue_reports"
      class:active={$page.url.pathname.includes("revenue_reports")}
    >
      Revenue Reports
    </a>
    <a
      href="/cms/dashboard/vertical_calendar"
      class:active={$page.url.pathname.includes("vertical_calendar")}
    >
      Vertical Calendar
    </a>
  </div>
</div>

<style>
  .dashboard-selection-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--cms-boxShadow);
    width: 250px;
  }

  h2 {
    font-family: cms-bold;
    color: var(--cms-text);
    font-size: 24px;
    margin: 100px 20px 0px 20px;
  }
  .divider {
    margin: 0 0 20px 20px;
    width: 50px;
    height: 2px;
  }
  a {
    font-family: cms-medium;
    color: var(--cms-text);
    padding: 10px 40px 10px 20px;
    width: 250px;
    transition: all 0.3s;
  }
  a.active {
    background-color: var(--cms-highlightPrimary);
    border-right: 3px solid var(--p);
  }

  @media (max-width: 1000px) {
    .dashboard-selection-container {
      height: 51px;
      display: flex;
      flex-direction: row;
      border: none;
      border-left: 2px solid var(--cms-boxShadow);
      border-top: 1px solid var(--cms-boxShadow);
      width: 50vw;
      position: fixed;
      bottom: 60px;
      right: 0;
      background-color: transparent;
      overflow: scroll;
      scroll-snap-type: x mandatory;
      z-index: 10;
    }
    h2,
    .divider {
      display: none;
    }
  }
</style>
