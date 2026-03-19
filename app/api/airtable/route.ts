import { NextResponse } from "next/server";
import type { Commercial, Session } from "@/types";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY!;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID!;
const TABLE_SESSIONS = process.env.AIRTABLE_TABLE_SESSIONS!;
const TABLE_COMMERCIAUX = process.env.AIRTABLE_TABLE_COMMERCIAUX!;

// Fetch paginé : récupère TOUS les enregistrements (Airtable limite à 100 par page)
async function fetchAllRecords(
  tableId: string,
  params: { filterByFormula?: string; fields?: string[] } = {}
) {
  const all: { id: string; fields: Record<string, unknown> }[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableId}`);
    url.searchParams.set("pageSize", "100");
    if (params.filterByFormula) url.searchParams.set("filterByFormula", params.filterByFormula);
    if (params.fields) params.fields.forEach((f) => url.searchParams.append("fields[]", f));
    if (offset) url.searchParams.set("offset", offset);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      cache: "no-store", // pas de cache pour que le refresh fonctionne
    });
    if (!res.ok) throw new Error(`Airtable ${res.status}: ${res.statusText}`);
    const data = await res.json();
    all.push(...data.records);
    offset = data.offset;
  } while (offset);

  return all;
}

export async function GET() {
  try {
    const [commerciauxRaw, sessionsRaw] = await Promise.all([
      fetchAllRecords(TABLE_COMMERCIAUX, {
        filterByFormula: "{Statut}='Actif'", // uniquement les commerciaux actifs
        fields: ["hubspot_name", "email", "phone", "Statut"],
      }),
      fetchAllRecords(TABLE_SESSIONS, {
        fields: ["session_id", "Nom de la formation", "Numéro de session", "Prix"],
      }),
    ]);

    const commerciaux: Commercial[] = commerciauxRaw
      .map((r) => ({
        id: r.id,
        nom: (r.fields["hubspot_name"] as string) || "",
        prenom: "",
        email: (r.fields["email"] as string) || "",
        phone: (r.fields["phone"] as string) || undefined,
      }))
      .filter((c) => c.nom);

    const sessions: Session[] = sessionsRaw
      .map((r) => ({
        id: r.id,
        sessionId: (r.fields["session_id"] as string) || "",
        nom: (r.fields["Nom de la formation"] as string) || "",
        description: (r.fields["Nom de la formation"] as string) || "",
        numeroSession: (r.fields["Numéro de session"] as string) || "",
        prixUnitaire: Number(r.fields["Prix"] || 0),
      }))
      .filter((s) => s.nom);

    return NextResponse.json({ commerciaux, sessions });
  } catch (error) {
    console.error("Erreur Airtable:", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les données Airtable", details: String(error) },
      { status: 500 }
    );
  }
}
