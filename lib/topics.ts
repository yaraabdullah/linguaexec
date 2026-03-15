export const TOPICS = [
  "Greetings & Introductions",
  "Business Meetings",
  "Travel & Dining",
  "Negotiations",
  "Presentations",
  "Small Talk",
  "Emails & Writing",
];

// Fixed epoch so every user sees the same topic on the same calendar day
const EPOCH = new Date("2025-01-01").getTime();

export function getDayIndex(date: Date = new Date()): number {
  const daysSinceEpoch = Math.floor((date.getTime() - EPOCH) / (1000 * 60 * 60 * 24));
  return ((daysSinceEpoch % TOPICS.length) + TOPICS.length) % TOPICS.length;
}

export function getTodayTopic(): string {
  return TOPICS[getDayIndex()];
}

/** Return topic + date for the next N days (including today) */
export function getUpcomingSchedule(days: number): Array<{ date: Date; topic: string; isToday: boolean }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return { date: d, topic: TOPICS[getDayIndex(d)], isToday: i === 0 };
  });
}

/** Check if a Date is today */
export function isToday(date: Date): boolean {
  const now = new Date();
  return date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
}
