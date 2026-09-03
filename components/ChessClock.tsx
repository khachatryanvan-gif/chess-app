"use client";

interface ChessClockProps {
  whiteTime: number; // վայրկյաններով
  blackTime: number; // վայրկյաններով
  activeTurn: "w" | "b";
  isGameActive: boolean;
}

export default function ChessClock({
  whiteTime,
  blackTime,
  activeTurn,
  isGameActive,
}: ChessClockProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.max(0, seconds) % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="w-full max-w-[500px] flex justify-between items-center gap-4 my-2">
      {/* White Clock */}
      <div
        className={`flex-1 p-3 rounded-xl border transition-all flex flex-col items-center justify-center ${
          activeTurn === "w" && isGameActive
            ? "bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/10"
            : "bg-slate-900 border-slate-800 opacity-80"
        }`}
      >
        <span className="text-xs font-bold text-slate-400">⚪ White Clock</span>
        <span
          className={`text-2xl font-mono font-black ${
            whiteTime <= 10 ? "text-rose-500 animate-pulse" : "text-slate-100"
          }`}
        >
          {formatTime(whiteTime)}
        </span>
      </div>

      {/* Black Clock */}
      <div
        className={`flex-1 p-3 rounded-xl border transition-all flex flex-col items-center justify-center ${
          activeTurn === "b" && isGameActive
            ? "bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/10"
            : "bg-slate-900 border-slate-800 opacity-80"
        }`}
      >
        <span className="text-xs font-bold text-slate-400">🖤 Black Clock</span>
        <span
          className={`text-2xl font-mono font-black ${
            blackTime <= 10 ? "text-rose-500 animate-pulse" : "text-slate-100"
          }`}
        >
          {formatTime(blackTime)}
        </span>
      </div>
    </div>
  );
}