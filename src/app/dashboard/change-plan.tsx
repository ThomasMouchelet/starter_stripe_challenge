"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Plan = {
	key: string;
	label: string;
	priceId: string;
	price: string;
	period: string;
	isCurrent: boolean;
};

export function ChangePlan({ plans }: { plans: Plan[] }) {
	const [loading, setLoading] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	async function handleChange(priceId: string) {
		setLoading(priceId);
		setError(null);
		try {
			const res = await fetch("/api/stripe/subscription", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ priceId }),
			});
			const data = await res.json();
			if (!res.ok) {
				setError(data.error ?? "Une erreur est survenue.");
				return;
			}
			router.refresh();
		} finally {
			setLoading(null);
		}
	}

	return (
		<div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
			<p className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
				Changer de plan
			</p>
			<div className="grid grid-cols-2 gap-2">
				{plans.map((plan) => (
					<button
						key={plan.priceId}
						disabled={plan.isCurrent || loading !== null}
						onClick={() => handleChange(plan.priceId)}
						className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed ${
							plan.isCurrent
								? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-200 dark:bg-zinc-200 dark:text-zinc-900"
								: "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-500"
						}`}
					>
						<span className="block font-medium">{plan.label}</span>
						<span
							className={`block text-xs ${plan.isCurrent ? "text-zinc-300 dark:text-zinc-600" : "text-zinc-400"}`}
						>
							{loading === plan.priceId
								? "En cours..."
								: plan.isCurrent
									? "Plan actuel"
									: `${plan.price} / ${plan.period}`}
						</span>
					</button>
				))}
			</div>
			{error && (
				<p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
			)}
		</div>
	);
}
