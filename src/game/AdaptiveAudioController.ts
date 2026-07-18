import {
  getMusicMoodLabel,
  getMusicState,
  getMusicStepDuration,
  type MusicState
} from '../systems/MusicSystem';
import type { AwarenessLevel } from '../systems/StealthSystem';

const LOOKAHEAD_SECONDS = 0.28;
const SCHEDULER_INTERVAL_MS = 80;
const MASTER_GAIN = 0.34;

interface AudioGraph {
  context: AudioContext;
  master: GainNode;
  ambienceGain: GainNode;
  droneGain: GainNode;
  melodyGain: GainNode;
  pulseGain: GainNode;
  percussionGain: GainNode;
  ambienceFilter: BiquadFilterNode;
  droneFilter: BiquadFilterNode;
  droneLow: OscillatorNode;
  droneHigh: OscillatorNode;
  ambienceSource: AudioBufferSourceNode;
  percussionBuffer: AudioBuffer;
}

export class AdaptiveAudioController {
  private readonly button: HTMLButtonElement;
  private readonly observer: MutationObserver;
  private readonly cleanup: Array<() => void> = [];
  private graph?: AudioGraph;
  private schedulerId?: number;
  private currentState: MusicState = getMusicState({
    sceneActive: false,
    worldHour: 0,
    stealthLevel: 'unaware',
    muted: true
  });
  private muted = true;
  private unlocked = false;
  private stepIndex = 0;
  private nextStepTime = 0;

