export interface UserProfile {
  name: string;
  targetLanguage: "arabic" | "english" | "spanish";
  nativeLanguage: string;
  level: "beginner" | "intermediate" | "advanced";
  goals: string[];
  dailyMinutes: number;
  joinedAt: string;
}

export interface Progress {
  streak: number;
  lastActiveDate: string;
  wordsLearned: number;
  lessonsCompleted: number;
  minutesPracticed: number;
  currentLevel: number;
  xp: number;
}

const PROFILE_KEY = "linguaexec_profile";
const PROGRESS_KEY = "linguaexec_progress";

export function getProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(PROFILE_KEY);
  return data ? JSON.parse(data) : null;
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getProgress(): Progress {
  if (typeof window === "undefined") {
    return defaultProgress();
  }
  const data = localStorage.getItem(PROGRESS_KEY);
  if (!data) return defaultProgress();
  const p = JSON.parse(data);
  // Update streak
  const today = new Date().toDateString();
  const lastActive = new Date(p.lastActiveDate).toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (lastActive !== today) {
    if (lastActive === yesterday) {
      p.streak += 1;
    } else if (lastActive !== today) {
      p.streak = 1;
    }
    p.lastActiveDate = new Date().toISOString();
    saveProgress(p);
  }
  return p;
}

export function saveProgress(progress: Progress): void {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function addXP(amount: number): void {
  const p = getProgress();
  p.xp += amount;
  p.currentLevel = Math.floor(p.xp / 500) + 1;
  saveProgress(p);
}

export function addWordsLearned(count: number): void {
  const p = getProgress();
  p.wordsLearned += count;
  saveProgress(p);
}

export function addLessonCompleted(): void {
  const p = getProgress();
  p.lessonsCompleted += 1;
  p.minutesPracticed += 10;
  saveProgress(p);
}

function defaultProgress(): Progress {
  return {
    streak: 1,
    lastActiveDate: new Date().toISOString(),
    wordsLearned: 0,
    lessonsCompleted: 0,
    minutesPracticed: 0,
    currentLevel: 1,
    xp: 0,
  };
}

export const LANGUAGE_LABELS: Record<string, string> = {
  arabic: "Arabic 🇸🇦",
  english: "English 🇺🇸",
  spanish: "Spanish 🇪🇸",
};

export const LANGUAGE_NATIVE: Record<string, string> = {
  arabic: "العربية",
  english: "English",
  spanish: "Español",
};
