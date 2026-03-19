"use client";
import type { FormData, Commercial } from "@/types";
import { TYPES_DEVIS, DUREES_VALIDITE } from "@/types";
import { formatEuros, formatDate, calculerDateExpiration } from "@/lib/utils";

interface QuotePreviewProps {
  formData: FormData;
  commercial: Commercial | undefined;
}

const NUMERO_DEVIS_PREVIEW = "DEV-" + new Date().getFullYear() + "XXXX-000";

export function QuotePreview({ formData, commercial }: QuotePreviewProps) {
  const sousTotal = formData.sessions.reduce(
    (sum, { session, quantite }) => sum + session.prixUnitaire * quantite,
    0
  );
  const total = Math.max(0, sousTotal - formData.remise);

  const typeDevisLabel = TYPES_DEVIS.find((t) => t.value === formData.typeDevis)?.label || "—";
  const dureeLabel = DUREES_VALIDITE.find((d) => d.value === formData.dureeValidite)?.label || "—";
  const isSociete = formData.typeDevis === "societe";
  const isPS = formData.typeDevis === "ps";

  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
      {/* Barre titre */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-100 bg-neutral-50">
        <span className="text-xs font-medium text-neutral-500">Prévisualisation du devis</span>
        <span className="text-xs text-neutral-400">Se met à jour en temps réel</span>
      </div>

      {/* Document */}
      <div className="p-8 text-[13px] leading-relaxed text-neutral-800 flex flex-col min-h-[860px]">
        {/* Logo + numéro */}
        <div className="flex items-start justify-between mb-8">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-medere.png" alt="médéré" className="h-6 w-auto" />
          </div>
          <div className="text-right">
            <div className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1">Devis</div>
            <div className="flex items-center gap-1.5">
              <div className="text-sm font-semibold text-neutral-900">{NUMERO_DEVIS_PREVIEW}</div>
              <div className="group relative">
                <div className="h-4 w-4 rounded-full bg-neutral-200 flex items-center justify-center cursor-default">
                  <span className="text-[9px] font-bold text-neutral-500">i</span>
                </div>
                <div className="absolute right-0 top-5 z-10 w-52 rounded-md bg-neutral-800 px-2.5 py-2 text-[10px] text-white leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                  La référence sera générée automatiquement à l'envoi du devis.
                </div>
              </div>
            </div>
            <div className="text-xs text-neutral-500 mt-1">Émis le {formatDate()}</div>
            {formData.dureeValidite && (
              <div className="text-xs text-neutral-500">
                Valable jusqu&apos;au {calculerDateExpiration(formData.dureeValidite)}
              </div>
            )}
            {formData.typeDevis && (
              <div className="mt-1.5 inline-block px-2 py-0.5 rounded-full bg-neutral-100 text-xs text-neutral-600 font-medium">
                {typeDevisLabel}
              </div>
            )}
          </div>
        </div>

        <div className="h-px bg-neutral-100 mb-6" />

        {/* Blocs expéditeur / destinataire */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">De</div>
            <div className="font-semibold text-neutral-900">Médéré</div>
            <div className="text-neutral-600 text-xs mt-0.5 leading-relaxed">
              174 Boulevard Malesherbes<br />
              75017 Paris<br />
              contact@medere.fr
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">À</div>
            <div className="font-semibold text-neutral-900">
              {formData.nomContactOuSociete || (
                <span className="text-neutral-300 font-normal italic">
                  {isSociete ? "Nom de la société" : "Nom du PS"}
                </span>
              )}
            </div>
            {isSociete && formData.siren && formData.siren.length === 9 && (
              <div className="text-xs text-neutral-500 mt-0.5">SIREN : {formData.siren}</div>
            )}
            {isPS && formData.rpps && formData.rpps.length === 11 && (
              <div className="text-xs text-neutral-500 mt-0.5">RPPS : {formData.rpps}</div>
            )}
            <div className="text-xs text-neutral-600 mt-0.5">
              {formData.emailContact || (
                <span className="text-neutral-300 italic">email@contact.fr</span>
              )}
            </div>
            {formData.dureeValidite && (
              <div className="text-xs text-neutral-400 mt-1">Validité : {dureeLabel}</div>
            )}
          </div>
        </div>

        {/* Tableau sessions */}
        <div className="mb-6">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left py-2 font-semibold text-neutral-500 uppercase tracking-wider">Description</th>
                <th className="text-center py-2 font-semibold text-neutral-500 uppercase tracking-wider w-12">Qté</th>
                <th className="text-right py-2 font-semibold text-neutral-500 uppercase tracking-wider w-24">Prix unit.</th>
                <th className="text-right py-2 font-semibold text-neutral-500 uppercase tracking-wider w-24">Sous-total</th>
              </tr>
            </thead>
            <tbody>
              {formData.sessions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-neutral-300 italic">
                    Aucune session sélectionnée
                  </td>
                </tr>
              ) : (
                formData.sessions.map(({ session, quantite }, i) => (
                  <tr key={i} className="border-b border-neutral-50">
                    <td className="py-2.5 pr-4">
                      <div className="font-medium text-neutral-800">{session.nom}</div>
                      {session.sessionId && (
                        <div className="text-[10px] text-neutral-400 mt-0.5 font-mono">
                          {session.sessionId}
                          {session.numeroSession && ` · Session ${session.numeroSession}`}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 text-center text-neutral-700">{quantite}</td>
                    <td className="py-2.5 text-right text-neutral-700">
                      {session.prixUnitaire > 0 ? formatEuros(session.prixUnitaire) : "—"}
                    </td>
                    <td className="py-2.5 text-right font-medium text-neutral-800">
                      {session.prixUnitaire > 0 ? formatEuros(session.prixUnitaire * quantite) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Totaux */}
        <div className="flex justify-end mb-8">
          <div className="w-56 flex flex-col gap-1.5">
            <div className="flex justify-between text-xs text-neutral-600">
              <span>Sous-total HT</span>
              <span>{sousTotal > 0 ? formatEuros(sousTotal) : "—"}</span>
            </div>
            {formData.remise > 0 && (
              <div className="flex justify-between text-xs text-green-700">
                <span>Remise</span>
                <span>−{formatEuros(formData.remise)}</span>
              </div>
            )}
            <div className="h-px bg-neutral-200 my-1" />
            <div className="flex justify-between text-sm font-semibold text-neutral-900">
              <span>Total HT</span>
              <span>{sousTotal > 0 ? formatEuros(total) : "—"}</span>
            </div>
          </div>
        </div>

        {/* Commentaires */}
        {formData.commentaires && (
          <div className="mb-8 p-3 rounded-md bg-neutral-50 border border-neutral-100">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
              Commentaires
            </div>
            <p className="text-xs text-neutral-700 whitespace-pre-line">{formData.commentaires}</p>
          </div>
        )}

        {/* Pied : commercial + signature */}
        <div className="mt-auto pt-6">
          <div className="h-px bg-neutral-100 mb-6" />

          {/* Ligne 1 : Votre contact | Signature du client */}
          <div className="flex items-start justify-between mb-4">
            <div className="text-xs flex-1 pr-6">
              <div className="text-[10px] text-neutral-400 mb-1 uppercase tracking-wider font-semibold">
                Votre contact
              </div>
              {commercial ? (
                <>
                  <div className="font-semibold text-neutral-800">{commercial.nom}</div>
                  <div className="text-neutral-500">{commercial.email}</div>
                  {commercial.phone && (
                    <div className="text-neutral-500">{commercial.phone}</div>
                  )}
                </>
              ) : (
                <div className="text-neutral-300 italic">Sélectionnez un commercial</div>
              )}
            </div>

            {/* Zone signature client */}
            <div className="flex-1 text-xs">
              <div className="text-[10px] text-neutral-400 mb-1 uppercase tracking-wider font-semibold">
                Signature du client
              </div>
              <div className="font-semibold text-neutral-700">
                Signature du Client :
              </div>
            </div>
          </div>

          {/* Ligne 2 : Pour Médéré */}
          <div className="text-xs">
            <div className="text-[10px] text-neutral-400 mb-1 uppercase tracking-wider font-semibold">
              Pour Médéré
            </div>
            <div className="text-neutral-600 mb-1">Harry Sitbon, Directeur Général Médéré</div>
            <img src="/signature-harry.png" alt="Signature Harry Sitbon" className="h-9 object-contain object-left" />
          </div>
        </div>
      </div>
    </div>
  );
}
