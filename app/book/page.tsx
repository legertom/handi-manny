import { Suspense } from "react";
import type { Metadata } from "next";
import { Loader2 } from "lucide-react";
import { BookingFlow } from "@/components/booking/booking-flow";
import { SERVICES } from "@/lib/services";

export const metadata: Metadata = {
  title: "Book a job",
  description: "Pick a service, choose a time, and Manny will confirm in under 2 hours.",
};

export default function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted" />
        </div>
      }
    >
      <BookContent searchParams={searchParams} />
    </Suspense>
  );
}

async function BookContent({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service: initialServiceId } = await searchParams;
  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <BookingFlow services={SERVICES} initialServiceId={initialServiceId} />
    </div>
  );
}
