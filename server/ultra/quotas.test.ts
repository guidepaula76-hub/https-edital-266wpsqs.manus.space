import { describe, expect, it } from "vitest";
import {
  canGenerateQuestionBatch,
  hasExpectedQuestionCount,
  FREE_DAILY_NEW_QUESTION_LIMIT,
  getSaoPauloDayKey,
  NEW_QUESTION_BATCH_SIZE,
} from "./quotas";

describe("daily Free question quota", () => {
  it("allows whole batches while keeping the total at or below ten", () => {
    expect(canGenerateQuestionBatch(0)).toBe(true);
    expect(canGenerateQuestionBatch(6)).toBe(true);
    expect(canGenerateQuestionBatch(7)).toBe(true);
    expect(canGenerateQuestionBatch(8)).toBe(false);
    expect(canGenerateQuestionBatch(9)).toBe(false);
    expect(canGenerateQuestionBatch(9, 1)).toBe(true);
    expect(canGenerateQuestionBatch(8, 2)).toBe(true);
    expect(canGenerateQuestionBatch(8, 3)).toBe(false);
    expect(FREE_DAILY_NEW_QUESTION_LIMIT).toBe(10);
    expect(NEW_QUESTION_BATCH_SIZE).toBe(3);
  });

  it("rejects invalid or negative counters instead of bypassing the quota", () => {
    expect(canGenerateQuestionBatch(-1)).toBe(false);
    expect(canGenerateQuestionBatch(Number.NaN)).toBe(false);
    expect(canGenerateQuestionBatch(0, 0)).toBe(false);
    expect(canGenerateQuestionBatch(0, 3, -1)).toBe(false);
  });

  it("uses the São Paulo calendar day, including its UTC offset", () => {
    expect(getSaoPauloDayKey(new Date("2026-11-27T02:30:00.000Z"))).toBe("2026-11-26");
  });
  it("accepts the exact dynamically selected batch size, including the final 1- or 2-question batch", () => {
    expect(hasExpectedQuestionCount(3, 3)).toBe(true);
    expect(hasExpectedQuestionCount(2, 2)).toBe(true);
    expect(hasExpectedQuestionCount(1, 1)).toBe(true);
    expect(hasExpectedQuestionCount(1, 3)).toBe(false);
    expect(hasExpectedQuestionCount(2, 3)).toBe(false);
    expect(hasExpectedQuestionCount(0, 1)).toBe(false);
  });

});
