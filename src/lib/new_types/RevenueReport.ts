export interface RevenueReport {
  id?: string; // Firestore document ID (optional, auto-generated)
  date: string; // ISO date string (e.g., "2025-08-05")
  dailyRevenue: number; // Revenue for the specific day
  dailyBookingIds: string[]; // Booking IDs for the day's successful payments
  monthlyRevenue: {
    [month: string]: number; // e.g., { "2025-01": 15000, "2025-02": 20000 }
  };
  quarterlyRevenue: {
    [quarter: string]: number; // e.g., { "2025-Q1": 45000, "2025-Q2": 60000 }
  };
  ytdRevenue: number; // Year-to-date total, e.g., 105000
  createdAt: string; // ISO timestamp of report creation
}
