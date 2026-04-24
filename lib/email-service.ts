import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send a complaint-resolution email to the user.
 * Falls back to console log if SMTP is not configured.
 */
export async function sendComplaintResolvedEmail(
  userEmail: string,
  complaintTitle: string,
  complaintId?: string
) {
  const subject = "Your complaint has been resolved — BMC Waste Collection";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: linear-gradient(135deg, #0ea5e9, #10b981); padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">BMC Waste Collection</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 14px;">Municipal Complaint Resolution</p>
      </div>
      <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; background: #ffffff;">
        <p style="font-size: 16px; margin-bottom: 16px;">Dear Citizen,</p>
        <p style="font-size: 15px; line-height: 1.6;">
          We are pleased to inform you that your complaint has been <strong style="color: #10b981;">resolved</strong> by our field worker.
        </p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">Complaint Title</p>
          <p style="margin: 6px 0 0; font-size: 16px; font-weight: 600; color: #111827;">${escapeHtml(complaintTitle)}</p>
        </div>
        <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">
          Resolved at: <strong>${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</strong>
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 13px; color: #9ca3af; text-align: center;">
          Thank you for helping keep Mumbai clean!<br/>
          Brihanmumbai Municipal Corporation (BMC)
        </p>
      </div>
    </div>
  `;

  const payload: EmailPayload = {
    to: userEmail,
    subject,
    html,
  };

  const res = await fetch("/api/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("Failed to send email:", data);
    throw new Error(data.error || "Failed to send email");
  }

  return data as { success: boolean; preview?: boolean; message: string };
}

/**
 * Fetch a user's email from Firestore by UID.
 */
export async function getUserEmail(userid: string): Promise<string | null> {
  const userRef = doc(db, "users", userid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  return data.email || null;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;")
    .replace(/"/g, "\u0026quot;")
    .replace(/'/g, "\u0026#039;");
}

