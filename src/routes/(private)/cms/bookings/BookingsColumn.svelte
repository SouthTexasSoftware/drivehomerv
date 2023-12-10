<script lang="ts">
  import { cmsStore, firebaseStore, unitStore } from "$lib/stores";
  import { DateTime } from "@easepick/bundle";
  import { collection, onSnapshot } from "firebase/firestore";
  import { populateUnitBookings } from "$lib/helpers";
  import type { Booking, BookingDisplayFilter } from "$lib/types";
  import { createEventDispatcher, onMount } from "svelte";
  import type { Unsubscriber } from "svelte/store";

  export let filters = {
    past: false,
    ongoing: true,
    upcoming: true,
  } as BookingDisplayFilter;

  let loadingPastBookings = false;
  let pastBookingsLoaded = false;
  let initialLoadComplete = false;

  let pastBookings: Booking[] = [];
  let ongoingBookings: Booking[] = [];
  let upcomingBookings: Booking[] = [];

  let iconWidth = 17;
  let iconHeight = 17;

  let initialLoad: Unsubscriber;

  let pastBookingsLoadCount = 0;

  let dispatch = createEventDispatcher();

  // past , ongoing , and upcoming -> different arrays
  // recalculate on unitStore update
  onMount(() => {
    initialLoad = unitStore.subscribe((storeData) => {
      if (loadingPastBookings) {
        // this was an afterthought, and handles the async operation of loading all the
        // past bookings into the page. kind of clever.
        // increment counter and compare to units total, if we've hit the # of reloads, stop the refresh loader
        pastBookingsLoadCount += 1;
        if (pastBookingsLoadCount == $unitStore.units.length) {
          loadingPastBookings = false;
          filters.past = true;
          dispatch("buttonEvent", filters);
        }
      }

      // original - when the unit store gets updated, remake all the arrays from scratch.
      if (storeData.isPopulated) {
        updateBookingArrays();
      }
    });
  });

  function updateBookingArrays() {
    // clear existing
    pastBookings = [];
    ongoingBookings = [];
    upcomingBookings = [];

    let today = new DateTime();
    // loop through all bookings and sort into correct array.
    $unitStore.units.forEach((unit) => {
      unit.bookings?.forEach((booking) => {
        let bookingStart = new DateTime(booking.start, "MMM-DD-YYYY");
        let bookingEnd = new DateTime(booking.end, "MMM-DD-YYYY");

        booking.unit_color_scheme = {
          primary: unit.information.cms_only.color_scheme.primary || "gray",
          secondary: unit.information.cms_only.color_scheme.secondary || "gray",
        };

        if (today.isAfter(bookingStart) && today.isBefore(bookingEnd)) {
          ongoingBookings.push(booking);
        }

        if (today.isSame(bookingStart) || today.isSame(bookingEnd)) {
          ongoingBookings.push(booking);
        }

        if (today.isAfter(bookingEnd)) {
          pastBookings.push(booking);
        }

        if (today.isBefore(bookingStart)) {
          upcomingBookings.push(booking);
        }
      });
    });

    //sort the arrays by booking start
    pastBookings = sortByDate(pastBookings);
    ongoingBookings = sortByDate(ongoingBookings);
    upcomingBookings = sortByDate(upcomingBookings);

    // console.log("past = ", pastBookings);
    //console.log("ongoing = ", ongoingBookings);
    // console.log("upcoming = ", upcomingBookings);
    initialLoadComplete = true;
  }

  function sortByDate(bookingsArray: Booking[]) {
    bookingsArray = bookingsArray.sort((bookingA, bookingB) => {
      let startA = new DateTime(bookingA.start, "MMM-DD-YYYY");
      let startB = new DateTime(bookingB.start, "MMM-DD-YYYY");

      if (startA.isBefore(startB)) {
        return -1;
      }
      return 1;
    });

    return bookingsArray;
  }

  async function getAllPastBookings() {
    if (loadingPastBookings) return;
    loadingPastBookings = true;

    for await (let unit of $unitStore.units) {
      let totalBookingsCollectionForUnit = collection(
        $firebaseStore.db,
        "units",
        unit.id,
        "bookings"
      );

      // find bookingListener within cmsStore, and update to be all bookings.
      cmsStore.update((store) => {
        store.bookingListeners.forEach((listenerObj) => {
          if (listenerObj.unit_id == unit.id) {
            listenerObj.listener();

            listenerObj.listener = onSnapshot(
              totalBookingsCollectionForUnit,
              (querySnapshot) => {
                populateUnitBookings(querySnapshot, unit);
              }
            );
          }
        });

        return store;
      });

      if (!unit.sessionOnly) {
        unit.sessionOnly = {};
        unit.sessionOnly.pastBookingsLoaded = true;
      } else {
        unit.sessionOnly.pastBookingsLoaded = true;
      }
    }

    pastBookingsLoaded = true;
  }
</script>

