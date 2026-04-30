import { PricingClient } from "./pricing-client";

export default function PricingPage() {
	const priceIds = {
		premiumMonthly: process.env.STRIPE_PRICE_PREMIUM_MENSUEL_ID ?? "",
		premiumYearly: process.env.STRIPE_PRICE_PREMIUM_ANNUEL_ID ?? "",
		maxMonthly: process.env.STRIPE_PRICE_MAX_MENSUEL_ID ?? "",
		maxYearly: process.env.STRIPE_PRICE_MAX_ANNUEL_ID ?? "",
	};

	return <PricingClient priceIds={priceIds} />;
}
