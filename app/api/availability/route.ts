import { NextResponse } from "next/server";
import { getUpcomingAvailability } from "@/lib/availability";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const duration = Number(searchParams.get("duration") ?? "60");
  const days = Number(searchParams.get("days") ?? "14");
  const safeDuration = Math.min(Math.max(duration, 30), 480);
  const safeDays = Math.min(Math.max(days, 1), 30);

  const result = getUpcomingAvailability(safeDuration, safeDays);
  return NextResponse.json({ days: result });
}
