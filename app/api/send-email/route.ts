import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const { subject, html_body, to } = await request.json();
    if (!subject || !html_body) {
      return NextResponse.json({ error: "subject et html_body requis" }, { status: 400 });
    }
    await sendEmail(subject, html_body, to);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/send-email] erreur:", err);
    const message = err instanceof Error ? err.message : "Échec de l'envoi de l'email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
