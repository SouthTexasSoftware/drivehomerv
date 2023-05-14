<script lang="ts">
  import { page } from "$app/stores";
</script>

<div class="menu-container">
  <h2>DriveHome RV CMS</h2>
  <div class="divider" />
  <a href="/cms/dashboard" class:active={$page.url.pathname == "/cms/dashboard"}
    >Dashboard</a
  >
  <a href="/cms/bookings" class:active={$page.url.pathname == "/cms/bookings"}
    >Bookings</a
  >
  <a href="/cms/units" class:active={$page.url.pathname == "/cms/units"}
    >Units</a
  >
</div>

<style>
  .menu-container {
    background-color: hsl(var(--b1));
    width: 250px;
    flex-grow: 0;
    padding: 25px;
    display: flex;
    flex-direction: column;
    align-items: center;
    border-radius: 4px;
    border: 1px solid hsl(var(--b3));
    max-height: 80vh;
  }
  a {
    margin-bottom: 25px;
  }
  a.active {
    text-decoration: underline;
  }
</style>
