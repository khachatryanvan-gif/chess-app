// components/MoveHistory.tsx
"use client";

import { useEffect, useRef } from "react";

interface MoveHistoryProps {
  history: string[];
}

export default function MoveHistory({ history }: MoveHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  // Զույգերով խմբավորում ենք (1. e4 e5)
  const movesPairs = [];
  for (let i = 0; i < history.length; i += 2) {
    movesPairs.push({
      number: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1] || "",
    });
  }

  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-3 flex flex-col h-48">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pb-1 border-b border-slate-800 flex justify-between">
        <span>📜 Move History</span>
        <span>{history.length} moves</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1 pr-1 font-mono text-xs">
        {movesPairs.length === 0 ? (
          <div className="text-slate-600 text-center py-4">No moves yet</div>
        ) : (
          movesPairs.map((pair) => (
            <div key={pair.number} className="grid grid-cols-12 gap-1 py-0.5 px-2 rounded hover:bg-slate-800/50">
              <span className="col-span-2 text-slate-500">{pair.number}.</span>
              <span className="col-span-5 text-slate-200 font-semibold">{pair.white}</span>
              <span className="col-span-5 text-slate-400">{pair.black}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}