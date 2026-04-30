"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SubscriptionButton({ isSubscribed }: { isSubscribed: boolean }) {
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const handleClick = async () => {
		if (!isSubscribed) {
			router.push("/pricing");
			return;
		}

		setLoading(true);
		try {
			const res = await fetch("/api/stripe/portal", { method: "POST" });
			const data = await res.json();
			if (data.url) {
				window.location.href = data.url;
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<button
			onClick={handleClick}
			disabled={loading}
			className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
		>
			{loading ? "Redirection..." : isSubscribed ? "Gérer mon abonnement" : "Choisir un plan"}
		</button>
	);
}
