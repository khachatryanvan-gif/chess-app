import React, { useState } from 'react';

export default function LandingPage({ onLogin, onGuestSpectate, activeGames = [] }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({ email, password, username, isRegister });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-mono relative overflow-hidden">
      
      {/* Background Neon Ambient Glows */}
      <div className="fixed -top-20 -left-20 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed -bottom-20 -right-20 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container Grid */}
      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* LEFT COLUMN: AUTHENTICATION FORM (Cols: 6) */}
        <div className="lg:col-span-6 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.6)]">
          
          {/* Header */}
          <div className="mb-6 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-3 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Cyber Chess
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100">
              {isRegister ? 'Ստեղծել Հաշիվ' : 'Բարի Գալուստ'}
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              {isRegister ? 'Գրանցվիր խաղալու և ռեյտինգդ բարձրացնելու համար' : 'Մուտք գործիր քո հաշիվ խաղը շարունակելու համար'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Մականուն (Username)</label>
                <input
                  type="text"
                  required
                  placeholder="Grandmaster_99"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Էլ․ հասցե (Email)</label>
              <input
                type="email"
                required
                placeholder="player@chess.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Գաղտնաբառ (Password)</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition"
            >
              {isRegister ? 'Գրանցվել' : 'Մուտք Գործել'}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
            {isRegister ? (
              <p>
                Արդեն ունե՞ս հաշիվ։{' '}
                <button onClick={() => setIsRegister(false)} className="text-cyan-400 hover:underline font-bold">
                  Մուտք
                </button>
              </p>
            ) : (
              <p>
                Չունե՞ս հաշիվ։{' '}
                <button onClick={() => setIsRegister(true)} className="text-cyan-400 hover:underline font-bold">
                  Գրանցվել
                </button>
              </p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: GUEST SPECTATE & LIVE PREVIEW (Cols: 6) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-lg flex flex-col h-[400px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Ընթացիկ Խաղեր (Live Arena)
                </h3>
              </div>
              <span className="text-[10px] text-slate-500">Հյուրերի Ռեժիմ</span>
            </div>

            {/* Games List for Guests */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {activeGames.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
                  <span className="text-3xl">♟️</span>
                  <p className="text-xs">Այս պահին ակտիվ խաղեր չկան։<br />Մուտք գործիր առաջինը սկսելու համար։</p>
                </div>
              ) : (
                activeGames.map((game) => (
                  <div
                    key={game.id}
                    className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-lg">⚔️</div>
                      <div>
                        <div className="text-xs font-semibold text-slate-200">
                          {game.whitePlayer} vs {game.blackPlayer}
                        </div>
                        <div className="text-[10px] text-slate-500">Time: {game.timeControl}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => onGuestSpectate(game.id)}
                      className="py-1.5 px-3 rounded-lg bg-slate-800 text-slate-200 hover:bg-cyan-500 hover:text-slate-950 text-xs font-bold transition"
                    >
                      👁️ Դիտել
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Guest Notice */}
            <div className="mt-4 pt-3 border-t border-slate-800/60 text-center">
              <p className="text-[11px] text-slate-500">
                * Հյուրերը կարող են միայն դիտել խաղերը։ Խաղալու համար անհրաժեշտ է մուտք գործել։
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}