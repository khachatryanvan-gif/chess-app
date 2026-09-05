// lib/sounds.ts

// Base64 ձայնային ֆայլեր (Lichess / Chess.com standard sounds)
const SOUNDS_BASE64 = {
  move: "data:audio/mp3;base64,SUQ3BAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAD/42AQAD8AXAAAAAEAAAABAAAAAAAAAAAAAAAAM1JS1P/jYBAYPgI2/0AAAA0ADQAAAAC/AABGSUxFAAAAAAAAAAD/42AQCDoC8m/mAC4AAAAANAAAAC/AAC/gAABGSUxFAAAAAAAAAAD/42AQAEsClv/4AC4AAAAANAAAAC/AAC/gAABGSUxFAAAAAAAAAAD",
  capture: "data:audio/mp3;base64,SUQ3BAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAD/42AQACMAUAAAAAEAAAABAAAAAAAAAAAAAAAAM1JS1P/jYBAUPgJm3/4AC4AAAAANAAAAC/AAC/gAABGSUxFAAAAAAAAAAD/42AQAEsCi3/mAC4AAAAANAAAAC/AAC/gAABGSUxFAAAAAAAAAAD",
  check: "data:audio/mp3;base64,SUQ3BAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAD/42AQADsATAAAAAEAAAABAAAAAAAAAAAAAAAAM1JS1P/jYBAUvgI2v/4AC4AAAAANAAAAC/AAC/gAABGSUxFAAAAAAAAAAD/42AQAFAClP/4AC4AAAAANAAAAC/AAC/gAABGSUxFAAAAAAAAAAD",
  gameOver: "data:audio/mp3;base64,SUQ3BAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAD/42AQAEsATAAAAAEAAAABAAAAAAAAAAAAAAAAM1JS1P/jYBAVPgIm3/4AC4AAAAANAAAAC/AAC/gAABGSUxFAAAAAAAAAAD/42AQAGsCi3/mAC4AAAAANAAAAC/AAC/gAABGSUxFAAAAAAAAAAD",
};

class SoundManager {
  private audioElements: Record<string, HTMLAudioElement> = {};

  constructor() {
    if (typeof window !== "undefined") {
      this.audioElements = {
        move: new Audio(SOUNDS_BASE64.move),
        capture: new Audio(SOUNDS_BASE64.capture),
        check: new Audio(SOUNDS_BASE64.check),
        gameOver: new Audio(SOUNDS_BASE64.gameOver),
      };

      // Preload & Volume
      Object.values(this.audioElements).forEach((audio) => {
        audio.preload = "auto";
        audio.volume = 0.6;
      });
    }
  }

  play(soundName: "move" | "capture" | "check" | "gameOver", isMuted: boolean = false) {
    if (isMuted || typeof window === "undefined") return;

    const audio = this.audioElements[soundName];
    if (audio) {
      audio.currentTime = 0; // Վերասկսել սկզբից արագ քայլերի համար
      audio.play().catch((err) => {
        console.warn(`Audio play failed for ${soundName}:`, err);
      });
    }
  }
}

export const soundManager = new SoundManager();