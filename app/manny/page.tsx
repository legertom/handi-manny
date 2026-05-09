import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Loader2 } from "lucide-react";
import { listBookings } from "@/lib/store";
import { MannyDashboard } from "@/components/manny/dashboard";

export const metadata: Metadata = {
  title: "Manny's desk",
  robots: { index: false },
};

export default function MannyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted" />
        </div>
      }
    >
      <MannyContent />
    </Suspense>
  );
}

async function MannyContent() {
  await connection();
  const bookings = await listBookings();
  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <MannyDashboard initialBookings={bookings} />
    </div>
  );
}
