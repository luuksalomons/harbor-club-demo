// This demo never sends real email — Fiverr visitors trigger these calls
// with fictional addresses, and standing up a verified Resend domain for a
// project that isn't generating revenue yet isn't worth it. The calling
// UI (Messages, Contact Requests) still shows its normal "sent" state,
// since these functions resolve successfully either way. A real client
// delivery swaps this file back to the Resend implementation unchanged —
// see royal-mission-portal/src/lib/email.ts for that version.
export async function sendNewMessageEmail(params: {
  to: string;
  senderName: string;
  preview: string;
}) {
  console.log(`[demo email mock] New message notification -> ${params.to}: "${params.preview}" from ${params.senderName}`);
}

export async function sendCareRequestEmail(params: {
  to: string[];
  studentName: string;
  note: string;
}) {
  if (params.to.length === 0) return;
  console.log(`[demo email mock] Contact request notification -> ${params.to.join(", ")}: ${params.studentName} — "${params.note}"`);
}
