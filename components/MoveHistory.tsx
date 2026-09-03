"use client";

interface MoveHistoryProps {
  history: string[];
}

export default function MoveHistory({ history }: MoveHistoryProps) {
  // Pair moves into White & Black columns
  const movePairs = history.reduce<{ white: string; black?: string }[]>(
    (acc, move, index) => {
      if (index % 2 === 0) {
        acc.push({ white: move });
      } else {
        acc[acc.length - 1].black = move;
      }
      return acc;
    },
    []
  );

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-4 backdrop-blur-md">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
        <span>📜</span> Move History
      </h3>
      <div className="max-h-48 overflow-y-auto space-y-1 text-xs font-mono pr-2">
        {movePairs.length === 0 ? (
          <p className="text-slate-600 italic">No moves made yet.</p>
        ) : (
          movePairs.map((pair, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center py-1 px-2 rounded bg-slate-950/40 border border-slate-800/50"
            >
              <span className="text-slate-500 w-8">{idx + 1}.</span>
              <span className="text-slate-200 font-semibold flex-1">
                {pair.white}
              </span>
              <span className="text-slate-400 flex-1 text-right">
                {pair.black || "..."}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}