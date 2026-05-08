import { useCallback, useEffect, useRef, useState } from "react";

export type PuzzleSoundCue = "correct" | "mistake" | "skip" | "solution" | "solved";

const MUSIC_STEPS = [
  { note: 196.0, accent: true },
  { note: 246.94, accent: false },
  { note: 293.66, accent: false },
  { note: 329.63, accent: true },
  { note: 246.94, accent: false },
  { note: 220.0, accent: false }
];

type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

interface AudioGraph {
  context: AudioContext;
  filter: BiquadFilterNode;
  master: GainNode;
}

export function usePuzzleAudio() {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const graphRef = useRef<AudioGraph | null>(null);
  const timerRef = useRef<number | null>(null);
  const stepRef = useRef(0);

  const ensureAudioGraph = useCallback(() => {
    if (graphRef.current) {
      return graphRef.current;
    }

    const AudioContextClass =
      window.AudioContext || (window as AudioWindow).webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    const context = new AudioContextClass();
    const master = context.createGain();
    const filter = context.createBiquadFilter();

    filter.type = "lowpass";
    filter.frequency.value = 2600;
    filter.Q.value = 0.72;
    master.gain.value = 0.24;

    filter.connect(master);
    master.connect(context.destination);

    graphRef.current = {
      context,
      filter,
      master
    };

    return graphRef.current;
  }, []);

  const playTone = useCallback(
    (
      graph: AudioGraph,
      frequency: number,
      startTime: number,
      peakGain: number,
      duration: number,
      type: OscillatorType,
      destination: AudioNode = graph.filter
    ) => {
      const oscillator = graph.context.createOscillator();
      const gain = graph.context.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, startTime);
      oscillator.detune.setValueAtTime((stepRef.current % 5) * 2, startTime);
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      oscillator.connect(gain);
      gain.connect(destination);
      oscillator.start(startTime);
      oscillator.stop(startTime + duration + 0.04);
    },
    []
  );

  const playKick = useCallback((graph: AudioGraph, startTime: number) => {
    const oscillator = graph.context.createOscillator();
    const gain = graph.context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(96, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(46, startTime + 0.16);
    gain.gain.setValueAtTime(0.2, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.18);
    oscillator.connect(gain);
    gain.connect(graph.master);
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.2);
  }, []);

  const playTick = useCallback((graph: AudioGraph, startTime: number) => {
    const oscillator = graph.context.createOscillator();
    const gain = graph.context.createGain();

    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(1480, startTime);
    gain.gain.setValueAtTime(0.045, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.035);
    oscillator.connect(gain);
    gain.connect(graph.master);
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.04);
  }, []);

  const scheduleAudioStep = useCallback(() => {
    const graph = graphRef.current;
    if (!graph || !soundEnabled) {
      return;
    }

    const now = graph.context.currentTime;
    const step = MUSIC_STEPS[stepRef.current % MUSIC_STEPS.length];
    stepRef.current += 1;

    playTone(graph, step.note, now, step.accent ? 0.22 : 0.14, 0.32, "triangle");

    if (step.accent) {
      playTone(graph, step.note / 2, now, 0.12, 0.44, "sine");
      playKick(graph, now);
    }

    if (stepRef.current % 2 === 0) {
      playTick(graph, now + 0.16);
    }
  }, [playKick, playTick, playTone, soundEnabled]);

  const stopLoop = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startLoop = useCallback(async () => {
    const graph = ensureAudioGraph();
    if (!graph) {
      return;
    }

    if (graph.context.state !== "running") {
      await graph.context.resume();
    }

    if (!timerRef.current) {
      scheduleAudioStep();
      timerRef.current = window.setInterval(scheduleAudioStep, 360);
    }
  }, [ensureAudioGraph, scheduleAudioStep]);

  const toggleSound = useCallback(async () => {
    if (soundEnabled) {
      stopLoop();
      await graphRef.current?.context.suspend();
      setSoundEnabled(false);
      return;
    }

    const graph = ensureAudioGraph();
    if (!graph) {
      return;
    }

    if (graph.context.state !== "running") {
      await graph.context.resume();
    }

    const now = graph.context.currentTime + 0.02;
    playTone(graph, 261.63, now, 0.22, 0.18, "triangle", graph.master);
    playTone(graph, 329.63, now + 0.07, 0.18, 0.2, "triangle", graph.master);
    playTone(graph, 392.0, now + 0.14, 0.16, 0.24, "sine", graph.master);
    setSoundEnabled(true);
  }, [ensureAudioGraph, playTone, soundEnabled, stopLoop]);

  const playPuzzleCue = useCallback(
    async (cue: PuzzleSoundCue) => {
      if (!soundEnabled) {
        return;
      }

      const graph = ensureAudioGraph();
      if (!graph) {
        return;
      }

      if (graph.context.state !== "running") {
        await graph.context.resume();
      }

      const now = graph.context.currentTime + 0.02;

      if (cue === "mistake") {
        playTone(graph, 164.81, now, 0.18, 0.18, "sawtooth", graph.master);
        playTone(graph, 130.81, now + 0.08, 0.14, 0.22, "sine", graph.master);
        return;
      }

      if (cue === "solved") {
        playTone(graph, 261.63, now, 0.22, 0.18, "triangle", graph.master);
        playTone(graph, 329.63, now + 0.07, 0.2, 0.2, "triangle", graph.master);
        playTone(graph, 392.0, now + 0.14, 0.2, 0.24, "sine", graph.master);
        return;
      }

      if (cue === "skip" || cue === "solution") {
        playTone(graph, 220.0, now, 0.14, 0.14, "sine", graph.master);
        playTone(graph, 196.0, now + 0.08, 0.12, 0.18, "sine", graph.master);
        return;
      }

      playTone(graph, 329.63, now, 0.16, 0.16, "triangle", graph.master);
      playTone(graph, 392.0, now + 0.08, 0.14, 0.18, "sine", graph.master);
    },
    [ensureAudioGraph, playTone, soundEnabled]
  );

  useEffect(() => {
    if (!soundEnabled) {
      return undefined;
    }

    void startLoop();

    return () => {
      stopLoop();
    };
  }, [soundEnabled, startLoop, stopLoop]);

  useEffect(() => {
    return () => {
      stopLoop();
      void graphRef.current?.context.close();
    };
  }, [stopLoop]);

  return {
    soundEnabled,
    toggleSound,
    playPuzzleCue
  };
}
