import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEuros(montant: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(montant);
}

export function genererNumeroDevis(): string {
  const now = new Date();
  const annee = now.getFullYear();
  const mois = String(now.getMonth() + 1).padStart(2, "0");
  const jour = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `DEV-${annee}${mois}${jour}-${random}`;
}

export function formatDate(date?: Date): string {
  const d = date || new Date();
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function calculerDateExpiration(duree: string): string {
  const now = new Date();
  const jours =
    duree === "30j" ? 30 : duree === "60j" ? 60 : duree === "90j" ? 90 : 30;
  now.setDate(now.getDate() + jours);
  return formatDate(now);
}
