class SoundManager {
  private playSound(src: string) {
    if (typeof window !== "undefined") {
      try {
        const audio = new Audio(src);
        audio.play().catch(() => {
          // Ignore autoplay restriction errors
        });
      } catch (e) {
        console.error("Audio playback error:", e);
      }
    }
  }

  playMove() {
    this.playSound("/sounds/move.mp3");
  }

  playCapture() {
    this.playSound("/sounds/capture.mp3");
  }

  playCheck() {
    this.playSound("/sounds/check.mp3");
  }
}

export const soundEffects = new SoundManager();