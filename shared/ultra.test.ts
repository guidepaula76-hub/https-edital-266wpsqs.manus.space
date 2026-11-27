import { describe, expect, it } from "vitest";
import { goalInputSchema } from "./ultra";

const validGoal = {
  concurso: "Concurso municipal",
  cargo: "Agente administrativo",
  nivel: "Médio" as const,
  banca: "IBAM",
  format: "AD" as const,
  hours: 2,
  examDate: "",
  disciplines: [{ name: "Português", topics: ["Interpretação de texto"] }],
  documentId: null,
};

describe("goalInputSchema exam date", () => {
  it("accepts a real calendar date and an empty optional date", () => {
    expect(goalInputSchema.safeParse({ ...validGoal, examDate: "2026-02-28" }).success).toBe(true);
    expect(goalInputSchema.safeParse({ ...validGoal, examDate: "2028-02-29" }).success).toBe(true);
    expect(goalInputSchema.safeParse(validGoal).success).toBe(true);
  });

  it("rejects impossible calendar dates even when they match YYYY-MM-DD", () => {
    for (const examDate of ["2026-02-31", "2027-02-29", "2026-99-99", "2026-13-01"]) {
      expect(goalInputSchema.safeParse({ ...validGoal, examDate }).success).toBe(false);
    }
  });
});
