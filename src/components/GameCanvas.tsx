"use client";

import { useEffect, useRef } from "react";
import * as Phaser from "phaser";
import { storageService, GameSettings } from "@/services/storage";
import { audioService } from "@/services/audio";

interface GameCanvasProps {
  onScoreChange: (score: number) => void;
  onGameOver: (score: number) => void;
  isPaused: boolean;
  onNitroChange?: (percent: number) => void;
  onNitroActive?: (isActive: boolean) => void;
}

export default function GameCanvas({ 
  onScoreChange, 
  onGameOver, 
  isPaused,
  onNitroChange,
  onNitroActive
}: GameCanvasProps) {
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

      // 6. Police Car
      const police = scene.make.graphics({ x: 0, y: 0 }, false);
      police.fillStyle(0x1a1a1a, 1); // Tires
      police.fillRect(2, 6, 8, 16); police.fillRect(38, 6, 8, 16);
      police.fillRect(2, 42, 8, 16); police.fillRect(38, 42, 8, 16);
      police.fillStyle(0x0033aa, 1); // Blue Body
      police.fillRoundedRect(6, 4, 36, 56, 10);
      police.fillStyle(0xffffff, 1); // White Doors/Hood
      police.fillRect(12, 18, 24, 28);
      police.fillStyle(0x0e0e0e, 1); // Windows
      police.fillRect(14, 22, 20, 8); police.fillRect(15, 38, 18, 6);
      // Siren Bar
      police.fillStyle(0xff0000, 1); // Red siren
      police.fillRect(16, 29, 8, 3);
      police.fillStyle(0x0000ff, 1); // Blue siren
      police.fillRect(24, 29, 8, 3);
      police.fillStyle(0xffffff, 1); // Headlights
      police.fillRect(8, 4, 5, 2); police.fillRect(35, 4, 5, 2);
      police.generateTexture("car_police", 48, 64);

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

      private nitro: number = 0; // 0 to 100
      private isNitroActive: boolean = false;
      private nitroDuration: number = 5000; // ms
      private nitroTimer: number = 0; // ms
      private warpLinesGroup!: Phaser.GameObjects.Group;
      private shiftKey!: Phaser.Input.Keyboard.Key;

      private policeCar: Phaser.Physics.Arcade.Sprite | null = null;
      private isPoliceActive: boolean = false;
      private policeSirenTimer: Phaser.Time.TimerEvent | null = null;
      private nextPoliceScore: number = 3000;

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

        // Reset Police state
        this.isPoliceActive = false;
        this.nextPoliceScore = 3000;
        this.policeCar = null;
        if (this.policeSirenTimer) {
          this.policeSirenTimer.destroy();
          this.policeSirenTimer = null;
        }

        // 5. Input Controls
        if (this.input.keyboard) {
          this.cursors = this.input.keyboard.createCursorKeys();
          this.wasdKeys = this.input.keyboard.addKeys("W,A,S,D") as any;
          this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT) as Phaser.Input.Keyboard.Key;

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

        this.warpLinesGroup = this.add.group();

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
              this.score += this.isNitroActive ? 6 : 2; // 3x distance score during nitro
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

      private handlePoliceCrash(policeObj: any, trafficObj: any) {
        if (!this.isPoliceActive) return;
        this.isPoliceActive = false;

        // Stop siren timer
        if (this.policeSirenTimer) {
          this.policeSirenTimer.destroy();
          this.policeSirenTimer = null;
        }

        // Add 500 XP bonus!
        this.score += 500;
        onScoreChange(this.score);

        // Flash screen cyan to celebrate
        this.cameras.main.flash(250, 0, 255, 200);

        // Play crash sound
        audioService.playCrash();

        // Create floating text
        this.showMakasFeedback(policeObj.x, policeObj.y, "POLİS EKARTE EDİLDİ!\n+500 XP");

        // Make police car spin out offscreen
        policeObj.setAngularVelocity(400); // spin
        policeObj.setVelocityX(Phaser.Math.Between(-150, 150));
        policeObj.setVelocityY(500); // fall behind

        // Schedule destroy
        this.time.delayedCall(1200, () => {
          policeObj.destroy();
        });

        // Destroy the traffic car it hit too
        if (trafficObj) {
          trafficObj.destroy();
        }

        // Set next trigger
        this.nextPoliceScore = this.score + 4000;
      }

      private showMakasFeedback(x: number, y: number, textContent: string) {
        // Create glowing floating text
        const text = this.add.text(x, y - 45, textContent, {
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

        // 1. Nitro Gauge charging and triggers
        if (this.isNitroActive) {
          this.nitroTimer -= delta;
          this.nitro = Math.max(0, (this.nitroTimer / this.nitroDuration) * 100);
          if (onNitroChange) onNitroChange(this.nitro);

          if (this.nitroTimer <= 0) {
            this.isNitroActive = false;
            this.nitro = 0;
            if (onNitroActive) onNitroActive(false);
          }
        } else {
          // Fill slowly: fully charges in ~25 seconds of clean survival
          this.nitro = Math.min(this.nitro + (delta / 250), 100);
          if (onNitroChange) onNitroChange(this.nitro);

          // Activate Nitro on Shift Key Down
          if (this.nitro >= 100 && this.shiftKey && this.shiftKey.isDown) {
            this.isNitroActive = true;
            this.nitroTimer = this.nitroDuration;
            audioService.playNitro();
            this.cameras.main.shake(300, 0.015);
            if (onNitroActive) onNitroActive(true);
          }
        }

        // 1b. Police Chase spawn trigger
        if (!this.isPoliceActive && this.score >= this.nextPoliceScore) {
          this.isPoliceActive = true;
          
          // Spawn police car offscreen bottom
          this.policeCar = this.physics.add.sprite(this.player.x, 900, "car_police");
          this.physics.add.existing(this.policeCar);
          this.policeCar.setDepth(13);
          this.policeCar.body?.setSize(36, 56, true);

          // Alternating siren tone timer
          this.policeSirenTimer = this.time.addEvent({
            delay: 450,
            callback: () => {
              if (this.isPoliceActive && !isPaused && !this.isGameOverActive) {
                const isHi = Math.floor(this.time.now / 450) % 2 === 0;
                audioService.playSirenTone(isHi);
              }
            },
            callbackScope: this,
            loop: true
          });

          // Overlap checks
          this.physics.add.overlap(this.player, this.policeCar, (p: any, pol: any) => {
            this.handleCollision(p, pol);
          }, undefined, this);

          this.physics.add.overlap(this.policeCar, this.trafficGroup, (pol: any, traf: any) => {
            this.handlePoliceCrash(pol, traf);
          }, undefined, this);

          // Flash screen blue to warn player
          this.cameras.main.flash(400, 0, 80, 255);
        }

        // 1c. Police AI movement follow
        if (this.isPoliceActive && this.policeCar && this.policeCar.active) {
          const dx = this.player.x - this.policeCar.x;
          this.policeCar.setVelocityX(dx * 3.8); // align on X

          // Maintain position behind player
          const targetY = this.player.y + 130;
          const dy = targetY - this.policeCar.y;
          this.policeCar.setVelocityY(dy * 5); // move up/down
        }

        // 2. Difficulty & Speed adjustments
        if (this.isNitroActive) {
          this.roadSpeed = 800; // Hyper boost speed
          audioService.updateMotorPitch(1.35); // Max rpm scream
        } else {
          this.roadSpeed = 350 + Math.min(this.score / 15, 350); // Cap road speed at 700 px/s
          const newInterval = Math.max(1800 - (this.score / 8), 750); // Cap spawn rate at 750ms
          if (this.trafficTimer) {
            (this.trafficTimer as any).delay = newInterval;
          }
          // Rev engine pitch based on speed
          const maxRoadSpeed = 700;
          const speedPercent = (this.roadSpeed - 350) / (maxRoadSpeed - 350);
          audioService.updateMotorPitch(speedPercent);
        }

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
        
        let speed = baseSpeed + Math.min(this.score / 30, 100);
        if (this.isNitroActive) {
          speed += 60; // Extra speed boost for steering under NOS hyper speed
        }
        let targetVx = 0;

        const activeControlType = settings.controlType;
        let goLeft = false;
        let goRight = false;

        // Read virtual buttons state from window.mobileControls
        if (typeof window !== "undefined" && (window as any).mobileControls) {
          const mc = (window as any).mobileControls;
          if (mc.left) goLeft = true;
          if (mc.right) goRight = true;

          // Process mobile nitro triggers inside Phaser
          if (mc.nitro && this.nitro >= 100 && !this.isNitroActive) {
            this.isNitroActive = true;
            this.nitroTimer = this.nitroDuration;
            audioService.playNitro();
            this.cameras.main.shake(300, 0.015);
            if (onNitroActive) onNitroActive(true);
            mc.nitro = false;
          }

          // Process mobile horn trigger
          if (mc.horn) {
            audioService.playHorn();
            mc.horn = false;
          }
        }

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
          // Enable steering buttons even in mouse mode if touched
          if (goLeft) {
            targetVx = -speed;
          } else if (goRight) {
            targetVx = speed;
          }
        } else {
          if (activeControlType === "arrows") {
            if (this.cursors.left.isDown) goLeft = true;
            if (this.cursors.right.isDown) goRight = true;
          } else {
            if (this.wasdKeys.A.isDown) goLeft = true;
            if (this.wasdKeys.D.isDown) goRight = true;
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
              const scoreBonus = this.isNitroActive ? 450 : 150;
              const cashBonus = this.isNitroActive ? 150 : 50;

              this.score += scoreBonus;
              onScoreChange(this.score);
              storageService.addCash(cashBonus);

              audioService.playMakas();
              
              const feedbackMsg = this.isNitroActive 
                ? `NITRO MAKAS! +${scoreBonus} XP\n+${cashBonus} TL`
                : `MAKAS! +${scoreBonus} XP\n+${cashBonus} TL`;
                
              this.showMakasFeedback(this.player.x, this.player.y, feedbackMsg);

              // 15% Nitro charge reward on Makas!
              if (!this.isNitroActive) {
                this.nitro = Math.min(this.nitro + 15, 100);
                if (onNitroChange) onNitroChange(this.nitro);
              }
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

        // 5b. Warp Speed Lines (Nitro)
        if (this.isNitroActive) {
          for (let i = 0; i < 2; i++) {
            const wx = Phaser.Math.Between(30, 450);
            const line = this.add.rectangle(wx, -20, 2, Phaser.Math.Between(50, 100), 0xffffff, 0.5);
            this.physics.add.existing(line);
            (line.body as Phaser.Physics.Arcade.Body).setVelocityY(2200); // super fast warp
            line.setDepth(14);
            this.warpLinesGroup.add(line);
          }
        }

        this.warpLinesGroup.getChildren().forEach((child: any) => {
          if (child.y > 820) {
            child.destroy();
          }
        });

        // 6. Draw Headlights in Night Mode & Police Flashing Lights
        this.headlightsGraphics.clear();

        // 6a. Police Flashing Sirens (independent of day/night)
        if (this.isPoliceActive && this.policeCar && this.policeCar.active) {
          const px = this.policeCar.x;
          const py = this.policeCar.y;
          const isRedLeft = (Math.floor(time / 100) % 2 === 0);

          // Left Cone (Red/Blue)
          this.headlightsGraphics.fillStyle(isRedLeft ? 0xff0000 : 0x0000ff, 0.22);
          this.headlightsGraphics.beginPath();
          this.headlightsGraphics.moveTo(px - 14, py - 30);
          this.headlightsGraphics.lineTo(px, py - 30);
          this.headlightsGraphics.lineTo(px - 40, py - 180);
          this.headlightsGraphics.lineTo(px - 85, py - 180);
          this.headlightsGraphics.closePath();
          this.headlightsGraphics.fillPath();

          // Right Cone (Blue/Red)
          this.headlightsGraphics.fillStyle(isRedLeft ? 0x0000ff : 0xff0000, 0.22);
          this.headlightsGraphics.beginPath();
          this.headlightsGraphics.moveTo(px, py - 30);
          this.headlightsGraphics.lineTo(px + 14, py - 30);
          this.headlightsGraphics.lineTo(px + 85, py - 180);
          this.headlightsGraphics.lineTo(px + 40, py - 180);
          this.headlightsGraphics.closePath();
          this.headlightsGraphics.fillPath();
        }

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
