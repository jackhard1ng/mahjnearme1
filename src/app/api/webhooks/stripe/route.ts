import { NextResponse } from "next/server";
import { getStripe, getPlanFromPriceId } from "@/lib/stripe";
import { getAdminDb } from "@/lib/firebase-admin";
import { sendWelcomeEmail } from "@/lib/email";
import Stripe from "stripe";
import type { Firestore } from "firebase-admin/firestore";

// Disable body parsing. Stripe needs the raw body for signature verification
export const runtime = "nodejs";

/**
 * When a user subscribes (or cancels), propagate promoted status to their
 * organizer profile and all linked listings.
 */
async function promoteOrganizerListings(
  db: Firestore,
  userId: string,
  promoted: boolean
) {
  try {
    // Find organizer profile linked to this user
    const orgSnap = await db
      .collection("organizers")
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (orgSnap.empty) return; // not an organizer — nothing to do

    const orgDoc = orgSnap.docs[0];
    const orgId = orgDoc.id;

    // Mark organizer as verified (they have an active account)
    if (promoted) {
      await orgDoc.ref.update({ verified: true, updatedAt: new Date().toISOString() });
    }

    // Update all listings owned by this organizer
    const listingsSnap = await db
      .collection("listings")
      .where("organizerId", "==", orgId)
      .get();

    const batch = db.batch();
    for (const doc of listingsSnap.docs) {
      batch.update(doc.ref, { promoted, updatedAt: new Date().toISOString() });
    }
    if (!listingsSnap.empty) {
      await batch.commit();
      console.log(`[Stripe] ${promoted ? "Promoted" : "Unpromoted"} ${listingsSnap.size} listings for organizer ${orgId}`);
    }
  } catch (err) {
    // Non-fatal: log and continue so the webhook doesn't fail
    console.error("[Stripe] Error syncing organizer listings:", err);
  }
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
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
        const subscription = await getStripe().subscriptions.retrieve(
          session.subscription as string
        );
        const priceId = subscription.items.data[0]?.price.id;
        const plan = getPlanFromPriceId(priceId) || "monthly";

        // Capture the price amount for grandfathering
        const priceAmount = subscription.items.data[0]?.price.unit_amount
          ? subscription.items.data[0].price.unit_amount / 100
          : null;

        // Check for referral code in session metadata
        const referredByCode = session.metadata?.referralCode || null;

        await db.collection("users").doc(firebaseUid).set(
          {
            accountType: "subscriber",
            subscriptionStatus: "active",
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            plan,
            subscribedPrice: priceAmount,
            subscribedDate: new Date().toISOString(),
            subscriptionEndsAt: subscription.items.data[0]?.current_period_end
              ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
              : null,
            isGrandfathered: false,
            referredByCode,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        // Send welcome email to new subscriber
        const customerEmail = session.customer_email || session.customer_details?.email;
        if (customerEmail) {
          await sendWelcomeEmail({
            to: customerEmail,
            name: session.customer_details?.name || "",
            isSubscriber: true,
            plan,
          });
        }

        // If referred, create a referral record
        if (referredByCode) {
          const contributorSnapshot = await db.collection("users")
            .where("referralCode", "==", referredByCode)
            .limit(1)
            .get();

          if (!contributorSnapshot.empty) {
            const vestingDate = new Date();
            vestingDate.setDate(vestingDate.getDate() + 60);

            await db.collection("referrals").add({
              referralCode: referredByCode,
              contributorId: contributorSnapshot.docs[0].id,
              subscriberId: firebaseUid,
              subscriberSignupDate: new Date().toISOString(),
              plan,
              status: "active",
              vestingDate: vestingDate.toISOString(),
              isVested: false,
              createdAt: new Date().toISOString(),
            });
          }
        }

        // Auto-promote: if this user is an organizer, mark their listings as promoted
        // and ensure organizer doc is verified.
        await promoteOrganizerListings(db, firebaseUid, true);

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

        const isActive = subscription.status === "active" || subscription.status === "trialing";

        await userDoc.ref.update({
          accountType: isActive ? "subscriber" : "free",
          subscriptionStatus: isActive ? "active" : subscription.status,
          plan: plan || userDoc.data().plan,
          subscriptionEndsAt: subscription.items.data[0]?.current_period_end
            ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
            : null,
          updatedAt: new Date().toISOString(),
        });

        // Sync promoted status on listings
        await promoteOrganizerListings(db, userDoc.id, isActive);

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

          // Remove promoted status from their listings
          await promoteOrganizerListings(db, snapshot.docs[0].id, false);

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
        // Unhandled event type, that's fine
        break;
    }
  } catch (err) {
    console.error(`Error handling webhook event ${event.type}:`, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
