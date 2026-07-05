"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Trophy, 
  Settings as SettingsIcon, 
  Play, 
  Volume2, 
  VolumeX, 
  X, 
  Keyboard,
  MousePointer,
  Sparkles
} from "lucide-react";
import styles from "./page.module.css";
import { storageService, LeaderboardEntry, GameSettings } from "@/services/storage";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeModal, setActiveModal] = useState<"leaderboard" | "settings" | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    volume: 0.5,
    controlType: "wasd",
  });
  const [highScore, setHighScore] = useState(0);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    setLeaderboard(storageService.getLeaderboard());
    setSettings(storageService.getSettings());
    setHighScore(storageService.getHighScore());
  }, []);

  const handleSaveSettings = (updated: Partial<GameSettings>) => {
    const newSettings = storageService.saveSettings(updated);
    setSettings(newSettings);
  };

  if (!mounted) {
    return (
      <div className={styles.container}>
        <div className={styles.tagline}>Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Animated Moving Highway Background */}
      <div className={styles.highwayBackground} />

      <div className={`${styles.menuCard} glass`}>
        <div className={styles.titleArea}>
          <h1 className={styles.gameLogo}>
            TÜRK <span className={styles.gameLogoHighlight}>TRAFİĞİ</span>
          </h1>
          <p className={styles.tagline}>İstanbul Makas Simülatörü</p>
        </div>

        {highScore > 0 && (
          <div className={styles.highScoreBanner}>
            <Sparkles size={16} />
            <span>KİŞİSEL REKOR: {highScore} XP</span>
          </div>
        )}

        <div className={styles.buttonList}>
          <Link href="/play" style={{ width: "100%" }}>
            <button className={`${styles.btn} ${styles.btnPrimary}`}>
              <Play size={20} fill="currentColor" />
              Oyunu Başlat
            </button>
          </Link>

          <button 
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={() => {
              setLeaderboard(storageService.getLeaderboard());
              setActiveModal("leaderboard");
            }}
          >
            <Trophy size={20} />
            Liderlik Tablosu
          </button>

          <button 
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={() => setActiveModal("settings")}
          >
            <SettingsIcon size={20} />
            Ayarlar
          </button>
        </div>
      </div>

      {/* --- LEADERBOARD MODAL --- */}
      {activeModal === "leaderboard" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={`${styles.modalContent} glass`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <Trophy size={24} className={styles.gameLogoHighlight} />
                En İyi Şoförler
              </h2>
              <button className={styles.modalClose} onClick={() => setActiveModal(null)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.leaderboardTable}>
              {leaderboard.length === 0 ? (
                <div className={styles.emptyState}>Henüz skor kaydedilmedi!</div>
              ) : (
                leaderboard.map((entry, index) => {
                  let rankClass = styles.rankBadge;
                  if (index === 0) rankClass = `${styles.rankBadge} ${styles.rankGold}`;
                  else if (index === 1) rankClass = `${styles.rankBadge} ${styles.rankSilver}`;
                  else if (index === 2) rankClass = `${styles.rankBadge} ${styles.rankBronze}`;

                  const isTop3 = index < 3;
                  const rowClass = isTop3 
                    ? `${styles.leaderboardRow} ${styles.leaderboardRowTop3}`
                    : styles.leaderboardRow;

                  return (
                    <div key={index} className={rowClass}>
                      <div className={rankClass}>{index + 1}</div>
                      <div className={styles.playerName}>{entry.name}</div>
                      <div className={styles.playerScore}>{entry.score} XP</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- SETTINGS MODAL --- */}
      {activeModal === "settings" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={`${styles.modalContent} glass`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <SettingsIcon size={24} className={styles.gameLogoHighlight} />
                Oyun Ayarları
              </h2>
              <button className={styles.modalClose} onClick={() => setActiveModal(null)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.settingsGroup}>
              <span className={styles.settingsLabel}>Ses ve Efektler</span>
              <div className={styles.soundToggleRow}>
                <span className={styles.soundToggleText}>
                  {settings.soundEnabled ? "Sesler Açık" : "Sesler Kapalı"}
                </span>
                <label className={styles.switch}>
                  <input 
                    type="checkbox" 
                    checked={settings.soundEnabled}
                    onChange={(e) => handleSaveSettings({ soundEnabled: e.target.checked })}
                  />
                  <span className={styles.slider} />
                </label>
              </div>

              {settings.soundEnabled && (
                <div className={styles.volumeSliderContainer}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
                      {settings.volume > 0 ? <Volume2 size={14} /> : <VolumeX size={14} />}
                      Ses Seviyesi
                    </span>
                    <span style={{ fontSize: "0.85rem", fontWeight: "bold" }}>
                      {Math.round(settings.volume * 100)}%
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05" 
                    value={settings.volume}
                    onChange={(e) => handleSaveSettings({ volume: parseFloat(e.target.value) })}
                    className={styles.rangeInput}
                  />
                </div>
              )}
            </div>

            <div className={styles.settingsGroup}>
              <span className={styles.settingsLabel}>Kontrol Tipi</span>
              <div className={styles.controlSelector}>
                <div 
                  className={`${styles.controlOption} ${settings.controlType === "wasd" ? styles.controlOptionActive : ""}`}
                  onClick={() => handleSaveSettings({ controlType: "wasd" })}
                >
                  <Keyboard size={18} style={{ display: "block", margin: "0 auto 6px" }} />
                  WASD
                </div>
                <div 
                  className={`${styles.controlOption} ${settings.controlType === "arrows" ? styles.controlOptionActive : ""}`}
                  onClick={() => handleSaveSettings({ controlType: "arrows" })}
                >
                  <Keyboard size={18} style={{ display: "block", margin: "0 auto 6px" }} />
                  YÖNLER
                </div>
                <div 
                  className={`${styles.controlOption} ${settings.controlType === "mouse" ? styles.controlOptionActive : ""}`}
                  onClick={() => handleSaveSettings({ controlType: "mouse" })}
                >
                  <MousePointer size={18} style={{ display: "block", margin: "0 auto 6px" }} />
                  FARE
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
