import Phaser from 'phaser';
import {
  getLightingProfile,
  getWeatherKindAtHour,
  getWeatherProfile,
  isLightningFlashActive,
  type LightPhase,
  type WeatherKind,
  type WeatherProfile
} from '../systems/WeatherSystem';

interface RainDrop {
  x: number;
  y: number;
  speedFactor: number;
  length: number;
}

interface WeatherRuntime {
  scene: Phaser.Scene;
  width: number;
  height: number;
  weatherOverlay: Phaser.GameObjects.Rectangle;
  lightOverlay: Phaser.GameObjects.Rectangle;
  flashOverlay: Phaser.GameObjects.Rectangle;
  cloudGraphics: Phaser.GameObjects.Graphics;
  rainGraphics: Phaser.GameObjects.Graphics;
  wetGraphics: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  drops: RainDrop[];
  weatherKind?: WeatherKind;
  lightPhase?: LightPhase;
}

const MAX_RAIN_DROPS = 96;

const createDrops = (width: number, height: number): RainDrop[] =>
  Array.from({ length: MAX_RAIN_DROPS }, (_unused, index) => ({
    x: (index * 73 + 19) % width,
    y: (index * 47 + 11) % height,
    speedFactor: 0.78 + ((index * 17) % 31) / 100,
    length: 5 + ((index * 13) % 7)
  }));

export class WeatherController {
  private runtime?: WeatherRuntime;

  constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.STEP, this.onStep, this);
  }

  destroy(): void {
    this.game.events.off(Phaser.Core.Events.STEP, this.onStep, this);
    this.runtime = undefined;
    this.clearDataset();
  }

  private onStep(time: number, delta: number): void {
    const scene = this.game.scene.getScene('GameScene');
    if (!scene?.scene.isActive()) {
      if (this.runtime) {
        this.runtime = undefined;
        this.clearDataset();
      }
      return;
    }

    if (!this.runtime || this.runtime.scene !== scene) {
      this.runtime = this.createRuntime(scene);
    }

    const hour = Number(document.body.dataset.worldHour ?? 0);
    const weatherKind = getWeatherKindAtHour(hour);
    const weather = getWeatherProfile(weatherKind);
    const lighting = getLightingProfile(hour);

    if (this.runtime.weatherKind !== weatherKind) {
      this.runtime.weatherKind = weatherKind;
      this.runtime.weatherOverlay
        .setFillStyle(weather.overlayColor, 1)
        .setAlpha(weather.overlayAlpha);
      this.runtime.label.setText(`${weather.label} · ${lighting.label}`);
    }

    if (this.runtime.lightPhase !== lighting.phase) {
      this.runtime.lightPhase = lighting.phase;
      this.runtime.lightOverlay
        .setFillStyle(lighting.tintColor, 1)
        .setAlpha(lighting.tintAlpha);
      this.runtime.label.setText(`${weather.label} · ${lighting.label}`);
    }

    this.drawClouds(this.runtime, time, weather);
    this.drawRain(this.runtime, delta, weather);
    this.drawWetSurface(this.runtime, time, weather);
    const lightning =
      weather.kind === 'storm' &&
      isLightningFlashActive(time, weather.lightningPeriodMs);
    this.runtime.flashOverlay.setAlpha(lightning ? 0.42 : 0);
    this.publishState(weather, lighting.phase, lightning);
  }

  private createRuntime(scene: Phaser.Scene): WeatherRuntime {
    const width = scene.scale.width;
    const height = scene.scale.height;
    const weatherOverlay = scene.add
      .rectangle(width / 2, height / 2, width, height, 0x52606a, 0)
      .setScrollFactor(0)
      .setDepth(91)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
    const lightOverlay = scene.add
      .rectangle(width / 2, height / 2, width, height, 0xf2d7a2, 0)
      .setScrollFactor(0)
      .setDepth(92)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const cloudGraphics = scene.add
      .graphics()
      .setScrollFactor(0)
      .setDepth(93)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
    const wetGraphics = scene.add
      .graphics()
      .setScrollFactor(0)
      .setDepth(94)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const rainGraphics = scene.add.graphics().setScrollFactor(0).setDepth(95);
    const flashOverlay = scene.add
      .rectangle(width / 2, height / 2, width, height, 0xdceaff, 0)
      .setScrollFactor(0)
      .setDepth(96)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const label = scene.add
      .text(width - 8, 63, '', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#e9dfc7',
        backgroundColor: '#17110dcc',
        padding: { x: 5, y: 3 }
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(120);

    return {
      scene,
      width,
      height,
      weatherOverlay,
      lightOverlay,
      flashOverlay,
      cloudGraphics,
      rainGraphics,
      wetGraphics,
      label,
      drops: createDrops(width, height)
    };
  }

  private drawClouds(runtime: WeatherRuntime, time: number, weather: WeatherProfile): void {
    runtime.cloudGraphics.clear();
    if (weather.cloudAlpha <= 0) return;

    const travel = (time * (0.006 + Math.abs(weather.windX) * 0.00008)) %
      (runtime.width + 180);
    runtime.cloudGraphics.fillStyle(0x202a32, weather.cloudAlpha);
    for (let index = 0; index < 4; index += 1) {
      const x = ((index * 157 + travel) % (runtime.width + 180)) - 120;
      const y = 18 + index * 53;
      const width = 108 + (index % 2) * 42;
      runtime.cloudGraphics.fillRoundedRect(x, y, width, 28, 12);
      runtime.cloudGraphics.fillRoundedRect(x + 34, y - 9, width * 0.55, 24, 10);
    }
  }

  private drawRain(runtime: WeatherRuntime, delta: number, weather: WeatherProfile): void {
    runtime.rainGraphics.clear();
    if (weather.rainDensity <= 0) return;

    const seconds = Math.min(0.05, Math.max(0, delta / 1000));
    const activeCount = Math.min(runtime.drops.length, weather.rainDensity);
    runtime.rainGraphics.lineStyle(
      weather.kind === 'storm' ? 1.2 : 1,
      0xb8d4df,
      weather.kind === 'storm' ? 0.58 : 0.46
    );

    for (let index = 0; index < activeCount; index += 1) {
      const drop = runtime.drops[index];
      drop.y += weather.rainSpeed * drop.speedFactor * seconds;
      drop.x += weather.windX * seconds;
      if (drop.y > runtime.height + 14) {
        drop.y = -drop.length - ((index * 19) % 23);
        drop.x = (index * 83 + timeSafe(index)) % runtime.width;
      }
      if (drop.x < -20) drop.x = runtime.width + 10;
      if (drop.x > runtime.width + 20) drop.x = -10;
      runtime.rainGraphics.lineBetween(
        drop.x,
        drop.y,
        drop.x + weather.windX * 0.045,
        drop.y + drop.length
      );
    }
  }

  private drawWetSurface(runtime: WeatherRuntime, time: number, weather: WeatherProfile): void {
    runtime.wetGraphics.clear();
    if (weather.wetness <= 0) return;

    const pulse = 0.04 + (Math.sin(time / 620) + 1) * 0.025;
    runtime.wetGraphics.fillStyle(0x9fc7d1, weather.wetness * pulse);
    for (let index = 0; index < 7; index += 1) {
      const x = (index * 79 + 23) % runtime.width;
      const y = runtime.height - 18 - (index % 3) * 11;
      runtime.wetGraphics.fillRect(x, y, 24 + (index % 2) * 18, 1);
    }
  }

  private publishState(
    weather: WeatherProfile,
    lightPhase: LightPhase,
    lightning: boolean
  ): void {
    document.body.dataset.weather = weather.kind;
    document.body.dataset.weatherLabel = weather.label;
    document.body.dataset.weatherRainDensity = String(weather.rainDensity);
    document.body.dataset.weatherWetness = weather.wetness.toFixed(2);
    document.body.dataset.weatherVisibility = weather.visibility.toFixed(2);
    document.body.dataset.lightPhase = lightPhase;
    document.body.dataset.lightning = String(lightning);
  }

  private clearDataset(): void {
    delete document.body.dataset.weather;
    delete document.body.dataset.weatherLabel;
    delete document.body.dataset.weatherRainDensity;
    delete document.body.dataset.weatherWetness;
    delete document.body.dataset.weatherVisibility;
    delete document.body.dataset.lightPhase;
    delete document.body.dataset.lightning;
  }
}

const timeSafe = (index: number): number => (index * 31 + 17) % 97;
