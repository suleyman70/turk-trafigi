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
  Sparkles,
  Car,
  Coins
} from "lucide-react";
import styles from "./page.module.css";
import { storageService, LeaderboardEntry, GameSettings } from "@/services/storage";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeModal, setActiveModal] = useState<"leaderboard" | "settings" | "garage" | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    volume: 0.5,
    controlType: "wasd",
  });
  const [highScore, setHighScore] = useState(0);
  const [cash, setCash] = useState(0);
  const [ownedCars, setOwnedCars] = useState<string[]>(["player_car"]);
  const [activeCar, setActiveCar] = useState("player_car");

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    setLeaderboard(storageService.getLeaderboard());
    setSettings(storageService.getSettings());
    setHighScore(storageService.getHighScore());
    setCash(storageService.getCash());
    setOwnedCars(storageService.getOwnedCars());
    setActiveCar(storageService.getActiveCar());
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
          <Link href="/play" style={{ width: "100%", display: "block" }}>
            <button className={`${styles.btn} ${styles.btnPrimary}`}>
              <Play size={20} fill="currentColor" />
              Oyunu Başlat
            </button>
          </Link>

          <button 
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={() => {
              setCash(storageService.getCash());
              setOwnedCars(storageService.getOwnedCars());
              setActiveCar(storageService.getActiveCar());
              setActiveModal("garage");
            }}
          >
            <Car size={20} />
            Modifiye & Garaj
          </button>

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

      {/* --- GARAGE MODAL --- */}
      {activeModal === "garage" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={`${styles.modalContent} glass`} style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <Car size={24} className={styles.gameLogoHighlight} />
                Makasçı Garajı
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,179,25,0.1)", border: "1px solid rgba(255,179,25,0.25)", color: "var(--accent)", padding: "4px 12px", borderRadius: 20, fontSize: "0.9rem", fontWeight: "bold" }}>
                <Coins size={16} />
                <span>{cash} TL</span>
              </div>
              <button className={styles.modalClose} onClick={() => setActiveModal(null)} style={{ marginLeft: 15 }}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.garageGrid}>
              {/* Car 1: Sahin */}
              <div className={`${styles.garageItem} ${activeCar === "player_car" ? styles.garageItemActive : ""}`}>
                <div className={styles.carColorPreview} style={{ background: "linear-gradient(135deg, #ff2a2a, #800000)" }}>
                  <span className={styles.carNameOnBadge}>Şahin Baba</span>
                </div>
                <div className={styles.garageItemDetails}>
                  <h3>Şahin 1.6 ie</h3>
                  <p>Klasik Türk modifiye arabası. Dengeli ve asil başlangıç arabası.</p>
                  <div className={styles.carStatsList}>
                    <span className={styles.carStatItem}>Hız: Normal</span>
                    <span className={styles.carStatItem}>Manevra: Normal</span>
                  </div>
                  {activeCar === "player_car" ? (
                    <div className={styles.activeCarStatus}>SEÇİLİ</div>
                  ) : (
                    <button 
                      className={`${styles.btn} ${styles.btnPrimary}`} 
                      style={{ padding: "8px 12px", fontSize: "0.9rem" }}
                      onClick={() => {
                        storageService.setActiveCar("player_car");
                        setActiveCar("player_car");
                      }}
                    >
                      Kullan
                    </button>
                  )}
                </div>
              </div>

              {/* Car 2: Taxi */}
              <div className={`${styles.garageItem} ${activeCar === "car_taxi" ? styles.garageItemActive : ""}`}>
                <div className={styles.carColorPreview} style={{ background: "linear-gradient(135deg, #ffd000, #ff8000)" }}>
                  <span className={styles.carNameOnBadge} style={{ color: "#000" }}>Egea Taksi</span>
                </div>
                <div className={styles.garageItemDetails}>
                  <h3>İstanbul Taksi</h3>
                  <p>Sarı Egea. Trafikte daha çevik (Sola/sağa %30 daha hızlı manevra).</p>
                  <div className={styles.carStatsList}>
                    <span className={styles.carStatItem} style={{ color: "var(--primary)" }}>Hız: Yüksek</span>
                    <span className={styles.carStatItem} style={{ color: "var(--primary)" }}>Manevra: Çok İyi</span>
                  </div>
                  {ownedCars.includes("car_taxi") ? (
                    activeCar === "car_taxi" ? (
                      <div className={styles.activeCarStatus}>SEÇİLİ</div>
                    ) : (
                      <button 
                        className={`${styles.btn} ${styles.btnPrimary}`} 
                        style={{ padding: "8px 12px", fontSize: "0.9rem" }}
                        onClick={() => {
                          storageService.setActiveCar("car_taxi");
                          setActiveCar("car_taxi");
                        }}
                      >
                        Kullan
                      </button>
                    )
                  ) : (
                    <button 
                      className={`${styles.btn} ${styles.btnPrimary}`} 
                      style={{ padding: "8px 12px", fontSize: "0.9rem", background: cash >= 1000 ? "var(--accent)" : "rgba(255,255,255,0.05)", color: cash >= 1000 ? "#000" : "rgba(255,255,255,0.3)", cursor: cash >= 1000 ? "pointer" : "not-allowed" }}
                      disabled={cash < 1000}
                      onClick={() => {
                        if (storageService.buyCar("car_taxi", 1000)) {
                          setOwnedCars(storageService.getOwnedCars());
                          setCash(storageService.getCash());
                        }
                      }}
                    >
                      Satın Al (1000 TL)
                    </button>
                  )}
                </div>
              </div>

              {/* Car 3: Dolmus */}
              <div className={`${styles.garageItem} ${activeCar === "car_dolmus" ? styles.garageItemActive : ""}`}>
                <div className={styles.carColorPreview} style={{ background: "linear-gradient(135deg, #00a896, #028090)" }}>
                  <span className={styles.carNameOnBadge}>Minibüs (Dolmuş)</span>
                </div>
                <div className={styles.garageItemDetails}>
                  <h3>Karsan J9 Dolmuş</h3>
                  <p>Hatlı minibüs. Hızı ve manevrası düşüktür ancak <b>2 Canı</b> vardır!</p>
                  <div className={styles.carStatsList}>
                    <span className={styles.carStatItem} style={{ color: "var(--secondary)" }}>Hız: Düşük</span>
                    <span className={styles.carStatItem} style={{ color: "var(--accent)" }}>Özellik: 2 Can (Kalkan)</span>
                  </div>
                  {ownedCars.includes("car_dolmus") ? (
                    activeCar === "car_dolmus" ? (
                      <div className={styles.activeCarStatus}>SEÇİLİ</div>
                    ) : (
                      <button 
                        className={`${styles.btn} ${styles.btnPrimary}`} 
                        style={{ padding: "8px 12px", fontSize: "0.9rem" }}
                        onClick={() => {
                          storageService.setActiveCar("car_dolmus");
                          setActiveCar("car_dolmus");
                        }}
                      >
                        Kullan
                      </button>
                    )
                  ) : (
                    <button 
                      className={`${styles.btn} ${styles.btnPrimary}`} 
                      style={{ padding: "8px 12px", fontSize: "0.9rem", background: cash >= 2500 ? "var(--accent)" : "rgba(255,255,255,0.05)", color: cash >= 2500 ? "#000" : "rgba(255,255,255,0.3)", cursor: cash >= 2500 ? "pointer" : "not-allowed" }}
                      disabled={cash < 2500}
                      onClick={() => {
                        if (storageService.buyCar("car_dolmus", 2500)) {
                          setOwnedCars(storageService.getOwnedCars());
                          setCash(storageService.getCash());
                        }
                      }}
                    >
                      Satın Al (2500 TL)
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
