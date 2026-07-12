import { NextResponse } from "next/server";
import { fetchIndexQuotes } from "@/lib/stocks";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const quotes = await fetchIndexQuotes();
    return NextResponse.json({ quotes });
  } catch (err) {
    console.error("[api/stocks] erreur:", err);
    return NextResponse.json({ quotes: [] });
  }
}
