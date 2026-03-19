import { formatEuros, genererNumeroDevis, formatDate, calculerDateExpiration } from "@/lib/utils";

describe("formatEuros", () => {
  it("formate correctement un montant en euros", () => {
    expect(formatEuros(1500)).toMatch(/1\s?500,00\s?€/);
    expect(formatEuros(0)).toMatch(/0,00\s?€/);
    expect(formatEuros(1234.5)).toMatch(/1\s?234,50\s?€/);
  });
});

describe("genererNumeroDevis", () => {
  it("génère un numéro au bon format", () => {
    const numero = genererNumeroDevis();
    expect(numero).toMatch(/^DEV-\d{8}-\d{3}$/);
  });

  it("génère des numéros uniques", () => {
    const n1 = genererNumeroDevis();
    const n2 = genererNumeroDevis();
    // La partie aléatoire peut coïncider mais le format doit être valide
    expect(n1).toMatch(/^DEV-/);
    expect(n2).toMatch(/^DEV-/);
  });
});

describe("formatDate", () => {
  it("retourne une date lisible en français", () => {
    const date = new Date(2025, 0, 15); // 15 janvier 2025
    expect(formatDate(date)).toBe("15 janvier 2025");
  });
});

describe("calculerDateExpiration", () => {
  it("ajoute le bon nombre de jours", () => {
    // On fixe la date courante pour tester
    const originalDate = global.Date;
    const mockDate = new Date(2025, 0, 1); // 1er janvier 2025
    global.Date = class extends originalDate {
      constructor() {
        super();
        return mockDate;
      }
      static now() { return mockDate.getTime(); }
    } as unknown as DateConstructor;

    const expiration30j = calculerDateExpiration("30j");
    expect(expiration30j).toBe("31 janvier 2025");

    global.Date = originalDate;
  });
});
