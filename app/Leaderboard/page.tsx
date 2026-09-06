"use client";

import { useEffect, useState } from "react";
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
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, rating, balance, avatar_url")
        .order("rating", { ascending: false })
        .limit(50);

      if (!error && data) {
        setUsers(data);
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
            Chess<span className="text-emerald-400">Bet</span> Leaderboard
          </span>
        </div>
        <Link
          href="/"
          className="px-4 py-2 bg-slate-900/80 border border-slate-800 text-emerald-400 rounded-xl text-xs font-bold hover:bg-slate-800 transition backdrop-blur-md"
        >
          ← Back to Game
        </Link>
      </header>

      <div className="w-full max-w-4xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl">
        <h1 className="text-xl font-black text-emerald-400 mb-6 flex items-center gap-2">
          🏆 Top Players by Rating
        </h1>

        {loading ? (
          <div className="text-center py-10 text-slate-400 animate-pulse">
            Loading leaderboard...
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            No players found yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Player</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {users.map((user, index) => (
                  <tr key={user.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-bold text-slate-300">
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                    </td>
                    <td className="py-3 px-4 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>👤</span>
                        )}
                      </div>
                      <span className="font-bold text-slate-100">{user.username}</span>
                    </td>
                    <td className="py-3 px-4 text-amber-400 font-extrabold">
                      ⭐ {user.rating ?? 1500}
                    </td>
                    <td className="py-3 px-4 text-emerald-400 font-semibold">
                      💰 {user.balance} USDT
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}