/**
 * Full 40-topic curriculum ordered beginner → intermediate → advanced.
 * Each user progresses sequentially based on their lessonsCompleted count.
 */
export const TOPICS = [
  // ── Beginner (0–14) ──────────────────────────────────────────────────────
  "Greetings & Introductions",    // 0
  "Numbers & Counting",            // 1
  "Days, Months & Time",           // 2
  "Family & Relationships",        // 3
  "Food & Drinks",                 // 4
  "Basic Shopping",                // 5
  "Asking for Directions",         // 6
  "Weather & Seasons",             // 7
  "Colors & Descriptions",         // 8
  "Daily Routines",                // 9
  "At a Restaurant",               // 10
  "Common Questions & Answers",    // 11
  "Essential Verbs & Actions",     // 12
  "Emotions & Feelings",           // 13
  "Getting Around (Transport)",    // 14

  // ── Intermediate (15–27) ─────────────────────────────────────────────────
  "At the Office",                 // 15
  "Business Meetings",             // 16
  "Scheduling & Appointments",     // 17
  "Health & Doctor Visits",        // 18
  "Travel & Hotels",               // 19
  "Phone Calls & Messages",        // 20
  "Asking for Clarification",      // 21
  "Giving Opinions & Feedback",    // 22
  "Shopping & Bargaining",         // 23
  "Describing People & Places",    // 24
  "Talking About the Past",        // 25
  "Future Plans & Ambitions",      // 26
  "Cultural Customs & Etiquette",  // 27

  // ── Advanced (28–39) ─────────────────────────────────────────────────────
  "Formal Presentations",          // 28
  "Job Interviews",                // 29
  "Business Negotiations",         // 30
  "Professional Emails & Writing", // 31
  "Finance & Banking",             // 32
  "Debates & Disagreements",       // 33
  "Idioms & Expressions",          // 34
  "Public Speaking & Persuasion",  // 35
  "News & Current Events",         // 36
  "Cross-cultural Communication",  // 37
  "Crisis Management",             // 38
  "Executive Leadership Communication", // 39
];

/** Label for each band so the UI can show a level badge */
export function getTopicLevel(index: number): "Beginner" | "Intermediate" | "Advanced" {
  if (index < 15) return "Beginner";
  if (index < 28) return "Intermediate";
  return "Advanced";
}

/**
 * Get the topic a user should do next, based on how many lessons they've completed.
 * Cycles back to the beginning after all 40 topics are done.
 */
export function getUserTopic(lessonsCompleted: number): string {
  return TOPICS[lessonsCompleted % TOPICS.length];
}

/**
 * Get the topic a user just finished.
 * (Call AFTER lessonsCompleted has been incremented.)
 */
export function getLastCompletedTopic(lessonsCompleted: number): string {
  const idx = ((lessonsCompleted - 1) % TOPICS.length + TOPICS.length) % TOPICS.length;
  return TOPICS[idx];
}

/**
 * Return the next N topics + their calendar dates, starting from startIndex.
 * startIndex = user.lessonsCompleted   when todaysDone=false  → today shows the lesson to do
 * startIndex = user.lessonsCompleted-1 when todaysDone=true   → today shows the lesson just done
 */
export function getUpcomingSchedule(
  startIndex: number,
  days: number,
): Array<{ date: Date; topic: string; isToday: boolean; lessonNumber: number }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const topicIdx = (startIndex + i) % TOPICS.length;
    return {
      date: d,
      topic: TOPICS[topicIdx],
      isToday: i === 0,
      lessonNumber: startIndex + i + 1,
    };
  });
}

/** Check if a Date is today (timezone-safe) */
export function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

// ── Backward-compat shim (used in api/progress/route.ts) ──────────────────
/** @deprecated use getUserTopic(user.lessonsCompleted) instead */
export function getTodayTopic(lessonsCompleted = 0): string {
  return getUserTopic(lessonsCompleted);
}
export function getDayIndex(): number { return 0; }
