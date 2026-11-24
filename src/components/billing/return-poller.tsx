"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function ReturnPoller({
  externalRef,
  initialStatus,
}: {
  externalRef: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    if (status !== "pending") return;
    let cancelled = false;
    const tick = async () => {
      const response = await fetch("/api/billing/moolre/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref: externalRef }),
      });
      const json = (await response.json().catch(() => null)) as { status?: string; reason?: string } | null;
      if (cancelled || !json?.status) return;
      setStatus(json.status);
      setReason(json.reason ?? null);
      if (json.status !== "pending") router.refresh();
    };
    const interval = setInterval(() => {
      void tick();
    }, 3000);
    void tick();
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [externalRef, router, status]);

  if (status === "paid") {
    return <p className="text-sm text-emerald-700">Payment confirmed. Your plan credits are now active.</p>;
  }
  if (status === "failed") {
    return <p className="text-sm text-red-600">Moolre reported a failed payment. You were not charged for this invoice.</p>;
  }
  return (
    <p className="text-sm text-muted-foreground">
      Waiting for Moolre to confirm the payment. This page does not treat the return URL as paid.
      {reason ? ` ${reason}` : ""}
    </p>
  );
}
