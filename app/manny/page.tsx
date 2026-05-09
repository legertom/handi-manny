import type { Metadata } from "next";
import { listBookings } from "@/lib/store";
import { MannyDashboard } from "@/components/manny/dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manny's desk",
  robots: { index: false },
};

export default function MannyPage() {
  const bookings = listBookings();
  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <MannyDashboard initialBookings={bookings} />
    </div>
  );
}
