"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function LeaderboardPage() {
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, rating, balance")
        .order("rating", { ascending: false })
        .limit(50);

      if (data) {
        setTopUsers(data);
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-mono">
      <header className="flex justify-between items-center pb-6 mb-8 border-b border-slate-800">
        <h1 className="text-2xl font-black text-emerald-400">🏆 Leaderboard (Top Players)</h1>
        <Link href="/" className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-800 transition">
          ← Back to Lobby
        </Link>
      </header>

      <div className="max-w-3xl mx-auto bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        {loading ? (
          <div className="text-center text-emerald-400 py-8 animate-pulse">Loading rankings...</div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase">
                <th className="p-3">Rank</th>
                <th className="p-3">Username</th>
                <th className="p-3">Rating (Elo)</th>
                <th className="p-3">Balance</th>
              </tr>
            </thead>
            <tbody>
              {topUsers.map((user, index) => (
                <tr key={user.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                  <td className="p-3 font-bold text-amber-400">
                    {index === 0 ? "🥇 1" : index === 1 ? "🥈 2" : index === 2 ? "🥉 3" : `#${index + 1}`}
                  </td>
                  <td className="p-3 font-bold text-slate-200">{user.username}</td>
                  <td className="p-3 text-emerald-400 font-bold">⭐ {user.rating ?? 1500}</td>
                  <td className="p-3 text-slate-300">{user.balance} USDT</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}