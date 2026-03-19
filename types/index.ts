// Types pour l'application de devis Médéré

export interface Commercial {
  id: string;
  nom: string;   // hubspot_name = prénom + nom complet
  prenom: string;
  email: string;
  phone?: string;
}

export interface Session {
  id: string;
  sessionId: string;         // ex: "00000000003_26001"
  nom: string;               // Nom de la formation
  description: string;
  numeroSession: string;     // ex: "26.001"
  prixUnitaire: number;
}

export interface SessionDevis {
  session: Session;
  quantite: number;
}

export interface FormData {
  commercialId: string;
  typeDevis: string;         // "societe" | "ps"
  dureeValidite: string;
  nomContactOuSociete: string;
  siren: string;             // uniquement si type = société (9 chiffres)
  rpps: string;              // uniquement si type = ps (11 chiffres)
  specialite: string;
  emailContact: string;
  sessions: SessionDevis[];
  remise: number;            // en €
  commentaires: string;
  emailBody: string;
}

export const TYPES_DEVIS = [
  { value: "societe", label: "Société" },
  { value: "ps", label: "Praticien de Santé" },
];

export const DUREES_VALIDITE = [
  { value: "30j", label: "30 jours" },
  { value: "60j", label: "60 jours" },
  { value: "90j", label: "90 jours" },
];

export const SPECIALITES = [
  { value: "medecin", label: "Médecin" },
  { value: "dentiste", label: "Dentiste" },
  { value: "autre", label: "Autre" },
];
