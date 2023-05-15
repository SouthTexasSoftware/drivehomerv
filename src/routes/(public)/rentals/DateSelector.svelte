<script lang="ts">
  import RentalsCalendar from "./RentalsCalendar.svelte";
</script>

<div class="selector-container">
  <h4>Find Your Drive Home</h4>
  <div class="underline-bar" />

  <div class="flex-row">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="9"
      height="14"
      viewBox="0 0 9 14"
      fill="none"
    >
      <path
        d="M4.45338 0.666748C1.99776 0.666748 0 2.6648 0 5.12049C0 7.4843 4.04063 13.007 4.21268 13.2409L4.37325 13.4594C4.39202 13.4851 4.42192 13.5001 4.45338 13.5001C4.48533 13.5001 4.51503 13.4851 4.53401 13.4594L4.69448 13.2409C4.86662 13.007 8.90715 7.4843 8.90715 5.12049C8.90715 2.6648 6.90907 0.666748 4.45338 0.666748ZM4.45338 3.52517C5.33324 3.52517 6.0487 4.24066 6.0487 5.12049C6.0487 5.99986 5.33321 6.71581 4.45338 6.71581C3.57404 6.71581 2.85806 5.99986 2.85806 5.12049C2.85806 4.24066 3.57401 3.52517 4.45338 3.52517Z"
        fill="black"
      />
    </svg>
    <p class="bold">New York</p>
  </div>

  <p class="indent">Modena Pickup Location</p>

  <RentalsCalendar on:selection />
</div>

<style>
  .selector-container {
    background-color: hsl(var(--b1));
    border-radius: 4px;
    box-shadow: 0 3px 5px #80808087;
    padding: 25px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin: 25px;
    width: 350px;
    position: relative;
  }
  h4 {
    font-size: 22px;
    font-family: "font-medium";
    text-align: center;
  }
  .underline-bar {
    background-color: hsl(var(--b2));
    height: 1px;
    width: 60%;
    margin: 0 auto 25px;
  }
  .flex-row {
    display: flex;
    align-items: center;
    margin-left: 10px;
  }
  .bold {
    font-size: 18px;
    font-family: "font-medium";
    margin-left: 5px;
  }
  .indent {
    font-family: "font-light";
    font-size: 14px;
    margin-left: 35px;
  }

  @media (max-width: 480px) {
    .selector-container {
      margin: 15px 0;
    }
  }
</style>
