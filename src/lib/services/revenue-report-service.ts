import admin from "firebase-admin";
import type { Firestore } from "firebase-admin/firestore";
import type { RevenueReport } from "$lib/new_types/RevenueReport";

export class RevenueReportService {
  private db: Firestore;

  constructor(firestore: Firestore) {
    this.db = admin.firestore();
  }

  // Check if today is the last day of a quarter
  private isQuarterEnd(date: Date): boolean {
    const month = date.getMonth();
    const day = date.getDate();
    return (
      (month === 2 && day === 31) || // Q1: March 31
      (month === 5 && day === 30) || // Q2: June 30
      (month === 8 && day === 30) || // Q3: September 30
      (month === 11 && day === 31) // Q4: December 31
    );
  }

  // Fetch the latest report
  async getLatestReport(): Promise<RevenueReport | null> {
    const snapshot = await this.db
      .collection("revenue_reports")
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as RevenueReport;
  }

  // Fetch bookings for a specific date range
  async fetchBookings(startDate: Date, endDate: Date): Promise<any[]> {
    const startTimestamp = admin.firestore.Timestamp.fromDate(startDate);
    const endTimestamp = admin.firestore.Timestamp.fromDate(endDate);

    const bookingsSnapshot = await this.db
      .collectionGroup("bookings")
      .where("payment_intent.status", "==", "succeeded")
      .where("created", ">=", startTimestamp)
      .where("created", "<=", endTimestamp)
      .get();

    const bookings: any[] = [];
    bookingsSnapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() });
    });

    return bookings;
  }

  // Calculate revenue metrics
  async calculateRevenueReport(date: Date): Promise<RevenueReport> {
    const previousReport = await this.getLatestReport();
    const monthlyRevenue: { [month: string]: number } =
      previousReport?.monthlyRevenue || {};
    const quarterlyRevenue: { [quarter: string]: number } =
      previousReport?.quarterlyRevenue || {};

    let ytdRevenue: number;
    const dailyBookingIds: string[] = [];

    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch bookings for the current day
    const dailyBookings = await this.fetchBookings(startOfDay, endOfDay);

    let dailyRevenue = 0;

    for (const booking of dailyBookings) {
      if (
        booking.payment_intent &&
        booking.payment_intent.status === "succeeded" &&
        booking.payment_intent.amount_received
      ) {
        const amount = booking.payment_intent.amount_received / 100;
        dailyRevenue += amount;
        dailyBookingIds.push(booking.id);
      }
    }

    const monthKey = `${year}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + dailyRevenue;

    // Update quarterly revenue at quarter-end
    if (this.isQuarterEnd(date)) {
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      const quarterKey = `${year}-Q${quarter}`;
      const startOfQuarter = new Date(year, (quarter - 1) * 3, 1);
      const endOfQuarter = new Date(year, quarter * 3, 0);

      const quarterBookings = await this.fetchBookings(
        startOfQuarter,
        endOfQuarter
      );
      let quarterRevenue = 0;
      for (const booking of quarterBookings) {
        if (
          booking.payment_intent &&
          booking.payment_intent.status === "succeeded" &&
          booking.payment_intent.amount_received
        ) {
          quarterRevenue += booking.payment_intent.amount_received / 100;
        }
      }
      quarterlyRevenue[quarterKey] = quarterRevenue;
    } else if (previousReport) {
      Object.assign(quarterlyRevenue, previousReport.quarterlyRevenue);
    }

    // Calculate YTD Revenue if missing or no previous report
    if (!previousReport || typeof previousReport.ytdRevenue !== "number") {
      ytdRevenue = 0;
      const ytdBookings = await this.fetchBookings(startOfYear, endOfDay);

      for (const booking of ytdBookings) {
        if (
          booking.payment_intent &&
          booking.payment_intent.status === "succeeded" &&
          booking.payment_intent.amount_received
        ) {
          ytdRevenue += booking.payment_intent.amount_received / 100;

          const bookingDate = booking.created.toDate();
          const monthKey = `${bookingDate.getFullYear()}-${String(
            bookingDate.getMonth() + 1
          ).padStart(2, "0")}`;
          monthlyRevenue[monthKey] =
            (monthlyRevenue[monthKey] || 0) +
            booking.payment_intent.amount_received / 100;

          const quarter = Math.floor(bookingDate.getMonth() / 3) + 1;
          const quarterKey = `${bookingDate.getFullYear()}-Q${quarter}`;
          quarterlyRevenue[quarterKey] =
            (quarterlyRevenue[quarterKey] || 0) +
            booking.payment_intent.amount_received / 100;
        }
      }
    } else {
      // Use previous ytdRevenue and add today's revenue
      ytdRevenue = previousReport.ytdRevenue + dailyRevenue;
    }

    return {
      date: date.toISOString().split("T")[0],
      dailyRevenue,
      dailyBookingIds,
      monthlyRevenue,
      quarterlyRevenue,
      ytdRevenue,
      createdAt: new Date().toISOString(),
    };
  }

  // Save report to Firestore
  async saveReport(report: RevenueReport): Promise<void> {
    await this.db.collection("revenue_reports").doc(report.date).set(report);
  }

  // Fetch reports for a date range (for drill-down)
  async getReportsForRange(
    startDate: Date,
    endDate: Date
  ): Promise<RevenueReport[]> {
    const snapshot = await this.db
      .collection("revenue_reports")
      .where("date", ">=", startDate.toISOString().split("T")[0])
      .where("date", "<=", endDate.toISOString().split("T")[0])
      .get();

    return snapshot.docs.map((doc) => doc.data() as RevenueReport);
  }
}
