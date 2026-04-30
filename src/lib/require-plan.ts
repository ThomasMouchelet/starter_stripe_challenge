import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMaxAccess, hasPremiumAccess } from "@/lib/plan-access";
import { SubscriptionPlan } from "@/generated/prisma/enums";

export async function requirePlan(minPlan: SubscriptionPlan) {
	const session = await auth();
	if (!session?.user?.email) {
		return {
			error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }),
			user: null,
		};
	}

	const user = await prisma.user.findUnique({
		where: { email: session.user.email },
	});

	if (!user) {
		return {
			error: NextResponse.json(
				{ error: "Utilisateur introuvable" },
				{ status: 404 },
			),
			user: null,
		};
	}

	const allowed =
		minPlan === SubscriptionPlan.MAX
			? hasMaxAccess(user.subscriptionPlan)
			: hasPremiumAccess(user.subscriptionPlan);

	if (!allowed) {
		return {
			error: NextResponse.json(
				{ error: "Accès réservé au plan " + minPlan },
				{ status: 403 },
			),
			user: null,
		};
	}

	return { error: null, user };
}
