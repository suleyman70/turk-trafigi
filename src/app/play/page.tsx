"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { 
  Pause, 
  Play, 
  Home, 
  RotateCcw, 
  Check, 
  Trophy,
  Skull
} from "lucide-react";
import styles from "./play.module.css";
import { storageService } from "@/services/storage";

// Dynamic import of Phaser component to disable Server-Side Rendering (SSR)
const GameCanvas = dynamic(() => import("@/components/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div style={{
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      color: "var(--primary)",
      backgroundColor: "#0d0f13",
      fontFamily: "var(--font-outfit)",
      gap: 15
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: "3px solid rgba(102, 252, 241, 0.1)",
        borderTop: "3px solid var(--primary)",
        borderRadius: "50%",
        animation: "spin 1s linear infinite"
      }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <span style={{ letterSpacing: 1.5, fontSize: "0.9rem", textTransform: "uppercase" }}>
        Motor Çalıştırılıyor...
      </span>
    </div>
  )
});

export default function PlayPage() {
  const [mounted, setMounted] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  // Initialize
  useEffect(() => {
    setMounted(true);
    setHighScore(storageService.getHighScore());
    
    // Auto-fill player name if saved previously in settings or logs
    const savedName = localStorage.getItem("turk_trafigi_player_name") || "";
    setPlayerName(savedName);
  }, []);

  const handleScoreChange = useCallback((newScore: number) => {
    setScore(newScore);
    if (newScore > highScore) {
      setHighScore(newScore);
    }
  }, [highScore]);

  const handleGameOver = useCallback((finalScore: number) => {
    setScore(finalScore);
    setIsGameOver(true);
    if (finalScore > highScore) {
      setHighScore(finalScore);
    }
  }, [highScore]);

  const handleRestart = () => {
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    setIsSaved(false);
  };

  const handleSaveScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    // Save score
    storageService.saveScore(playerName, score);
    
    // Cache name for future convenience
    localStorage.setItem("turk_trafigi_player_name", playerName.trim());
    
    setIsSaved(true);
  };

  if (!mounted) return null;

  return (
    <div className={styles.container}>
      <div className={styles.gameWrapper}>
        
        {/* GAME CANVAS (Phaser Engine) */}
        {!isGameOver && (
          <GameCanvas 
            onScoreChange={handleScoreChange} 
            onGameOver={handleGameOver}
            isPaused={isPaused}
          />
        )}

        {/* HUD (Heads-Up Display) */}
        {!isGameOver && (
          <div className={styles.hud}>
            <div className={styles.scoreContainer}>
              <span className={styles.scoreLabel}>SKOR</span>
              <span className={styles.scoreValue}>{score} XP</span>
            </div>
            
            <div className={styles.scoreContainer}>
              <span className={`${styles.scoreLabel} ${styles.highScoreLabel}`}>REKOR</span>
              <span className={`${styles.scoreValue} ${styles.highScoreValue}`}>{highScore} XP</span>
            </div>

            <div className={styles.hudButtons}>
              <button 
                className={styles.hudBtn}
                onClick={() => setIsPaused(!isPaused)}
                title={isPaused ? "Devam Et" : "Duraklat"}
              >
                {isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
              </button>
              <Link href="/">
                <button className={styles.hudBtn} title="Ana Menü">
                  <Home size={18} />
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* PAUSE OVERLAY */}
        {isPaused && !isGameOver && (
          <div className={styles.overlay}>
            <h2 className={`${styles.overlayTitle} ${styles.overlayTitleCyan}`}>OYUN DURDURULDU</h2>
            <p className={styles.overlaySubtitle}>İstanbul Trafiği Beklemez!</p>
            
            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Mevcut Skor</span>
                <span className={styles.statValue}>{score} XP</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>En Yüksek Skor</span>
                <span className={styles.statValue}>{highScore} XP</span>
              </div>
            </div>

            <div className={styles.actionButtons}>
              <button 
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => setIsPaused(false)}
              >
                <Play size={18} fill="currentColor" />
                Devam Et
              </button>
              <button 
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={handleRestart}
              >
                <RotateCcw size={18} />
                Yeniden Başlat
              </button>
              <Link href="/">
                <button className={`${styles.btn} ${styles.btnSecondary}`}>
                  <Home size={18} />
                  Ana Menü
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* GAME OVER OVERLAY */}
        {isGameOver && (
          <div className={styles.overlay}>
            <div style={{ display: "inline-flex", padding: 12, borderRadius: "50%", background: "rgba(255, 74, 74, 0.1)", marginBottom: 15 }}>
              <Skull size={40} className={styles.overlayTitleRed} style={{ animation: "pulse 2s infinite" }} />
            </div>
            <h2 className={`${styles.overlayTitle} ${styles.overlayTitleRed}`}>KAZA YAPTIN!</h2>
            <p className={styles.overlaySubtitle}>Makasın Sonu Kara Toprak</p>
            
            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Yaptığın Skor</span>
                <span className={styles.statValue} style={{ color: "var(--secondary)", fontWeight: 800 }}>{score} XP</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>En Yüksek Skor</span>
                <span className={styles.statValue} style={{ color: "var(--accent)" }}>{highScore} XP</span>
              </div>
            </div>

            {!isSaved ? (
              <form onSubmit={handleSaveScore} className={styles.formGroup}>
                <label className={styles.inputLabel}>İsmini Yaz, Liderlik Tablosuna Gir</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input 
                    type="text" 
                    placeholder="Şoför İsmi"
                    maxLength={15}
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className={styles.inputField}
                    required
                  />
                  <button 
                    type="submit" 
                    className={styles.btn} 
                    style={{ width: "auto", background: "var(--accent)", color: "#000", padding: "0 18px", boxShadow: "0 0 10px rgba(255,179,25,0.3)" }}
                  >
                    <Trophy size={18} />
                  </button>
                </div>
              </form>
            ) : (
              <div className={styles.formGroup} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--primary)", background: "rgba(102, 252, 241, 0.08)", padding: 12, borderRadius: 10, border: "1px solid rgba(102, 252, 241, 0.2)", width: "100%", maxWidth: 320 }}>
                <Check size={18} />
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Skor Liderlik Tablosuna Kaydedildi!</span>
              </div>
            )}

            <div className={styles.actionButtons}>
              <button 
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={handleRestart}
              >
                <RotateCcw size={18} />
                Tekrar Dene
              </button>
              <Link href="/">
                <button className={`${styles.btn} ${styles.btnSecondary}`}>
                  <Home size={18} />
                  Ana Menü
                </button>
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
