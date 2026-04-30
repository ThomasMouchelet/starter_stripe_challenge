import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import Stripe from "stripe";
import { SubscriptionPlan, BillingPeriod } from "@/generated/prisma/enums";

function resolvePlanAndPeriod(priceId: string): {
	subscriptionPlan: SubscriptionPlan;
	billingPeriod: BillingPeriod;
} | null {
	const map: Record<
		string,
		{ subscriptionPlan: SubscriptionPlan; billingPeriod: BillingPeriod }
	> = {
		[process.env.STRIPE_PRICE_PREMIUM_MENSUEL_ID!]: {
			subscriptionPlan: SubscriptionPlan.PREMIUM,
			billingPeriod: BillingPeriod.MONTHLY,
		},
		[process.env.STRIPE_PRICE_PREMIUM_ANNUEL_ID!]: {
			subscriptionPlan: SubscriptionPlan.PREMIUM,
			billingPeriod: BillingPeriod.YEARLY,
		},
		[process.env.STRIPE_PRICE_MAX_MENSUEL_ID!]: {
			subscriptionPlan: SubscriptionPlan.MAX,
			billingPeriod: BillingPeriod.MONTHLY,
		},
		[process.env.STRIPE_PRICE_MAX_ANNUEL_ID!]: {
			subscriptionPlan: SubscriptionPlan.MAX,
			billingPeriod: BillingPeriod.YEARLY,
		},
	};
	return map[priceId] ?? null;
}

export async function POST(req: NextRequest) {
	const body = await req.text();
	const signature = req.headers.get("stripe-signature")!;

	let event: Stripe.Event;

	try {
		event = stripe.webhooks.constructEvent(
			body,
			signature,
			process.env.STRIPE_WEBHOOK_SECRET!,
		);
	} catch {
		return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
	}

	switch (event.type) {
		case "checkout.session.completed": {
			const session = event.data.object as Stripe.Checkout.Session;
			if (session.subscription && session.customer) {
				const subscription = await stripe.subscriptions.retrieve(
					session.subscription as string,
				);
				const priceId = subscription.items.data[0].price.id;
				const planData = resolvePlanAndPeriod(priceId);

				await prisma.user.update({
					where: { stripeCustomerId: session.customer as string },
					data: {
						stripeSubscriptionId: subscription.id,
						stripePriceId: priceId,
						stripeStatus: subscription.status,
						subscriptionPlan: planData?.subscriptionPlan ?? null,
						billingPeriod: planData?.billingPeriod ?? null,
					},
				});
			}
			break;
		}

		case "customer.subscription.updated": {
			const subscription = event.data.object as Stripe.Subscription;
			const priceId = subscription.items.data[0]?.price.id ?? null;
			const planData = priceId ? resolvePlanAndPeriod(priceId) : null;

			await prisma.user.update({
				where: { stripeCustomerId: subscription.customer as string },
				data: {
					stripeStatus: subscription.status,
					stripePriceId: priceId,
					subscriptionPlan: planData?.subscriptionPlan ?? null,
					billingPeriod: planData?.billingPeriod ?? null,
				},
			});
			break;
		}

		case "customer.subscription.deleted": {
			const subscription = event.data.object as Stripe.Subscription;
			await prisma.user.update({
				where: { stripeCustomerId: subscription.customer as string },
				data: {
					stripeStatus: subscription.status,
					stripePriceId: null,
					subscriptionPlan: null,
					billingPeriod: null,
				},
			});
			break;
		}
	}

	return NextResponse.json({ received: true });
}
