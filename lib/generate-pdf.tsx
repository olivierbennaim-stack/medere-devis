import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import path from "path";
import type { FormData, Commercial } from "@/types";

const LOGO_PATH = path.join(process.cwd(), "public", "logo-medere.png");
const SIGNATURE_HARRY_PATH = path.join(process.cwd(), "public", "signature-harry.png");

const DUREE_LABELS: Record<string, string> = {
  "30j": "30 jours",
  "60j": "60 jours",
  "90j": "90 jours",
};

function fmt(n: number) {
  return (
    n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      .replace(/\u202F/g, " ")
      .replace(/\u00A0/g, " ") + " €"
  );
}

const s = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Helvetica",
    color: "#262626",
    fontSize: 10,
    lineHeight: 1.5,
    backgroundColor: "#ffffff",
  },
  row: { flexDirection: "row" },
  jBetween: { justifyContent: "space-between" },
  sep: { height: 1, backgroundColor: "#f0f0f0", marginBottom: 20 },
  logo: { height: 16, objectFit: "contain" },
  devisLabel: { fontSize: 8, color: "#a3a3a3", marginBottom: 2 },
  devisNumber: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#0a0a0a" },
  devisDate: { fontSize: 9, color: "#737373", marginTop: 2 },
  badge: {
    marginTop: 5,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: "flex-end",
  },
  badgeText: { fontSize: 8, color: "#525252", fontFamily: "Helvetica-Bold" },
  sectionLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#a3a3a3", marginBottom: 5 },
  blockName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#0a0a0a",
    marginBottom: 2,
  },
  blockText: { fontSize: 9, color: "#525252", lineHeight: 1.6 },
  thText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#737373" },
  sessionName: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#171717" },
  sessionId: { fontSize: 8, color: "#a3a3a3", marginTop: 1 },
  totalLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0a0a0a" },
  commentBox: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#f0f0f0",
    borderRadius: 4,
    padding: 10,
    marginBottom: 20,
    maxHeight: 78,
    overflow: "hidden",
  },
  commentLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#a3a3a3", marginBottom: 4 },
  commentText: { fontSize: 9, color: "#404040", lineHeight: 1.6 },
});

export interface DevisPdfProps {
  formData: FormData;
  commercial: Commercial;
  numeroDevis: string;
  dateCreation: string;
  dateExpiration: string;
  sousTotal: number;
  total: number;
}

