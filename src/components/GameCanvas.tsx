"use client";

import { useEffect, useRef } from "react";
import * as Phaser from "phaser";
import { storageService, GameSettings } from "@/services/storage";
import { audioService } from "@/services/audio";

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

      // 5. Raindrop
      const rain = scene.make.graphics({ x: 0, y: 0 }, false);
      rain.fillStyle(0x7fbfff, 0.4);
      rain.fillRect(0, 0, 2, 16);
      rain.generateTexture("raindrop", 2, 16);
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

      private trafficGroup!: Phaser.Physics.Arcade.Group;
      private trafficTimer!: Phaser.Time.TimerEvent;
      private spawnInterval: number = 1800; // ms between spawns

      private playerLives: number = 1;
      private isInvulnerable: boolean = false;

      private isNight: boolean = false;
      private nightOverlay!: Phaser.GameObjects.Rectangle;
      private headlightsGraphics!: Phaser.GameObjects.Graphics;

      private isRainy: boolean = false;
      private rainGroup!: Phaser.GameObjects.Group;

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

        // Create individual tile sprites for lanes
        this.laneLines = this.add.tileSprite(140, height / 2, 4, height, "dashed_line");
        const line2 = this.add.tileSprite(240, height / 2, 4, height, "dashed_line");
        const line3 = this.add.tileSprite(340, height / 2, 4, height, "dashed_line");

        // Keep references to animate them scrolling
        this.sideLines = line2; // piggyback
        this.road = line3; // piggyback for simplicity

        // 4. Setup Player Car
        const activeCarTexture = storageService.getActiveCar();
        const startLane = 2; // Start in lane 3 (index 2)
        const startX = this.laneOffsets[startLane];
        const startY = height - 120;

        this.player = this.physics.add.sprite(startX, startY, activeCarTexture);
        this.player.setCollideWorldBounds(true);

        this.playerLives = 1;
        if (activeCarTexture === "car_dolmus") {
          this.playerLives = 2;
        }

        let widthBody = 36;
        let heightBody = 56;
        if (activeCarTexture === "car_dolmus") {
          widthBody = 42;
          heightBody = 76;
        }
        this.player.body?.setSize(widthBody, heightBody, true);

        // 5. Input Controls
        if (this.input.keyboard) {
          this.cursors = this.input.keyboard.createCursorKeys();
          this.wasdKeys = this.input.keyboard.addKeys("W,A,S,D") as any;

          // Istanbul Horn sounds!
          this.input.keyboard.on("keydown-SPACE", () => {
            audioService.playHorn();
          });
          this.input.keyboard.on("keydown-H", () => {
            audioService.playHorn();
          });
        }

        // Start motor sound
        audioService.startMotor();

        // 6. Traffic Physics Group
        this.trafficGroup = this.physics.add.group();

        // 7. Spawn Timer
        this.trafficTimer = this.time.addEvent({
          delay: this.spawnInterval,
          callback: this.spawnTraffic,
          callbackScope: this,
          loop: true
        });

        // 8. Collision detection
        this.physics.add.overlap(this.player, this.trafficGroup, this.handleCollision, undefined, this);

        // 9. Score Accumulation (Increases distance score every 100ms)
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

        // 10. Weather & Time Cycle Setup
        this.nightOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0);
        this.nightOverlay.setDepth(15);

        this.headlightsGraphics = this.add.graphics();
        this.headlightsGraphics.setDepth(16);

        this.rainGroup = this.add.group();

        // Trigger weather shift every 20 seconds
        this.time.addEvent({
          delay: 20000,
          callback: this.cycleWeather,
          callbackScope: this,
          loop: true
        });
      }

      private cycleWeather() {
        if (this.isGameOverActive || isPaused) return;

        // 50% chance to flip night mode
        if (Math.random() < 0.5) {
          this.isNight = !this.isNight;
          this.tweens.add({
            targets: this.nightOverlay,
            fillAlpha: this.isNight ? 0.58 : 0,
            duration: 3000
          });
        }

        // 50% chance to flip rainy weather
        if (Math.random() < 0.5) {
          this.isRainy = !this.isRainy;
        }
      }

      private spawnTraffic() {
        if (isPaused) return;

        // Choose random lane
        const laneIndex = Phaser.Math.Between(0, this.laneOffsets.length - 1);
        const startX = this.laneOffsets[laneIndex];

        // Check if there is already a car nearby at the top of this lane
        let tooClose = false;
        this.trafficGroup.getChildren().forEach((child: any) => {
          if (child.y < 150 && Math.abs(child.x - startX) < 20) {
            tooClose = true;
          }
        });
        if (tooClose) return;

        // Choose random car texture
        const textures = ["car_taxi", "car_dolmus", "car_sedan"];
        const texture = Phaser.Math.RND.pick(textures);

        // Adjust relative speed and size of collision body
        let relativeSpeed = 100; // taxi
        let widthBody = 36;
        let heightBody = 56;

        if (texture === "car_dolmus") {
          relativeSpeed = 185; // Minibus is slower -> scrolls down faster relative to player
          widthBody = 42;
          heightBody = 76;
        } else if (texture === "car_sedan") {
          relativeSpeed = 60; // Sedan is faster -> scrolls down slower relative to player
          widthBody = 36;
          heightBody = 56;
        }

        const trafficCar = this.physics.add.sprite(startX, -100, texture);
        trafficCar.body?.setSize(widthBody, heightBody, true);
        
        // Velocity in pixels/sec down the screen
        const velocityY = this.roadSpeed - relativeSpeed;
        trafficCar.setVelocityY(velocityY);

        // Lane change parameters (some cars are aggressive)
        const willChangeLane = Math.random() < 0.35;
        const changeLaneTriggerY = Phaser.Math.Between(150, 450);

        const tCar = trafficCar as any;
        tCar.laneIndex = laneIndex;
        tCar.willChangeLane = willChangeLane;
        tCar.changeLaneTriggerY = changeLaneTriggerY;
        tCar.targetLaneIndex = -1;
        tCar.relativeSpeed = relativeSpeed;

        this.trafficGroup.add(trafficCar);
      }

      private isGameOverActive: boolean = false;

      private handleCollision(playerObj: any, trafficObj: any) {
        if (this.isGameOverActive || this.isInvulnerable) return;

        // If we have lives left (e.g. Dolmuş has 2 lives)
        if (this.playerLives > 1) {
          this.playerLives--;
          this.isInvulnerable = true;

          // Camera visual impact
          this.cameras.main.flash(200, 255, 179, 25); // Yellow flash for fender bender
          this.cameras.main.shake(150, 0.025);

          // Panic horn beep
          audioService.playHorn();

          // Destroy hit traffic obstacle
          if (trafficObj) {
            trafficObj.destroy();
          }

          // Invulnerability blinking animation
          this.tweens.add({
            targets: this.player,
            alpha: 0.4,
            duration: 150,
            yoyo: true,
            repeat: 5,
            onComplete: () => {
              this.player.alpha = 1;
              this.isInvulnerable = false;
            }
          });
          return;
        }

        // Fatal crash
        this.isGameOverActive = true;
        this.physics.pause();
        if (this.scoreTimer) this.scoreTimer.destroy();
        if (this.trafficTimer) this.trafficTimer.destroy();

        // Play crash explosion
        audioService.playCrash();

        // Screen effects for collision
        this.cameras.main.flash(300, 255, 74, 74);
        this.cameras.main.shake(300, 0.05);

        this.time.delayedCall(800, () => {
          onGameOver(this.score);
        });
      }

      private showMakasFeedback(x: number, y: number) {
        // Create glowing floating text
        const text = this.add.text(x, y - 45, "MAKAS! +150 XP\n+50 TL", {
          fontSize: "14px",
          fontFamily: "var(--font-outfit), sans-serif",
          color: "#ffb319",
          stroke: "#000000",
          strokeThickness: 3,
          align: "center",
          shadow: { color: "#ffb319", blur: 4, stroke: true, fill: true }
        });
        text.setOrigin(0.5);

        this.tweens.add({
          targets: text,
          y: y - 105,
          alpha: 0,
          duration: 900,
          ease: "Power1",
          onComplete: () => text.destroy()
        });
      }

      update(time: number, delta: number) {
        if (isPaused || this.isGameOverActive) {
          this.physics.pause();
          audioService.stopMotor();
          return;
        } else {
          this.physics.resume();
          audioService.startMotor();
        }

        const deltaS = delta / 1000;

        // 1. Difficulty Scaling (Increase speed and traffic density with score)
        this.roadSpeed = 350 + Math.min(this.score / 15, 350); // Cap road speed at 700 px/s
        const newInterval = Math.max(1800 - (this.score / 8), 750); // Cap spawn rate at 750ms
        if (this.trafficTimer) {
          (this.trafficTimer as any).delay = newInterval;
        }

        // Rev engine pitch based on speed
        const maxRoadSpeed = 700;
        const speedPercent = (this.roadSpeed - 350) / (maxRoadSpeed - 350);
        audioService.updateMotorPitch(speedPercent);

        // 2. Scroll Road Marks
        const scrollDist = this.roadSpeed * deltaS;
        this.laneLines.tilePositionY -= scrollDist;
        this.sideLines.tilePositionY -= scrollDist;
        this.road.tilePositionY -= scrollDist;

        // 3. Handle Player Input Controls
        let baseSpeed = 250;
        const activeCarTexture = storageService.getActiveCar();
        if (activeCarTexture === "car_taxi") {
          baseSpeed = 330; // Taksi: 30% faster manevra
        } else if (activeCarTexture === "car_dolmus") {
          baseSpeed = 200; // Minibüs: 20% slower manevra
        }
        const speed = baseSpeed + Math.min(this.score / 30, 100);
        let targetVx = 0;

        const activeControlType = settings.controlType;

        if (activeControlType === "mouse") {
          const pointer = this.input.activePointer;
          if (pointer.isDown || this.input.pointer1.isDown) {
            const targetX = pointer.x;
            const distance = targetX - this.player.x;

            if (Math.abs(distance) > 5) {
              targetVx = distance > 0 
                ? Math.min(speed, distance * 10) 
                : Math.max(-speed, distance * 10);
            }
          }
        } else {
          let goLeft = false;
          let goRight = false;

          if (activeControlType === "arrows") {
            goLeft = this.cursors.left.isDown;
            goRight = this.cursors.right.isDown;
          } else {
            goLeft = this.wasdKeys.A.isDown;
            goRight = this.wasdKeys.D.isDown;
          }

          if (goLeft) {
            targetVx = -speed;
          } else if (goRight) {
            targetVx = speed;
          }
        }

        // Apply slide physics (high inertia in rain)
        const currentVx = this.player.body?.velocity.x || 0;
        const accel = this.isRainy ? 0.06 : 0.35; // lower accel = more slide
        const newVx = Phaser.Math.Linear(currentVx, targetVx, accel);
        this.player.setVelocityX(newVx);

        // Restrict player inside the yellow lines (lane boundary buffers)
        if (this.player.x < 54) this.player.x = 54;
        if (this.player.x > 426) this.player.x = 426;

        // 4. Update Traffic Cars (Lane changing AI & cleanup)
        this.trafficGroup.getChildren().forEach((child: any) => {
          // Offscreen deletion
          if (child.y > 850) {
            child.destroy();
            return;
          }

          // Check if passed player to reward score (Makas check)
          if (!child.passed && this.player.y < child.y) {
            child.passed = true;
            const dx = Math.abs(this.player.x - child.x);
            // If they are in adjacent or same lane and very close
            if (dx < 110) {
              this.score += 150;
              onScoreChange(this.score);
              storageService.addCash(50);
              audioService.playMakas();
              this.showMakasFeedback(this.player.x, this.player.y);
            }
          }

          // Adjust speed dynamically according to roadSpeed
          const velocityY = this.roadSpeed - child.relativeSpeed;
          child.setVelocityY(velocityY);

          // Handle Lane Changing AI
          if (child.willChangeLane && child.targetLaneIndex === -1 && child.y > child.changeLaneTriggerY) {
            const currentLane = child.laneIndex;
            const possibleLanes: number[] = [];
            if (currentLane > 0) possibleLanes.push(currentLane - 1);
            if (currentLane < this.laneOffsets.length - 1) possibleLanes.push(currentLane + 1);

            if (possibleLanes.length > 0) {
              const targetLane = Phaser.Math.RND.pick(possibleLanes);
              child.targetLaneIndex = targetLane;
              
              const targetX = this.laneOffsets[targetLane];
              const direction = targetX > child.x ? 1 : -1;
              
              // Set horizontal velocity
              child.setVelocityX(120 * direction);
            } else {
              child.willChangeLane = false;
            }
          }

          // Check if lane change is complete
          if (child.targetLaneIndex !== -1) {
            const targetX = this.laneOffsets[child.targetLaneIndex];
            const dx = targetX - child.x;
            const vx = child.body.velocity.x;

            if ((vx > 0 && dx <= 0) || (vx < 0 && dx >= 0)) {
              child.x = targetX;
              child.setVelocityX(0);
              child.laneIndex = child.targetLaneIndex;
              child.targetLaneIndex = -1;
              child.willChangeLane = false;
            }
          }
        });

        // 5. Rain Spawning & Cleanup
        if (this.isRainy) {
          for (let i = 0; i < 2; i++) {
            const rx = Phaser.Math.Between(0, 480);
            const drop = this.physics.add.sprite(rx, -20, "raindrop");
            drop.setVelocityY(1000);
            drop.setVelocityX(-80); // wind angle
            drop.setDepth(17);
            this.rainGroup.add(drop);
          }
        }
        
        this.rainGroup.getChildren().forEach((child: any) => {
          if (child.y > 820) {
            child.destroy();
          }
        });

        // 6. Draw Headlights in Night Mode
        this.headlightsGraphics.clear();
        if (this.isNight) {
          this.headlightsGraphics.fillStyle(0xfffdb5, 0.2); // soft yellow cone

          // Draw Player Headlights (depth 16 cone)
          const frontY = this.player.y - (activeCarTexture === "car_dolmus" ? 44 : 32);
          this.headlightsGraphics.beginPath();
          this.headlightsGraphics.moveTo(this.player.x - 14, frontY);
          this.headlightsGraphics.lineTo(this.player.x + 14, frontY);
          this.headlightsGraphics.lineTo(this.player.x + 95, frontY - 260);
          this.headlightsGraphics.lineTo(this.player.x - 95, frontY - 260);
          this.headlightsGraphics.closePath();
          this.headlightsGraphics.fillPath();

          // Draw Headlights for Traffic Cars
          this.trafficGroup.getChildren().forEach((child: any) => {
            if (child.y > -50 && child.y < 820) {
              const carFrontY = child.y + (child.texture.key === "car_dolmus" ? 44 : 32);
              this.headlightsGraphics.beginPath();
              this.headlightsGraphics.moveTo(child.x - 14, carFrontY);
              this.headlightsGraphics.lineTo(child.x + 14, carFrontY);
              this.headlightsGraphics.lineTo(child.x + 75, carFrontY + 220);
              this.headlightsGraphics.lineTo(child.x - 75, carFrontY + 220);
              this.headlightsGraphics.closePath();
              this.headlightsGraphics.fillPath();
            }
          });
        }
      }

      destroyRegistry() {
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
      audioService.stopMotor();
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
