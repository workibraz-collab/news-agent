import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/resend";
import { renderDigestEmailHtml } from "@/lib/email-render";
import type { Digest } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Digest & { to?: string };
    if (!body.subject || !Array.isArray(body.sections)) {
      return NextResponse.json({ error: "digest invalide" }, { status: 400 });
    }
    const html = renderDigestEmailHtml(body);
    await sendEmail(body.subject, html, body.to);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/send-email] erreur:", err);
    const message = err instanceof Error ? err.message : "Échec de l'envoi de l'email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
