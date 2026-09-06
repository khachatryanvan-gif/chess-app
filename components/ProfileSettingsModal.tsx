"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface ProfileSettingsModalProps {
  profile: {
    id: string;
    username: string;
    email?: string;
    avatar_url?: string;
    balance: number;
    rating?: number;
    created_at?: string;
  } | null;
  onClose: () => void;
  onProfileUpdated: () => void;
}

export default function ProfileSettingsModal({
  profile,
  onClose,
  onProfileUpdated,
}: ProfileSettingsModalProps) {
  const [username, setUsername] = useState(profile?.username || "");
  const [email, setEmail] = useState(profile?.email || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Username & Avatar Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    setMessage(null);

    const { error } = await supabase
      .from("profiles")
      .update({
        username: username.trim(),
        avatar_url: avatarUrl.trim(),
      })
      .eq("id", profile.id);

    setLoading(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Profile updated successfully!" });
      onProfileUpdated();
    }
  };

  // Email Update (Supabase Auth)
  const handleUpdateEmail = async () => {
    if (!email) return;
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({ email });

    setLoading(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({
        type: "success",
        text: "Confirmation link sent to your new email!",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 font-mono">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
          ⚙️ Profile Settings
        </h2>

        {/* Dynamic Status Message */}
        {message && (
          <div
            className={`p-3 rounded-xl mb-4 text-xs font-bold border ${
              message.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* 1. PROFILE INFO STATS */}
        <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 block">Rating:</span>
            <span className="text-amber-400 font-extrabold text-sm">
              ⭐ {profile?.rating ?? 1500}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Balance:</span>
            <span className="text-emerald-400 font-extrabold text-sm">
              💰 {profile?.balance ?? 0} USDT
            </span>
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          {/* Avatar Preview & URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">
              Avatar Image URL
            </label>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl">👤</span>
                )}
              </div>
              <input
                type="url"
                placeholder="https://example.com/avatar.png"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Email Update Section */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Email Address
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition"
              />
              <button
                type="button"
                onClick={handleUpdateEmail}
                disabled={loading}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition shrink-0"
              >
                Change Email
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 flex justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-md shadow-emerald-500/20"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}