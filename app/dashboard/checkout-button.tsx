"use client";

import { loadStripe } from "@stripe/stripe-js";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function CheckoutButton() {
  const { data: session } = useSession();
  const handleCheckout = async () => {
    if (!session?.user?.email) {
      redirect("/api/auth/signin");
    }

    // Get user ID from API route
    const userResponse = await fetch("/api/user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: session.user.email,
      }),
    });

    if (!userResponse.ok) {
      return redirect("/api/auth/signin");
    }

    const { user } = await userResponse.json();
    if (!user) {
      return redirect("/api/auth/signin");
    }
    const stripe = await loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
    );
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
        email: session?.user?.email,
        userId: user.id,
      }),
    });
    const stripeSession = await response.json();
    await stripe?.redirectToCheckout({
      sessionId: stripeSession.sessionId,
    });
  };
  return (
    <div>
      <h1>Signup for a Plan</h1>
      <p>Clicking this button creates a new Stripe Checkout session</p>
      <button className="btn btn-accent" onClick={handleCheckout}>
        Buy Now
      </button>
    </div>
  );
}
