import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SubscriptionButton } from "./subscription-button";
import { ChangePlan } from "./change-plan";
import { MaxOnly } from "@/components/max-only";
import Link from "next/link";

const PLAN_LABELS: Record<string, string> = {
	PREMIUM: "Premium",
	MAX: "Max",
};

const PERIOD_LABELS: Record<string, string> = {
	MONTHLY: "mois",
	YEARLY: "an",
};

const PLAN_PRICES: Record<string, Record<string, string>> = {
	PREMIUM: { MONTHLY: "9,90 €", YEARLY: "99 €" },
	MAX: { MONTHLY: "19,90 €", YEARLY: "199 €" },
};

export default async function DashboardPage({
	searchParams,
}: {
	searchParams: Promise<{ success?: string; canceled?: string }>;
}) {
	const session = await auth();

	if (!session?.user?.email) {
		redirect("/auth/signin");
	}

	const user = await prisma.user.findUnique({
		where: { email: session.user.email },
	});

	if (!user) {
		redirect("/auth/signin");
	}

	const params = await searchParams;
	const isSubscribed = user.stripeStatus === "active";

	const allPlans = [
		{
			key: "premium-monthly",
			label: "Premium Mensuel",
			priceId: process.env.STRIPE_PRICE_PREMIUM_MENSUEL_ID ?? "",
			price: "9,90 €",
			period: "mois",
			isCurrent: user.stripePriceId === process.env.STRIPE_PRICE_PREMIUM_MENSUEL_ID,
		},
		{
			key: "premium-yearly",
			label: "Premium Annuel",
			priceId: process.env.STRIPE_PRICE_PREMIUM_ANNUEL_ID ?? "",
			price: "99 €",
			period: "an",
			isCurrent: user.stripePriceId === process.env.STRIPE_PRICE_PREMIUM_ANNUEL_ID,
		},
		{
			key: "max-monthly",
			label: "Max Mensuel",
			priceId: process.env.STRIPE_PRICE_MAX_MENSUEL_ID ?? "",
			price: "19,90 €",
			period: "mois",
			isCurrent: user.stripePriceId === process.env.STRIPE_PRICE_MAX_MENSUEL_ID,
		},
		{
			key: "max-yearly",
			label: "Max Annuel",
			priceId: process.env.STRIPE_PRICE_MAX_ANNUEL_ID ?? "",
			price: "199 €",
			period: "an",
			isCurrent: user.stripePriceId === process.env.STRIPE_PRICE_MAX_ANNUEL_ID,
		},
	];

	const planLabel = user.subscriptionPlan
		? PLAN_LABELS[user.subscriptionPlan]
		: null;
	const periodLabel = user.billingPeriod
		? PERIOD_LABELS[user.billingPeriod]
		: null;
	const priceLabel =
		user.subscriptionPlan && user.billingPeriod
			? PLAN_PRICES[user.subscriptionPlan]?.[user.billingPeriod]
			: null;

	return (
		<div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
			<div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
				<h1 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
					Dashboard
				</h1>
				<p className="mb-6 text-zinc-600 dark:text-zinc-400">
					Bienvenue, {session.user.name} !
				</p>

				<div className="mb-6 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
					<p className="text-sm text-zinc-600 dark:text-zinc-400">
						<span className="font-medium text-zinc-900 dark:text-zinc-50">
							Email :
						</span>{" "}
						{session.user.email}
					</p>
				</div>

				{params.success && (
					<div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
						Abonnement activé avec succès !
					</div>
				)}
				{params.canceled && (
					<div className="mb-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
						Paiement annulé.
					</div>
				)}

				<div className="mb-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium text-zinc-900 dark:text-zinc-50">
								Abonnement
							</p>
							<p className="text-sm text-zinc-500 dark:text-zinc-400">
								{isSubscribed && planLabel && periodLabel && priceLabel
									? `${planLabel} — ${priceLabel} / ${periodLabel}`
									: isSubscribed
										? "Actif"
										: "Aucun abonnement"}
							</p>
						</div>
						<span
							className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
								isSubscribed
									? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
									: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
							}`}
						>
							{isSubscribed ? "Actif" : "Inactif"}
						</span>
					</div>
				</div>

				<MaxOnly>
					<div className="mb-4 rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20">
						<p className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-1">
							Fonctionnalités Max
						</p>
						<p className="text-xs text-purple-600 dark:text-purple-400">
							Accès API activé · Projets illimités · Support prioritaire
						</p>
					</div>
				</MaxOnly>

				<div className="space-y-3">
					<SubscriptionButton isSubscribed={isSubscribed} />

					{isSubscribed && <ChangePlan plans={allPlans} />}

					{!isSubscribed && (
						<Link
							href="/pricing"
							className="block w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-center font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
						>
							Voir les plans
						</Link>
					)}

					<form
						action={async () => {
							"use server";
							await signOut({ redirectTo: "/" });
						}}
					>
						<button
							type="submit"
							className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
						>
							Se déconnecter
						</button>
					</form>
				</div>
			</div>
		</div>
	);
}
