import type { Metadata } from "next";
import { BookingFlow } from "@/components/booking/booking-flow";
import { SERVICES } from "@/lib/services";

export const metadata: Metadata = {
  title: "Book a job",
  description: "Pick a service, choose a time, and Manny will confirm in under 2 hours.",
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service: initialServiceId } = await searchParams;
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <BookingFlow services={SERVICES} initialServiceId={initialServiceId} />
    </div>
  );
}
