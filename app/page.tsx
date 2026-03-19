"use client";
import { useState, useEffect, useCallback } from "react";
import { QuoteForm } from "@/components/shared/QuoteForm";
import { QuotePreview } from "@/components/shared/QuotePreview";
import type { FormData, Commercial, Session } from "@/types";

const FORM_INITIAL: FormData = {
  commercialId: "",
  typeDevis: "",
  dureeValidite: "30j",
  nomContactOuSociete: "",
  siren: "",
  rpps: "",
  specialite: "",
  emailContact: "",
  sessions: [],
  remise: 0,
  commentaires: "",
  emailBody: "",
};

export default function HomePage() {
  const [formData, setFormData] = useState<FormData>(FORM_INITIAL);
  const [commerciaux, setCommerciaux] = useState<Commercial[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function loadData(showLoader = true) {
    if (showLoader) setIsLoading(true);
    try {
      const res = await fetch("/api/airtable", { cache: "no-store" });
      const data = await res.json();
      if (data.commerciaux) setCommerciaux(data.commerciaux);
      if (data.sessions) setSessions(data.sessions);
    } catch (e) {
      console.error("Erreur chargement Airtable:", e);
      showToast("error", "Impossible de charger les données Airtable");
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();

    // Auto-refresh chaque matin à 6h
    function msJusquaProchain6h() {
      const now = new Date();
      const next = new Date();
      next.setHours(6, 0, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      return next.getTime() - now.getTime();
    }

    let timeoutId: ReturnType<typeof setTimeout>;
    function planifierRefresh() {
      timeoutId = setTimeout(() => {
        loadData(false);
        planifierRefresh(); // re-planifie pour le lendemain
      }, msJusquaProchain6h());
    }
    planifierRefresh();

    return () => clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleRefresh() {
    loadData(false);
  }

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  }

  const handleChange = useCallback((updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  async function handleSubmit(): Promise<boolean> {
    if (!formData.commercialId || !formData.emailContact) return false;
    const commercial = commerciaux.find((c) => c.id === formData.commercialId);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/send-devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData, commercial, sessions: formData.sessions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur inconnue");
      showToast("success", `Devis ${data.numeroDevis} en cours de traitement — vous recevrez un email lorsque le devis a été envoyé au client.`);
      setFormData(FORM_INITIAL);
      return true;
    } catch (e) {
      showToast("error", String(e));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  const commercialSelectionne = commerciaux.find((c) => c.id === formData.commercialId);

  return (
    <div className="min-h-screen bg-[#F9F5F2]">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-medere.png" alt="médéré" className="h-5 w-auto" />
            <span className="h-4 w-px bg-neutral-200" />
            <span className="text-sm text-neutral-500">Générateur de devis</span>
          </div>
          <div className="text-xs text-neutral-400">
            Données Airtable
            <span className={`ml-2 inline-block h-1.5 w-1.5 rounded-full ${isLoading ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
          </div>
        </div>
      </header>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg text-sm max-w-sm ${toast.type === "success" ? "bg-white border-emerald-200 text-emerald-800" : "bg-white border-red-200 text-red-700"}`}>
          <span className={`mt-0.5 h-4 w-4 flex-shrink-0 rounded-full ${toast.type === "success" ? "bg-emerald-500" : "bg-red-500"}`} />
          {toast.message}
        </div>
      )}

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="grid grid-cols-[420px_1fr] gap-8 items-start">
          <div className="sticky top-[72px] bg-white rounded-lg border border-neutral-200 shadow-sm overflow-auto max-h-[calc(100vh-96px)]">
            <QuoteForm
              formData={formData}
              onChange={handleChange}
              commerciaux={commerciaux}
              sessions={sessions}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              isSubmitting={isSubmitting}
              onRefresh={handleRefresh}
            />
          </div>
          <div>
            <QuotePreview formData={formData} commercial={commercialSelectionne} />
          </div>
        </div>
      </main>
    </div>
  );
}
