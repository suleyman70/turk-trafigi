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

  getCash(): number {
    if (typeof window === "undefined") return 0;
    try {
      const val = localStorage.getItem("turk_trafigi_cash");
      return val ? parseInt(val) : 0;
    } catch {
      return 0;
    }
  },

  addCash(amount: number): number {
    if (typeof window === "undefined") return 0;
    try {
      const current = this.getCash();
      const updated = current + amount;
      localStorage.setItem("turk_trafigi_cash", updated.toString());
      return updated;
    } catch {
      return 0;
    }
  },

  deductCash(amount: number): boolean {
    if (typeof window === "undefined") return false;
    try {
      const current = this.getCash();
      if (current < amount) return false;
      localStorage.setItem("turk_trafigi_cash", (current - amount).toString());
      return true;
    } catch {
      return false;
    }
  },

  getOwnedCars(): string[] {
    if (typeof window === "undefined") return ["player_car"];
    try {
      const val = localStorage.getItem("turk_trafigi_owned_cars");
      return val ? JSON.parse(val) : ["player_car"];
    } catch {
      return ["player_car"];
    }
  },

  buyCar(carId: string, price: number): boolean {
    if (typeof window === "undefined") return false;
    try {
      const owned = this.getOwnedCars();
      if (owned.includes(carId)) return true;
      if (this.deductCash(price)) {
        const updated = [...owned, carId];
        localStorage.setItem("turk_trafigi_owned_cars", JSON.stringify(updated));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  getActiveCar(): string {
    if (typeof window === "undefined") return "player_car";
    try {
      const val = localStorage.getItem("turk_trafigi_active_car");
      return val || "player_car";
    } catch {
      return "player_car";
    }
  },

  setActiveCar(carId: string): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("turk_trafigi_active_car", carId);
    } catch (e) {
      console.error(e);
    }
  },
};