<div class="bookings-selection-container">
  <div class="bookings-header">
    <h2>Bookings</h2>
    <button
      class="filter"
      class:active={filters.past}
      on:click={() => {
        if (!filters.past && !pastBookingsLoaded) {
          getAllPastBookings();
          return;
        }
        filters.past = !filters.past;
        dispatch("buttonEvent", filters);
      }}
    >
      {#if loadingPastBookings}
        <div class="spinner"></div>
      {:else}
        Past
      {/if}
    </button>
    <button
      class="filter"
      class:active={filters.ongoing}
      on:click={() => {
        filters.ongoing = !filters.ongoing;
        dispatch("buttonEvent", filters);
      }}>Ongoing</button
    >
    <button
      class="filter"
      class:active={filters.upcoming}
      on:click={() => {
        filters.upcoming = !filters.upcoming;
        dispatch("buttonEvent", filters);
      }}>Upcoming</button
    >
  </div>

  <div class="divider" />
  {#if initialLoadComplete}
    <div class="all-bookings-container">
      {#if filters.past}
        <div class="section-title">
          Past | <span class="bookings-count">{pastBookings.length}</span>
        </div>
        <div class="ind-bookings-container">
          {#each pastBookings as booking}
            <a
              class="booking-card"
              href="/cms/units/{booking.unit_id}/bookings/{booking.id}/Overview"
              style="border-color:{booking.unit_color_scheme?.primary};
            box-shadow: 0 1px 3px {booking.unit_color_scheme?.primary};
            "
            >
              <div
                class="unit-img"
                style="background-image:url({booking.unit_img_link})"
              ></div>
              <div class="booking-info-container">
                <div class="info-group">
                  <svg
                    width={iconWidth}
                    height={iconHeight}
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g clip-path="url(#clip0_675_815)">
                      <path
                        d="M3.52168 9.52188C3.7378 9.52188 3.913 9.34669 3.913 9.13057C3.913 8.91445 3.7378 8.73926 3.52168 8.73926C3.30557 8.73926 3.13037 8.91445 3.13037 9.13057C3.13037 9.34669 3.30557 9.52188 3.52168 9.52188Z"
                        fill="#3D3D3D"
                      />
                      <path
                        d="M4.30433 4.04346H1.9565C1.7404 4.04346 1.56519 4.21865 1.56519 4.43477V5.99997C1.56519 6.21607 1.74038 6.39129 1.9565 6.39129H4.30433C4.52042 6.39129 4.69564 6.21609 4.69564 5.99997V4.43475C4.69564 4.21865 4.52044 4.04346 4.30433 4.04346ZM3.91304 5.60866H2.34781V4.82606H3.91304V5.60866Z"
                        fill="#3D3D3D"
                      />
                      <path
                        d="M7.43485 2.47852H2.73921C2.52312 2.47852 2.3479 2.65371 2.3479 2.86983C2.3479 3.08592 2.5231 3.26114 2.73921 3.26114H7.43487C7.65096 3.26114 7.82618 3.08595 7.82618 2.86983C7.82616 2.65371 7.65096 2.47852 7.43485 2.47852Z"
                        fill="#3D3D3D"
                      />
                      <path
                        d="M11.6087 8.73917H10.1739V2.8696C10.1739 1.79077 9.29623 0.913086 8.2174 0.913086H1.95652C0.877687 0.913086 0 1.79077 0 2.8696V9.13046C0 9.34655 0.175195 9.52177 0.391312 9.52177H1.6046C1.78638 10.4137 2.57688 11.087 3.52177 11.087C4.46662 11.087 5.25712 10.4138 5.43893 9.52177C5.74165 9.52177 10.9515 9.52177 11.2174 9.52177V9.91308C11.2174 10.1292 11.3926 10.3044 11.6087 10.3044C11.8249 10.3044 12 10.1292 12 9.91308V9.13048C12 8.91437 11.8248 8.73917 11.6087 8.73917ZM3.52174 10.3044C2.87445 10.3044 2.34783 9.77776 2.34783 9.13046C2.34783 8.48316 2.87445 7.95655 3.52174 7.95655C4.16904 7.95655 4.69566 8.48316 4.69566 9.13046C4.69566 9.77776 4.16904 10.3044 3.52174 10.3044ZM7.82609 8.73917H6.26086V4.82612H7.82609V8.73917ZM9.39131 8.73917H8.60871V4.4348C8.60871 4.21871 8.43352 4.04349 8.2174 4.04349H5.86957C5.65348 4.04349 5.47826 4.21869 5.47826 4.4348V8.73917H5.43888C5.2571 7.84721 4.4666 7.17394 3.52172 7.17394C2.57686 7.17394 1.78636 7.84719 1.60455 8.73917H0.782602V2.8696C0.782602 2.2223 1.30922 1.69569 1.95652 1.69569H8.21737C8.86467 1.69569 9.39129 2.2223 9.39129 2.8696L9.39131 8.73917Z"
                        fill="#3D3D3D"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_675_815">
                        <rect width="12" height="12" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                  <p class="info-text unit-name">{booking.unit_name}</p>
                </div>
                <div class="info-group">
                  <svg
                    width={iconWidth}
                    height={iconHeight}
                    viewBox="0 0 13 13"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8.51221 5.98828C8.42207 5.94893 8.33193 5.91338 8.24053 5.88037C8.87275 5.36875 9.27646 4.58799 9.27646 3.71455C9.27646 2.17842 8.02725 0.929199 6.49111 0.929199C4.95498 0.929199 3.70576 2.17842 3.70576 3.71455C3.70576 4.58926 4.11074 5.37129 4.74297 5.88164C2.78535 6.59639 1.38379 8.47783 1.38379 10.6805H2.31182C2.31182 8.37627 4.18691 6.50244 6.48984 6.50244C7.06494 6.50244 7.621 6.6167 8.14277 6.84141L8.51221 5.98828ZM6.49111 1.85723C7.51562 1.85723 8.34844 2.69004 8.34844 3.71455C8.34844 4.73906 7.51562 5.57188 6.49111 5.57188C5.4666 5.57188 4.63379 4.73779 4.63379 3.71455C4.63379 2.69131 5.4666 1.85723 6.49111 1.85723ZM7.77588 8.08047C7.77588 8.20996 7.84697 8.32803 7.96123 8.3877L9.58623 9.2459C9.63701 9.27256 9.69287 9.28652 9.74873 9.28652C9.80459 9.28652 9.86045 9.27256 9.91123 9.2459L11.5362 8.3877C11.6505 8.32676 11.7216 8.20869 11.7216 8.08047C11.7216 7.95225 11.6505 7.83291 11.5362 7.77324L9.91123 6.91377C9.80967 6.86045 9.68779 6.86045 9.58623 6.91377L7.96123 7.77324C7.84697 7.83291 7.77588 7.95098 7.77588 8.08047ZM9.74873 7.61582L10.6285 8.08047L9.74873 8.54512L8.86894 8.08047L9.74873 7.61582Z"
                      fill="#3D3D3D"
                    />
                    <path
                      d="M9.74871 9.6915L7.8825 8.70508L7.5575 9.3208L9.74871 10.4786L11.931 9.32588L11.606 8.71016L9.74871 9.6915Z"
                      fill="#3D3D3D"
                    />
                    <path
                      d="M9.74871 10.8089L7.8825 9.82373L7.5575 10.4382L9.74871 11.5973L11.9234 10.4471L11.5984 9.83135L9.74871 10.8089Z"
                      fill="#3D3D3D"
                    />
                  </svg>
                  <p class="info-text">
                    {#if !booking.customerObject}
                      CMS Only
                    {:else}
                      {booking.customerObject?.first_name}
                      {booking.customerObject?.last_name}
                    {/if}
                  </p>
                </div>

                <div class="info-group">
                  <svg
                    width={iconWidth}
                    height={iconHeight}
                    viewBox="0 0 10 10"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M-8.85942e-06 8.12993C-8.85942e-06 8.64993 0.183324 9.08993 0.549991 9.44993C0.916658 9.80993 1.35999 9.99326 1.87999 9.99993H8.12999C8.64333 9.99993 9.08333 9.81659 9.44999 9.44993C9.81666 9.08326 9.99999 8.64326 9.99999 8.12993V1.87993C9.99999 1.47326 9.88332 1.10993 9.64999 0.789927C9.41666 0.469927 9.11666 0.246594 8.74999 0.119927V0.939927C8.74999 1.19993 8.65999 1.42326 8.47999 1.60993C8.29999 1.79659 8.07666 1.88659 7.80999 1.87993C7.54333 1.87326 7.32332 1.78326 7.14999 1.60993C6.97666 1.43659 6.88666 1.21326 6.87999 0.939927V-7.27854e-05H3.12999V0.939927C3.12999 1.19993 3.03666 1.42326 2.84999 1.60993C2.66332 1.79659 2.44332 1.88659 2.18999 1.87993C1.93666 1.87326 1.71332 1.78326 1.51999 1.60993C1.32666 1.43659 1.23666 1.21326 1.24999 0.939927V0.119927C0.883324 0.253261 0.583324 0.476594 0.349991 0.789927C0.116658 1.10326 -8.85942e-06 1.46659 -8.85942e-06 1.87993V8.12993ZM1.24999 8.12993V3.12993H8.74999V8.12993C8.74999 8.30326 8.68999 8.44993 8.56999 8.56993C8.44999 8.68993 8.30333 8.74993 8.12999 8.74993H1.87999C1.70666 8.74993 1.55666 8.68993 1.42999 8.56993C1.30332 8.44993 1.24332 8.30326 1.24999 8.12993ZM1.87999 0.939927C1.87999 1.02659 1.90999 1.09993 1.96999 1.15993C2.02999 1.21993 2.10332 1.24993 2.18999 1.24993C2.27666 1.24993 2.34999 1.21993 2.40999 1.15993C2.46999 1.09993 2.49999 1.02659 2.49999 0.939927V-7.27854e-05H1.87999V0.939927ZM2.49999 5.62993H3.74999V4.37993H2.49999V5.62993ZM7.49999 0.939927C7.49999 1.02659 7.52999 1.09993 7.58999 1.15993C7.64999 1.21993 7.72333 1.24993 7.80999 1.24993C7.89666 1.24993 7.96999 1.21993 8.02999 1.15993C8.08999 1.09993 8.12333 1.02659 8.12999 0.939927V-7.27854e-05H7.49999V0.939927Z"
                      fill="#3D3D3D"
                    />
                  </svg>
                  <p class="info-text light">{booking.start}</p>
                </div>
                <div class="info-group">
                  <svg
                    width={iconWidth}
                    height={iconHeight}
                    viewBox="0 0 10 10"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M0 8.13C0 8.65 0.183333 9.09 0.55 9.45C0.916667 9.81 1.36 9.99333 1.88 10H8.13C8.64333 10 9.08333 9.81667 9.45 9.45C9.81667 9.08333 10 8.64333 10 8.13V1.88C10 1.47333 9.88333 1.11 9.65 0.79C9.41667 0.47 9.11667 0.246667 8.75 0.12V0.94C8.75 1.2 8.66 1.42333 8.48 1.61C8.3 1.79667 8.07667 1.88667 7.81 1.88C7.54333 1.87333 7.32333 1.78333 7.15 1.61C6.97667 1.43667 6.88667 1.21333 6.88 0.94V0H3.13V0.94C3.13 1.2 3.03667 1.42333 2.85 1.61C2.66333 1.79667 2.44333 1.88667 2.19 1.88C1.93667 1.87333 1.71333 1.78333 1.52 1.61C1.32667 1.43667 1.23667 1.21333 1.25 0.94V0.12C0.883333 0.253333 0.583333 0.476667 0.35 0.79C0.116667 1.10333 0 1.46667 0 1.88L0 8.13ZM1.25 8.13V3.13H8.75V8.13C8.75 8.30333 8.69 8.45 8.57 8.57C8.45 8.69 8.30333 8.75 8.13 8.75H1.88C1.70667 8.75 1.55667 8.69 1.43 8.57C1.30333 8.45 1.24333 8.30333 1.25 8.13ZM1.88 0.94C1.88 1.02667 1.91 1.1 1.97 1.16C2.03 1.22 2.10333 1.25 2.19 1.25C2.27667 1.25 2.35 1.22 2.41 1.16C2.47 1.1 2.5 1.02667 2.5 0.94V0H1.88V0.94ZM6.25 7.5H7.5V6.25H6.25V7.5ZM7.5 0.94C7.5 1.02667 7.53 1.1 7.59 1.16C7.65 1.22 7.72333 1.25 7.81 1.25C7.89667 1.25 7.97 1.22 8.03 1.16C8.09 1.1 8.12333 1.02667 8.13 0.94V0H7.5V0.94Z"
                      fill="#3D3D3D"
                    />
                  </svg>
                  <p class="info-text light">{booking.end}</p>
                </div>
                <div class="info-group">
                  <svg
                    width={iconWidth}
                    height={iconHeight}
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1.59067 10.4931C2.18134 11.0838 3.13201 11.0838 5.03335 11.0838H7.05002C8.95135 11.0838 9.90206 11.0838 10.4927 10.4931C11.0834 9.90247 11.0834 8.95176 11.0834 7.05044C11.0834 6.46066 11.0834 5.96239 11.0657 5.53793M10.4927 3.60776C9.90206 3.01709 8.95135 3.01709 7.05002 3.01709H5.03335C3.13201 3.01709 2.18134 3.01709 1.59067 3.60776C1 4.19843 1 5.14912 1 7.05044C1 7.64022 1 8.13849 1.01763 8.56295"
                      stroke="#3D3D3D"
                      stroke-width="0.756253"
                      stroke-linecap="round"
                    />
                    <path
                      d="M6.0417 1C6.99236 1 7.46769 1 7.76303 1.29534C8.05837 1.59067 8.05837 2.066 8.05837 3.01667M4.32036 1.29534C4.02502 1.59067 4.02502 2.066 4.02502 3.01667"
                      stroke="#3D3D3D"
                      stroke-width="0.756253"
                      stroke-linecap="round"
                    />
                    <path
                      d="M6.04178 8.73091C6.59869 8.73091 7.05012 8.3547 7.05012 7.89066C7.05012 7.42658 6.59869 7.05037 6.04178 7.05037C5.48488 7.05037 5.03345 6.67416 5.03345 6.21007C5.03345 5.74603 5.48488 5.36982 6.04178 5.36982M6.04178 8.73091C5.48488 8.73091 5.03345 8.3547 5.03345 7.89066M6.04178 8.73091V9.06704M6.04178 5.36982V5.03369M6.04178 5.36982C6.59869 5.36982 7.05012 5.74603 7.05012 6.21007"
                      stroke="#3D3D3D"
                      stroke-width="0.756253"
                      stroke-linecap="round"
                    />
                  </svg>
                  {#if booking.status == "paid"}
                    <p class="info-text light">Paid</p>
                  {:else}
                    <p class="info-text light highlight">Pending</p>
                  {/if}
                </div>
                <div class="info-group">
                  <svg
                    width={iconWidth}
                    height={iconHeight}
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8.98945 4.02015L9.2334 3.78843C9.6375 3.40451 10.2928 3.40451 10.6969 3.78843C11.101 4.17236 11.101 4.79483 10.6969 5.17874L10.453 5.41049M8.98945 4.02015C8.98945 4.02015 9.01997 4.51256 9.47729 4.94703C9.93466 5.38149 10.453 5.41049 10.453 5.41049M8.98945 4.02015L6.74703 6.15044C6.59514 6.29474 6.51919 6.36689 6.45388 6.44644C6.37688 6.54029 6.31082 6.64184 6.25693 6.74924C6.21124 6.84034 6.17724 6.93709 6.10935 7.13069L5.89188 7.75049L5.82151 7.95099M10.453 5.41049L8.21056 7.54079C8.05866 7.68509 7.98271 7.75724 7.89898 7.81929C7.80019 7.89244 7.69329 7.95519 7.58024 8.00639C7.48435 8.04979 7.38251 8.08209 7.17872 8.14659L6.5263 8.35319L6.31524 8.42004M5.82151 7.95099L5.75114 8.15154C5.71772 8.24679 5.74382 8.35184 5.81856 8.42284C5.8933 8.49384 6.00388 8.51864 6.10414 8.48689L6.31524 8.42004M5.82151 7.95099L6.31524 8.42004"
                      stroke="#3D3D3D"
                      stroke-width="0.769735"
                    />
                    <path
                      d="M3.63147 6.50098H4.94726"
                      stroke="#3D3D3D"
                      stroke-width="0.769735"
                      stroke-linecap="round"
                    />
                    <path
                      d="M3.63147 4.5H7.05252"
                      stroke="#3D3D3D"
                      stroke-width="0.769735"
                      stroke-linecap="round"
                    />
                    <path
                      d="M3.63147 8.5H4.42094"
                      stroke="#3D3D3D"
                      stroke-width="0.769735"
                      stroke-linecap="round"
                    />
                    <path
                      d="M1 7V5C1 3.11438 1 2.17158 1.61661 1.58579C2.23323 1 3.22566 1 5.21052 1H6.26315C8.24798 1 9.24046 1 9.85703 1.58579M10.4737 7C10.4737 8.8856 10.4737 9.82845 9.85703 10.4142M9.85703 10.4142C9.24046 11 8.24798 11 6.26315 11H5.21052C3.22566 11 2.23323 11 1.61661 10.4142M9.85703 10.4142C10.3534 9.94265 10.4502 9.2398 10.4691 8"
                      stroke="#3D3D3D"
                      stroke-width="0.769735"
                      stroke-linecap="round"
                    />
                  </svg>
                  {#if booking.agreement_notification}
                    <p class="info-text light">Sent</p>
                  {:else}
                    <p class="info-text light highlight">In Queue</p>
                  {/if}
                  {#if booking.agreement_signed}
                    <p class="info-text light">& Signed</p>
                  {/if}
                </div>
              </div>
            </a>
          {/each}
        </div>
      {/if}

      {#if filters.ongoing}
        <div class="section-title">
          Ongoing | <span class="bookings-count">{ongoingBookings.length}</span>
        </div>
        <div class="ind-bookings-container">
          {#each ongoingBookings as booking (booking.id)}
            <a
              class="booking-card"
              href="/cms/units/{booking.unit_id}/bookings/{booking.id}/Overview"
              style="border-color:{booking.unit_color_scheme?.primary};
            box-shadow: 0 1px 3px {booking.unit_color_scheme?.primary};
            "
            >
              <!-- TODO: booking card border/shadow will be unique -->
              <div
                class="unit-img"
                style="background-image:url({booking.unit_img_link})"
              ></div>
              <div class="booking-info-container">
                <div class="info-group">
                  <svg
                    width={iconWidth}
                    height={iconHeight}
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g clip-path="url(#clip0_675_815)">
                      <path
                        d="M3.52168 9.52188C3.7378 9.52188 3.913 9.34669 3.913 9.13057C3.913 8.91445 3.7378 8.73926 3.52168 8.73926C3.30557 8.73926 3.13037 8.91445 3.13037 9.13057C3.13037 9.34669 3.30557 9.52188 3.52168 9.52188Z"
                        fill="#3D3D3D"
                      />
                      <path
                        d="M4.30433 4.04346H1.9565C1.7404 4.04346 1.56519 4.21865 1.56519 4.43477V5.99997C1.56519 6.21607 1.74038 6.39129 1.9565 6.39129H4.30433C4.52042 6.39129 4.69564 6.21609 4.69564 5.99997V4.43475C4.69564 4.21865 4.52044 4.04346 4.30433 4.04346ZM3.91304 5.60866H2.34781V4.82606H3.91304V5.60866Z"
                        fill="#3D3D3D"
                      />
                      <path
                        d="M7.43485 2.47852H2.73921C2.52312 2.47852 2.3479 2.65371 2.3479 2.86983C2.3479 3.08592 2.5231 3.26114 2.73921 3.26114H7.43487C7.65096 3.26114 7.82618 3.08595 7.82618 2.86983C7.82616 2.65371 7.65096 2.47852 7.43485 2.47852Z"
                        fill="#3D3D3D"
                      />
                      <path
                        d="M11.6087 8.73917H10.1739V2.8696C10.1739 1.79077 9.29623 0.913086 8.2174 0.913086H1.95652C0.877687 0.913086 0 1.79077 0 2.8696V9.13046C0 9.34655 0.175195 9.52177 0.391312 9.52177H1.6046C1.78638 10.4137 2.57688 11.087 3.52177 11.087C4.46662 11.087 5.25712 10.4138 5.43893 9.52177C5.74165 9.52177 10.9515 9.52177 11.2174 9.52177V9.91308C11.2174 10.1292 11.3926 10.3044 11.6087 10.3044C11.8249 10.3044 12 10.1292 12 9.91308V9.13048C12 8.91437 11.8248 8.73917 11.6087 8.73917ZM3.52174 10.3044C2.87445 10.3044 2.34783 9.77776 2.34783 9.13046C2.34783 8.48316 2.87445 7.95655 3.52174 7.95655C4.16904 7.95655 4.69566 8.48316 4.69566 9.13046C4.69566 9.77776 4.16904 10.3044 3.52174 10.3044ZM7.82609 8.73917H6.26086V4.82612H7.82609V8.73917ZM9.39131 8.73917H8.60871V4.4348C8.60871 4.21871 8.43352 4.04349 8.2174 4.04349H5.86957C5.65348 4.04349 5.47826 4.21869 5.47826 4.4348V8.73917H5.43888C5.2571 7.84721 4.4666 7.17394 3.52172 7.17394C2.57686 7.17394 1.78636 7.84719 1.60455 8.73917H0.782602V2.8696C0.782602 2.2223 1.30922 1.69569 1.95652 1.69569H8.21737C8.86467 1.69569 9.39129 2.2223 9.39129 2.8696L9.39131 8.73917Z"
                        fill="#3D3D3D"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_675_815">
                        <rect width="12" height="12" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                  <p class="info-text unit-name">{booking.unit_name}</p>
                </div>
                <div class="info-group">
                  <svg
                    width={iconWidth}
                    height={iconHeight}
                    viewBox="0 0 13 13"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8.51221 5.98828C8.42207 5.94893 8.33193 5.91338 8.24053 5.88037C8.87275 5.36875 9.27646 4.58799 9.27646 3.71455C9.27646 2.17842 8.02725 0.929199 6.49111 0.929199C4.95498 0.929199 3.70576 2.17842 3.70576 3.71455C3.70576 4.58926 4.11074 5.37129 4.74297 5.88164C2.78535 6.59639 1.38379 8.47783 1.38379 10.6805H2.31182C2.31182 8.37627 4.18691 6.50244 6.48984 6.50244C7.06494 6.50244 7.621 6.6167 8.14277 6.84141L8.51221 5.98828ZM6.49111 1.85723C7.51562 1.85723 8.34844 2.69004 8.34844 3.71455C8.34844 4.73906 7.51562 5.57188 6.49111 5.57188C5.4666 5.57188 4.63379 4.73779 4.63379 3.71455C4.63379 2.69131 5.4666 1.85723 6.49111 1.85723ZM7.77588 8.08047C7.77588 8.20996 7.84697 8.32803 7.96123 8.3877L9.58623 9.2459C9.63701 9.27256 9.69287 9.28652 9.74873 9.28652C9.80459 9.28652 9.86045 9.27256 9.91123 9.2459L11.5362 8.3877C11.6505 8.32676 11.7216 8.20869 11.7216 8.08047C11.7216 7.95225 11.6505 7.83291 11.5362 7.77324L9.91123 6.91377C9.80967 6.86045 9.68779 6.86045 9.58623 6.91377L7.96123 7.77324C7.84697 7.83291 7.77588 7.95098 7.77588 8.08047ZM9.74873 7.61582L10.6285 8.08047L9.74873 8.54512L8.86894 8.08047L9.74873 7.61582Z"
                      fill="#3D3D3D"
                    />
                    <path
                      d="M9.74871 9.6915L7.8825 8.70508L7.5575 9.3208L9.74871 10.4786L11.931 9.32588L11.606 8.71016L9.74871 9.6915Z"
                      fill="#3D3D3D"
                    />
                    <path
                      d="M9.74871 10.8089L7.8825 9.82373L7.5575 10.4382L9.74871 11.5973L11.9234 10.4471L11.5984 9.83135L9.74871 10.8089Z"
                      fill="#3D3D3D"
                    />
                  </svg>
                  <p class="info-text">
                    {#if !booking.customerObject}
                      CMS Only
                    {:else}
                      {booking.customerObject?.first_name}
                      {booking.customerObject?.last_name}
                    {/if}
                  </p>
                </div>

                <div class="info-group">
                  <svg
                    width={iconWidth}
                    height={iconHeight}
                    viewBox="0 0 10 10"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M-8.85942e-06 8.12993C-8.85942e-06 8.64993 0.183324 9.08993 0.549991 9.44993C0.916658 9.80993 1.35999 9.99326 1.87999 9.99993H8.12999C8.64333 9.99993 9.08333 9.81659 9.44999 9.44993C9.81666 9.08326 9.99999 8.64326 9.99999 8.12993V1.87993C9.99999 1.47326 9.88332 1.10993 9.64999 0.789927C9.41666 0.469927 9.11666 0.246594 8.74999 0.119927V0.939927C8.74999 1.19993 8.65999 1.42326 8.47999 1.60993C8.29999 1.79659 8.07666 1.88659 7.80999 1.87993C7.54333 1.87326 7.32332 1.78326 7.14999 1.60993C6.97666 1.43659 6.88666 1.21326 6.87999 0.939927V-7.27854e-05H3.12999V0.939927C3.12999 1.19993 3.03666 1.42326 2.84999 1.60993C2.66332 1.79659 2.44332 1.88659 2.18999 1.87993C1.93666 1.87326 1.71332 1.78326 1.51999 1.60993C1.32666 1.43659 1.23666 1.21326 1.24999 0.939927V0.119927C0.883324 0.253261 0.583324 0.476594 0.349991 0.789927C0.116658 1.10326 -8.85942e-06 1.46659 -8.85942e-06 1.87993V8.12993ZM1.24999 8.12993V3.12993H8.74999V8.12993C8.74999 8.30326 8.68999 8.44993 8.56999 8.56993C8.44999 8.68993 8.30333 8.74993 8.12999 8.74993H1.87999C1.70666 8.74993 1.55666 8.68993 1.42999 8.56993C1.30332 8.44993 1.24332 8.30326 1.24999 8.12993ZM1.87999 0.939927C1.87999 1.02659 1.90999 1.09993 1.96999 1.15993C2.02999 1.21993 2.10332 1.24993 2.18999 1.24993C2.27666 1.24993 2.34999 1.21993 2.40999 1.15993C2.46999 1.09993 2.49999 1.02659 2.49999 0.939927V-7.27854e-05H1.87999V0.939927ZM2.49999 5.62993H3.74999V4.37993H2.49999V5.62993ZM7.49999 0.939927C7.49999 1.02659 7.52999 1.09993 7.58999 1.15993C7.64999 1.21993 7.72333 1.24993 7.80999 1.24993C7.89666 1.24993 7.96999 1.21993 8.02999 1.15993C8.08999 1.09993 8.12333 1.02659 8.12999 0.939927V-7.27854e-05H7.49999V0.939927Z"
                      fill="#3D3D3D"
                    />
                  </svg>
                  <p class="info-text light">{booking.start}</p>
                </div>
                <div class="info-group">
                  <svg
                    width={iconWidth}
                    height={iconHeight}
                    viewBox="0 0 10 10"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M0 8.13C0 8.65 0.183333 9.09 0.55 9.45C0.916667 9.81 1.36 9.99333 1.88 10H8.13C8.64333 10 9.08333 9.81667 9.45 9.45C9.81667 9.08333 10 8.64333 10 8.13V1.88C10 1.47333 9.88333 1.11 9.65 0.79C9.41667 0.47 9.11667 0.246667 8.75 0.12V0.94C8.75 1.2 8.66 1.42333 8.48 1.61C8.3 1.79667 8.07667 1.88667 7.81 1.88C7.54333 1.87333 7.32333 1.78333 7.15 1.61C6.97667 1.43667 6.88667 1.21333 6.88 0.94V0H3.13V0.94C3.13 1.2 3.03667 1.42333 2.85 1.61C2.66333 1.79667 2.44333 1.88667 2.19 1.88C1.93667 1.87333 1.71333 1.78333 1.52 1.61C1.32667 1.43667 1.23667 1.21333 1.25 0.94V0.12C0.883333 0.253333 0.583333 0.476667 0.35 0.79C0.116667 1.10333 0 1.46667 0 1.88L0 8.13ZM1.25 8.13V3.13H8.75V8.13C8.75 8.30333 8.69 8.45 8.57 8.57C8.45 8.69 8.30333 8.75 8.13 8.75H1.88C1.70667 8.75 1.55667 8.69 1.43 8.57C1.30333 8.45 1.24333 8.30333 1.25 8.13ZM1.88 0.94C1.88 1.02667 1.91 1.1 1.97 1.16C2.03 1.22 2.10333 1.25 2.19 1.25C2.27667 1.25 2.35 1.22 2.41 1.16C2.47 1.1 2.5 1.02667 2.5 0.94V0H1.88V0.94ZM6.25 7.5H7.5V6.25H6.25V7.5ZM7.5 0.94C7.5 1.02667 7.53 1.1 7.59 1.16C7.65 1.22 7.72333 1.25 7.81 1.25C7.89667 1.25 7.97 1.22 8.03 1.16C8.09 1.1 8.12333 1.02667 8.13 0.94V0H7.5V0.94Z"
                      fill="#3D3D3D"
                    />
                  </svg>
                  <p class="info-text light">{booking.end}</p>
                </div>
                <div class="info-group">
                  <svg
                    width={iconWidth}
                    height={iconHeight}
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1.59067 10.4931C2.18134 11.0838 3.13201 11.0838 5.03335 11.0838H7.05002C8.95135 11.0838 9.90206 11.0838 10.4927 10.4931C11.0834 9.90247 11.0834 8.95176 11.0834 7.05044C11.0834 6.46066 11.0834 5.96239 11.0657 5.53793M10.4927 3.60776C9.90206 3.01709 8.95135 3.01709 7.05002 3.01709H5.03335C3.13201 3.01709 2.18134 3.01709 1.59067 3.60776C1 4.19843 1 5.14912 1 7.05044C1 7.64022 1 8.13849 1.01763 8.56295"
                      stroke="#3D3D3D"
                      stroke-width="0.756253"
                      stroke-linecap="round"
                    />
                    <path
                      d="M6.0417 1C6.99236 1 7.46769 1 7.76303 1.29534C8.05837 1.59067 8.05837 2.066 8.05837 3.01667M4.32036 1.29534C4.02502 1.59067 4.02502 2.066 4.02502 3.01667"
                      stroke="#3D3D3D"
                      stroke-width="0.756253"
                      stroke-linecap="round"
                    />
                    <path
                      d="M6.04178 8.73091C6.59869 8.73091 7.05012 8.3547 7.05012 7.89066C7.05012 7.42658 6.59869 7.05037 6.04178 7.05037C5.48488 7.05037 5.03345 6.67416 5.03345 6.21007C5.03345 5.74603 5.48488 5.36982 6.04178 5.36982M6.04178 8.73091C5.48488 8.73091 5.03345 8.3547 5.03345 7.89066M6.04178 8.73091V9.06704M6.04178 5.36982V5.03369M6.04178 5.36982C6.59869 5.36982 7.05012 5.74603 7.05012 6.21007"
                      stroke="#3D3D3D"
                      stroke-width="0.756253"
                      stroke-linecap="round"
                    />
                  </svg>
                  {#if booking.status == "paid"}
                    <p class="info-text light">Paid</p>
                  {:else}
                    <p class="info-text light highlight">Pending</p>
                  {/if}
                </div>
                <div class="info-group">
                  <svg
                    width={iconWidth}
                    height={iconHeight}
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8.98945 4.02015L9.2334 3.78843C9.6375 3.40451 10.2928 3.40451 10.6969 3.78843C11.101 4.17236 11.101 4.79483 10.6969 5.17874L10.453 5.41049M8.98945 4.02015C8.98945 4.02015 9.01997 4.51256 9.47729 4.94703C9.93466 5.38149 10.453 5.41049 10.453 5.41049M8.98945 4.02015L6.74703 6.15044C6.59514 6.29474 6.51919 6.36689 6.45388 6.44644C6.37688 6.54029 6.31082 6.64184 6.25693 6.74924C6.21124 6.84034 6.17724 6.93709 6.10935 7.13069L5.89188 7.75049L5.82151 7.95099M10.453 5.41049L8.21056 7.54079C8.05866 7.68509 7.98271 7.75724 7.89898 7.81929C7.80019 7.89244 7.69329 7.95519 7.58024 8.00639C7.48435 8.04979 7.38251 8.08209 7.17872 8.14659L6.5263 8.35319L6.31524 8.42004M5.82151 7.95099L5.75114 8.15154C5.71772 8.24679 5.74382 8.35184 5.81856 8.42284C5.8933 8.49384 6.00388 8.51864 6.10414 8.48689L6.31524 8.42004M5.82151 7.95099L6.31524 8.42004"
                      stroke="#3D3D3D"
                      stroke-width="0.769735"
                    />
                    <path
                      d="M3.63147 6.50098H4.94726"
                      stroke="#3D3D3D"
                      stroke-width="0.769735"
                      stroke-linecap="round"
                    />
                    <path
                      d="M3.63147 4.5H7.05252"
                      stroke="#3D3D3D"
                      stroke-width="0.769735"
                      stroke-linecap="round"
                    />
                    <path
                      d="M3.63147 8.5H4.42094"
                      stroke="#3D3D3D"
                      stroke-width="0.769735"
                      stroke-linecap="round"
                    />
                    <path
                      d="M1 7V5C1 3.11438 1 2.17158 1.61661 1.58579C2.23323 1 3.22566 1 5.21052 1H6.26315C8.24798 1 9.24046 1 9.85703 1.58579M10.4737 7C10.4737 8.8856 10.4737 9.82845 9.85703 10.4142M9.85703 10.4142C9.24046 11 8.24798 11 6.26315 11H5.21052C3.22566 11 2.23323 11 1.61661 10.4142M9.85703 10.4142C10.3534 9.94265 10.4502 9.2398 10.4691 8"
                      stroke="#3D3D3D"
                      stroke-width="0.769735"
                      stroke-linecap="round"
                    />
                  </svg>
                  {#if booking.agreement_notification}
                    <p class="info-text light">Sent</p>
                  {:else}
                    <p class="info-text light highlight">In Queue</p>
                  {/if}
                  {#if booking.agreement_signed}
                    <p class="info-text light">& Signed</p>
                  {/if}
                </div>
              </div>
            </a>
          {/each}
        </div>
      {/if}

      {#if filters.upcoming}
        <div class="section-title">
          Upcoming | <span class="bookings-count"
            >{upcomingBookings.length}</span
          >
        </div>
        <div class="ind-bookings-container">
          {#each upcomingBookings as booking}
            <a
              class="booking-card"
              href="/cms/units/{booking.unit_id}/bookings/{booking.id}/Overview"
              style="border-color:{booking.unit_color_scheme?.primary};
            box-shadow: 0 1px 3px {booking.unit_color_scheme?.primary};
            "
            >
              <!-- TODO: booking card border/shadow will be unique -->
              <div
                class="unit-img"
                style="background-image:url({booking.unit_img_link})"
              ></div>
              <div class="booking-info-container">
                <div class="info-group">
                  <svg
                    width={iconWidth}
                    height={iconHeight}
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g clip-path="url(#clip0_675_815)">
                      <path
                        d="M3.52168 9.52188C3.7378 9.52188 3.913 9.34669 3.913 9.13057C3.913 8.91445 3.7378 8.73926 3.52168 8.73926C3.30557 8.73926 3.13037 8.91445 3.13037 9.13057C3.13037 9.34669 3.30557 9.52188 3.52168 9.52188Z"
                        fill="#3D3D3D"
                      />
                      <path
                        d="M4.30433 4.04346H1.9565C1.7404 4.04346 1.56519 4.21865 1.56519 4.43477V5.99997C1.56519 6.21607 1.74038 6.39129 1.9565 6.39129H4.30433C4.52042 6.39129 4.69564 6.21609 4.69564 5.99997V4.43475C4.69564 4.21865 4.52044 4.04346 4.30433 4.04346ZM3.91304 5.60866H2.34781V4.82606H3.91304V5.60866Z"
                        fill="#3D3D3D"
                      />
                      <path
                        d="M7.43485 2.47852H2.73921C2.52312 2.47852 2.3479 2.65371 2.3479 2.86983C2.3479 3.08592 2.5231 3.26114 2.73921 3.26114H7.43487C7.65096 3.26114 7.82618 3.08595 7.82618 2.86983C7.82616 2.65371 7.65096 2.47852 7.43485 2.47852Z"
                        fill="#3D3D3D"
                      />
                      <path
                        d="M11.6087 8.73917H10.1739V2.8696C10.1739 1.79077 9.29623 0.913086 8.2174 0.913086H1.95652C0.877687 0.913086 0 1.79077 0 2.8696V9.13046C0 9.34655 0.175195 9.52177 0.391312 9.52177H1.6046C1.78638 10.4137 2.57688 11.087 3.52177 11.087C4.46662 11.087 5.25712 10.4138 5.43893 9.52177C5.74165 9.52177 10.9515 9.52177 11.2174 9.52177V9.91308C11.2174 10.1292 11.3926 10.3044 11.6087 10.3044C11.8249 10.3044 12 10.1292 12 9.91308V9.13048C12 8.91437 11.8248 8.73917 11.6087 8.73917ZM3.52174 10.3044C2.87445 10.3044 2.34783 9.77776 2.34783 9.13046C2.34783 8.48316 2.87445 7.95655 3.52174 7.95655C4.16904 7.95655 4.69566 8.48316 4.69566 9.13046C4.69566 9.77776 4.16904 10.3044 3.52174 10.3044ZM7.82609 8.73917H6.26086V4.82612H7.82609V8.73917ZM9.39131 8.73917H8.60871V4.4348C8.60871 4.21871 8.43352 4.04349 8.2174 4.04349H5.86957C5.65348 4.04349 5.47826 4.21869 5.47826 4.4348V8.73917H5.43888C5.2571 7.84721 4.4666 7.17394 3.52172 7.17394C2.57686 7.17394 1.78636 7.84719 1.60455 8.73917H0.782602V2.8696C0.782602 2.2223 1.30922 1.69569 1.95652 1.69569H8.21737C8.86467 1.69569 9.39129 2.2223 9.39129 2.8696L9.39131 8.73917Z"
                        fill="#3D3D3D"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_675_815">
                        <rect width="12" height="12" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                  <p class="info-text unit-name">{booking.unit_name}</p>
                </div>
                <div class="info-group">
                  <svg
                    width={iconWidth}
                    height={iconHeight}
                    viewBox="0 0 13 13"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8.51221 5.98828C8.42207 5.94893 8.33193 5.91338 8.24053 5.88037C8.87275 5.36875 9.27646 4.58799 9.27646 3.71455C9.27646 2.17842 8.02725 0.929199 6.49111 0.929199C4.95498 0.929199 3.70576 2.17842 3.70576 3.71455C3.70576 4.58926 4.11074 5.37129 4.74297 5.88164C2.78535 6.59639 1.38379 8.47783 1.38379 10.6805H2.31182C2.31182 8.37627 4.18691 6.50244 6.48984 6.50244C7.06494 6.50244 7.621 6.6167 8.14277 6.84141L8.51221 5.98828ZM6.49111 1.85723C7.51562 1.85723 8.34844 2.69004 8.34844 3.71455C8.34844 4.73906 7.51562 5.57188 6.49111 5.57188C5.4666 5.57188 4.63379 4.73779 4.63379 3.71455C4.63379 2.69131 5.4666 1.85723 6.49111 1.85723ZM7.77588 8.08047C7.77588 8.20996 7.84697 8.32803 7.96123 8.3877L9.58623 9.2459C9.63701 9.27256 9.69287 9.28652 9.74873 9.28652C9.80459 9.28652 9.86045 9.27256 9.91123 9.2459L11.5362 8.3877C11.6505 8.32676 11.7216 8.20869 11.7216 8.08047C11.7216 7.95225 11.6505 7.83291 11.5362 7.77324L9.91123 6.91377C9.80967 6.86045 9.68779 6.86045 9.58623 6.91377L7.96123 7.77324C7.84697 7.83291 7.77588 7.95098 7.77588 8.08047ZM9.74873 7.61582L10.6285 8.08047L9.74873 8.54512L8.86894 8.08047L9.74873 7.61582Z"
                      fill="#3D3D3D"
                    />
                    <path
                      d="M9.74871 9.6915L7.8825 8.70508L7.5575 9.3208L9.74871 10.4786L11.931 9.32588L11.606 8.71016L9.74871 9.6915Z"
                      fill="#3D3D3D"
                    />
                    <path
                      d="M9.74871 10.8089L7.8825 9.82373L7.5575 10.4382L9.74871 11.5973L11.9234 10.4471L11.5984 9.83135L9.74871 10.8089Z"
                      fill="#3D3D3D"
                    />
                  </svg>
                  <p class="info-text">
                    {#if !booking.customerObject}
                      CMS Only
                    {:else}
                      {booking.customerObject?.first_name}
                      {booking.customerObject?.last_name}
                    {/if}
                  </p>
                </div>

                <div class="info-group">
                  <svg
                    width={iconWidth}
                    height={iconHeight}
                    viewBox="0 0 10 10"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M-8.85942e-06 8.12993C-8.85942e-06 8.64993 0.183324 9.08993 0.549991 9.44993C0.916658 9.80993 1.35999 9.99326 1.87999 9.99993H8.12999C8.64333 9.99993 9.08333 9.81659 9.44999 9.44993C9.81666 9.08326 9.99999 8.64326 9.99999 8.12993V1.87993C9.99999 1.47326 9.88332 1.10993 9.64999 0.789927C9.41666 0.469927 9.11666 0.246594 8.74999 0.119927V0.939927C8.74999 1.19993 8.65999 1.42326 8.47999 1.60993C8.29999 1.79659 8.07666 1.88659 7.80999 1.87993C7.54333 1.87326 7.32332 1.78326 7.14999 1.60993C6.97666 1.43659 6.88666 1.21326 6.87999 0.939927V-7.27854e-05H3.12999V0.939927C3.12999 1.19993 3.03666 1.42326 2.84999 1.60993C2.66332 1.79659 2.44332 1.88659 2.18999 1.87993C1.93666 1.87326 1.71332 1.78326 1.51999 1.60993C1.32666 1.43659 1.23666 1.21326 1.24999 0.939927V0.119927C0.883324 0.253261 0.583324 0.476594 0.349991 0.789927C0.116658 1.10326 -8.85942e-06 1.46659 -8.85942e-06 1.87993V8.12993ZM1.24999 8.12993V3.12993H8.74999V8.12993C8.74999 8.30326 8.68999 8.44993 8.56999 8.56993C8.44999 8.68993 8.30333 8.74993 8.12999 8.74993H1.87999C1.70666 8.74993 1.55666 8.68993 1.42999 8.56993C1.30332 8.44993 1.24332 8.30326 1.24999 8.12993ZM1.87999 0.939927C1.87999 1.02659 1.90999 1.09993 1.96999 1.15993C2.02999 1.21993 2.10332 1.24993 2.18999 1.24993C2.27666 1.24993 2.34999 1.21993 2.40999 1.15993C2.46999 1.09993 2.49999 1.02659 2.49999 0.939927V-7.27854e-05H1.87999V0.939927ZM2.49999 5.62993H3.74999V4.37993H2.49999V5.62993ZM7.49999 0.939927C7.49999 1.02659 7.52999 1.09993 7.58999 1.15993C7.64999 1.21993 7.72333 1.24993 7.80999 1.24993C7.89666 1.24993 7.96999 1.21993 8.02999 1.15993C8.08999 1.09993 8.12333 1.02659 8.12999 0.939927V-7.27854e-05H7.49999V0.939927Z"
                      fill="#3D3D3D"
                    />
                  </svg>
                  <p class="info-text light">{booking.start}</p>
                </div>
                <div class="info-group">
                  <svg
                    width={iconWidth}
                    height={iconHeight}
                    viewBox="0 0 10 10"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M0 8.13C0 8.65 0.183333 9.09 0.55 9.45C0.916667 9.81 1.36 9.99333 1.88 10H8.13C8.64333 10 9.08333 9.81667 9.45 9.45C9.81667 9.08333 10 8.64333 10 8.13V1.88C10 1.47333 9.88333 1.11 9.65 0.79C9.41667 0.47 9.11667 0.246667 8.75 0.12V0.94C8.75 1.2 8.66 1.42333 8.48 1.61C8.3 1.79667 8.07667 1.88667 7.81 1.88C7.54333 1.87333 7.32333 1.78333 7.15 1.61C6.97667 1.43667 6.88667 1.21333 6.88 0.94V0H3.13V0.94C3.13 1.2 3.03667 1.42333 2.85 1.61C2.66333 1.79667 2.44333 1.88667 2.19 1.88C1.93667 1.87333 1.71333 1.78333 1.52 1.61C1.32667 1.43667 1.23667 1.21333 1.25 0.94V0.12C0.883333 0.253333 0.583333 0.476667 0.35 0.79C0.116667 1.10333 0 1.46667 0 1.88L0 8.13ZM1.25 8.13V3.13H8.75V8.13C8.75 8.30333 8.69 8.45 8.57 8.57C8.45 8.69 8.30333 8.75 8.13 8.75H1.88C1.70667 8.75 1.55667 8.69 1.43 8.57C1.30333 8.45 1.24333 8.30333 1.25 8.13ZM1.88 0.94C1.88 1.02667 1.91 1.1 1.97 1.16C2.03 1.22 2.10333 1.25 2.19 1.25C2.27667 1.25 2.35 1.22 2.41 1.16C2.47 1.1 2.5 1.02667 2.5 0.94V0H1.88V0.94ZM6.25 7.5H7.5V6.25H6.25V7.5ZM7.5 0.94C7.5 1.02667 7.53 1.1 7.59 1.16C7.65 1.22 7.72333 1.25 7.81 1.25C7.89667 1.25 7.97 1.22 8.03 1.16C8.09 1.1 8.12333 1.02667 8.13 0.94V0H7.5V0.94Z"
                      fill="#3D3D3D"
                    />
                  </svg>
                  <p class="info-text light">{booking.end}</p>
                </div>
                <div class="info-group">
                  <svg
                    width={iconWidth}
                    height={iconHeight}
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1.59067 10.4931C2.18134 11.0838 3.13201 11.0838 5.03335 11.0838H7.05002C8.95135 11.0838 9.90206 11.0838 10.4927 10.4931C11.0834 9.90247 11.0834 8.95176 11.0834 7.05044C11.0834 6.46066 11.0834 5.96239 11.0657 5.53793M10.4927 3.60776C9.90206 3.01709 8.95135 3.01709 7.05002 3.01709H5.03335C3.13201 3.01709 2.18134 3.01709 1.59067 3.60776C1 4.19843 1 5.14912 1 7.05044C1 7.64022 1 8.13849 1.01763 8.56295"
                      stroke="#3D3D3D"
                      stroke-width="0.756253"
                      stroke-linecap="round"
                    />
                    <path
                      d="M6.0417 1C6.99236 1 7.46769 1 7.76303 1.29534C8.05837 1.59067 8.05837 2.066 8.05837 3.01667M4.32036 1.29534C4.02502 1.59067 4.02502 2.066 4.02502 3.01667"
                      stroke="#3D3D3D"
                      stroke-width="0.756253"
                      stroke-linecap="round"
                    />
                    <path
                      d="M6.04178 8.73091C6.59869 8.73091 7.05012 8.3547 7.05012 7.89066C7.05012 7.42658 6.59869 7.05037 6.04178 7.05037C5.48488 7.05037 5.03345 6.67416 5.03345 6.21007C5.03345 5.74603 5.48488 5.36982 6.04178 5.36982M6.04178 8.73091C5.48488 8.73091 5.03345 8.3547 5.03345 7.89066M6.04178 8.73091V9.06704M6.04178 5.36982V5.03369M6.04178 5.36982C6.59869 5.36982 7.05012 5.74603 7.05012 6.21007"
                      stroke="#3D3D3D"
                      stroke-width="0.756253"
                      stroke-linecap="round"
                    />
                  </svg>
                  {#if booking.status == "paid"}
                    <p class="info-text light">Paid</p>
                  {:else}
                    <p class="info-text light highlight">Pending</p>
                  {/if}
                </div>
                <div class="info-group">
                  <svg
                    width={iconWidth}
                    height={iconHeight}
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8.98945 4.02015L9.2334 3.78843C9.6375 3.40451 10.2928 3.40451 10.6969 3.78843C11.101 4.17236 11.101 4.79483 10.6969 5.17874L10.453 5.41049M8.98945 4.02015C8.98945 4.02015 9.01997 4.51256 9.47729 4.94703C9.93466 5.38149 10.453 5.41049 10.453 5.41049M8.98945 4.02015L6.74703 6.15044C6.59514 6.29474 6.51919 6.36689 6.45388 6.44644C6.37688 6.54029 6.31082 6.64184 6.25693 6.74924C6.21124 6.84034 6.17724 6.93709 6.10935 7.13069L5.89188 7.75049L5.82151 7.95099M10.453 5.41049L8.21056 7.54079C8.05866 7.68509 7.98271 7.75724 7.89898 7.81929C7.80019 7.89244 7.69329 7.95519 7.58024 8.00639C7.48435 8.04979 7.38251 8.08209 7.17872 8.14659L6.5263 8.35319L6.31524 8.42004M5.82151 7.95099L5.75114 8.15154C5.71772 8.24679 5.74382 8.35184 5.81856 8.42284C5.8933 8.49384 6.00388 8.51864 6.10414 8.48689L6.31524 8.42004M5.82151 7.95099L6.31524 8.42004"
                      stroke="#3D3D3D"
                      stroke-width="0.769735"
                    />
                    <path
                      d="M3.63147 6.50098H4.94726"
                      stroke="#3D3D3D"
                      stroke-width="0.769735"
                      stroke-linecap="round"
                    />
                    <path
                      d="M3.63147 4.5H7.05252"
                      stroke="#3D3D3D"
                      stroke-width="0.769735"
                      stroke-linecap="round"
                    />
                    <path
                      d="M3.63147 8.5H4.42094"
                      stroke="#3D3D3D"
                      stroke-width="0.769735"
                      stroke-linecap="round"
                    />
                    <path
                      d="M1 7V5C1 3.11438 1 2.17158 1.61661 1.58579C2.23323 1 3.22566 1 5.21052 1H6.26315C8.24798 1 9.24046 1 9.85703 1.58579M10.4737 7C10.4737 8.8856 10.4737 9.82845 9.85703 10.4142M9.85703 10.4142C9.24046 11 8.24798 11 6.26315 11H5.21052C3.22566 11 2.23323 11 1.61661 10.4142M9.85703 10.4142C10.3534 9.94265 10.4502 9.2398 10.4691 8"
                      stroke="#3D3D3D"
                      stroke-width="0.769735"
                      stroke-linecap="round"
                    />
                  </svg>
                  {#if booking.agreement_notification}
                    <p class="info-text light">Sent</p>
                  {:else}
                    <p class="info-text light highlight">In Queue</p>
                  {/if}
                  {#if booking.agreement_signed}
                    <p class="info-text light">& Signed</p>
                  {/if}
                </div>
              </div>
            </a>
          {/each}
        </div>
      {/if}
    </div>
  {:else}
    <div class="spinner bookings"></div>
    <div class="spinner-label">Bookings Building...</div>
  {/if}
</div>

<style>
  .bookings-selection-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--cms-boxShadow);
    min-width: 700px;
  }

  h2 {
    font-family: cms-bold;
    color: var(--cms-text);
    font-size: 24px;
    margin: 0px 20px 0px 20px;
  }
  .divider {
    margin: 0 0 20px 20px;
    width: 50px;
    height: 2px;
  }
  .bookings-header {
    display: flex;
    margin-top: 100px;
  }
  button.filter {
    font-family: cms-semibold;
    color: rgb(98, 98, 98);
    font-size: 13px;
    background-color: transparent;
    border-radius: 10px;
    border: 2px solid hsl(var(--b2));
    padding: 0px 10px;
    margin: 0 10px;
    height: 25px;
    align-self: flex-end;
    cursor: pointer;
    min-width: 60px;
  }
  button.filter:hover {
    background-color: rgb(243, 243, 243);
  }
  button.filter.active {
    background-color: hsl(var(--b2));
    border-color: rgb(212, 212, 212);
  }
  .all-bookings-container {
    padding: 25px;
    max-height: 100%;
    overflow-y: scroll;
  }
  .ind-bookings-container {
    margin-bottom: 25px;
    overflow-y: scroll;
    overflow-x: visible;
  }
  .section-title {
    font-family: cms-semibold;
    color: var(--text);
    font-size: 18px;
    margin-bottom: 15px;
  }
  .bookings-count {
    font-family: cms-bold;
    color: hsl(var(--p));
  }
  .booking-card {
    border: 1px solid hsl(var(--b2));
    border-radius: 10px;
    padding: 5px;
    display: flex;
    margin: 0 15px 20px;
    flex-grow: 1;
    transition: all 0.2s;
  }
  .booking-card:hover {
    background-color: hsl(var(--b1));
  }
  .unit-img {
    width: 70px;
    border-radius: 10px;
    height: 50px;
    background-size: cover;
    background-repeat: no-repeat;
    display: flex;
    justify-content: center;
    align-items: center;
    /* background-color: hsl(var(--b2)); */
    background-position: center;
  }
  .booking-info-container {
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    max-height: 70px;
    margin: auto 0;
  }
  .info-group {
    display: flex;
    align-items: center;
    padding: 0 8px;
    min-width: 170px;
  }
  .info-text {
    font-family: cms-semibold;
    margin-left: 5px;
    color: rgb(86, 86, 86);
    font-size: 16px;
  }
  .info-text.unit-name {
    font-family: cms-bold;
    color: hsl(var(--p));
  }
  .info-text.highlight {
    color: hsl(var(--wa));
  }
  .spinner {
    content: "";
    border-radius: 50%;
    border-top: 1px solid rgb(98, 98, 98);
    border-right: 1px solid transparent;
    animation-name: spinning;
    animation-duration: 1s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    opacity: 1;
    transition: all 0.2s;
    width: 10px;
    height: 10px;
    margin: 0 auto;
  }
  .spinner.bookings {
    height: 50px;
    width: 50px;
    border-top: 2px solid hsl(var(--p));
    border-right: 2px solid transparent;
    margin-top: 50px;
  }
  .spinner-label {
    margin: auto;
    font-family: cms-light;
    font-size: 12px;
    width: 120px;
    margin-top: 20px;
    text-align: center;
  }
  @keyframes spinning {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  @media (max-width: 1000px) {
    .bookings-selection-container {
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
