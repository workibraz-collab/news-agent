import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const { subject, html_body } = await request.json();
    if (!subject || !html_body) {
      return NextResponse.json({ error: "subject et html_body requis" }, { status: 400 });
    }
    await sendEmail(subject, html_body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/send-email] erreur:", err);
    return NextResponse.json({ error: "Échec de l'envoi de l'email" }, { status: 500 });
  }
}
