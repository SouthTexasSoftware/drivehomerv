<script lang="ts">
  import { onMount } from "svelte";
  import type { RevenueReport } from "$lib/new_types/RevenueReport";

  let report: RevenueReport | null = null;
  let loading = true;
  let error: string | null = null;
  let regenerating = false;
  let successMessage: string | null = null;

  onMount(async () => {
    await fetchLatestReport();
  });

  async function fetchLatestReport() {
    try {
      const response = await fetch("/api/revenue_reports", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to fetch report");
      report = await response.json();
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown error";
    } finally {
      loading = false;
    }
  }

  async function regenerateReport() {
    regenerating = true;
    error = null;
    successMessage = null;

    try {
      const response = await fetch("/api/revenue_reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to regenerate report");
      const data = await response.json();
      successMessage = data.message;
      await fetchLatestReport(); // Refresh the report after regeneration
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown error";
    } finally {
      regenerating = false;
    }
  }

  function formatMonthLabel(month: string): string {
    const [year, monthNum] = month.split("-");
    const date = new Date(Number(year), Number(monthNum) - 1);
    return `${date.toLocaleString("default", { month: "long" })} ${year}`;
  }

  function sortedMonthlyEntries(
    monthly: Record<string, number>
  ): [string, number][] {
    return Object.entries(monthly).sort(([a], [b]) => b.localeCompare(a));
  }

  function sortedQuarterlyEntries(
    quarterly: Record<string, number>
  ): [string, number][] {
    return Object.entries(quarterly).sort(([a], [b]) => {
      const [yearA, qA] = a.split("-Q").map(Number);
      const [yearB, qB] = b.split("-Q").map(Number);
      return yearA !== yearB ? yearA - yearB : qA - qB;
    });
  }

  function formatPrettyDate(dateStr: string, includeTime?: boolean): string {
    const date = parseLocalDate(dateStr);

    const weekday = date.toLocaleString("en-US", { weekday: "long" });
    const month = date.toLocaleString("en-US", { month: "long" });
    const day = date.getDate();
    const suffix = getOrdinalSuffix(day);

    return `${weekday}, ${month} ${day}${suffix}`;
  }

  function formatTimestampPretty(timestamp: string): string {
    const date = new Date(timestamp); // ISO 8601 string

    const weekday = date.toLocaleString("en-US", { weekday: "long" });
    const month = date.toLocaleString("en-US", { month: "long" });
    const day = date.getDate();
    const suffix = getOrdinalSuffix(day);

    const time = date
      .toLocaleString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase(); // e.g., "4:44 PM" => "4:44 pm"

    return `${weekday}, ${month} ${day}${suffix} at ${time}`;
  }

  function getOrdinalSuffix(day: number): string {
    if (day >= 11 && day <= 13) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  }
  function parseLocalDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  }

  // Placeholder for drill-down
  async function drillDown(period: string, key: string) {
    console.log(`Drilling down into ${period}: ${key}`);
  }
</script>

<div class="container mx-auto p-4 font-[cms-regular] mt-10">
  <div class="flex justify-start items-center -mb-1">
    <h1 class="text-2xl font-[cms-bold] text-gray-800">Revenue Reports</h1>

    <!-- <button
      on:click={regenerateReport}
      disabled={regenerating}
      class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-[cms-medium]"
    >
      {#if regenerating}
        <span class="flex items-center">
          <svg
            class="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Regenerating...
        </span>
      {:else}
        Regenerate Report
      {/if}
    </button> -->
  </div>
  {#if report}
    <h5 class="text-sm font-[cms-light] text-gray-700 mb-6 mt-2">
      Last Run: {formatTimestampPretty(report.createdAt)}
    </h5>
  {/if}

  {#if successMessage}
    <div
      class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4 font-[cms-regular]"
      role="alert"
    >
      <strong class="font-[cms-semibold]">Success:</strong>
      {successMessage}
    </div>
  {/if}

  {#if loading}
    <div class="flex justify-center items-center h-64">
      <div
        class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-800"
      ></div>
    </div>
  {:else if error}
    <div
      class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg font-[cms-regular]"
      role="alert"
    >
      <strong class="font-[cms-semibold]">Error:</strong>
      {error}
    </div>
  {:else if report}
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <!-- Daily Revenue -->
      <div class="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
        <h2 class="text-lg font-[cms-semibold] text-gray-700">Daily Revenue</h2>
        <p class="text-3xl font-[cms-bold] text-gray-900 mt-2">
          ${report.dailyRevenue.toLocaleString()}
        </p>
        <p class="text-sm text-gray-500 mt-1 font-[cms-light]">
          For {formatPrettyDate(report.date)}
        </p>
        {#if report.dailyBookingIds.length > 0}
          <div class="mt-4">
            <h3 class="text-sm font-[cms-semibold] text-gray-600">Bookings</h3>
            <ul class="mt-2 space-y-1">
              {#each report.dailyBookingIds as bookingId}
                <li>
                  <a
                    href={`/cms/bookings/${bookingId}`}
                    class="text-sm text-red-800 hover:underline font-[cms-regular]"
                  >
                    Booking #{bookingId.slice(0, 8)}...
                  </a>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>

      <!-- YTD Revenue -->
      <div class="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
        <h2 class="text-lg font-[cms-semibold] text-gray-700">
          Year-to-Date Revenue
        </h2>
        <p class="text-3xl font-[cms-bold] text-gray-900 mt-2">
          ${report.ytdRevenue.toLocaleString()}
        </p>
        <p class="text-sm text-gray-500 mt-1 font-[cms-light]">
          As of {formatPrettyDate(report.date)}
        </p>
      </div>

      <!-- Monthly Revenue -->
      <div class="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
        <h2 class="text-lg font-[cms-semibold] text-gray-700">
          Monthly Revenue
        </h2>
        {#each sortedMonthlyEntries(report.monthlyRevenue) as [month, amount]}
          <div class="mt-2 flex justify-between items-center">
            <button
              on:click={() => drillDown("month", month)}
              class="text-sm font-[cms-medium] text-red-800 hover:underline"
            >
              {formatMonthLabel(month)}
            </button>
            <span class="text-sm font-[cms-bold] text-gray-900">
              ${amount.toLocaleString()}
            </span>
          </div>
        {/each}
      </div>

      <!-- Quarterly Revenue -->
      <div class="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
        <h2 class="text-lg font-[cms-semibold] text-gray-700">
          Quarterly Revenue
        </h2>
        {#each sortedQuarterlyEntries(report.quarterlyRevenue) as [quarter, amount]}
          <div class="mt-2 flex justify-between items-center">
            <button
              on:click={() => drillDown("quarter", quarter)}
              class="text-sm font-[cms-medium] text-red-800 hover:underline"
            >
              {quarter}
            </button>
            <span class="text-sm font-[cms-bold] text-gray-900">
              ${amount.toLocaleString()}
            </span>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div
      class="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-[cms-regular]"
    >
      No revenue data available.
    </div>
  {/if}
</div>
