import { NextResponse } from "next/server";
import { getBooking, updateBooking } from "@/lib/store";
import { captureAuthorization } from "@/lib/stripe";
import { notifyCustomer } from "@/lib/notify";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const booking = getBooking(id);
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (booking.status !== "pending") {
    return NextResponse.json(
      { error: `Cannot confirm a ${booking.status} booking` },
      { status: 409 }
    );
  }

  // In production: capture happens after the job is completed, not on confirm.
  // For now we mark as confirmed and notify the customer.
  // TODO when Stripe is wired: call stripe.paymentIntents.capture(pi) on completion, not here.
  if (booking.stripePaymentIntentId) {
    await captureAuthorization(booking.stripePaymentIntentId);
  }

  const updated = updateBooking(id, { status: "confirmed" });
  if (updated) await notifyCustomer(updated, "booking_confirmed");

  return NextResponse.json({ booking: updated });
}
