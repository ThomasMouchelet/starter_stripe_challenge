import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function PATCH(req: NextRequest) {
	const session = await auth();
	if (!session?.user?.email) {
		return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
	}

	const { priceId } = await req.json();
	if (!priceId) {
		return NextResponse.json({ error: "priceId manquant" }, { status: 400 });
	}

	const user = await prisma.user.findUnique({
		where: { email: session.user.email },
	});

	if (!user?.stripeSubscriptionId) {
		return NextResponse.json(
			{ error: "Aucun abonnement actif" },
			{ status: 404 },
		);
	}

	const subscription = await stripe.subscriptions.retrieve(
		user.stripeSubscriptionId,
	);

	await stripe.subscriptions.update(user.stripeSubscriptionId, {
		items: [
			{
				id: subscription.items.data[0].id,
				price: priceId,
			},
		],
		proration_behavior: "always_invoice",
	});

	return NextResponse.json({ success: true });
}
