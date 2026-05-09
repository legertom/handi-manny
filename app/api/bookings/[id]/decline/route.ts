import { NextResponse } from "next/server";
import { getBooking, updateBooking } from "@/lib/store";
import { voidAuthorization } from "@/lib/stripe";
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
      { error: `Cannot decline a ${booking.status} booking` },
      { status: 409 }
    );
  }

  if (booking.stripePaymentIntentId) {
    await voidAuthorization(booking.stripePaymentIntentId);
  }

  const updated = await updateBooking(id, { status: "declined" });
  if (updated) await notifyCustomer(updated, "booking_declined");

  return NextResponse.json({ booking: updated });
}
