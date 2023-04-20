<script lang="ts">
  import type { Unit } from "$lib/types";
  import Calendar from "./Calendar.svelte";

  export let unitObject: Unit;
</script>

<div class="trip-plan-container">
  <div class="trip-plan-title">
    <p>Plan Your Trip&nbsp;</p>
    <p>with <span class="unit-name">{unitObject.name}</span></p>
  </div>
  <section class="col-container">
    <div class="col estimate">
      <div class="row stack location">
        <strong id="state">New York</strong>
        <p id="pickup-location">Modena Pickup Location</p>
      </div>
      <div class="row stack dates">
        <strong class="dates">Dates</strong>
        <div class="row date-display">
          <p>13 Apr 2023</p>
          <div class="arrow-container">
            <svg
              id="right-arrow"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g id="Complete">
                <g id="arrow-right">
                  <g>
                    <polyline
                      data-name="Right"
                      fill="none"
                      id="Right-2"
                      points="16.4 7 21.5 12 16.4 17"
                      stroke="#000000"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                    />

                    <line
                      fill="none"
                      stroke="#000000"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      x1="2.5"
                      x2="19.2"
                      y1="12"
                      y2="12"
                    />
                  </g>
                </g>
              </g>
            </svg>
          </div>
          <p>17 Apr 2023</p>
        </div>
      </div>
      <div class="row fee nightly-rate">
        <p>$185 x 4 Nights</p>
        <p>$740</p>
      </div>
      <div class="row fee">
        <p>Preparation fee</p>
        <p>$100</p>
      </div>
      <div class="row fee mi-per-night">
        <p>100 mi per night ($0.00/day)</p>
        <p class="green-highlight">FREE</p>
      </div>
      <div class="banner">
        <div class="row fee miles-included">
          <p>Miles included</p>
          <p>400 mi</p>
        </div>
        <p class="row fee small-note">Additional miles: $0.38/mi</p>
      </div>
      <div class="bar" />
      <div class="row total">
        <p>Total</p>
        <p>$999</p>
      </div>

      <button class="reserve-button"><p>RESERVE NOW · $499.50</p></button>
    </div>

    <div class="col calendar">
      <Calendar />
    </div>
  </section>
</div>

<style>
  .trip-plan-container {
    width: 100%;
    background-color: hsl(var(--b1));
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    position: relative;
    font-size: 16px;
  }
  .trip-plan-title {
    font-size: 28px;
    margin-top: 15px;
    font-family: font-regular;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
  }
  span.unit-name {
    color: hsl(var(--p));
    font-family: font-medium;
  }
  .col-container {
    display: flex;
    flex-wrap: wrap-reverse;
    width: 100%;
    justify-content: space-evenly;
    margin-bottom: 25px;
  }
  .col {
    flex-basis: 300px;
    flex-grow: 2;
    margin: 0 15px;
    display: flex;
    flex-direction: column;
    max-width: 450px;
  }
  .col.calendar {
    margin: 0 auto;
    position: relative;
    height: 450px;
    /* align-items: center; */
  }
  .row {
    display: flex;
    justify-content: space-between;
    margin: 5px 0px;
    /* left/right margin for the rows is set in .col */
  }
  .row.stack {
    flex-direction: column;
  }
  strong {
    font-size: 20px;
    color: hsl(var(--nf));
  }
  p#pickup-location {
    margin-top: -10px;
    padding-left: 10px;
  }
  .row.stack.dates {
    align-items: flex-start;
    margin: 10px 0 15px 0;
  }
  strong.dates {
    font-size: 16px;
    margin-bottom: -5px;
  }
  .date-display {
    border: 1px solid hsl(var(--b3));
    border-radius: 10px;
    padding: 10px 10px;
    color: black;
    position: relative;
    max-width: 300px;
  }
  svg#right-arrow {
    height: 100%;
    width: 20px;
  }
  .row.fee {
    color: hsl(var(--n));
    opacity: 0.8;
    font-size: 16px;
  }

  .green-highlight {
    color: hsl(var(--suc));
    font-family: font-light;
  }
  .banner {
    border-radius: 10px;
    background-color: hsl(var(--b2));
    padding: 4px 10px;
    margin-bottom: 10px;
    color: hsl(var(--b3));
  }
  .row.miles-included {
    font-size: 17px;
  }
  .row.fee.small-note {
    font-size: 13px;
    margin-top: -7px;
    margin-left: 5px;
    font-family: font-light;
  }

  .bar {
    content: "";
    width: 100%;
    height: 1px;
    background-color: hsl(var(--b2));
  }
  .row.total {
    color: hsl(var(--pf));
    font-size: 22px;
    margin-top: 10px;
  }
  .reserve-button {
    background-color: hsl(var(--p));
    border-radius: 3px;
    color: hsl(var(--b1));
    width: 100%;
    padding: 8px 0;
    margin-top: 25px;
  }
  .reserve-button p {
    font-family: font-light;
  }

  @media (max-width: 500px) {
    .col {
      margin: 15px 25px;
    }
    .row.stack.dates {
      align-items: center;
    }
    .reserve-button {
      padding: 12px 0;
    }
  }

  @media (min-width: 500px) and (max-width: 1000px) {
  }

  @media (min-width: 1000px) {
  }

  /* max-width setpoint at 1800px */
</style>
