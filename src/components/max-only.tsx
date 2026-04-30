import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMaxAccess } from "@/lib/plan-access";

export async function MaxOnly({ children }: { children: React.ReactNode }) {
	const session = await auth();
	if (!session?.user?.email) return null;

	const user = await prisma.user.findUnique({
		where: { email: session.user.email },
		select: { subscriptionPlan: true },
	});

	if (!hasMaxAccess(user?.subscriptionPlan)) {
		return (
			<div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
				Cette fonctionnalité est réservée au plan{" "}
				<span className="font-semibold text-zinc-900 dark:text-zinc-50">
					Max
				</span>
				.
			</div>
		);
	}

	return <>{children}</>;
}
