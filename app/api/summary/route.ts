import { NextResponse } from "next/server";
import { fetchItemsForSummary } from "@/lib/rss";
import { buildPrompt, callGemini, fallbackDigest, type Digest } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await fetchItemsForSummary();

    if (items.length === 0) {
      const empty: Digest = { status: "calme", subject: "Rien de notable", sections: [] };
      return NextResponse.json(empty);
    }

    try {
      const digest = await callGemini(buildPrompt(items), items);
      return NextResponse.json(digest);
    } catch (err) {
      console.warn("[api/summary] échec Gemini, digest de secours:", err);
      return NextResponse.json(fallbackDigest(items));
    }
  } catch (err) {
    console.error("[api/summary] erreur:", err);
    return NextResponse.json({ error: "Échec de génération du résumé" }, { status: 500 });
  }
}
