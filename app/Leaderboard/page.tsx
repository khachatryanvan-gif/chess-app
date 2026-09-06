"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface LeaderboardUser {
  id: string;
  username: string;
  rating: number;
  balance: number;
  avatar_url?: string;
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, rating, balance, avatar_url")
        .order("rating", { ascending: false })
        .limit(50);

      if (!error && data) {
        setUsers(data as LeaderboardUser[]);
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  const backgroundStyle = {
    backgroundImage: `linear-gradient(to bottom, rgba(2, 6, 23, 0.75), rgba(2, 6, 23, 0.85)), url('/bg-chess.png')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundAttachment: "fixed",
  };

  return (
    <main
      style={backgroundStyle}
      className="min-h-screen text-slate-100 flex flex-col items-center p-4 md:p-8 font-mono"
    >
      <header className="w-full max-w-4xl flex justify-between items-center pb-6 mb-8 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-xl font-black text-slate-950">♟</span>
          </div>
          <span className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Chess<span className="text-emerald-400">Bet</span>
          </span>
        </div>

        <Link
          href="/"
          className="px-4 py-2 bg-slate-900/80 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-800 transition flex items-center gap-2 backdrop-blur-md"
        >
          ← Back to Game
        </Link>
      </header>

      <div className="w-full max-w-4xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-emerald-400 tracking-wide uppercase flex items-center gap-2">
              🏆 Leaderboard
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Top players ranked by Elo rating
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs animate-pulse">
            Loading rankings...
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No players found yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Rank</th>
                  <th className="py-3 px-4 font-semibold">Player</th>
                  <th className="py-3 px-4 font-semibold text-right">Rating</th>
                  <th className="py-3 px-4 font-semibold text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {users.map((user, index) => {
                  const rank = index + 1;
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3.5 px-4 font-bold">
                        {rank === 1 ? (
                          <span className="text-amber-400">🥇 1</span>
                        ) : rank === 2 ? (
                          <span className="text-slate-300">🥈 2</span>
                        ) : rank === 3 ? (
                          <span className="text-amber-600">🥉 3</span>
                        ) : (
                          <span className="text-slate-500">#{rank}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px]">👤</span>
                          )}
                        </div>
                        <span className="text-slate-200">{user.username}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-amber-400">
                        ⭐ {user.rating ?? 1500}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-emerald-400">
                        💰 {user.balance ?? 0} USDT
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}