function DevisPdf({
  formData,
  commercial,
  numeroDevis,
  dateCreation,
  dateExpiration,
  sousTotal,
  total,
}: DevisPdfProps) {
  const isSociete = formData.typeDevis === "societe";
  const isPS = formData.typeDevis === "ps";

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* En-tête */}
        <View style={[s.row, s.jBetween, { marginBottom: 20, alignItems: "flex-start" }]}>
          <Image style={s.logo} src={LOGO_PATH} />
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.devisLabel}>DEVIS</Text>
            <Text style={s.devisNumber}>{numeroDevis}</Text>
            <Text style={s.devisDate}>Émis le {dateCreation}</Text>
            {!!formData.dureeValidite && (
              <Text style={s.devisDate}>Valable jusqu'au {dateExpiration}</Text>
            )}
          </View>
        </View>

        <View style={s.sep} />

        {/* De / À */}
        <View style={[s.row, { marginBottom: 24 }]}>
          <View style={{ flex: 1, paddingRight: 32 }}>
            <Text style={s.sectionLabel}>DE</Text>
            <Text style={s.blockName}>Médéré</Text>
            <Text style={s.blockText}>
              {"174 Boulevard Malesherbes\n75017 Paris\ncontact@medere.fr"}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.sectionLabel}>À</Text>
            <Text style={s.blockName}>{formData.nomContactOuSociete || "—"}</Text>
            {isSociete && formData.siren?.length === 9 && (
              <Text style={s.blockText}>SIREN : {formData.siren}</Text>
            )}
            {isPS && formData.rpps?.length === 11 && (
              <Text style={s.blockText}>RPPS : {formData.rpps}</Text>
            )}
            <Text style={s.blockText}>{formData.emailContact}</Text>
            {!!formData.dureeValidite && (
              <Text style={[s.blockText, { color: "#a3a3a3", marginTop: 4 }]}>
                Validité : {DUREE_LABELS[formData.dureeValidite] || formData.dureeValidite}
              </Text>
            )}
          </View>
        </View>

        {/* Tableau sessions */}
        <View style={{ marginBottom: 16 }}>
          <View
            style={[
              s.row,
              {
                borderBottomWidth: 1,
                borderBottomColor: "#e5e5e5",
                paddingBottom: 5,
                marginBottom: 2,
              },
            ]}
          >
            <Text style={[s.thText, { flex: 1 }]}>DESCRIPTION</Text>
            <Text style={[s.thText, { width: 30, textAlign: "center" }]}>QTÉ</Text>
            <Text style={[s.thText, { width: 65, textAlign: "right" }]}>PRIX UNIT.</Text>
            <Text style={[s.thText, { width: 75, textAlign: "right" }]}>SOUS-TOTAL</Text>
          </View>

          {formData.sessions.map(({ session, quantite }, i) => (
            <View
              key={i}
              style={[
                s.row,
                {
                  borderBottomWidth: 1,
                  borderBottomColor: "#f5f5f5",
                  paddingVertical: 7,
                },
              ]}
            >
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={s.sessionName}>{session.nom}</Text>
                {!!session.sessionId && (
                  <Text style={s.sessionId}>
                    {session.sessionId}
                    {session.numeroSession ? ` · Session ${session.numeroSession}` : ""}
                  </Text>
                )}
              </View>
              <Text style={{ fontSize: 9, color: "#525252", width: 30, textAlign: "center" }}>
                {quantite}
              </Text>
              <Text style={{ fontSize: 9, color: "#525252", width: 65, textAlign: "right" }}>
                {session.prixUnitaire > 0 ? fmt(session.prixUnitaire) : "—"}
              </Text>
              <Text
                style={{
                  fontSize: 9,
                  fontFamily: "Helvetica-Bold",
                  color: "#171717",
                  width: 75,
                  textAlign: "right",
                }}
              >
                {session.prixUnitaire > 0 ? fmt(session.prixUnitaire * quantite) : "—"}
              </Text>
            </View>
          ))}
        </View>

        {/* Totaux */}
        <View style={{ alignItems: "flex-end", marginBottom: 24 }}>
          <View style={{ width: 210 }}>
            <View style={[s.row, s.jBetween, { marginBottom: 3 }]}>
              <Text style={{ fontSize: 9, color: "#525252" }}>Sous-total HT</Text>
              <Text style={{ fontSize: 9, color: "#525252" }}>
                {sousTotal > 0 ? fmt(sousTotal) : "—"}
              </Text>
            </View>
            {formData.remise > 0 && (
              <View style={[s.row, s.jBetween, { marginBottom: 3 }]}>
                <Text style={{ fontSize: 9, color: "#15803d" }}>Remise</Text>
                <Text style={{ fontSize: 9, color: "#15803d" }}>−{fmt(formData.remise)}</Text>
              </View>
            )}
            <View style={{ height: 1, backgroundColor: "#e5e5e5", marginVertical: 6 }} />
            <View style={[s.row, s.jBetween]}>
              <Text style={s.totalLabel}>Total HT</Text>
              <Text style={s.totalLabel}>{sousTotal > 0 ? fmt(total) : "—"}</Text>
            </View>
          </View>
        </View>

        {/* Commentaires */}
        {!!formData.commentaires && (
          <View style={s.commentBox}>
            <Text style={s.commentLabel}>COMMENTAIRES</Text>
            <Text style={s.commentText}>
              {formData.commentaires.length > 350
                ? formData.commentaires.slice(0, 350) + "…"
                : formData.commentaires}
            </Text>
          </View>
        )}

        {/* Footer — position absolue pour rester toujours au même endroit sur la page 1 */}
        <View style={{ position: "absolute", bottom: 40, left: 40, right: 40 }}>
          {/* Votre contact */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[s.sectionLabel, { marginBottom: 4 }]}>VOTRE CONTACT</Text>
            <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: "#262626" }}>
              {commercial.nom}
            </Text>
            <Text style={{ fontSize: 9, color: "#737373" }}>{commercial.email}</Text>
            {!!commercial.phone && (
              <Text style={{ fontSize: 9, color: "#737373" }}>{commercial.phone}</Text>
            )}
          </View>

          {/* Signature Médéré + Signature client côte à côte */}
          <View style={[s.row, s.jBetween, { alignItems: "flex-start" }]}>
            <View style={{ flex: 1, paddingRight: 24 }}>
              <Text style={s.sectionLabel}>POUR MÉDÉRÉ</Text>
              <Text style={{ fontSize: 9, color: "#525252", marginBottom: 6 }}>
                Harry Sitbon, Directeur Général Médéré
              </Text>
              <Image
                style={{ height: 36, objectFit: "contain", objectPositionX: "left" }}
                src={SIGNATURE_HARRY_PATH}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.sectionLabel}>SIGNATURE DU CLIENT</Text>
              <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: "#404040" }}>
                Signature du Client :
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function generateDevisPdf(params: DevisPdfProps): Promise<Buffer> {
  const { renderToBuffer } = await import("@react-pdf/renderer");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await renderToBuffer(React.createElement(DevisPdf, params) as any);
}
