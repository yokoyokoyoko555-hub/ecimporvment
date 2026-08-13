import { NextResponse } from "next/server";
import { hasDatabase, query } from "@/lib/db";

export async function GET() {
  let database = "not_configured";
  if (hasDatabase) {
    try { await query("SELECT 1"); database = "connected"; } catch { database = "unavailable"; }
  }
  return NextResponse.json({ status: "ok", service: "ecimprovement", database, timestamp: new Date().toISOString() }, { status: database === "unavailable" ? 503 : 200 });
}
