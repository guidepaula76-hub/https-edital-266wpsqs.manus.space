import { describe, it, expect } from "vitest";
import {
  DEMO_QUESTIONS,
  LESSON_TITLES,
  getLessonQuestions,
  getQuestionChoices,
  getCorrectAnswer,
  getQuestionRationales,
  formatForBoard,
} from "../client/src/lib/questions";
import { nextStreak, previousDayKey } from "../client/src/lib/studyLogic";

describe("UltraConcursos demonstrative study logic", () => {
  it("maps exam boards to adaptive answer formats", () => {
    expect(formatForBoard("Cebraspe")).toBe("CE");
    expect(formatForBoard("Quadrix")).toBe("CE");
    expect(formatForBoard("IBFC")).toBe("AD");
    for (const board of ["FGV", "FCC", "Vunesp", "Cesgranrio"])
      expect(formatForBoard(board)).toBe("AE");
  });
  it("renders the correct number of choices and a single valid answer for every format", () => {
    for (const q of DEMO_QUESTIONS)
      for (const format of ["CE", "AD", "AE"] as const) {
        const choices = getQuestionChoices(q, format);
        expect(choices).toHaveLength(
          format === "CE" ? 2 : format === "AD" ? 4 : 5
        );
        expect(
          choices.some(choice => choice.value === getCorrectAnswer(q, format))
        ).toBe(true);
        const rationales = getQuestionRationales(q, format);
        expect(rationales.filter(r => r.correct)).toHaveLength(1);
        expect(rationales.every(r => r.rationale.length > 8)).toBe(true);
      }
  });
  it("supplies three questions per topic with new and harder questions at level two", () => {
    expect(LESSON_TITLES).toHaveLength(6);
    for (let index = 0; index < 6; index++) {
      const basic = getLessonQuestions(1, index),
        advanced = getLessonQuestions(2, index);
      expect(basic).toHaveLength(3);
      expect(advanced).toHaveLength(3);
      expect(
        advanced.every(q => q.level === 2 && q.difficulty === "Difícil")
      ).toBe(true);
      expect(advanced.some(q => basic.some(old => old.id === q.id))).toBe(
        false
      );
    }
  });
  it("keeps same-day streak, advances yesterday, and resets after a gap", () => {
    expect(nextStreak(7, "2026-11-23", "2026-11-23")).toBe(7);
    expect(nextStreak(7, "2026-11-22", "2026-11-23")).toBe(8);
    expect(nextStreak(7, "2026-11-20", "2026-11-23")).toBe(1);
    expect(previousDayKey("2026-03-01")).toBe("2026-02-28");
  });
});
