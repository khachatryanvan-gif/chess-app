"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface UserProfile {
  id: string;
  username: string;
  role: string;
  balance: number;
  rating?: number;
  email?: string;
}

export default function AdminDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newBalance, setNewBalance] = useState<number>(0);

  // 1. Ստուգում ենք՝ արդյո՞ք մուտք գործած օգտատերը Admin է
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (data) {
        setProfile(data as UserProfile);
        if (data.role === "admin") {
          fetchUsers();
        }
      }
      setLoading(false);
    };

    checkAdmin();
  }, []);

  // 2. Բեռնում ենք բոլոր օգտատերերի ցուցակը
  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setUsers(data as UserProfile[]);
    }
  };

  // 3. Թարմացնում ենք օգտատիրոջ հաշվեկշիռը (Balance)
  const handleUpdateBalance = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ balance: newBalance })
      .eq("id", userId);

    if (!error) {
      alert("Balance updated successfully!");
      setEditingUser(null);
      fetchUsers();
    } else {
      alert("Error updating balance: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-mono">
        <div className="text-emerald-400 animate-pulse font-bold">Checking Admin Access...</div>
      </div>
    );
  }

  if (!profile || profile.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-mono p-4">
        <h1 className="text-3xl font-black text-rose-500 mb-2">403 - Access Denied</h1>
        <p className="text-slate-400 text-sm mb-6">You do not have administrator permissions.</p>
        <Link href="/" className="px-4 py-2 bg-slate-800 text-slate-200 rounded-xl font-bold hover:bg-slate-700 transition">
          Return to Lobby
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-mono">
      <header className="flex justify-between items-center pb-6 mb-8 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-emerald-400">⚙️ ChessBet Admin Panel</h1>
          <p className="text-xs text-slate-400 mt-1">Logged in as: {profile.username} ({profile.role})</p>
        </div>
        <Link href="/" className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-800 transition">
          ← Back to Game
        </Link>
      </header>

      {/* Users Management Section */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
          <span>👥 User Management</span>
          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
            {users.length} Users
          </span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase">
                <th className="p-3">Username</th>
                <th className="p-3">Role</th>
                <th className="p-3">Rating</th>
                <th className="p-3">Balance (USDT)</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                  <td className="p-3 font-bold text-slate-200">{u.username}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-400'}`}>
                      {u.role || 'user'}
                    </span>
                  </td>
                  <td className="p-3 text-amber-400 font-bold">⭐ {u.rating ?? 1500}</td>
                  <td className="p-3 text-emerald-400 font-bold">{u.balance} USDT</td>
                  <td className="p-3">
                    <button
                      onClick={() => {
                        setEditingUser(u);
                        setNewBalance(u.balance);
                      }}
                      className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-lg font-bold hover:bg-emerald-500/30 transition"
                    >
                      Edit Balance
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Edit Balance Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-2">Edit Balance for {editingUser.username}</h3>
            <p className="text-xs text-slate-400 mb-4">Current Balance: {editingUser.balance} USDT</p>

            <input
              type="number"
              value={newBalance}
              onChange={(e) => setNewBalance(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm mb-4 focus:outline-none focus:border-emerald-500"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateBalance(editingUser.id)}
                className="px-4 py-2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl hover:bg-emerald-400 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}