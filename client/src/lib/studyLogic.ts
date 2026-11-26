export function localDayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function previousDayKey(key = localDayKey()): string {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  date.setDate(date.getDate() - 1);
  return localDayKey(date);
}
export function nextStreak(
  streak: number,
  lastDay: string,
  currentDay = localDayKey()
): number {
  if (lastDay === currentDay) return streak;
  return lastDay === previousDayKey(currentDay) ? streak + 1 : 1;
}
