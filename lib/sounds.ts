class SoundManager {
  private sounds: Record<string, HTMLAudioElement> = {};

  constructor() {
    if (typeof window !== "undefined") {
      this.sounds = {
        move: new Audio("https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-self.mp3"),
        capture: new Audio("https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/capture.mp3"),
        check: new Audio("https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-check.mp3"),
        gameOver: new Audio("https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/game-end.mp3"),
      };
    }
  }

  play(soundName: string, isMuted: boolean = false) {
    if (isMuted) return;
    const sound = this.sounds[soundName];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch((e) => console.log("Audio play error:", e));
    }
  }
}

export const soundManager = new SoundManager();