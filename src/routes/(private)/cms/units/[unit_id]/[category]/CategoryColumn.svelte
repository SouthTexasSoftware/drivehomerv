<script lang="ts">
  import { newUnitModel } from "$lib/helpers";
  import { page } from "$app/stores";
  import { beforeUpdate, onMount } from "svelte";
  import type { Booking, Unit } from "$lib/types";
  import { DateTime } from "@easepick/bundle";
  import { afterNavigate, goto } from "$app/navigation";
  import { cmsStore, firebaseStore, unitStore } from "$lib/stores";
  import { createEventDispatcher } from "svelte";
  import {
    collection,
    getDocs,
    onSnapshot,
    query,
    where,
  } from "firebase/firestore";

  export let unitObject: Unit;

  let subcategoryList: string[] = [];
  let subcategoryLabels: string[] = [];
  let showingSubcategory: { [key: string]: boolean } = {};

  let loadingPastBookings = false;

  let dispatch = createEventDispatcher();

  afterNavigate(() => {
    getUnitModelInformation();
    dispatch("closeMobileColumn", true);
    if (!unitObject.sessionOnly) {
      unitObject.sessionOnly = {};
      unitObject.sessionOnly.pastBookingsLoaded = false;
      attachBookingsListener();
    } else if (!unitObject.sessionOnly.bookingsListener) {
      attachBookingsListener();
    }
  });

  onMount(() => {
    if (subcategoryList.length == 0) {
      getUnitModelInformation();
    }
    if (!unitObject.sessionOnly) {
      unitObject.sessionOnly = {};
      unitObject.sessionOnly.pastBookingsLoaded = false;
      attachBookingsListener();
    }
  });

  function getUnitModelInformation() {
    if ($unitStore.isPopulated == false) {
      console.log("unit store not populated, rerun in .2 seconds");
      setTimeout(getUnitModelInformation, 200);
      return;
    }

    try {
      //@ts-ignore
      if (!newUnitModel[$page.params.category]) {
        // THIS SECTION IS BASICALLY FOR BOOKINGS ONLY RIGHT NOW.
        if (unitObject.bookings) {
          unitObject.bookings.sort((bookingA, bookingB) => {
            if (bookingA.start == "undefined") {
              return -1;
            }
            if (bookingB.start == "undefined") {
              return 1;
            }

            let bookingAstart = new DateTime(bookingA.start, "MMM-DD-YYYY");
            let bookingBstart = new DateTime(bookingB.start, "MMM-DD-YYYY");
            if (bookingAstart.isBefore(bookingBstart)) {
              return 1;
            }
            return -1;
          });

          subcategoryList = unitObject.bookings.map((booking) => {
            if (booking.id) {
              return booking.id;
            }
            return "noBookingIdFound";
          });
          subcategoryLabels = unitObject.bookings.map((booking) => {
            if (booking.start != "undefined" && booking.end != "undefined") {
              let startDateTime = new DateTime(booking.start, "MMM-DD-YYYY");
              let endDateTime = new DateTime(booking.end, "MMM-DD-YYYY");

              let startMonth = startDateTime.toDateString();
              startMonth = startMonth.slice(3, 7);
              let startDay = startDateTime.getDate();
              let startDayString = ordinal_suffix_of(startDay);

              let endMonth = endDateTime.toDateString();
              endMonth = endMonth.slice(3, 7);
              let endDay = endDateTime.getDate();
              let endDayString = ordinal_suffix_of(endDay);

              let fullString =
                startMonth +
                " " +
                startDayString +
                " - " +
                endMonth +
                " " +
                endDayString;

              return fullString;
            }
            return "No Dates - " + booking.id?.slice(0, 4);
          });
        }
      } else {
        // THIS SECTION FOR PHOTOS & INFORMATION
        //@ts-ignore
        subcategoryList = Object.keys(newUnitModel[$page.params.category]);

        // list of formatted string keys
        subcategoryLabels = subcategoryList.map((key) => {
          return objectKeyToLabel(key);
        });
      }

      // used to un/collapse subcategories
      subcategoryList.forEach((key: string) => {
        showingSubcategory[key] = false;
      });
    } catch (e) {
      console.error(e);
    }
  }

  function getOptions(key: string) {
    // check if in bookings category.. then just build standard options
    if ($page.params.category == "bookings") {
      return ["Overview", "Photos", "Documents"];
    }
    //@ts-ignore
    return Object.keys(newUnitModel[$page.params.category][key]);
  }

  /**
   * Adds the appropriate ending to a dates number '22nd or 28th' etc
   * @param i Number to format
   */
  function ordinal_suffix_of(i: number) {
    var j = i % 10,
      k = i % 100;
    if (j == 1 && k != 11) {
      return i + "st";
    }
    if (j == 2 && k != 12) {
      return i + "nd";
    }
    if (j == 3 && k != 13) {
      return i + "rd";
    }
    return i + "th";
  }

  function objectKeyToLabel(key: string) {
    let label = key.replaceAll("_", " ");
    label = label.replaceAll("and", "&");

    return label.replace(/(^|\s)\S/g, function (t) {
      return t.toUpperCase();
    });
  }

  async function loadPastBookings() {
    if (loadingPastBookings) return;
    loadingPastBookings = true;

    let bookingsCollection = collection(
      $firebaseStore.db,
      "units",
      unitObject.id,
      "bookings"
    );
    let todaysDate = new DateTime();
    let todaysUnixTimestamp = Math.ceil(todaysDate.getTime() / 1000);
    let pastBookingsQuery = query(
      bookingsCollection,
      where("unix_end", "<=", todaysUnixTimestamp)
    );

    let pastBookings = await getDocs(pastBookingsQuery);

    for (let booking of pastBookings.docs) {
      unitObject.bookings?.push(booking.data() as Booking);
    }

    getUnitModelInformation();

    if (!unitObject.sessionOnly) {
      unitObject.sessionOnly = {};
      unitObject.sessionOnly.pastBookingsLoaded = true;
    } else {
      unitObject.sessionOnly.pastBookingsLoaded = true;
    }

    unitObject.sessionOnly.bookingsListener();
    attachBookingsListener();

    cmsStore.update((storeData) => {
      storeData.triggerRefresh = !storeData.triggerRefresh;
      return storeData;
    });

    loadingPastBookings = false;
  }

  async function attachBookingsListener() {
    let unitsBookingCollectionRef = collection(
      $firebaseStore.db,
      "units",
      unitObject.id,
      "bookings"
    );

    let todaysDate = new DateTime();
    let todaysUnixTimestamp = Math.ceil(todaysDate.getTime() / 1000);

    let collectionQuery = query(
      unitsBookingCollectionRef,
      where("unix_end", ">=", todaysUnixTimestamp)
    );

    if (unitObject.sessionOnly?.pastBookingsLoaded) {
      collectionQuery = query(unitsBookingCollectionRef);
    }

    const unsubscribe = onSnapshot(collectionQuery, (querySnapshot) => {
      let updatedBookingsArray: Booking[] = [];
      querySnapshot.forEach((doc) => {
        updatedBookingsArray.push(doc.data() as Booking);
      });
      unitObject.bookings = updatedBookingsArray;
      getUnitModelInformation();
    });
    if (unitObject.sessionOnly) {
      unitObject.sessionOnly.bookingsListener = unsubscribe;
    } else {
      unitObject.sessionOnly = {};
      unitObject.sessionOnly.bookingsListener = unsubscribe;
    }
  }
