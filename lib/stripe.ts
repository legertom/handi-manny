// Stripe stub. We're using the auth-on-booking, capture-on-confirm pattern.
// Real wiring goes here when the Stripe account exists.
//
// Production sketch:
//   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
//   const intent = await stripe.paymentIntents.create({
//     amount: priceCents,
//     currency: "usd",
//     capture_method: "manual",
//     payment_method_types: ["card"],
//     metadata: { bookingId },
//   });
//   // Confirm flow on Manny's dashboard:
//   await stripe.paymentIntents.capture(intent.id);
//   // Decline flow:
//   await stripe.paymentIntents.cancel(intent.id);

export type AuthorizeResult = {
  paymentIntentId: string;
  status: "authorized";
};

export async function authorizeCard(opts: {
  bookingId: string;
  amountDollars: number;
}): Promise<AuthorizeResult> {
  // eslint-disable-next-line no-console
  console.log(
    `[stripe:stub] authorize ${opts.amountDollars} for booking=${opts.bookingId}`
  );
  return {
    paymentIntentId: `pi_stub_${opts.bookingId.slice(0, 8)}`,
    status: "authorized",
  };
}

export async function captureAuthorization(paymentIntentId: string) {
  // eslint-disable-next-line no-console
  console.log(`[stripe:stub] capture ${paymentIntentId}`);
}

export async function voidAuthorization(paymentIntentId: string) {
  // eslint-disable-next-line no-console
  console.log(`[stripe:stub] void ${paymentIntentId}`);
}
