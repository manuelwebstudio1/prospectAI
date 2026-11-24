import type { PlanSlug } from "@/config/plans";
import { getRuntimePlan } from "@/services/admin/store";
import type { LocalSubscriptionRecord } from "@/services/workspace/types";
import type { PlanUsage } from "@/types";

function asPlanSlug(value: string | null | undefined): PlanSlug {
  if (value === "professional" || value === "agency" || value === "starter") return value;
  return "starter";
}

export async function planUsageFromSubscription(
  subscription: LocalSubscriptionRecord | null,
  credits: { remaining: number; allocated: number },
): Promise<PlanUsage> {
  const catalog = await getRuntimePlan(asPlanSlug(subscription?.plan_slug));
  const name =
    !subscription || subscription.status === "trialing" || subscription.status === "incomplete"
      ? `${catalog.name} trial`
      : catalog.name;
  return {
    planName: name,
    planSlug: catalog.slug,
    monthlyGhs: catalog.monthlyGhs,
    renewsOn: subscription?.current_period_end?.slice(0, 10) ?? null,
    creditsUsed: credits.allocated < 0 ? 0 : Math.max(credits.allocated - credits.remaining, 0),
    creditsTotal: credits.allocated,
    features: catalog.features.slice(0, 4),
  };
}
