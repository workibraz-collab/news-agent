export async function sendEmail(subject: string, htmlBody: string, to?: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const destEmail = to || process.env.DEST_EMAIL;
  const from = process.env.RESEND_FROM || "onboarding@resend.dev";

  if (!apiKey || !destEmail) {
    throw new Error("RESEND_API_KEY ou destinataire manquant");
  }

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [destEmail], subject, html: htmlBody }),
  });

  if (!resp.ok) {
    throw new Error(`Resend ${resp.status}: ${await resp.text()}`);
  }
}
