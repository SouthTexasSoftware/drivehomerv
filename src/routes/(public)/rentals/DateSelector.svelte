<script lang="ts">
  import RentalsCalendar from "./RentalsCalendar.svelte";
</script>

<div class="selector-container">
  <h4>Find Your Drive Home</h4>
  <div class="underline-bar" />

  <RentalsCalendar on:selection />

  <div class="row">
    <svg
      width="20"
      height="20"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="16"
        cy="16"
        r="15.5"
        fill="#AE2623"
        fill-opacity="0.29"
        stroke="#AE2623"
      />
      <path
        d="M20.3075 12.74C20.3075 13.22 20.2075 13.6933 20.0075 14.16C19.8075 14.6133 19.5475 15.06 19.2275 15.5C18.9208 15.9267 18.5675 16.3467 18.1675 16.76C17.7675 17.16 17.3675 17.5533 16.9675 17.94C16.7542 18.14 16.5142 18.38 16.2475 18.66C15.9808 18.94 15.7275 19.22 15.4875 19.5C15.2475 19.78 15.0408 20.0533 14.8675 20.32C14.6942 20.5733 14.6008 20.7867 14.5875 20.96H20.7475V23H11.9275C11.9142 22.8933 11.9075 22.7667 11.9075 22.62C11.9075 22.46 11.9075 22.34 11.9075 22.26C11.9075 21.62 12.0075 21.0333 12.2075 20.5C12.4208 19.9533 12.6942 19.4467 13.0275 18.98C13.3608 18.5133 13.7342 18.0733 14.1475 17.66C14.5608 17.2467 14.9742 16.84 15.3875 16.44C15.7075 16.1333 16.0142 15.8333 16.3075 15.54C16.6008 15.2467 16.8542 14.96 17.0675 14.68C17.2942 14.3867 17.4742 14.0933 17.6075 13.8C17.7408 13.4933 17.8075 13.18 17.8075 12.86C17.8075 12.1667 17.6075 11.6733 17.2075 11.38C16.8075 11.0867 16.3208 10.94 15.7475 10.94C15.3742 10.94 15.0275 10.9933 14.7075 11.1C14.3875 11.2067 14.1008 11.3333 13.8475 11.48C13.6075 11.6267 13.3942 11.78 13.2075 11.94C13.0208 12.0867 12.8808 12.2067 12.7875 12.3L11.5875 10.6C12.1475 10.0667 12.8008 9.64 13.5475 9.32C14.3075 8.98667 15.1208 8.82 15.9875 8.82C17.4675 8.82 18.5542 9.17333 19.2475 9.88C19.9542 10.5733 20.3075 11.5267 20.3075 12.74Z"
        fill="#AE2623"
      />
    </svg>
    <strong class="available-statement">Browse what's available at:</strong>
  </div>

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
</div>

<style>
  .selector-container {
    background-color: var(--b1);
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
    background-color: var(--b2);
    height: 1px;
    width: 60%;
    margin: 0 auto 15px;
  }
  .row {
    display: flex;
    align-items: center;
    margin-top: 15px;
  }
  .flex-row {
    display: flex;
    align-items: center;
    margin-left: 40px;
  }
  .bold {
    font-size: 18px;
    font-family: "font-medium";
    margin-left: 5px;
  }
  .indent {
    font-family: "font-light";
    font-size: 14px;
    margin-left: 65px;
  }
  .available-statement {
    font-size: 20px;
    margin-left: 10px;
  }

  @media (max-width: 700px) {
    .selector-container {
      margin: 15px 0;
      width: 90vw;
    }
  }
</style>
