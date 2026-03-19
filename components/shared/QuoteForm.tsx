"use client";
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FormData, Commercial, Session } from "@/types";
import { TYPES_DEVIS, DUREES_VALIDITE, SPECIALITES } from "@/types";
import { cn } from "@/lib/utils";

interface QuoteFormProps {
  formData: FormData;
  onChange: (data: Partial<FormData>) => void;
  commerciaux: Commercial[];
  sessions: Session[];
  onSubmit: () => Promise<boolean>;
  isLoading: boolean;
  isSubmitting: boolean;
  onRefresh: () => void;
}

function FieldGroup({
  label,
  children,
  className,
  required,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

// Dropdown de recherche de sessions
function SessionSearchDropdown({
  sessions,
  sessionsDejaPrises,
  onSelect,
  onClose,
}: {
  sessions: Session[];
  sessionsDejaPrises: string[];
  onSelect: (session: Session) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const filtered = sessions.filter((s) => {
    if (sessionsDejaPrises.includes(s.id)) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      s.nom.toLowerCase().includes(q) ||
      s.sessionId.toLowerCase().includes(q) ||
      s.numeroSession.toLowerCase().includes(q)
    );
  });

  return (
    <div
      ref={containerRef}
      className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden"
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-100">
        <Search className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par nom ou ID session…"
          className="flex-1 text-sm outline-none placeholder:text-neutral-400"
        />
      </div>

      <div className="max-h-64 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-neutral-400">
            Aucune session trouvée
          </div>
        ) : (
          filtered.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelect(session)}
              className="w-full text-left px-4 py-3 hover:bg-neutral-50 border-b border-neutral-50 last:border-0 transition-colors"
            >
              <div className="font-medium text-sm text-neutral-900">
                {session.sessionId}
              </div>
              <div className="flex items-center gap-4 mt-1">
                <div>
                  <span className="text-xs text-neutral-400">Nom de la formation</span>
                  <p className="text-xs text-neutral-700 truncate max-w-[240px]">
                    {session.nom}
                  </p>
                </div>
                {session.numeroSession && (
                  <div>
                    <span className="text-xs text-neutral-400">Numéro de session</span>
                    <p className="text-xs text-neutral-700">{session.numeroSession}</p>
                  </div>
                )}
                {session.prixUnitaire > 0 && (
                  <div className="ml-auto">
                    <p className="text-xs font-medium text-neutral-900">
                      {session.prixUnitaire.toLocaleString("fr-FR")} €
                    </p>
                  </div>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export function QuoteForm({
  formData,
  onChange,
  commerciaux,
  sessions,
  onSubmit,
  isLoading,
  isSubmitting,
  onRefresh,
}: QuoteFormProps) {
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const sessionsDejaPrises = formData.sessions.map((s) => s.session.id);
  const isSociete = formData.typeDevis === "societe";
  const isPS = formData.typeDevis === "ps";

  function handleRefresh() {
    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 1000);
  }

  function handleSelectSession(session: Session, replaceIndex?: number) {
    if (replaceIndex !== undefined) {
      const updated = [...formData.sessions];
      updated[replaceIndex] = { session, quantite: updated[replaceIndex].quantite };
      onChange({ sessions: updated });
      setOpenDropdownIndex(null);
    } else {
      onChange({
        sessions: [...formData.sessions, { session, quantite: 1 }],
      });
      setShowAddDropdown(false);
    }
  }

  function modifierQuantite(index: number, quantite: number) {
    const updated = [...formData.sessions];
    updated[index] = { ...updated[index], quantite: Math.max(1, quantite) };
    onChange({ sessions: updated });
  }

  function supprimerSession(index: number) {
    onChange({ sessions: formData.sessions.filter((_, i) => i !== index) });
  }

  function remplirDonneesTest() {
    const commercial =
      commerciaux.find((c) => c.nom.toLowerCase().includes("jordan")) || commerciaux[0];
    const sessionsTest = sessions.slice(0, 2);
    if (!commercial || sessionsTest.length < 1) return;
    const sousTest = sessionsTest.reduce((s, sess) => s + sess.prixUnitaire, 0);
    onChange({
      commercialId: commercial.id,
      typeDevis: "ps",
      dureeValidite: "30j",
      nomContactOuSociete: "Dr. Olivier Bennaim",
      rpps: "12345678901",
      siren: "",
      specialite: "medecin",
      emailContact: "olivier.bennaim@gmail.com",
      sessions: sessionsTest.map((s) => ({ session: s, quantite: 1 })),
      remise: 100,
      commentaires: `[TEST] Devis de démonstration — sous-total ${sousTest} € · ne pas envoyer`,
      emailBody: "",
    });
  }

  async function handleConfirmerEnvoi() {
    setShowConfirmModal(false);
    const success = await onSubmit();
    if (success) {
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 4000);
    }
  }

  const sousTotal = formData.sessions.reduce(
    (sum, { session, quantite }) => sum + session.prixUnitaire * quantite,
    0
  );
  const total = Math.max(0, sousTotal - formData.remise);

  const isFormValid =
    !!formData.commercialId &&
    !!formData.typeDevis &&
    !!formData.nomContactOuSociete &&
    !!formData.emailContact &&
    !!formData.specialite &&
    formData.sessions.length > 0 &&
    formData.sessions.every((s) => !!s.session) &&
    !(isSociete && formData.siren.length !== 9) &&
    !(isPS && formData.rpps.length !== 11);

  return (
    <>
    <div className="flex flex-col gap-0 divide-y divide-neutral-100">
      {/* En-tête */}
      <div className="px-6 py-5 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">Nouveau devis</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Remplissez les informations pour générer un devis
          </p>
        </div>
        {process.env.NODE_ENV !== "production" && (
          <button
            onClick={remplirDonneesTest}
            disabled={isLoading || commerciaux.length === 0}
            className="text-[10px] px-2.5 py-1 rounded border border-dashed border-amber-300 text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors disabled:opacity-40"
          >
            Données de test
          </button>
        )}
      </div>

      {/* Section : Infos générales */}
      <div className="px-6 py-5 flex flex-col gap-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
          Informations générales
        </p>

        {/* Commercial + bouton refresh */}
        <FieldGroup label="Propriétaire de la vente" required>
          {isLoading ? (
            <div className="h-9 rounded-md bg-neutral-100 animate-pulse" />
          ) : (
            <div className="flex gap-2">
              <Select
                value={formData.commercialId}
                onValueChange={(v) => onChange({ commercialId: v })}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Sélectionner un commercial…" />
                </SelectTrigger>
                <SelectContent>
                  {commerciaux.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                title="Rafraîchir les données"
                className="h-9 w-9 flex items-center justify-center rounded-md border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-colors disabled:opacity-40"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
              </button>
            </div>
          )}
        </FieldGroup>

        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Type de devis" required>
            <Select
              value={formData.typeDevis}
              onValueChange={(v) => onChange({ typeDevis: v, siren: "", rpps: "" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type…" />
              </SelectTrigger>
              <SelectContent>
                {TYPES_DEVIS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>

          <FieldGroup label="Durée de validité" required>
            <Select
              value={formData.dureeValidite}
              onValueChange={(v) => onChange({ dureeValidite: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Durée…" />
              </SelectTrigger>
              <SelectContent>
                {DUREES_VALIDITE.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
        </div>
      </div>

      {/* Section : Contact */}
      <div className="px-6 py-5 flex flex-col gap-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
          Contact / Destinataire
        </p>

        <FieldGroup label={isSociete ? "Nom de la société" : "Nom du PS"} required>
          <Input
            placeholder={isSociete ? "Nom de la société…" : "Dr. Martin…"}
            value={formData.nomContactOuSociete}
            onChange={(e) => onChange({ nomContactOuSociete: e.target.value })}
          />
        </FieldGroup>

        {isSociete && (
          <FieldGroup label="Numéro SIREN" required>
            <Input
              placeholder="9 chiffres"
              value={formData.siren}
              maxLength={9}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 9);
                onChange({ siren: val });
              }}
              className={cn(
                formData.siren && formData.siren.length !== 9 && "border-red-300 focus:ring-red-400"
              )}
            />
            {formData.siren && formData.siren.length !== 9 && (
              <p className="text-xs text-red-500">Le SIREN doit contenir exactement 9 chiffres</p>
            )}
          </FieldGroup>
        )}

        {isPS && (
          <FieldGroup label="Numéro RPPS" required>
            <Input
              placeholder="11 chiffres"
              value={formData.rpps}
              maxLength={11}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 11);
                onChange({ rpps: val });
              }}
              className={cn(
                formData.rpps && formData.rpps.length !== 11 && "border-red-300 focus:ring-red-400"
              )}
            />
            {formData.rpps && formData.rpps.length !== 11 && (
              <p className="text-xs text-red-500">Le RPPS doit contenir exactement 11 chiffres</p>
            )}
          </FieldGroup>
        )}

        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Spécialité" required>
            <Select
              value={formData.specialite}
              onValueChange={(v) => onChange({ specialite: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Spécialité…" />
              </SelectTrigger>
              <SelectContent>
                {SPECIALITES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>

          <FieldGroup label="Email du contact" required>
            <Input
              type="email"
              placeholder="contact@exemple.fr"
              value={formData.emailContact}
              onChange={(e) => onChange({ emailContact: e.target.value })}
            />
          </FieldGroup>
        </div>
      </div>

      {/* Section : Sessions */}
      <div className="px-6 py-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Sessions de formation <span className="text-red-500">*</span>
          </p>
          <div className="flex items-center gap-2">
            {formData.sessions.length < 3 && sessions.length > 0 && (
              <span className="text-[10px] text-neutral-400">
                {formData.sessions.length}/3 sélectionnées
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="Rafraîchir les sessions"
              className="h-6 w-6 flex items-center justify-center rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors disabled:opacity-40"
            >
              <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
            </button>
          </div>
        </div>

        {formData.sessions.map((item, index) => (
          <div
            key={index}
            className="flex flex-col gap-2 rounded-lg border border-neutral-150 bg-neutral-50 p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500">Session {index + 1}</span>
              <button
                onClick={() => supprimerSession(index)}
                className="text-neutral-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() =>
                  setOpenDropdownIndex(openDropdownIndex === index ? null : index)
                }
                className="w-full text-left flex items-center justify-between gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm hover:bg-neutral-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium text-xs text-neutral-900 truncate">
                    {item.session.sessionId}
                  </p>
                  <p className="text-xs text-neutral-500 truncate mt-0.5">
                    {item.session.nom}
                  </p>
                </div>
                <Search className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
              </button>

              {openDropdownIndex === index && (
                <SessionSearchDropdown
                  sessions={sessions}
                  sessionsDejaPrises={sessionsDejaPrises.filter(
                    (id) => id !== item.session.id
                  )}
                  onSelect={(s) => handleSelectSession(s, index)}
                  onClose={() => setOpenDropdownIndex(null)}
                />
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500 w-16 shrink-0">Quantité</span>
              <Input
                type="number"
                min={1}
                value={item.quantite}
                onChange={(e) =>
                  modifierQuantite(index, parseInt(e.target.value) || 1)
                }
                className="w-20 bg-white"
              />
              {item.session.prixUnitaire > 0 && (
                <span className="text-xs text-neutral-500 ml-auto">
                  {item.session.prixUnitaire.toLocaleString("fr-FR")} € / unité
                </span>
              )}
            </div>
          </div>
        ))}

        {formData.sessions.length < 3 && (
          <div className="relative">
            <button
              onClick={() => setShowAddDropdown(!showAddDropdown)}
              disabled={isLoading || sessions.length === 0}
              className="flex items-center justify-center gap-2 w-full rounded-lg border border-dashed border-neutral-200 py-3 text-sm text-neutral-400 hover:border-neutral-400 hover:text-neutral-600 transition-colors disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              {isLoading ? "Chargement…" : "Ajouter une session"}
            </button>

            {showAddDropdown && (
              <SessionSearchDropdown
                sessions={sessions}
                sessionsDejaPrises={sessionsDejaPrises}
                onSelect={(s) => handleSelectSession(s)}
                onClose={() => setShowAddDropdown(false)}
              />
            )}
          </div>
        )}
      </div>

      {/* Section : Remise & Commentaires */}
      <div className="px-6 py-5 flex flex-col gap-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
          Options
        </p>

        <FieldGroup label="Remise (€)">
          <div className="relative">
            <Input
              type="number"
              min={0}
              step={1}
              placeholder="0"
              value={formData.remise || ""}
              onChange={(e) =>
                onChange({ remise: Math.max(0, parseFloat(e.target.value) || 0) })
              }
              className="pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
              €
            </span>
          </div>
        </FieldGroup>

        <FieldGroup label="Commentaires">
          <Textarea
            placeholder="Informations complémentaires, conditions particulières…"
            value={formData.commentaires}
            onChange={(e) => {
              const val = e.target.value;
              const lignes = val.split("\n").length;
              if (val.length <= 350 && lignes <= 5) {
                onChange({ commentaires: val });
              }
            }}
            onKeyDown={(e) => {
              const lignes = formData.commentaires.split("\n").length;
              if (e.key === "Enter" && lignes >= 5) e.preventDefault();
            }}
            rows={4}
          />
          <div className="flex justify-end mt-1 text-[11px] text-neutral-400">
            {formData.commentaires.length} / 350 · {formData.commentaires.split("\n").length} / 5 lignes
          </div>
        </FieldGroup>
      </div>

      {/* Bouton envoi */}
      <div className="px-6 py-5">
        <Button
          onClick={() => setShowConfirmModal(true)}
          disabled={isSubmitting || submitSuccess || !isFormValid}
          size="lg"
          className={cn(
            "w-full transition-colors",
            submitSuccess && "bg-emerald-600 hover:bg-emerald-600 text-white"
          )}
        >
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Envoi en cours…
            </>
          ) : submitSuccess ? (
            "Devis envoyé ✓"
          ) : (
            "Envoyer le devis"
          )}
        </Button>
      </div>

    </div>

    {/* Modale de confirmation — rendue via portal pour échapper au overflow-auto */}
    {showConfirmModal && createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Fond semi-transparent */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowConfirmModal(false)}
        />

        {/* Carte modale */}
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5">
          <div>
            <h3 className="text-base font-semibold text-neutral-900">Confirmer l&apos;envoi du devis</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Vérifiez les informations avant d&apos;envoyer.</p>
          </div>

          {/* Résumé */}
          <div className="rounded-lg bg-neutral-50 border border-neutral-100 p-4 flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Client</span>
              <span className="font-medium text-neutral-900 text-right max-w-[200px] truncate">
                {formData.nomContactOuSociete || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Email</span>
              <span className="font-medium text-neutral-900">{formData.emailContact || "—"}</span>
            </div>

            {formData.sessions.length > 0 && (
              <div className="flex flex-col gap-1 pt-1 border-t border-neutral-200">
                <span className="text-neutral-500 text-xs mb-1">Sessions</span>
                {formData.sessions.map(({ session, quantite }, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-neutral-700 truncate max-w-[220px]">{session.nom}</span>
                    <span className="text-neutral-500 ml-2 shrink-0">×{quantite}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-1 border-t border-neutral-200">
              <span className="text-neutral-500">Total HT</span>
              <span className="font-semibold text-neutral-900">
                {total > 0 ? `${total.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €` : "—"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="flex-1 rounded-lg border border-red-200 bg-red-50 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirmerEnvoi}
              className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              Confirmer l&apos;envoi
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
