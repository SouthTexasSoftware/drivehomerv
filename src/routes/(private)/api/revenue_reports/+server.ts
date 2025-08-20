import type { RequestHandler } from "./$types";
import { initializeApp, getApp, cert } from "firebase-admin/app";
import { RevenueReportService } from "$lib/services/revenue-report-service";
import { json, error } from "@sveltejs/kit";
import admin from "firebase-admin";

import {
  FIREBASE_ADMIN_CLIENT_EMAIL,
  FIREBASE_ADMIN_PRIVATE_KEY,
  FIREBASE_ADMIN_PROJECT_ID,
} from "$env/static/private";
import { get } from "svelte/store";
import { serverAdminStore } from "$lib/stores";

let serverFirebase = get(serverAdminStore);

// Initialize Firebase Admin
if (!serverFirebase) {
  try {
    initializeApp({
      credential: cert({
        projectId: FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  } catch (e) {
    console.log(e);
  }

  const db = admin.firestore();

  serverAdminStore.set({
    app: serverFirebase,
    db: db,
  });
}

serverFirebase = get(serverAdminStore);

const reportService = new RevenueReportService(serverFirebase.db);

export const POST: RequestHandler = async () => {
  try {
    const report = await reportService.calculateRevenueReport(new Date());
    await reportService.saveReport(report);
    return json(
      { message: "Revenue report generated", report },
      { status: 200 }
    );
  } catch (err) {
    const errorObj = err as Error;
    throw error(500, `Failed to generate report: ${errorObj.message}`);
  }
};

export const GET: RequestHandler = async () => {
  try {
    const report = await reportService.getLatestReport();
    if (!report) {
      throw error(404, "No revenue reports found");
    }
    return json(report, { status: 200 });
  } catch (err) {
    const errorObj = err as Error;
    throw error(500, `Failed to fetch report: ${errorObj.message}`);
  }
};
