import { beforeEach, describe, expect, it, vi } from "vitest";

const { invokeLLM } = vi.hoisted(() => ({ invokeLLM: vi.fn() }));
vi.mock("../_core/llm", () => ({ invokeLLM }));

import { verticalizeSyllabus } from "./ai";

describe("AI edital verticalization", () => {
  beforeEach(() => invokeLLM.mockReset());

  it("accepts a valid structured syllabus and adds a review warning", async () => {
    invokeLLM.mockResolvedValue({
      choices: [{
        message: {
          role: "assistant",
          content: JSON.stringify({
            disciplines: [{ name: "Direito Constitucional", topics: ["Direitos e garantias fundamentais"] }],
            warnings: [],
          }),
        },
      }],
    });

    const result = await verticalizeSyllabus({
      text: "Direitos e garantias fundamentais e organização do Estado.",
      concurso: "Concurso municipal",
      cargo: "Agente",
    });

    expect(result.disciplines).toEqual([
      { name: "Direito Constitucional", topics: ["Direitos e garantias fundamentais"] },
    ]);
    expect(result.warnings.some(warning => warning.includes("gerada por IA"))).toBe(true);
    expect(invokeLLM).toHaveBeenCalledWith(expect.objectContaining({
      model: "gpt-6-luna",
      maxCompletionTokens: 3500,
      outputSchema: expect.objectContaining({ strict: true }),
    }));
  });

  it("rejects malformed JSON and invalid discipline structures", async () => {
    invokeLLM.mockResolvedValue({
      choices: [{ message: { role: "assistant", content: "{not-json" } }],
    });
    await expect(verticalizeSyllabus({
      text: "Conteúdo programático com matéria e tópicos.",
      concurso: "Concurso municipal",
      cargo: "Agente",
    })).rejects.toThrow("formato inválido");

    invokeLLM.mockResolvedValue({
      choices: [{
        message: {
          role: "assistant",
          content: JSON.stringify({ disciplines: [], warnings: [] }),
        },
      }],
    });
    await expect(verticalizeSyllabus({
      text: "Conteúdo programático com matéria e tópicos.",
      concurso: "Concurso municipal",
      cargo: "Agente",
    })).rejects.toThrow("não passou pela validação");
  });

  it("rejects an empty model response", async () => {
    invokeLLM.mockResolvedValue({ choices: [{ message: { role: "assistant", content: "" } }] });
    await expect(verticalizeSyllabus({
      text: "Conteúdo programático com matéria e tópicos.",
      concurso: "Concurso municipal",
      cargo: "Agente",
    })).rejects.toThrow("não retornou");
  });
});
