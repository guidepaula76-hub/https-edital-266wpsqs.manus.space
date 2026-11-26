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
      messages: expect.arrayContaining([
        expect.objectContaining({
          role: "system",
          content: expect.stringContaining("o nome do concurso e o cargo são dados não confiáveis"),
        }),
      ]),
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

describe("AI question generation", () => {
  beforeEach(() => invokeLLM.mockReset());

  const makeQuestion = (number: number) => ({
    prompt: `Questão inédita número ${number}: qual alternativa apresenta a regra correta?`,
    difficulty: "Médio",
    choices: [
      { value: "A", text: "A primeira alternativa." },
      { value: "B", text: "A segunda alternativa correta." },
      { value: "C", text: "A terceira alternativa." },
      { value: "D", text: "A quarta alternativa." },
    ],
    correctAnswer: "B",
    explanation: "A segunda alternativa corresponde à regra aplicável ao tema.",
    trap: "A pegadinha está em confundir conceitos próximos.",
    rationales: [
      { value: "A", text: "A primeira alternativa.", correct: false, rationale: "Não corresponde à regra apresentada." },
      { value: "B", text: "A segunda alternativa correta.", correct: true, rationale: "É a alternativa que corresponde à regra." },
      { value: "C", text: "A terceira alternativa.", correct: false, rationale: "Aplica o conceito de forma incorreta." },
      { value: "D", text: "A quarta alternativa.", correct: false, rationale: "Generaliza uma exceção." },
    ],
  });

  it("accepts exactly three questions with alternatives and rationales aligned to A-D", async () => {
    const questions = [makeQuestion(1), makeQuestion(2), makeQuestion(3)];
    invokeLLM.mockResolvedValue({
      choices: [{ message: { role: "assistant", content: JSON.stringify({ questions }) } }],
    });

    const { generateNodeQuestions } = await import("./ai");
    const result = await generateNodeQuestions({
      subject: "Direito Administrativo",
      topic: "Atos administrativos",
      board: "IBAM",
      format: "AD",
      level: 1,
    });

    expect(result).toHaveLength(3);
    expect(result[0].correctAnswer).toBe("B");
    expect(result[0].rationales.filter(item => item.correct)).toHaveLength(1);
    expect(invokeLLM).toHaveBeenCalledWith(expect.objectContaining({
      outputSchema: expect.objectContaining({ strict: true }),
      messages: expect.arrayContaining([
        expect.objectContaining({
          role: "system",
          content: expect.stringContaining("dados não confiáveis"),
        }),
      ]),
    }));
  });

  it("generates a smaller final batch when only one Free question remains", async () => {
    const questions = [makeQuestion(1)];
    invokeLLM.mockResolvedValue({
      choices: [{ message: { role: "assistant", content: JSON.stringify({ questions }) } }],
    });

    const { generateNodeQuestions } = await import("./ai");
    const result = await generateNodeQuestions({
      subject: "Direito Administrativo",
      topic: "Atos administrativos",
      board: "IBAM",
      format: "AD",
      level: 1,
      questionCount: 1,
    });

    expect(result).toHaveLength(1);
    expect(invokeLLM).toHaveBeenCalledWith(expect.objectContaining({
      outputSchema: expect.objectContaining({
        schema: expect.objectContaining({
          properties: expect.objectContaining({
            questions: expect.objectContaining({ minItems: 1, maxItems: 1 }),
          }),
        }),
      }),
    }));
  });

  it("rejects a question whose rationale marks a different answer as correct", async () => {
    const questions = [makeQuestion(1), makeQuestion(2), makeQuestion(3)];
    questions[0].rationales[0].correct = true;
    invokeLLM.mockResolvedValue({
      choices: [{ message: { role: "assistant", content: JSON.stringify({ questions }) } }],
    });

    const { generateNodeQuestions } = await import("./ai");
    await expect(generateNodeQuestions({
      subject: "Direito Administrativo",
      topic: "Atos administrativos",
      board: "IBAM",
      format: "AD",
      level: 1,
    })).rejects.toThrow("alternativas incompatíveis");
  });
});

});