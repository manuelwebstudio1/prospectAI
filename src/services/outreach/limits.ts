export const OUTREACH_ORG_HOURLY_CAP = 10;
export const OUTREACH_LEAD_COOLDOWN_HOURS = 24;

export function orgHourlyCapExceeded(sentAt: string[], now = Date.now()) {
  const windowStart = now - 60 * 60 * 1000;
  const recent = sentAt.filter((value) => new Date(value).getTime() >= windowStart);
  return recent.length >= OUTREACH_ORG_HOURLY_CAP;
}

export function leadCooldownActive(lastSentAt: string | null | undefined, now = Date.now()) {
  if (!lastSentAt) return false;
  const elapsed = now - new Date(lastSentAt).getTime();
  return elapsed < OUTREACH_LEAD_COOLDOWN_HOURS * 60 * 60 * 1000;
}
