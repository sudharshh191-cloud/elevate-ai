export class SpeechRecognitionService {
  private recognition: any = null;
  private isListening: boolean = false;

  isBrowserSupported(): boolean {
    return Boolean(
      typeof window !== 'undefined' &&
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    );
  }

  init(
    onTranscript: (text: string, isFinal: boolean) => void,
    onStatusChange?: (status: 'idle' | 'listening' | 'error' | 'unsupported') => void
  ) {
    if (!this.isBrowserSupported()) {
      onStatusChange?.('unsupported');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const combined = finalTranscript || interimTranscript;
        if (combined) {
          onTranscript(combined, Boolean(finalTranscript));
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          onStatusChange?.('error');
        }
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch {
            onStatusChange?.('idle');
          }
        } else {
          onStatusChange?.('idle');
        }
      };
    } catch (err) {
      console.warn('SpeechRecognition initialization error:', err);
      this.recognition = null;
      onStatusChange?.('unsupported');
    }
  }

  start(
    onTranscript: (text: string, isFinal: boolean) => void,
    onStatusChange?: (status: 'idle' | 'listening' | 'error' | 'unsupported') => void
  ) {
    if (!this.isBrowserSupported() || !this.recognition) {
      this.init(onTranscript, onStatusChange);
      if (!this.recognition) {
        onStatusChange?.('unsupported');
        return;
      }
    }

    this.isListening = true;
    onStatusChange?.('listening');

    try {
      this.recognition.start();
    } catch (err: any) {
      console.warn('SpeechRecognition start notice:', err.message);
    }
  }

  stop() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }
  }
}
