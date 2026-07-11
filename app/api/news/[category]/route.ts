import { NextResponse } from "next/server";
import { CATEGORY_KEYS, type CategoryKey } from "@/lib/feeds";
import { fetchCategoryItems } from "@/lib/rss";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  const { category } = await params;

  if (!CATEGORY_KEYS.includes(category as CategoryKey)) {
    return NextResponse.json({ error: "Rubrique inconnue" }, { status: 404 });
  }

  try {
    const items = await fetchCategoryItems(category as CategoryKey);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[api/news] erreur:", err);
    return NextResponse.json({ error: "Échec de récupération des flux" }, { status: 500 });
  }
}
