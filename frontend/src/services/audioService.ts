export class AudioVisualizerService {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private animationFrameId: number | null = null;
  private isRecording: boolean = false;
  private isSimulated: boolean = false;

  async start(
    onData: (frequencies: Uint8Array, volume: number) => void,
    onSimulatedToggle?: (simulated: boolean) => void
  ): Promise<boolean> {
    try {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64;

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          this.sourceNode = this.audioCtx.createMediaStreamSource(this.mediaStream);
          this.sourceNode.connect(this.analyser);
          this.isSimulated = false;
          onSimulatedToggle?.(false);
        } catch {
          console.warn('Microphone permission not granted or unavailable. Using synthetic audio visualizer.');
          this.isSimulated = true;
          onSimulatedToggle?.(true);
        }
      } else {
        this.isSimulated = true;
        onSimulatedToggle?.(true);
      }

      this.isRecording = true;
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let simPhase = 0;
      const update = () => {
        if (!this.isRecording) return;

        if (!this.isSimulated && this.analyser) {
          this.analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const volume = sum / (bufferLength * 255);
          onData(dataArray, volume);
        } else {
          // Synthetic dynamic waveform for simulation
          simPhase += 0.15;
          for (let i = 0; i < bufferLength; i++) {
            const wave = Math.sin(simPhase + i * 0.4) * 0.5 + 0.5;
            const noise = Math.random() * 0.2;
            dataArray[i] = Math.floor((wave * 0.8 + noise) * 255);
          }
          const volume = 0.4 + Math.sin(simPhase * 0.7) * 0.3;
          onData(dataArray, volume);
        }

        this.animationFrameId = requestAnimationFrame(update);
      };

      update();
      return true;
    } catch (err) {
      console.error('Failed to start audio visualizer:', err);
      return false;
    }
  }

  stop() {
    this.isRecording = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
  }
}
