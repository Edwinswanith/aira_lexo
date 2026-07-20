"use client";

import { useEffect, useRef } from "react";

export function InsightReadTracker() {
  const marker = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const element = marker.current;
    if (!element) return;
    let sent = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (!sent && entry.isIntersecting) {
        sent = true;
        const plausible = (window as typeof window & { plausible?: (event: string) => void }).plausible;
        plausible?.("insight_read_complete");
        observer.disconnect();
      }
    }, { threshold: 1 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <span ref={marker} aria-hidden="true" style={{ position: "absolute", bottom: 0 }} />;
}
