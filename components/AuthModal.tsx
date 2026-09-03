"use client";

import { useState } from "react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (username: string) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    
    // Այստեղ հետագայում կմիացվի Backend API-ն (Auth request)
    onSuccess(username);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
        
        {/* Փակելու կոճակ */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition text-lg font-bold"
        >
          ✕
        </button>

        {/* Վերնագիր / Switcher */}
        <div className="flex border-b border-slate-800 pb-3 mb-6 gap-6">
          <button
            onClick={() => setMode("login")}
            className={`text-lg font-bold transition ${
              mode === "login" ? "text-emerald-400 border-b-2 border-emerald-400 pb-1" : "text-slate-400"
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => setMode("register")}
            className={`text-lg font-bold transition ${
              mode === "register" ? "text-emerald-400 border-b-2 border-emerald-400 pb-1" : "text-slate-400"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Ֆորմա */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Username
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ChessMaster"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 transition text-sm"
            />
          </div>

          {mode === "register" && (
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="player@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 transition text-sm"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 transition text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3 rounded-xl transition shadow-lg shadow-emerald-500/20 text-base mt-2"
          >
            {mode === "login" ? "Log In" : "Create Account"}
          </button>
        </form>

        {/* Տեքստ ներքևում */}
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-500">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <span
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-emerald-400 cursor-pointer hover:underline font-semibold"
            >
              {mode === "login" ? "Sign Up" : "Log In"}
            </span>
          </p>
        </div>

      </div>
    </div>
  );
}