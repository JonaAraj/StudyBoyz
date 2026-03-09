// ============================================================
// useRecorder.ts — Hook de grabación multiplataforma v2
// Móvil: expo-av | Web: MediaRecorder API
// INICIO MANUAL — no se inicia automáticamente
// ============================================================

import { useState, useRef, useCallback, useEffect } from "react";
import { Platform, Alert } from "react-native";

export type RecorderState = "idle" | "recording" | "paused" | "stopped";

export interface RecorderResult {
  uri: string;
  blob?: Blob;
  mimeType: string;
  durationMillis: number;
  sizeBytes?: number;
}

interface UseRecorderReturn {
  state: RecorderState;
  durationMillis: number;
  metering: number[];
  startRecording: () => Promise<void>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  stopRecording: () => Promise<RecorderResult | null>;
  cancelRecording: () => Promise<void>;
}

export const useRecorder = (): UseRecorderReturn => {
  const [state, setState] = useState<RecorderState>("idle");
  const [durationMillis, setDurationMillis] = useState(0);
  const [metering, setMetering] = useState<number[]>(new Array(13).fill(6));

  // Refs móvil
  const recordingRef = useRef<any>(null);

  // Refs web
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // ── Animación de metering web ────────────────────────────────
  const startMeteringWeb = (analyser: AnalyserNode) => {
    const buffer = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(buffer);
      const avg = buffer.slice(0, 32).reduce((a, b) => a + b, 0) / 32;
      const h = Math.max(4, Math.min(52, (avg / 255) * 52));
      setMetering((prev) => [...prev.slice(1), h]);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  };

  // ════════════════════════════════════════════════════════════
  // MÓVIL — expo-av
  // ════════════════════════════════════════════════════════════
  const startMobile = async () => {
    try {
      const { Audio } = await import("expo-av");

      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Permiso denegado", "Se requiere acceso al micrófono.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          setDurationMillis(status.durationMillis);
          if (status.isRecording && status.metering !== undefined) {
            const db = status.metering;
            const h = Math.max(4, Math.min(52, 4 + ((db + 160) / 160) * 48));
            setMetering((prev) => [...prev.slice(1), h]);
          }
        },
        100,
      );

      recordingRef.current = recording;
      setState("recording");
    } catch (err: any) {
      Alert.alert("Error", `No se pudo iniciar la grabación: ${err.message}`);
    }
  };

  const pauseMobile = async () => {
    if (!recordingRef.current) return;
    await recordingRef.current.pauseAsync();
    setState("paused");
  };

  const resumeMobile = async () => {
    if (!recordingRef.current) return;
    await recordingRef.current.startAsync();
    setState("recording");
  };

  const stopMobile = async (): Promise<RecorderResult | null> => {
    if (!recordingRef.current) return null;
    setState("stopped");
    const status = await recordingRef.current.getStatusAsync();
    await recordingRef.current.stopAndUnloadAsync();
    const uri = recordingRef.current.getURI() || "";
    recordingRef.current = null;
    return {
      uri,
      mimeType: "audio/m4a",
      durationMillis: status.durationMillis || durationMillis,
    };
  };

  const cancelMobile = async () => {
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (_) {}
      recordingRef.current = null;
    }
    setDurationMillis(0);
    setMetering(new Array(13).fill(6));
    setState("idle");
  };

  // ════════════════════════════════════════════════════════════
  // WEB — MediaRecorder API
  // ════════════════════════════════════════════════════════════
  const startWeb = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });
      streamRef.current = stream;
      chunksRef.current = [];

      // Web Audio API para visualización
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      startMeteringWeb(analyser);

      // Elegir mejor formato soportado
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
            ? "audio/ogg;codecs=opus"
            : "audio/ogg";

      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.start(100);
      startTimeRef.current = Date.now();
      pausedDurationRef.current = 0;

      timerRef.current = setInterval(() => {
        setDurationMillis(
          Date.now() - startTimeRef.current + pausedDurationRef.current,
        );
      }, 100);

      setState("recording");
    } catch (err: any) {
      const msg =
        err.name === "NotAllowedError"
          ? "Permiso de micrófono denegado. Habilítalo en la configuración del navegador."
          : `No se pudo acceder al micrófono: ${err.message}`;
      Alert.alert("Error", msg);
    }
  };

  const pauseWeb = async () => {
    if (
      !mediaRecorderRef.current ||
      mediaRecorderRef.current.state !== "recording"
    )
      return;
    mediaRecorderRef.current.pause();
    pausedDurationRef.current += Date.now() - startTimeRef.current;
    if (timerRef.current) clearInterval(timerRef.current);
    cancelAnimationFrame(animFrameRef.current);
    setState("paused");
  };

  const resumeWeb = async () => {
    if (
      !mediaRecorderRef.current ||
      mediaRecorderRef.current.state !== "paused"
    )
      return;
    mediaRecorderRef.current.resume();
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setDurationMillis(
        Date.now() - startTimeRef.current + pausedDurationRef.current,
      );
    }, 100);
    if (analyserRef.current) startMeteringWeb(analyserRef.current);
    setState("recording");
  };

  const stopWeb = (): Promise<RecorderResult | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      if (timerRef.current) clearInterval(timerRef.current);
      cancelAnimationFrame(animFrameRef.current);

      const mr = mediaRecorderRef.current;
      const mimeType = mr.mimeType || "audio/webm";
      const finalDuration = durationMillis;

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const uri = URL.createObjectURL(blob);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
        if (audioCtxRef.current) {
          audioCtxRef.current.close();
        }

        setState("stopped");
        resolve({
          uri,
          blob,
          mimeType,
          durationMillis: finalDuration,
          sizeBytes: blob.size,
        });
      };

      if (mr.state !== "inactive") mr.stop();
      else resolve(null);
    });
  };

  const cancelWeb = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    cancelAnimationFrame(animFrameRef.current);

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
    }

    chunksRef.current = [];
    setDurationMillis(0);
    setMetering(new Array(13).fill(6));
    setState("idle");
  };

  // ════════════════════════════════════════════════════════════
  // API PÚBLICA — detecta plataforma automáticamente
  // ════════════════════════════════════════════════════════════
  const isWeb = Platform.OS === "web";

  const startRecording = useCallback(async () => {
    if (isWeb) await startWeb();
    else await startMobile();
  }, [isWeb]);

  const pauseRecording = useCallback(async () => {
    if (isWeb) await pauseWeb();
    else await pauseMobile();
  }, [isWeb, state]);

  const resumeRecording = useCallback(async () => {
    if (isWeb) await resumeWeb();
    else await resumeMobile();
  }, [isWeb, state]);

  const stopRecording =
    useCallback(async (): Promise<RecorderResult | null> => {
      if (isWeb) return await stopWeb();
      else return await stopMobile();
    }, [isWeb, durationMillis]);

  const cancelRecording = useCallback(async () => {
    if (isWeb) await cancelWeb();
    else await cancelMobile();
  }, [isWeb]);

  return {
    state,
    durationMillis,
    metering,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
  };
};
