import { useCallback, useEffect, useState } from 'react';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
} from 'expo-audio';

const BAR_COUNT = 24;
const POLL_INTERVAL_MS = 80;
const SILENT_WAVEFORM = Array<number>(BAR_COUNT).fill(0);

interface VoiceFile {
  uri: string;
  name: string;
  type: string;
}

interface UseVoiceRecorderResult {
  isRecording: boolean;
  elapsedSeconds: number;
  /** BAR_COUNT values 0-1 — recent mic amplitude history, updated on each poll (~80ms) */
  waveform: number[];
  start: () => Promise<void>;
  stop: () => Promise<VoiceFile | null>;
  cancel: () => Promise<void>;
}

// RecorderState.metering is dBFS (usually within [-160, 0], silence is ~ -50 or below)
// — normalized to [0,1] to draw the waveform, similar to Web using AnalyserNode.
function normalizeMetering(db: number | undefined): number {
  if (db == null || !Number.isFinite(db)) return 0;
  const clamped = Math.max(-50, Math.min(0, db));
  return (clamped + 50) / 50;
}

/**
 * Records audio via expo-audio (RecordingPresets.HIGH_QUALITY → .m4a, content-type "audio/mp4"
 * — within the BE ChatVoiceTranscribeCommand whitelist, same as Web). Waveform is read via
 * RecorderState.metering (polling ~80ms via useAudioRecorderState) — for UI display only,
 * does not affect the recorded file.
 */
export function useVoiceRecorder(): UseVoiceRecorderResult {
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const state = useAudioRecorderState(recorder, POLL_INTERVAL_MS);
  const [waveform, setWaveform] = useState<number[]>(SILENT_WAVEFORM);

  useEffect(() => {
    if (!state.isRecording) return;
    setWaveform((prev) => [...prev.slice(1), normalizeMetering(state.metering)]);
  }, [state.metering, state.isRecording]);

  const start = useCallback(async () => {
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) {
      throw new Error('Microphone permission not granted.');
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setWaveform(SILENT_WAVEFORM);
  }, [recorder]);

  const stop = useCallback(async (): Promise<VoiceFile | null> => {
    if (!state.isRecording) return null;
    await recorder.stop();
    // iOS: leave the PlayAndRecord category as soon as recording stops — if allowsRecording=true
    // stays on, the mic loops back to the speaker causing an echo of the just-recorded voice after sending.
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
    setWaveform(SILENT_WAVEFORM);
    const uri = recorder.uri;
    if (!uri) return null;
    return { uri, name: `voice-message-${Date.now()}.m4a`, type: 'audio/mp4' };
  }, [recorder, state.isRecording]);

  const cancel = useCallback(async () => {
    if (state.isRecording) {
      await recorder.stop();
    }
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
    setWaveform(SILENT_WAVEFORM);
  }, [recorder, state.isRecording]);

  return {
    isRecording: state.isRecording,
    elapsedSeconds: Math.floor(state.durationMillis / 1000),
    waveform,
    start,
    stop,
    cancel,
  };
}
