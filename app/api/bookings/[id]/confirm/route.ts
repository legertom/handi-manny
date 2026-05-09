import { NextResponse } from "next/server";
import { getBooking, updateBooking } from "@/lib/store";
import { captureAuthorization } from "@/lib/stripe";
import { notifyCustomer } from "@/lib/notify";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const booking = await getBooking(id);
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (booking.status !== "pending") {
    return NextResponse.json(
      { error: `Cannot confirm a ${booking.status} booking` },
      { status: 409 }
    );
  }

  if (booking.stripePaymentIntentId) {
    await captureAuthorization(booking.stripePaymentIntentId);
  }

  const updated = await updateBooking(id, { status: "confirmed" });
  if (updated) await notifyCustomer(updated, "booking_confirmed");

  return NextResponse.json({ booking: updated });
}
