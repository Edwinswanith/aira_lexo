import { Resend } from "resend";
import type { PilotApplicationRequest } from "./pilot";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] || character);
}

export async function sendPilotNotifications(application: PilotApplicationRequest, status: "received" | "future_access") {
  const apiKey = process.env.RESEND_API_KEY;
  const teamEmail = process.env.PILOT_NOTIFICATION_EMAIL;
  if (!apiKey || !teamEmail) return { sent: false as const, reason: "not_configured" as const };

  const resend = new Resend(apiKey);
  const name = escapeHtml(application.fullName);
  const email = escapeHtml(application.email);
  const city = escapeHtml(application.city === "other" ? application.otherCity || "Other city" : application.city);
  const applicantMessage = status === "future_access"
    ? "Thank you for your interest in Aira. Your city is outside the first pilot group, so we have added you to the future-access list."
    : "Thank you for applying to the Aira clinical pilot. We have received your details and will review whether the pilot is a good fit.";

  try {
    const [teamResult, applicantResult] = await Promise.all([
      resend.emails.send({
      from: "Aira Pilot <pilot@airalexo.in>",
      to: teamEmail,
      subject: `New Aira pilot application: ${city}`,
      html: `<p>A new pilot application has been received.</p><p><strong>Name:</strong> ${name}<br><strong>Email:</strong> ${email}<br><strong>City:</strong> ${city}<br><strong>Role:</strong> ${escapeHtml(application.role)}<br><strong>Specialty:</strong> ${escapeHtml(application.specialty)}</p><p>This email contains applicant contact information. It does not contain patient information.</p>`,
      }),
      resend.emails.send({
      from: "Aira Pilot <pilot@airalexo.in>",
      to: application.email,
      subject: status === "future_access" ? "You are on Aira's future-access list" : "We received your Aira pilot application",
      html: `<p>Hello ${name},</p><p>${applicantMessage}</p><p>Please do not send patient names, medical information, or consultation recordings by email.</p><p>Aira Lexo Solutions Private Limited</p>`,
      }),
    ]);
    return { sent: !teamResult.error && !applicantResult.error };
  } catch {
    return { sent: false as const };
  }
}
