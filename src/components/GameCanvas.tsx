"use client";

import { useEffect, useRef } from "react";
import * as Phaser from "phaser";
import { storageService, GameSettings } from "@/services/storage";

interface GameCanvasProps {
  onScoreChange: (score: number) => void;
  onGameOver: (score: number) => void;
  isPaused: boolean;
}

export default function GameCanvas({ onScoreChange, onGameOver, isPaused }: GameCanvasProps) {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameRef.current || phaserGameRef.current) return;

    const settings = storageService.getSettings();

    // -------------------------------------------------------------------------
    // TEXTURE GENERATORS (Built-in graphics to avoid loading external files)
    // -------------------------------------------------------------------------
    function createTextures(scene: Phaser.Scene) {
      // 1. Player Car (Sleek red sports car)
      const pCar = scene.make.graphics({ x: 0, y: 0 }, false);
      pCar.fillStyle(0x1a1a1a, 1); // Tires outline
      pCar.fillRect(2, 6, 8, 16);
      pCar.fillRect(38, 6, 8, 16);
      pCar.fillRect(2, 42, 8, 16);
      pCar.fillRect(38, 42, 8, 16);

      pCar.fillStyle(0xff2a2a, 1); // Main Body
      pCar.fillRoundedRect(6, 4, 36, 56, 10);

      pCar.fillStyle(0x0e0e0e, 1); // Windshield
      pCar.fillRect(10, 20, 28, 12);
      pCar.fillStyle(0x2d3748, 1); // Rear Window
      pCar.fillRect(12, 42, 24, 8);

      pCar.fillStyle(0xffe066, 1); // Headlights
      pCar.fillRect(8, 4, 6, 3);
      pCar.fillRect(34, 4, 6, 3);

      pCar.fillStyle(0xff4444, 1); // Taillights
      pCar.fillRect(8, 57, 6, 2);
      pCar.fillRect(34, 57, 6, 2);

      pCar.generateTexture("player_car", 48, 64);

      // 2. Traffic Car 1 - Yellow Taxi
      const taxi = scene.make.graphics({ x: 0, y: 0 }, false);
      taxi.fillStyle(0x1a1a1a, 1); // Tires
      taxi.fillRect(2, 6, 8, 16); taxi.fillRect(38, 6, 8, 16);
      taxi.fillRect(2, 42, 8, 16); taxi.fillRect(38, 42, 8, 16);
      taxi.fillStyle(0xffd000, 1); // Body
      taxi.fillRoundedRect(6, 4, 36, 56, 10);
      taxi.fillStyle(0x0e0e0e, 1); // Windows
      taxi.fillRect(10, 20, 28, 10);
      taxi.fillRect(12, 40, 24, 8);
      taxi.fillStyle(0x222222, 1); // Taxi sign
      taxi.fillRect(16, 28, 16, 4);
      taxi.generateTexture("car_taxi", 48, 64);

      // 3. Traffic Car 2 - Turquoise Dolmuş (Minibus)
      const bus = scene.make.graphics({ x: 0, y: 0 }, false);
      bus.fillStyle(0x1a1a1a, 1); // Tires
      bus.fillRect(1, 10, 8, 20); bus.fillRect(43, 10, 8, 20);
      bus.fillRect(1, 60, 8, 20); bus.fillRect(43, 60, 8, 20);
      bus.fillStyle(0x00a896, 1); // Body (Dolmuş color)
      bus.fillRoundedRect(4, 4, 44, 80, 8);
      bus.fillStyle(0x0e0e0e, 1); // Windshield
      bus.fillRect(8, 16, 36, 12);
      bus.fillRect(8, 36, 6, 16); // Side windows
      bus.fillRect(38, 36, 6, 16);
      bus.fillRect(8, 60, 36, 10); // Back window
      bus.fillStyle(0xffb319, 1); // Headlights
      bus.fillRect(6, 4, 8, 4);
      bus.fillRect(38, 4, 8, 4);
      bus.generateTexture("car_dolmus", 52, 88);

      // 4. Traffic Car 3 - Black Sedan
      const sedan = scene.make.graphics({ x: 0, y: 0 }, false);
      sedan.fillStyle(0x1a1a1a, 1); // Tires
      sedan.fillRect(2, 6, 8, 16); sedan.fillRect(38, 6, 8, 16);
      sedan.fillRect(2, 42, 8, 16); sedan.fillRect(38, 42, 8, 16);
      sedan.fillStyle(0x22252a, 1); // Body
      sedan.fillRoundedRect(6, 4, 36, 56, 10);
      sedan.fillStyle(0x0e0e0e, 1); // Windows
      sedan.fillRect(10, 20, 28, 10); sedan.fillRect(12, 40, 24, 8);
      sedan.fillStyle(0xffffff, 1); // Headlights
      sedan.fillRect(8, 4, 5, 2); sedan.fillRect(35, 4, 5, 2);
      sedan.generateTexture("car_sedan", 48, 64);
    }

    // -------------------------------------------------------------------------
    // GAME SCENE CLASS
    // -------------------------------------------------------------------------
    class GameScene extends Phaser.Scene {
      private player!: Phaser.Physics.Arcade.Sprite;
      private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
      private wasdKeys!: {
        W: Phaser.Input.Keyboard.Key;
        A: Phaser.Input.Keyboard.Key;
        S: Phaser.Input.Keyboard.Key;
        D: Phaser.Input.Keyboard.Key;
      };
      
      private road!: Phaser.GameObjects.TileSprite;
      private laneLines!: Phaser.GameObjects.TileSprite;
      private sideLines!: Phaser.GameObjects.TileSprite;

      private score: number = 0;
      private scoreTimer!: Phaser.Time.TimerEvent;

      // Configurations
      private roadSpeed: number = 350; // pixels per second
      private laneWidth: number = 100;
      private laneOffsets: number[] = [90, 190, 290, 390]; // 4 lanes centers (Width: 480)

      constructor() {
        super("GameScene");
      }

      preload() {
        // Generates textures dynamic style
        createTextures(this);
      }

      create() {
        const { width, height } = this.scale;

        // 1. Road Background (Asphalt grey)
        this.add.rectangle(width / 2, height / 2, width, height, 0x1f242d);

        // 2. Road Side Borders (Green grass or gravel color)
        this.add.rectangle(15, height / 2, 30, height, 0x14181f);
        this.add.rectangle(width - 15, height / 2, 30, height, 0x14181f);

        // Solid Yellow Road boundary lines
        this.add.rectangle(30, height / 2, 4, height, 0xffd000);
        this.add.rectangle(width - 30, height / 2, 4, height, 0xffd000);

        // 3. Lane Dividers (White dashed lines)
        // We make a canvas texture for dashed lines to scroll it as tileSprite
        const lineGraphics = this.make.graphics({ x: 0, y: 0 }, false);
        lineGraphics.fillStyle(0xffffff, 0.6);
        lineGraphics.fillRect(0, 0, 4, 30); // dashed line of height 30
        lineGraphics.generateTexture("dashed_line", 4, 60); // gap of 30

        // Create three dashed lines dividing the 4 lanes
        this.laneLines = this.add.tileSprite(width / 2, height / 2, 400, height, "dashed_line");
        // Distribute them across lanes: x coordinates 140, 240, 340
        // Phaser TileSprite repeats the texture across its width, so we create 3 separate ones
        this.destroyRegistry();
        this.laneLines.destroy();

        // Let's create individual tile sprites for lanes
        this.laneLines = this.add.tileSprite(140, height / 2, 4, height, "dashed_line");
        const line2 = this.add.tileSprite(240, height / 2, 4, height, "dashed_line");
        const line3 = this.add.tileSprite(340, height / 2, 4, height, "dashed_line");

        // Keep references to animate them scrolling
        this.sideLines = line2; // piggyback
        this.road = line3; // piggyback for simplicity

        // 4. Setup Player Car
        const startLane = 2; // Start in lane 3 (index 2)
        const startX = this.laneOffsets[startLane];
        const startY = height - 120;

        this.player = this.physics.add.sprite(startX, startY, "player_car");
        this.player.setCollideWorldBounds(true);
        // Shrink collision body slightly for fair game physics
        this.player.body?.setSize(36, 56, true);

        // 5. Input Controls
        if (this.input.keyboard) {
          this.cursors = this.input.keyboard.createCursorKeys();
          this.wasdKeys = this.input.keyboard.addKeys("W,A,S,D") as any;
        }

        // 6. Score Accumulation (Increases distance score every 100ms)
        this.score = 0;
        this.scoreTimer = this.time.addEvent({
          delay: 100,
          callback: () => {
            if (!isPaused) {
              this.score += 2; // 2 points per 100ms
              onScoreChange(this.score);
            }
          },
          callbackScope: this,
          loop: true
        });
      }

      update(time: number, delta: number) {
        if (isPaused) {
          this.physics.pause();
          return;
        } else {
          this.physics.resume();
        }

        const deltaS = delta / 1000;

        // 1. Scroll Road Marks
        const scrollDist = this.roadSpeed * deltaS;
        this.laneLines.tilePositionY -= scrollDist;
        this.sideLines.tilePositionY -= scrollDist;
        this.road.tilePositionY -= scrollDist;

        // 2. Handle Player Input Controls
        const speed = 250; // Sola/sağa kayma hızı
        this.player.setVelocity(0);

        const activeControlType = settings.controlType;

        if (activeControlType === "mouse") {
          // Mouse/Touch steering control
          const pointer = this.input.activePointer;
          if (pointer.isDown || this.input.pointer1.isDown) {
            const targetX = pointer.x;
            const distance = targetX - this.player.x;

            // Simple deadzone to prevent jittering
            if (Math.abs(distance) > 5) {
              if (distance > 0) {
                this.player.setVelocityX(Math.min(speed, distance * 10));
              } else {
                this.player.setVelocityX(Math.max(-speed, distance * 10));
              }
            }
          }
        } else {
          // Keyboard controls (WASD or Arrows)
          let goLeft = false;
          let goRight = false;

          if (activeControlType === "arrows") {
            goLeft = this.cursors.left.isDown;
            goRight = this.cursors.right.isDown;
          } else { // "wasd"
            goLeft = this.wasdKeys.A.isDown;
            goRight = this.wasdKeys.D.isDown;
          }

          if (goLeft) {
            this.player.setVelocityX(-speed);
          } else if (goRight) {
            this.player.setVelocityX(speed);
          }
        }

        // Restrict player inside the yellow lines (lane boundary buffers)
        if (this.player.x < 54) this.player.x = 54;
        if (this.player.x > 426) this.player.x = 426;
      }

      destroyRegistry() {
        // Helper cleanups
      }
    }

    // -------------------------------------------------------------------------
    // PHASER INITIALIZATION CONFIG
    // -------------------------------------------------------------------------
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 480,
      height: 800,
      parent: gameRef.current,
      physics: {
        default: "arcade",
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: [GameScene],
    };

    const game = new Phaser.Game(config);
    phaserGameRef.current = game;

    return () => {
      game.destroy(true);
      phaserGameRef.current = null;
    };
  }, [onScoreChange, onGameOver, isPaused]);

  return (
    <div 
      ref={gameRef} 
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0d0f13",
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid rgba(102, 252, 241, 0.1)",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
      }}
    />
  );
}
