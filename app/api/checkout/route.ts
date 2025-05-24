import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const { priceId, email, userId } = await request.json();
    if (!priceId || !email || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }
    console.log("Creating checkout session for user:", userId);
    console.log("Price ID:", priceId);
    console.log("Customer email:", email);
    // Create a Checkout Session with the price ID and customer email
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/cancel`,
      metadata: {
        userId: userId,
      },
    });
    console.log("Checkout session created:", session.id);
    // Return the session ID to the client
    return NextResponse.json({ sessionId: session.id }, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
