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

        // If the user has scheduled a cancellation (typically via the Stripe
        // billing portal) they keep access until the period ends, but we
        // record the flag so the account page can surface
        // "Subscription ends on X" instead of silently waiting.
        const cancelAtPeriodEnd = subscription.cancel_at_period_end === true;

        await userDoc.ref.update({
          accountType: isActive ? "subscriber" : "free",
          subscriptionStatus: isActive ? "active" : subscription.status,
          plan: plan || userDoc.data().plan,
          subscriptionCancelAtPeriodEnd: cancelAtPeriodEnd,
          subscriptionEndsAt: subscription.items.data[0]?.current_period_end
            ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
            : null,
          updatedAt: new Date().toISOString(),
        });

        // Sync promoted status on listings
        await promoteOrganizerListings(db, userDoc.id, isActive);

        console.log(
          `Subscription updated for customer ${customerId}: status=${subscription.status}, cancelAtPeriodEnd=${cancelAtPeriodEnd}`
        );
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
            subscriptionCancelAtPeriodEnd: false,
            updatedAt: new Date().toISOString(),
          });

          // Remove promoted status from their listings
          await promoteOrganizerListings(db, snapshot.docs[0].id, false);

          console.log(`Subscription canceled for customer ${customerId}`);
        }
        break;
      }

      case "charge.refunded": {
        // Fires when a charge is refunded (full or partial). We only act on
        // FULL refunds: partial refunds are typically prorations or goodwill
        // credits where the subscription should stay active.
        //
        // On a full refund we:
        //   1. Cancel the linked Stripe subscription (if still active).
        //      This fires customer.subscription.deleted which the handler
        //      above uses to downgrade the user in Firestore.
        //   2. Also directly downgrade the Firestore user doc immediately,
        //      as belt-and-braces in case the sub-deleted event is slow to
        //      arrive or the subscription was already canceled.
        //   3. Respect the duplicate-subscription edge case: if the same
        //      customer still has another active subscription (e.g. they
        //      accidentally had two and we're refunding one), keep them
        //      marked as subscriber.
        const charge = event.data.object as Stripe.Charge;

        if (!charge.refunded) {
          // Partial refund — leave the subscription alone.
          console.log(
            `[Stripe] Partial refund on charge ${charge.id}, subscription left intact`
          );
          break;
        }

        const stripe = getStripe();
        const customerId = charge.customer as string | null;
        // `charge.invoice` was removed from the Stripe SDK's Charge type in
        // recent API versions, but the field is still present on the
        // webhook payload at runtime — cast through unknown to read it.
        const invoiceId =
          (charge as unknown as { invoice?: string | null }).invoice ?? null;

        // Step 1: cancel the subscription this charge paid for, if it's
        // still active. Cancelling an already-canceled sub throws — catch
        // and ignore.
        if (invoiceId) {
          try {
            const invoice = await stripe.invoices.retrieve(invoiceId);
            const subscriptionId =
              (invoice as unknown as { subscription?: string | null }).subscription || null;
            if (subscriptionId) {
              try {
                const sub = await stripe.subscriptions.retrieve(subscriptionId);
                if (
                  sub.status === "active" ||
                  sub.status === "trialing" ||
                  sub.status === "past_due"
                ) {
                  await stripe.subscriptions.cancel(subscriptionId);
                  console.log(
                    `[Stripe] Canceled subscription ${subscriptionId} after full refund of charge ${charge.id}`
                  );
                }
              } catch (err) {
                console.error(
                  `[Stripe] Could not cancel subscription ${subscriptionId} after refund:`,
                  err
                );
              }
            }
          } catch (err) {
            console.error(
              `[Stripe] Could not resolve invoice/subscription for refunded charge ${charge.id}:`,
              err
            );
          }
        }

        // Step 2: downgrade the user in Firestore, but only if they have no
        // other active subscriptions. This handles the duplicate-sub case
        // where refunding one charge shouldn't touch another still-active
        // sub for the same customer.
        if (customerId) {
          try {
            const activeSubs = await stripe.subscriptions.list({
              customer: customerId,
              status: "active",
              limit: 1,
            });

            if (activeSubs.data.length === 0) {
              const snapshot = await db.collection("users")
                .where("stripeCustomerId", "==", customerId)
                .limit(1)
                .get();

              if (!snapshot.empty) {
                await snapshot.docs[0].ref.update({
                  accountType: "free",
                  subscriptionStatus: "canceled",
                  plan: null,
                  subscriptionCancelAtPeriodEnd: false,
                  updatedAt: new Date().toISOString(),
                });
                await promoteOrganizerListings(db, snapshot.docs[0].id, false);
                console.log(
                  `[Stripe] Downgraded user for customer ${customerId} to free after full refund`
                );
              } else {
                console.error(
                  `[Stripe] No Firestore user found for refunded customer ${customerId}`
                );
              }
            } else {
              console.log(
                `[Stripe] Refund processed but customer ${customerId} still has ${activeSubs.data.length} active sub(s); not downgrading`
              );
            }
          } catch (err) {
            console.error(
              `[Stripe] Error checking other subs / downgrading user after refund:`,
              err
            );
          }
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
