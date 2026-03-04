import { NextResponse } from "next/server";
import { stripe, getPlanFromPriceId } from "@/lib/stripe";
import { getAdminDb } from "@/lib/firebase-admin";
import Stripe from "stripe";

// Disable body parsing — Stripe needs the raw body for signature verification
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const db = getAdminDb();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const firebaseUid = session.metadata?.firebaseUid;

        if (!firebaseUid) {
          console.error("No firebaseUid in checkout session metadata");
          break;
        }

        // Get subscription details to determine plan
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        const priceId = subscription.items.data[0]?.price.id;
        const plan = getPlanFromPriceId(priceId) || "monthly";

        const trialEnd = subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null;

        await db.collection("users").doc(firebaseUid).set(
          {
            accountType: trialEnd ? "trial" : "subscriber",
            subscriptionStatus: subscription.status === "trialing" ? "trialing" : "active",
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            trialEndsAt: trialEnd,
            plan,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        console.log(`Checkout completed for user ${firebaseUid}, plan: ${plan}`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by stripeCustomerId
        const usersRef = db.collection("users");
        const snapshot = await usersRef
          .where("stripeCustomerId", "==", customerId)
          .limit(1)
          .get();

        if (snapshot.empty) {
          console.error(`No user found for Stripe customer ${customerId}`);
          break;
        }

        const userDoc = snapshot.docs[0];
        const priceId = subscription.items.data[0]?.price.id;
        const plan = getPlanFromPriceId(priceId);

        const isTrialing = subscription.status === "trialing";
        const isActive = subscription.status === "active";

        await userDoc.ref.update({
          accountType: isTrialing ? "trial" : isActive ? "subscriber" : "free",
          subscriptionStatus: subscription.status,
          plan: plan || userDoc.data().plan,
          subscriptionEndsAt: subscription.items.data[0]?.current_period_end
            ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
            : null,
          trialEndsAt: subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null,
          updatedAt: new Date().toISOString(),
        });

        console.log(`Subscription updated for customer ${customerId}: ${subscription.status}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const usersRef = db.collection("users");
        const snapshot = await usersRef
          .where("stripeCustomerId", "==", customerId)
          .limit(1)
          .get();

        if (!snapshot.empty) {
          await snapshot.docs[0].ref.update({
            accountType: "free",
            subscriptionStatus: "canceled",
            plan: null,
            updatedAt: new Date().toISOString(),
          });
          console.log(`Subscription canceled for customer ${customerId}`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const usersRef = db.collection("users");
        const snapshot = await usersRef
          .where("stripeCustomerId", "==", customerId)
          .limit(1)
          .get();

        if (!snapshot.empty) {
          await snapshot.docs[0].ref.update({
            subscriptionStatus: "past_due",
            updatedAt: new Date().toISOString(),
          });
          console.log(`Payment failed for customer ${customerId}`);
        }
        break;
      }

      default:
        // Unhandled event type — that's fine
        break;
    }
  } catch (err) {
    console.error(`Error handling webhook event ${event.type}:`, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
