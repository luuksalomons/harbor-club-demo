import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM ?? "Royal Mission Portal <noreply@example.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// E-mail is een melding, geen kritiek pad: een falende Resend-call mag het
// versturen van een bericht of zorgaanvraag nooit blokkeren.
export async function sendNewMessageEmail(params: {
  to: string;
  senderName: string;
  preview: string;
}) {
  try {
    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: `Nieuw bericht van ${params.senderName}`,
      text: `Je hebt een nieuw bericht ontvangen van ${params.senderName}:\n\n"${params.preview}"\n\nBekijk en beantwoord het bericht: ${APP_URL}/berichten`,
    });
  } catch (err) {
    console.error("sendNewMessageEmail failed", err);
  }
}

export async function sendCareRequestEmail(params: {
  to: string[];
  studentName: string;
  note: string;
}) {
  if (params.to.length === 0) return;
  try {
    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: `Zorggesprek aangevraagd door ${params.studentName}`,
      text: `${params.studentName} heeft een zorggesprek aangevraagd.\n\nToelichting: ${params.note || "(geen toelichting)"}\n\nBekijk de aanvraag: ${APP_URL}/zorg`,
    });
  } catch (err) {
    console.error("sendCareRequestEmail failed", err);
  }
}
