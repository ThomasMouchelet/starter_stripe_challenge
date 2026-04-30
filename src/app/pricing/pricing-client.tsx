"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type PriceIds = {
	premiumMonthly: string;
	premiumYearly: string;
	maxMonthly: string;
	maxYearly: string;
};

const PLANS = [
	{
		key: "premium" as const,
		name: "Premium",
		monthlyPrice: 9.9,
		yearlyPrice: 99,
		features: [
			"Accès aux fonctionnalités essentielles",
			"Support par email",
			"5 projets",
			"10 Go de stockage",
		],
		cta: "Choisir Premium",
		highlighted: false,
	},
	{
		key: "max" as const,
		name: "Max",
		monthlyPrice: 19.9,
		yearlyPrice: 199,
		features: [
			"Tout ce qu'inclut Premium",
			"Fonctionnalités avancées (Max uniquement)",
			"Support prioritaire",
			"Projets illimités",
			"100 Go de stockage",
			"Accès API",
		],
		cta: "Choisir Max",
		highlighted: true,
	},
];

export function PricingClient({ priceIds }: { priceIds: PriceIds }) {
	const [yearly, setYearly] = useState(false);
	const [loading, setLoading] = useState<string | null>(null);
	const router = useRouter();

	function getPriceId(planKey: "premium" | "max") {
		if (planKey === "premium") {
			return yearly ? priceIds.premiumYearly : priceIds.premiumMonthly;
		}
		return yearly ? priceIds.maxYearly : priceIds.maxMonthly;
	}

	async function handleSubscribe(planKey: "premium" | "max") {
		setLoading(planKey);
		try {
			const res = await fetch("/api/stripe/checkout", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ priceId: getPriceId(planKey) }),
			});
			if (res.status === 401) {
				router.push("/auth/signin");
				return;
			}
			const data = await res.json();
			if (data.url) {
				window.location.href = data.url;
			}
		} finally {
			setLoading(null);
		}
	}

	return (
		<div className="min-h-screen bg-zinc-50 dark:bg-black py-16 px-4">
			<div className="mx-auto max-w-4xl">
				<div className="mb-10 text-center">
					<h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
						Choisissez votre plan
					</h1>
					<p className="text-zinc-500 dark:text-zinc-400">
						Annulez à tout moment. Pas de frais cachés.
					</p>

					<div className="mt-6 inline-flex items-center gap-3 rounded-full border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950">
						<button
							onClick={() => setYearly(false)}
							className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
								!yearly
									? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
									: "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
							}`}
						>
							Mensuel
						</button>
						<button
							onClick={() => setYearly(true)}
							className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
								yearly
									? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
									: "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
							}`}
						>
							Annuel{" "}
							<span className="ml-1 text-xs text-green-500 font-semibold">
								-15%
							</span>
						</button>
					</div>
				</div>

				<div className="grid gap-6 md:grid-cols-2">
					{PLANS.map((plan) => (
						<div
							key={plan.key}
							className={`rounded-2xl border p-8 ${
								plan.highlighted
									? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-200 dark:bg-white dark:text-zinc-900"
									: "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
							}`}
						>
							<h2 className="text-xl font-bold mb-1">{plan.name}</h2>
							<div className="mb-6">
								<span className="text-4xl font-bold">
									{yearly ? plan.yearlyPrice : plan.monthlyPrice} €
								</span>
								<span
									className={`text-sm ml-1 ${
										plan.highlighted
											? "text-zinc-400 dark:text-zinc-500"
											: "text-zinc-400"
									}`}
								>
									/ {yearly ? "an" : "mois"}
								</span>
							</div>

							<ul className="space-y-2 mb-8">
								{plan.features.map((f) => (
									<li key={f} className="flex items-start gap-2 text-sm">
										<span className="mt-0.5 shrink-0">✓</span>
										{f}
									</li>
								))}
							</ul>

							<button
								onClick={() => handleSubscribe(plan.key)}
								disabled={loading === plan.key}
								className={`w-full rounded-lg px-4 py-2.5 font-medium transition-colors disabled:opacity-50 ${
									plan.highlighted
										? "bg-white text-zinc-900 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
										: "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
								}`}
							>
								{loading === plan.key ? "Redirection..." : plan.cta}
							</button>
						</div>
					))}
				</div>

				<p className="mt-8 text-center text-sm text-zinc-400">
					Déjà abonné ?{" "}
					<Link
						href="/dashboard"
						className="underline hover:text-zinc-900 dark:hover:text-zinc-50"
					>
						Gérer mon abonnement
					</Link>
				</p>
			</div>
		</div>
	);
}
