"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface Challenge {
  id: string;
  creator: string;
  rating: number;
  bet: number;
  timeControl: string;
  status: "waiting" | "live";
  opponent?: string;
  color?: "white" | "black" | "random";
  theme?: "green" | "wood" | "slate";
}

interface LobbyProps {
  readOnly?: boolean; // 👈 Ավելացվել է readOnly prop-ը
  onJoinGame: (challenge: Challenge) => void;
  onWatchGame: (challenge: Challenge) => void;
  onCreateGame: (
    bet: number,
    timeControl: string,
    color: string,
    theme: string
  ) => void;
}

export default function Lobby({
  readOnly = false, // 👈 Լռելյայն false է
  onJoinGame,
  onWatchGame,
  onCreateGame,
}: LobbyProps) {
  const [bet, setBet] = useState<number>(10);
  const [timeControl, setTimeControl] = useState<string>("3+2");
  const [color, setColor] = useState<string>("random");
  const [theme, setTheme] = useState<string>("green");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchGames = async () => {
    // Եթե readOnly է՝ վերցնում ենք "live" խաղերը, հակառակ դեպքում "waiting" խաղերը
    const targetStatus = readOnly ? "live" : "waiting";

    const { data, error } = await supabase
      .from("games")
      .select("*")
      .eq("status", targetStatus)
      .order("created_at", { ascending: false });

    if (data && !error) {
      const formatted: Challenge[] = data.map((game: any) => ({
        id: game.id,
        creator: game.white_player || game.black_player || "Anonymous",
        opponent:
          game.white_player && game.black_player
            ? game.white_player === (game.white_player || "Anonymous")
              ? game.black_player
              : game.white_player
            : game.black_player || game.white_player,
        rating: 1500,
        bet: game.bet || 10,
        timeControl: game.time_control || "3+2",
        status: game.status,
        color: game.color || "random",
        theme: game.theme || "green",
      }));
      setChallenges(formatted);
    }
  };

  useEffect(() => {
    fetchGames();

    const channel = supabase
      .channel("lobby_games")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games" },
        () => {
          fetchGames();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [readOnly]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    onCreateGame(bet, timeControl, color, theme);
    setIsModalOpen(false);
  };

  return (
    <div className="w-full max-w-4xl flex flex-col gap-6 font-mono">
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-slate-100">♟️ Game Lobby</h2>
          <p className="text-xs text-slate-400">
            {readOnly
              ? "Watch ongoing live chess matches"
              : "Create or join an existing chess game"}
          </p>
        </div>

        {/* Կոճակը երևում է միայն գրանցված (ոչ readOnly) օգտատերերի համար */}
        {!readOnly && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2.5 rounded-xl transition cursor-pointer shadow-lg shadow-emerald-500/10 text-sm"
          >
            + Create Challenge
          </button>
        )}
      </div>

      {/* Modal - Ցուցադրվում է միայն երբ readOnly չէ */}
      {!readOnly && isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-100">
                ⚡ New Game Settings
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Wager (USDT)
                </label>
                <input
                  type="number"
                  value={bet}
                  onChange={(e) => setBet(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  min={1}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Time Control
                </label>
                <select
                  value={timeControl}
                  onChange={(e) => setTimeControl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="1+0">1 min (Bullet)</option>
                  <option value="3+2">3+2 min (Blitz)</option>
                  <option value="5+3">5+3 min (Blitz)</option>
                  <option value="10+0">10 min (Rapid)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Play As (Piece Color)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "white", label: "⚪ White" },
                    { id: "random", label: "🎲 Random" },
                    { id: "black", label: "🖤 Black" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setColor(item.id)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        color === item.id
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Board Style
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "green", label: "🎨 Green" },
                    { id: "wood", label: "🌲 Wood" },
                    { id: "slate", label: "🌌 Slate" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTheme(item.id)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        theme === item.id
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-sm transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl text-sm transition cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Challenge List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            {readOnly ? "🔴 Live Matches" : "Open Challenges"} ({challenges.length})
          </h3>
        </div>

        {challenges.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            {readOnly
              ? "Այս պահին ակտիվ խաղեր չկան։"
              : "No active challenges available. Create one to start!"}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {challenges.map((item) => (
              <div
                key={item.id}
                className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-emerald-400">
                    🏆
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200 text-sm">
                        {item.creator}
                      </span>
                      {item.opponent && (
                        <span className="text-xs text-slate-400">
                          vs{" "}
                          <span className="text-rose-400 font-bold">
                            {item.opponent}
                          </span>
                        </span>
                      )}
                      <span className="text-xs text-slate-500 font-mono">
                        ({item.rating})
                      </span>
                    </div>
                    <div className="flex gap-3 text-xs text-slate-400 mt-1">
                      <span>⏱️ {item.timeControl}</span>
                      <span>💰 {item.bet} USDT</span>
                      <span className="capitalize">
                        {item.theme === "wood"
                          ? "🌲 Wood"
                          : item.theme === "slate"
                          ? "🌌 Slate"
                          : "🎨 Green"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Կոճակների տրամաբանությունը */}
                <div className="flex items-center gap-3">
                  {readOnly ? (
                    <button
                      onClick={() => onWatchGame(item)}
                      className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                    >
                      👁️ Watch
                    </button>
                  ) : (
                    <button
                      onClick={() => onJoinGame(item)}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                    >
                      Play
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}