"use client";

import { useState } from "react";

interface DepositModalProps {
  userId?: string;
  username?: string;
  onClose: () => void;
}

export default function DepositModal({
  userId,
  username,
  onClose,
}: DepositModalProps) {
  const [copied, setCopied] = useState(false);
  const walletAddress = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"; // Ձեր USDT հասցեն

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn font-mono">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition w-8 h-8 rounded-lg bg-slate-800/50 hover:bg-slate-800 flex items-center justify-center cursor-pointer"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">
            💰
          </div>
          <h2 className="text-xl font-black text-slate-100 tracking-wide uppercase">
            Deposit Funds
          </h2>
          {username && (
            <p className="text-slate-400 text-xs mt-1">
              Account: <span className="text-emerald-400">{username}</span>
            </p>
          )}
        </div>

        {/* Payment Network Info */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 mb-4">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-slate-400">Asset</span>
            <span className="text-emerald-400 font-bold">USDT (BEP20 / TRC20)</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Min Deposit</span>
            <span className="text-slate-200 font-bold">5.00 USDT</span>
          </div>
        </div>

        {/* QR Code Placeholder */}
        <div className="flex justify-center mb-4">
          <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-200">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${walletAddress}`}
              alt="Deposit QR Code"
              className="w-32 h-32"
            />
          </div>
        </div>

        {/* Wallet Address Copy */}
        <div className="mb-6">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
            Deposit Address
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={walletAddress}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono focus:outline-none select-all"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer shrink-0 shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              {copied ? "Copied! ✓" : "Copy"}
            </button>
          </div>
        </div>

        {/* Important Notice */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300/90 text-center leading-relaxed">
          ⚠️ Send only USDT to this address. Credits will appear automatically after network confirmation.
        </div>

        {/* Close Action */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
}