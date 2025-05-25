import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/prisma";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature") || "";

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 },
      );
    }

    // Handle the checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session: Stripe.Checkout.Session = event.data
        .object as Stripe.Checkout.Session;
      console.log(session);
      const userId = session.metadata?.userId;

      if (!userId) {
        console.error("No userId found in session metadata");
        return NextResponse.json(
          { error: "No userId in metadata" },
          { status: 400 },
        );
      }

      if (!session.subscription) {
        console.error("No subscription found in completed session");
        return NextResponse.json(
          { error: "No subscription in session" },
          { status: 400 },
        );
      }

      try {
        // Get the subscription details from Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(
          session.subscription as string,
        );

        console.log("Retrieved subscription:", stripeSubscription);

        // Set planExpires to null initially - it will be updated by subscription.updated event
        console.log(
          "Setting planExpires to null for initial checkout completion",
        );

        // Update the user with Stripe subscription data
        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeCustomerId: session.customer as string,
            subscriptionId: stripeSubscription.id,
            planActive: stripeSubscription.status === "active",
            planExpires: null, // Set to null initially, will be updated by subscription.updated event
          },
        });

        console.log(
          `Successfully updated user ${userId} with subscription ${stripeSubscription.id}`,
        );
        return NextResponse.json({ success: true }, { status: 200 });
      } catch (error) {
        console.error("Error updating user with subscription data:", error);
        return NextResponse.json(
          { error: "Failed to update user subscription" },
          { status: 500 },
        );
      }
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;

      try {
        // Find user by Stripe customer ID
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: subscription.customer as string },
        });

        if (user) {
          // Calculate the plan expires date based on billing cycle anchor and interval
          // since current_period_end might not be available in webhook events
          const billingCycleAnchor = (
            subscription as unknown as { billing_cycle_anchor: number }
          ).billing_cycle_anchor;
          const planInterval =
            (subscription as unknown as { plan: { interval: string } }).plan
              ?.interval || "month";
          const intervalCount =
            (subscription as unknown as { plan: { interval_count: number } })
              .plan?.interval_count || 1;

          console.log(
            "Updated subscription - billing cycle anchor:",
            billingCycleAnchor,
          );
          console.log("Plan interval:", planInterval, "count:", intervalCount);

          const anchorDate = new Date(billingCycleAnchor * 1000);

          // Calculate next billing date based on interval
          if (planInterval === "month") {
            anchorDate.setMonth(anchorDate.getMonth() + intervalCount);
          } else if (planInterval === "year") {
            anchorDate.setFullYear(anchorDate.getFullYear() + intervalCount);
          } else if (planInterval === "week") {
            anchorDate.setDate(anchorDate.getDate() + 7 * intervalCount);
          } else if (planInterval === "day") {
            anchorDate.setDate(anchorDate.getDate() + intervalCount);
          }

          const planExpires = anchorDate;

          // Validate the date
          if (isNaN(planExpires.getTime())) {
            console.error(
              "Invalid date created for planExpires in update:",
              planExpires,
            );
            return NextResponse.json(
              { error: "Invalid subscription expiration date" },
              { status: 500 },
            );
          }

          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionId: subscription.id,
              planActive: subscription.status === "active",
              planExpires: planExpires,
            },
          });

          console.log(
            `Successfully updated user ${user.id} subscription status`,
          );
        } else {
          console.error("User not found for customer:", subscription.customer);
        }

        return NextResponse.json({ success: true }, { status: 200 });
      } catch (error) {
        console.error("Error updating subscription:", error);
        return NextResponse.json(
          { error: "Failed to update subscription" },
          { status: 500 },
        );
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription: Stripe.Subscription = event.data
        .object as Stripe.Subscription;

      try {
        // Find user by Stripe customer ID
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: subscription.customer as string },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              planActive: false,
              planExpires: null,
            },
          });

          console.log(
            `Successfully deactivated subscription for user ${user.id}`,
          );
        } else {
          console.error("User not found for customer:", subscription.customer);
        }

        return NextResponse.json({ success: true }, { status: 200 });
      } catch (error) {
        console.error("Error deactivating subscription:", error);
        return NextResponse.json(
          { error: "Failed to deactivate subscription" },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
