import { SubscriptionPlan } from "@/generated/prisma/enums";

export function hasMaxAccess(plan: SubscriptionPlan | null | undefined): boolean {
	return plan === SubscriptionPlan.MAX;
}

export function hasPremiumAccess(
	plan: SubscriptionPlan | null | undefined,
): boolean {
	return plan === SubscriptionPlan.PREMIUM || plan === SubscriptionPlan.MAX;
}