  constructor() {
    this.button = this.requireButton('[data-audio-toggle]');
    this.observer = new MutationObserver(() => this.refreshState());
    this.observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-scene', 'data-world-hour', 'data-stealth-level']
    });

    const onButton = () => void this.toggle();
    this.button.addEventListener('click', onButton);
    this.cleanup.push(() => this.button.removeEventListener('click', onButton));

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.key.toLowerCase() !== 'm') return;
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;
      event.preventDefault();
      void this.toggle();
    };
    document.addEventListener('keydown', onKeyDown);
    this.cleanup.push(() => document.removeEventListener('keydown', onKeyDown));

    document.body.dataset.audioUnlocked = 'false';
    document.body.dataset.musicMuted = 'true';
    document.body.dataset.musicMood = 'silent';
    this.renderButton();
  }

  async destroy(): Promise<void> {
    this.observer.disconnect();
    this.cleanup.forEach((dispose) => dispose());
    this.cleanup.length = 0;
    if (this.schedulerId !== undefined) window.clearInterval(this.schedulerId);
    this.schedulerId = undefined;
    this.graph?.ambienceSource.stop();
    this.graph?.droneLow.stop();
    this.graph?.droneHigh.stop();
    await this.graph?.context.close();
    this.graph = undefined;
    delete document.body.dataset.audioUnlocked;
    delete document.body.dataset.musicMuted;
    delete document.body.dataset.musicMood;
  }

  private async toggle(): Promise<void> {
    if (!this.unlocked) {
      await this.unlock();
      return;
    }

    this.muted = !this.muted;
    if (!this.muted && this.graph?.context.state === 'suspended') {
      await this.graph.context.resume();
    }
    this.refreshState();
    this.renderButton();
  }

  private async unlock(): Promise<void> {
    if (!this.graph) this.graph = this.createGraph();
    if (this.graph.context.state === 'suspended') await this.graph.context.resume();
    this.unlocked = true;
    this.muted = false;
    this.nextStepTime = this.graph.context.currentTime + 0.08;
    this.schedulerId = window.setInterval(() => this.schedule(), SCHEDULER_INTERVAL_MS);
    document.body.dataset.audioUnlocked = 'true';
    this.refreshState();
    this.renderButton();
  }

  private refreshState(): void {
    const nextState = getMusicState({
      sceneActive: document.body.dataset.scene === 'game',
      worldHour: Number(document.body.dataset.worldHour ?? 0),
      stealthLevel: this.parseStealthLevel(document.body.dataset.stealthLevel),
      muted: this.muted || !this.unlocked
    });

    const moodChanged = nextState.mood !== this.currentState.mood;
    this.currentState = nextState;
    document.body.dataset.musicMood = nextState.mood;
    document.body.dataset.musicMuted = String(this.muted || !this.unlocked);
    if (moodChanged) this.stepIndex = 0;
    if (this.graph) this.applyState(nextState, moodChanged);
    this.renderButton();
  }

  private applyState(state: MusicState, moodChanged: boolean): void {
    const graph = this.graph;
    if (!graph) return;
    const now = graph.context.currentTime;
    const rampSeconds = moodChanged ? 0.9 : 0.35;

    this.rampGain(graph.master.gain, state.mood === 'silent' ? 0 : MASTER_GAIN, now, rampSeconds);
    this.rampGain(graph.ambienceGain.gain, state.layers.ambience, now, rampSeconds);
    this.rampGain(graph.droneGain.gain, state.layers.drone, now, rampSeconds);
    this.rampGain(graph.melodyGain.gain, state.layers.melody, now, rampSeconds);
    this.rampGain(graph.pulseGain.gain, state.layers.pulse, now, rampSeconds);
    this.rampGain(graph.percussionGain.gain, state.layers.percussion, now, rampSeconds);

    if (state.motif) {
      graph.ambienceFilter.frequency.cancelScheduledValues(now);
      graph.ambienceFilter.frequency.setValueAtTime(graph.ambienceFilter.frequency.value, now);
      graph.ambienceFilter.frequency.linearRampToValueAtTime(
        state.motif.filterFrequency,
        now + rampSeconds
      );
      graph.droneFilter.frequency.cancelScheduledValues(now);
      graph.droneFilter.frequency.setValueAtTime(graph.droneFilter.frequency.value, now);
      graph.droneFilter.frequency.linearRampToValueAtTime(
        Math.max(420, state.motif.filterFrequency * 0.62),
        now + rampSeconds
      );
      graph.droneLow.frequency.setTargetAtTime(
        state.motif.rootFrequency * 0.5,
        now,
        0.35
      );
      graph.droneHigh.frequency.setTargetAtTime(
        state.motif.rootFrequency * 0.75,
        now,
        0.35
      );
    }
  }

  private schedule(): void {
    const graph = this.graph;
    const motif = this.currentState.motif;
    if (!graph || !motif || this.currentState.mood === 'silent') return;

    const now = graph.context.currentTime;
    if (this.nextStepTime < now - 0.5) this.nextStepTime = now + 0.05;
    const stepDuration = getMusicStepDuration(motif);

    while (this.nextStepTime < now + LOOKAHEAD_SECONDS) {
      this.scheduleStep(graph, this.currentState, this.stepIndex, this.nextStepTime, stepDuration);
      this.stepIndex = (this.stepIndex + 1) % motif.melodyRatios.length;
      this.nextStepTime += stepDuration;
    }
  }

  private scheduleStep(
    graph: AudioGraph,
    state: MusicState,
    index: number,
    time: number,
    duration: number
  ): void {
    const motif = state.motif;
    if (!motif) return;
    const melodyFrequency = motif.rootFrequency * motif.melodyRatios[index % motif.melodyRatios.length];
    const bassFrequency = motif.rootFrequency * motif.bassRatios[index % motif.bassRatios.length];

    if (state.layers.melody > 0.02) {
      this.scheduleTone(graph, graph.melodyGain, melodyFrequency, time, duration * 0.78, 'triangle', 0.16);
    }
    if (state.layers.pulse > 0.04 && index % 2 === 0) {
      this.scheduleTone(graph, graph.pulseGain, bassFrequency, time, duration * 0.58, 'sine', 0.22);
    }
    if (state.layers.percussion > 0.04 && index % 4 === 0) {
      this.schedulePercussion(graph, time, Math.min(0.18, duration * 0.55));
    }
  }

  private scheduleTone(
    graph: AudioGraph,
    destination: AudioNode,
    frequency: number,
    time: number,
    duration: number,
    type: OscillatorType,
    peakGain: number
  ): void {
    const oscillator = graph.context.createOscillator();
    const gain = graph.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(peakGain, time + Math.min(0.04, duration * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(gain).connect(destination);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.02);
  }

  private schedulePercussion(graph: AudioGraph, time: number, duration: number): void {
    const source = graph.context.createBufferSource();
    const filter = graph.context.createBiquadFilter();
    const gain = graph.context.createGain();
    source.buffer = graph.percussionBuffer;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(
      this.currentState.mood === 'alerted' ? 165 : 115,
      time
    );
    filter.Q.setValueAtTime(1.4, time);
    gain.gain.setValueAtTime(0.24, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    source.connect(filter).connect(gain).connect(graph.percussionGain);
    source.start(time, 0, duration);
    source.stop(time + duration + 0.02);
  }

  private createGraph(): AudioGraph {
    const AudioContextConstructor = window.AudioContext;
    const context = new AudioContextConstructor({ latencyHint: 'interactive' });
    const master = context.createGain();
    const ambienceGain = context.createGain();
    const droneGain = context.createGain();
    const melodyGain = context.createGain();
    const pulseGain = context.createGain();
    const percussionGain = context.createGain();
    const ambienceFilter = context.createBiquadFilter();
    const droneFilter = context.createBiquadFilter();
    const compressor = context.createDynamicsCompressor();

    master.gain.value = 0;
    ambienceGain.gain.value = 0;
    droneGain.gain.value = 0;
    melodyGain.gain.value = 0;
    pulseGain.gain.value = 0;
    percussionGain.gain.value = 0;
    ambienceFilter.type = 'lowpass';
    ambienceFilter.frequency.value = 1200;
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 700;
    compressor.threshold.value = -18;
    compressor.knee.value = 20;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.01;
    compressor.release.value = 0.25;

    ambienceGain.connect(master);
    droneGain.connect(master);
    melodyGain.connect(master);
    pulseGain.connect(master);
    percussionGain.connect(master);
    master.connect(compressor).connect(context.destination);

    const ambienceSource = context.createBufferSource();
    ambienceSource.buffer = this.createNoiseBuffer(context, 2.5);
    ambienceSource.loop = true;
    ambienceSource.connect(ambienceFilter).connect(ambienceGain);
    ambienceSource.start();

    const droneLow = context.createOscillator();
    const droneHigh = context.createOscillator();
    droneLow.type = 'sine';
    droneHigh.type = 'triangle';
    droneLow.detune.value = -4;
    droneHigh.detune.value = 5;
    droneLow.connect(droneFilter);
    droneHigh.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneLow.start();
    droneHigh.start();

    return {
      context,
      master,
      ambienceGain,
      droneGain,
      melodyGain,
      pulseGain,
      percussionGain,
      ambienceFilter,
      droneFilter,
      droneLow,
      droneHigh,
      ambienceSource,
      percussionBuffer: this.createNoiseBuffer(context, 0.4)
    };
  }

  private createNoiseBuffer(context: AudioContext, seconds: number): AudioBuffer {
    const length = Math.max(1, Math.floor(context.sampleRate * seconds));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    let previous = 0;

    for (let index = 0; index < data.length; index += 1) {
      const white = Math.random() * 2 - 1;
      previous = previous * 0.92 + white * 0.08;
      data[index] = previous * 0.7;
    }
    return buffer;
  }

  private rampGain(
    parameter: AudioParam,
    target: number,
    now: number,
    duration: number
  ): void {
    parameter.cancelScheduledValues(now);
    parameter.setValueAtTime(parameter.value, now);
    parameter.linearRampToValueAtTime(target, now + duration);
  }

  private parseStealthLevel(value: string | undefined): AwarenessLevel {
    if (value === 'suspicious' || value === 'alerted') return value;
    return 'unaware';
  }

  private renderButton(): void {
    const mood = getMusicMoodLabel(this.currentState.mood);
    const active = this.unlocked && !this.muted;
    this.button.textContent = active ? `Hudba: ${mood}` : 'Hudba vypnuta';
    this.button.setAttribute('aria-pressed', String(active));
    this.button.title = active
      ? 'Ztlumit hudbu (M)'
      : 'Zapnout adaptivní hudbu (M)';
  }

  private requireButton(selector: string): HTMLButtonElement {
    const button = document.querySelector<HTMLButtonElement>(selector);
    if (!button) throw new Error(`Required audio control is missing: ${selector}`);
    return button;
  }
}
