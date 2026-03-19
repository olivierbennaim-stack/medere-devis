import { NextRequest, NextResponse } from "next/server";
import type { FormData as DevisFormData, Commercial, Session } from "@/types";
import { genererNumeroDevis, formatDate, calculerDateExpiration } from "@/lib/utils";
import { generateDevisPdf } from "@/lib/generate-pdf";

const WEBHOOK_URL = process.env.WEBHOOK_URL!;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY!;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID!;
const AIRTABLE_TABLE_DEVIS = process.env.AIRTABLE_TABLE_DEVIS!;

const SPECIALITE_LABELS: Record<string, string> = {
  medecin: "Médecin",
  dentiste: "Dentiste",
  autre: "Autre",
};

const TYPE_LABELS: Record<string, string> = {
  societe: "Société",
  ps: "Praticien de santé",
};

const DUREE_LABELS: Record<string, string> = {
  "30j": "30 jours",
  "60j": "60 jours",
  "90j": "90 jours",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      formData,
      commercial,
      sessions,
    }: {
      formData: DevisFormData;
      commercial: Commercial;
      sessions: { session: Session; quantite: number }[];
    } = body;

    if (!WEBHOOK_URL) {
      return NextResponse.json({ error: "WEBHOOK_URL non configuré" }, { status: 500 });
    }

    const numeroDevis = genererNumeroDevis();
    const dateCreation = formatDate();
    const dateExpiration = calculerDateExpiration(formData.dureeValidite);

    const sousTotal = sessions.reduce(
      (sum, { session, quantite }) => sum + session.prixUnitaire * quantite,
      0
    );
    const total = Math.max(0, sousTotal - formData.remise);

    // ── 1. Créer l'enregistrement dans la table Devis (Airtable) ──────────────
    const airtableFields: Record<string, unknown> = {
      "Type de devis": TYPE_LABELS[formData.typeDevis] || formData.typeDevis,
      "Destinataire": formData.nomContactOuSociete,
      "Adresse email du contact": formData.emailContact,
      "IDs de session": sessions.map((s) => s.session.id),
      "Remise éventuelle": formData.remise,
      "Montant final du devis": total,
      "Commercial": [commercial.id],
      "Durée de validité": DUREE_LABELS[formData.dureeValidite] || formData.dureeValidite,
    };

    if (formData.siren) airtableFields["SIREN"] = formData.siren;
    if (formData.rpps) airtableFields["RPPS du PS"] = formData.rpps;
    if (formData.specialite)
      airtableFields["Spécialité"] = SPECIALITE_LABELS[formData.specialite] || formData.specialite;
    if (formData.commentaires)
      airtableFields["Commentaires éventuels"] = formData.commentaires;
    if (sessions[0]) airtableFields["Quantité formation 1"] = String(sessions[0].quantite);
    if (sessions[1]) airtableFields["Quantité formation 2"] = String(sessions[1].quantite);
    if (sessions[2]) airtableFields["Quantité formation 3"] = String(sessions[2].quantite);

    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_DEVIS}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ records: [{ fields: airtableFields }] }),
      }
    );

    if (!airtableRes.ok) {
      const errText = await airtableRes.text();
      throw new Error(`Airtable create error: ${errText.slice(0, 300)}`);
    }

    const airtableData = await airtableRes.json();
    const airtableRecordId: string = airtableData.records[0].id;

    // ── 2. Générer le PDF en mémoire ──────────────────────────────────────────
    const pdfBuffer = await generateDevisPdf({
      formData,
      commercial,
      numeroDevis,
      dateCreation,
      dateExpiration,
      sousTotal,
      total,
    });

    // ── 3. Envoyer au webhook Make ────────────────────────────────────────────
    const webhookRes = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        record_id: airtableRecordId,
        pdf: pdfBuffer.toString("base64"),
      }),
    });

    if (!webhookRes.ok) {
      throw new Error(`Webhook error: ${webhookRes.status}`);
    }

    return NextResponse.json({ success: true, numeroDevis, airtableRecordId });
  } catch (error) {
    console.error("Erreur envoi devis:", error);
    return NextResponse.json(
      { error: "Impossible d'envoyer le devis", details: String(error) },
      { status: 500 }
    );
  }
}
