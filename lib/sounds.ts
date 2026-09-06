// lib/sounds.ts

class SoundManager {
  private sounds: { [key: string]: HTMLAudioElement } = {};

  constructor() {
    if (typeof window !== "undefined") {
      this.sounds = {
        // Chess.com-ի պաշտոնական ձայնային ֆայլերը
        move: new Audio("https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-self.mp3"),
        capture: new Audio("https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/capture.mp3"),
        check: new Audio("https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-check.mp3"),
        gameOver: new Audio("https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/game-end.mp3"),
      };

      // Նախապես բեռնում ենք ձայները (Preload)
      Object.values(this.sounds).forEach((audio) => {
        audio.preload = "auto";
      });
    }
  }

  play(soundName: "move" | "capture" | "check" | "gameOver", isMuted: boolean = false) {
    if (isMuted) return;

    const sound = this.sounds[soundName];
    if (sound) {
      sound.currentTime = 0; // Եթե ձայնը դեռ չի ավարտվել, սկսում է սկզբից
      sound.play().catch((err) => {
        console.warn("Audio playback blocked by browser:", err);
      });
    }
  }
}

export const soundManager = new SoundManager();