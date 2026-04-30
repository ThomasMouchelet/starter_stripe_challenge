import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
	const session = await auth();
	if (!session?.user?.email) {
		return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
	}

	const body = await req.json().catch(() => ({}));
	const priceId: string =
		body.priceId ?? process.env.STRIPE_PRICE_PREMIUM_MENSUEL_ID!;

	const user = await prisma.user.findUnique({
		where: { email: session.user.email },
	});

	if (!user) {
		return NextResponse.json(
			{ error: "Utilisateur introuvable" },
			{ status: 404 },
		);
	}

	let customerId = user.stripeCustomerId;

	if (!customerId) {
		const customer = await stripe.customers.create({
			email: user.email,
			name: user.name,
			metadata: { userId: user.id },
		});
		customerId = customer.id;

		await prisma.user.update({
			where: { id: user.id },
			data: { stripeCustomerId: customerId },
		});
	}

	const checkoutSession = await stripe.checkout.sessions.create({
		customer: customerId,
		mode: "subscription",
		payment_method_types: ["card"],
		line_items: [{ price: priceId, quantity: 1 }],
		success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
		cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
	});

	return NextResponse.json({ url: checkoutSession.url });
}
