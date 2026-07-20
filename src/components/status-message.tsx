export function StatusMessage({ title, detail, tone = "neutral" }: { title: string; detail?: string; tone?: "neutral" | "error" | "success" }) {
  return (
    <div className={`form-status ${tone === "error" ? "error" : ""}`} role={tone === "error" ? "alert" : "status"}>
      <strong>{title}</strong>
      {detail ? <span>{detail}</span> : null}
    </div>
  );
}
