export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

export interface GameSettings {
  soundEnabled: boolean;
  volume: number; // 0 to 1
  controlType: "wasd" | "arrows" | "mouse";
}

const LEADERBOARD_KEY = "turk_trafigi_leaderboard";
const SETTINGS_KEY = "turk_trafigi_settings";

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  volume: 0.5,
  controlType: "wasd",
};

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { name: "Şahin Baba", score: 5000, date: "2026-07-01" },
  { name: "Makasçı Enes", score: 4200, date: "2026-07-02" },
  { name: "Taksici Vedat", score: 3500, date: "2026-07-03" },
  { name: "Dolmuşçu Selim", score: 2800, date: "2026-07-04" },
  { name: "Acemi Sürücü", score: 1000, date: "2026-07-05" },
];

export const storageService = {
  getSettings(): GameSettings {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
    } catch (e) {
      console.error("Failed to load settings:", e);
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: Partial<GameSettings>): GameSettings {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    try {
      const current = this.getSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error("Failed to save settings:", e);
      return DEFAULT_SETTINGS;
    }
  },

  getLeaderboard(): LeaderboardEntry[] {
    if (typeof window === "undefined") return DEFAULT_LEADERBOARD;
    try {
      const stored = localStorage.getItem(LEADERBOARD_KEY);
      if (stored) {
        return JSON.parse(stored);
      } else {
        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(DEFAULT_LEADERBOARD));
        return DEFAULT_LEADERBOARD;
      }
    } catch (e) {
      console.error("Failed to load leaderboard:", e);
      return DEFAULT_LEADERBOARD;
    }
  },

  saveScore(name: string, score: number): LeaderboardEntry[] {
    if (typeof window === "undefined") return [];
    try {
      const current = this.getLeaderboard();
      const newEntry: LeaderboardEntry = {
        name: name.trim() || "Anonim",
        score,
        date: new Date().toISOString().split("T")[0],
      };
      const updated = [...current, newEntry]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10); // keep top 10

      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error("Failed to save score:", e);
      return [];
    }
  },

  getHighScore(): number {
    const scores = this.getLeaderboard();
    return scores.length > 0 ? scores[0].score : 0;
  },
};
