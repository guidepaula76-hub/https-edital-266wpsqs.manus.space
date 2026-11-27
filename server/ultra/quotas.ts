export const FREE_DAILY_NEW_QUESTION_LIMIT = 10;
export const FREE_DAILY_VERTICALIZATION_LIMIT = 3;

export function canVerticalize(used: number, dailyLimit = FREE_DAILY_VERTICALIZATION_LIMIT): boolean {
  return Number.isSafeInteger(used)
    && Number.isSafeInteger(dailyLimit)
    && used >= 0
    && dailyLimit >= 0
    && used < dailyLimit;
}
export const NEW_QUESTION_BATCH_SIZE = 3;

/** Calendar day used for quotas follows the product's São Paulo timezone. */
export function getSaoPauloDayKey(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** A generation batch is all-or-nothing; never allow it to exceed the daily cap. */
export function canGenerateQuestionBatch(
  alreadyGenerated: number,
  batchSize: number = NEW_QUESTION_BATCH_SIZE,
  dailyLimit: number = FREE_DAILY_NEW_QUESTION_LIMIT,
): boolean {
  return Number.isSafeInteger(alreadyGenerated)
    && Number.isSafeInteger(batchSize)
    && Number.isSafeInteger(dailyLimit)
    && alreadyGenerated >= 0
    && batchSize > 0
    && dailyLimit >= 0
    && alreadyGenerated + batchSize <= dailyLimit;
}
/** Confirms the persisted batch matches the dynamically selected batch size. */
export function hasExpectedQuestionCount(actualCount: number, expectedCount: number): boolean {
  return Number.isSafeInteger(actualCount)
    && Number.isSafeInteger(expectedCount)
    && expectedCount > 0
    && actualCount === expectedCount;
}