</script>

<div class="column-container">
  {#each subcategoryLabels as subcategory, index}
    <button
      class="subcategory-title"
      on:click={() => {
        showingSubcategory[subcategory] = !showingSubcategory[subcategory];
        if (showingSubcategory[subcategory]) {
          let optionsWithin = getOptions(subcategoryList[index]);
          console.log(optionsWithin[0]);
          goto(
            "/cms/units/" +
              $page.params.unit_id +
              "/" +
              $page.params.category +
              "/" +
              subcategoryList[index] +
              "/" +
              optionsWithin[0]
          );
        }
      }}
    >
      <p class:active={$page.params.subcategory == subcategoryList[index]}>
        {subcategory.toUpperCase()}
      </p>
      <svg
        class:showing={showingSubcategory[subcategory]}
        xmlns="http://www.w3.org/2000/svg"
        width="9"
        height="5"
        viewBox="0 0 9 5"
        fill="none"
      >
        <g clip-path="url(#clip0_135_337)">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M3.65331 4.5284C3.54996 4.49149 3.4643 4.43796 3.40524 4.37336L0.55403 1.25485C0.371356 1.05505 0.482421 0.800525 0.802099 0.686354C0.902831 0.650378 1.01684 0.631455 1.13286 0.631455L6.83529 0.631455C7.20348 0.631455 7.50195 0.818003 7.50195 1.04812C7.50195 1.12063 7.47168 1.19189 7.41412 1.25485L4.5629 4.37336C4.38023 4.57316 3.97299 4.64257 3.65331 4.5284Z"
            fill="#3D3D3D"
          />
        </g>
        <defs>
          <clipPath id="clip0_135_337">
            <rect
              width="8"
              height="5"
              fill="white"
              transform="matrix(-1 0 0 -1 8.00195 5)"
            />
          </clipPath>
        </defs>
      </svg>
    </button>
    {#if showingSubcategory[subcategory]}
      <div class="subcategory-options">
        {#each getOptions(subcategoryList[index]) as option}
          <a
            href="/cms/units/{$page.params.unit_id}/{$page.params
              .category}/{subcategoryList[index]}/{option}"
            class:active={$page.params.option == option &&
              $page.params.subcategory == subcategoryList[index]}
            class="option-link"
          >
            {objectKeyToLabel(option)}
          </a>
        {/each}
      </div>
    {/if}
  {/each}
  {#if $page.params.category == "bookings"}
    {#if unitObject.sessionOnly}
      {#if unitObject.sessionOnly.pastBookingsLoaded == false}
        <button class="load-past-bookings" on:click={loadPastBookings}>
          {#if loadingPastBookings}
            <div class="spinner" />
          {:else}
            Load Past Bookings
          {/if}
        </button>
      {/if}
    {/if}
  {/if}
</div>

<style>
  .column-container {
    overflow-y: scroll;
    padding-bottom: 100px;
    display: flex;
    flex-direction: column;
  }
  .subcategory-title {
    display: flex;
    align-items: flex-end;
    margin-top: 15px;
    padding: 0px 20px;
  }
  .subcategory-title p {
    font-family: cms-semibold;
    font-size: 14px;
  }
  .subcategory-title p.active {
    color: hsl(var(--p));
  }
  svg {
    margin-left: 15px;
    margin-bottom: 8px;
    transition: 0.4s all;
  }
  svg.showing {
    transform: rotate(180deg);
  }
  .subcategory-options {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .option-link {
    font-family: cms-regular;
    transition: all 0.3s;
    padding: 5px 30px;
  }
  .option-link.active {
    background-color: var(--cms-highlightPrimary);
    border-right: 3px solid hsl(var(--p));
  }

  .load-past-bookings {
    background-color: hsl(var(--p));
    font-family: font-bold;
    color: hsl(var(--b1));
    text-align: center;
    align-self: flex-start;
    height: 24px;
    width: 156px;
    border-radius: 4px;
    margin-top: 14px;
    margin-left: 19px;
    font-size: 14px;
  }

  @media (max-width: 500px) {
    .column-container {
      width: 100%;
      background-color: #fafafa;
      border: 1px solid hsl(var(--b2));
    }
  }

  .spinner {
    content: "";
    border-radius: 50%;
    border-top: 1px solid hsl(var(--b1));
    border-right: 1px solid transparent;
    animation-name: spinning;
    animation-duration: 1s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    opacity: 1;
    transition: all 0.2s;
    width: 15px;
    height: 15px;
    margin: 0 auto;
  }

  @keyframes spinning {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
