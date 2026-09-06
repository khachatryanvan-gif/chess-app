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
  is_blocked?: boolean;
}

interface AnnouncementSettings {
  enabled: boolean;
  message: string;
  type: "info" | "warning" | "success" | "danger";
}

interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  wallet_address: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  profiles?: {
    username: string;
    balance: number;
  };
}

interface Game {
  id: string;
  white_player_id: string;
  black_player_id?: string;
  bet_amount: number;
  status: "waiting" | "in_progress" | "completed" | "draw" | "cancelled";
  winner_id?: string;
  created_at: string;
  white_profile?: { username: string };
  black_profile?: { username: string };
  winner_profile?: { username: string };
}

export default function AdminDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newBalance, setNewBalance] = useState<number>(0);
  const [newRating, setNewRating] = useState<number>(1500);

  // Announcement State
  const [announcement, setAnnouncement] = useState<AnnouncementSettings>({
    enabled: true,
    message: "",
    type: "info",
  });
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  // Withdrawals State
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Games State
  const [games, setGames] = useState<Game[]>([]);
  const [gameFilter, setGameFilter] = useState<"all" | "active" | "completed">("all");

  useEffect(() => {
    const checkAdminAndFetch = async () => {
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
          fetchAnnouncement();
          fetchWithdrawals();
          fetchGames();
        }
      }
      setLoading(false);
    };

    checkAdminAndFetch();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setUsers(data as UserProfile[]);
  };

  const fetchAnnouncement = async () => {
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "announcement")
      .single();

    if (data?.value) {
      setAnnouncement(data.value as AnnouncementSettings);
    }
  };

  const fetchWithdrawals = async () => {
    const { data } = await supabase
      .from("withdrawals")
      .select("*, profiles(username, balance)")
      .order("created_at", { ascending: false });

    if (data) {
      setWithdrawals(data as any);
    }
  };

  const fetchGames = async () => {
    try {
      // Նախ փորձում ենք վերցնել խաղերը պարզ եղանակով, առանց խիստ ֆորին քեյեր կախվածության
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching games:", error.message);
        return;
      }

      if (data) {
        // Լրացուցիչ քաշում ենք profiles-ները, որպեսզի անունները ճիշտ ցույց տանք
        const { data: profilesData } = await supabase.from("profiles").select("id, username");
        const profileMap = new Map();
        if (profilesData) {
          profilesData.forEach((p: any) => profileMap.set(p.id, p.username));
        }

        const enrichedGames = data.map((g: any) => ({
          ...g,
          white_profile: { username: profileMap.get(g.white_player_id) || "Unknown" },
          black_profile: { username: profileMap.get(g.black_player_id) || (g.status === "waiting" ? "Waiting..." : "Unknown") },
          winner_profile: { username: profileMap.get(g.winner_id) || "" },
        }));

        setGames(enrichedGames);
      }
    } catch (err) {
      console.error("Unexpected error in fetchGames:", err);
    }
  };

  const handleSaveAnnouncement = async () => {
    setSavingAnnouncement(true);
    const { error } = await supabase.from("settings").upsert({
      key: "announcement",
      value: announcement,
      updated_at: new Date().toISOString(),
    });

    setSavingAnnouncement(false);
    if (!error) {
      alert("Banner/Announcement updated successfully!");
    } else {
      alert("Error saving announcement: " + error.message);
    }
  };

  const handleToggleRole = async (targetUser: UserProfile) => {
    const newRole = targetUser.role === "admin" ? "user" : "admin";
    if (!confirm(`Are you sure you want to change ${targetUser.username}'s role to ${newRole}?`)) return;

    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", targetUser.id);

    if (!error) {
      alert(`Role changed to ${newRole}!`);
      fetchUsers();
    } else {
      alert("Error changing role: " + error.message);
    }
  };

  const handleToggleBlock = async (targetUser: UserProfile) => {
    const nextStatus = !targetUser.is_blocked;
    const actionName = nextStatus ? "block" : "unblock";
    if (!confirm(`Are you sure you want to ${actionName} ${targetUser.username}?`)) return;

    const { error } = await supabase
      .from("profiles")
      .update({ is_blocked: nextStatus })
      .eq("id", targetUser.id);

    if (!error) {
      alert(`User ${actionName}ed successfully!`);
      fetchUsers();
    } else {
      alert(`Error trying to ${actionName} user: ` + error.message);
    }
  };

  const handleDeleteUser = async (targetUser: UserProfile) => {
    if (!confirm(`⚠️ DANGER: Are you sure you want to delete profile for ${targetUser.username}? This cannot be undone.`)) return;

    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", targetUser.id);

    if (!error) {
      alert("User profile deleted!");
      fetchUsers();
    } else {
      alert("Error deleting user: " + error.message);
    }
  };

  const handleSaveUserDetails = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ 
        balance: newBalance,
        rating: newRating
      })
      .eq("id", userId);

    if (!error) {
      alert("User details updated successfully!");
      setEditingUser(null);
      fetchUsers();
    } else {
      alert("Error updating user details: " + error.message);
    }
  };

  const handleProcessWithdrawal = async (
    request: WithdrawalRequest,
    newStatus: "approved" | "rejected"
  ) => {
    setProcessingId(request.id);

    try {
      const { error: updateError } = await supabase
        .from("withdrawals")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", request.id);

      if (updateError) throw updateError;

      if (newStatus === "rejected") {
        const currentBalance = request.profiles?.balance ?? 0;
        const { error: refundError } = await supabase
          .from("profiles")
          .update({ balance: currentBalance + request.amount })
          .eq("id", request.user_id);

        if (refundError) throw refundError;
      }

      alert(`Withdrawal request ${newStatus}!`);
      fetchWithdrawals();
      fetchUsers();
    } catch (err: any) {
      alert("Error processing withdrawal: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelGame = async (game: Game) => {
    if (!confirm("Are you sure you want to cancel this game?")) return;

    try {
      const { error } = await supabase
        .from("games")
        .update({ status: "cancelled" })
        .eq("id", game.id);

      if (error) throw error;

      alert("Game cancelled successfully!");
      fetchGames();
    } catch (err: any) {
      alert("Error cancelling game: " + err.message);
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

  const pendingWithdrawalsCount = withdrawals.filter((w) => w.status === "pending").length;

  const filteredGames = games.filter((g) => {
    if (gameFilter === "active") return g.status === "in_progress" || g.status === "waiting";
    if (gameFilter === "completed") return g.status === "completed" || g.status === "draw";
    return true;
  });

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

      {/* Top Grid: Banner & Withdrawals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Banner/Announcement Management */}
        <section className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
              <span>📢 Announcement Banner</span>
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-slate-300">Show Banner on Site</span>
                <input
                  type="checkbox"
                  checked={announcement.enabled}
                  onChange={(e) => setAnnouncement({ ...announcement, enabled: e.target.checked })}
                  className="w-5 h-5 accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Banner Type / Style</label>
                <select
                  value={announcement.type}
                  onChange={(e) => setAnnouncement({ ...announcement, type: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs p-3 rounded-xl focus:outline-none focus:border-emerald-500"
                >
                  <option value="info">🔵 Info (Blue)</option>
                  <option value="success">🟢 Success / Promo (Green)</option>
                  <option value="warning">🟡 Warning / Alert (Yellow)</option>
                  <option value="danger">🔴 Critical Alert (Red)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Banner Text / Message</label>
                <textarea
                  rows={3}
                  value={announcement.message}
                  onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
                  placeholder="Enter banner message..."
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs p-3 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveAnnouncement}
            disabled={savingAnnouncement}
            className="w-full mt-6 py-3 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 transition disabled:opacity-50 text-xs"
          >
            {savingAnnouncement ? "Saving..." : "Save Banner Settings"}
          </button>
        </section>

        {/* Withdrawal Requests Section */}
        <section className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
            <span>💸 Withdrawal Requests</span>
            {pendingWithdrawalsCount > 0 && (
              <span className="text-xs bg-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/30 animate-pulse">
                {pendingWithdrawalsCount} Pending
              </span>
            )}
          </h2>

          <div className="overflow-x-auto max-h-[320px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase sticky top-0 bg-slate-900">
                  <th className="p-3">User</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Wallet Address</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-500">
                      No withdrawal requests found.
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                      <td className="p-3 font-bold text-slate-200">
                        {w.profiles?.username || "Unknown"}
                      </td>
                      <td className="p-3 text-amber-400 font-bold">{w.amount} USDT</td>
                      <td className="p-3 font-mono text-[11px] text-slate-400 select-all">
                        {w.wallet_address}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            w.status === "approved"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : w.status === "rejected"
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {w.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {w.status === "pending" ? (
                          <div className="flex gap-2">
                            <button
                              disabled={processingId === w.id}
                              onClick={() => handleProcessWithdrawal(w, "approved")}
                              className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-lg font-bold hover:bg-emerald-500/30 transition disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              disabled={processingId === w.id}
                              onClick={() => handleProcessWithdrawal(w, "rejected")}
                              className="px-2.5 py-1 bg-rose-500/20 border border-rose-500/40 text-rose-400 rounded-lg font-bold hover:bg-rose-500/30 transition disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Games Monitoring */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <span>♟️ Games Monitoring</span>
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              {games.length} Total
            </span>
          </h2>

          <div className="flex gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setGameFilter("all")}
              className={`px-3 py-1 rounded-lg font-bold transition ${gameFilter === "all" ? "bg-slate-800 text-emerald-400" : "text-slate-400"}`}
            >
              All
            </button>
            <button
              onClick={() => setGameFilter("active")}
              className={`px-3 py-1 rounded-lg font-bold transition ${gameFilter === "active" ? "bg-slate-800 text-emerald-400" : "text-slate-400"}`}
            >
              Active
            </button>
            <button
              onClick={() => setGameFilter("completed")}
              className={`px-3 py-1 rounded-lg font-bold transition ${gameFilter === "completed" ? "bg-slate-800 text-emerald-400" : "text-slate-400"}`}
            >
              Completed
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[350px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase sticky top-0 bg-slate-900">
                <th className="p-3">White ⚪</th>
                <th className="p-3">Black 👤</th>
                <th className="p-3">Bet (USDT)</th>
                <th className="p-3">Status</th>
                <th className="p-3">Winner</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGames.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500">
                    No games found in the database.
                  </td>
                </tr>
              ) : (
                filteredGames.map((g) => (
                  <tr key={g.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                    <td className="p-3 font-bold text-slate-200">
                      {g.white_profile?.username || "Unknown"}
                    </td>
                    <td className="p-3 font-bold text-slate-300">
                      {g.black_profile?.username || "Waiting..."}
                    </td>
                    <td className="p-3 text-emerald-400 font-bold">{g.bet_amount} USDT</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          g.status === "in_progress"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse"
                            : g.status === "completed"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : g.status === "cancelled"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {g.status}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-amber-400">
                      {g.winner_profile?.username || (g.status === "draw" ? "Draw 🤝" : "-")}
                    </td>
                    <td className="p-3">
                      {(g.status === "in_progress" || g.status === "waiting") && (
                        <button
                          onClick={() => handleCancelGame(g)}
                          className="px-2.5 py-1 bg-rose-500/20 border border-rose-500/40 text-rose-400 rounded-lg font-bold hover:bg-rose-500/30 transition"
                        >
                          Cancel Game
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* User Management Section */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
          <span>👥 Advanced User Management</span>
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
                <th className="p-3">Status</th>
                <th className="p-3">Rating</th>
                <th className="p-3">Balance</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                  <td className="p-3 font-bold text-slate-200">{u.username}</td>
                  <td className="p-3">
                    <button
                      onClick={() => handleToggleRole(u)}
                      title="Click to toggle role"
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase cursor-pointer hover:opacity-80 transition ${
                        u.role === "admin"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {u.role || "user"} 🔄
                    </button>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.is_blocked
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {u.is_blocked ? "Blocked 🚫" : "Active ✅"}
                    </span>
                  </td>
                  <td className="p-3 text-amber-400 font-bold">⭐ {u.rating ?? 1500}</td>
                  <td className="p-3 text-emerald-400 font-bold">{u.balance} USDT</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingUser(u);
                          setNewBalance(u.balance);
                          setNewRating(u.rating ?? 1500);
                        }}
                        className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-lg font-bold hover:bg-emerald-500/30 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleBlock(u)}
                        className={`px-2.5 py-1 border rounded-lg font-bold transition ${
                          u.is_blocked
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30"
                            : "bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30"
                        }`}
                      >
                        {u.is_blocked ? "Unblock" : "Block"}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u)}
                        className="px-2.5 py-1 bg-rose-500/20 border border-rose-500/40 text-rose-400 rounded-lg font-bold hover:bg-rose-500/30 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-4">Edit Profile: {editingUser.username}</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Balance (USDT)</label>
                <input
                  type="number"
                  value={newBalance}
                  onChange={(e) => setNewBalance(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Chess Rating (Elo)</label>
                <input
                  type="number"
                  value={newRating}
                  onChange={(e) => setNewRating(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveUserDetails(editingUser.id)}
                className="px-4 py-2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl hover:bg-emerald-400 transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}