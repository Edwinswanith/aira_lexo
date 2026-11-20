"use client";

import { useFormStatus } from "react-dom";

/** A submit button that shows progress while its form's server action runs. */
export function SubmitButton({ children, pendingText, className = "button button-violet" }: { children: React.ReactNode; pendingText: string; className?: string }) {
  const { pending } = useFormStatus();
  return <button className={className} type="submit" disabled={pending} aria-busy={pending}>{pending ? pendingText : children}</button>;
}
