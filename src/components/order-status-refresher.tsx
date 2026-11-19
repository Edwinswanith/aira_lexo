"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Re-checks a pending order every 4 seconds for up to 3 minutes. */
export function OrderStatusRefresher() {
  const router = useRouter();
  useEffect(() => {
    let checks = 0;
    const timer = window.setInterval(() => {
      checks += 1;
      if (checks > 45) window.clearInterval(timer);
      else router.refresh();
    }, 4000);
    return () => window.clearInterval(timer);
  }, [router]);
  return null;
}
