"use client";

import LiveChat from "@/components/LiveChat";
import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Chess } from "chess.js";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import Lobby, { Challenge } from "@/components/Lobby";
import ChessClock from "@/components/ChessClock";
import MoveHistory from "@/components/MoveHistory";
import DepositModal from "@/components/DepositModal";
import { soundEffects } from "@/lib/sounds";

const Chessboard = dynamic(
  () => import("react-chessboard").then((mod) => mod.Chessboard),
  { ssr: false }
);

const BOARD_THEMES = {
  green: { dark: "#769656", light: "#eeeed2" },
  wood: { dark: "#b58863", light: "#f0d9b5" },
  slate: { dark: "#475569", light: "#94a3b8" },
};

interface UserProfile {
  id: string;
  username: string;
  role: string;
  balance: number;
}

const parseTimeControl = (tc: string) => {
  const parts = (tc || "3+0").split("+");
  const base = Number(parts[0]);
  const inc = Number(parts[1]);
  return {
    baseSeconds: (isNaN(base) ? 3 : base) * 60,
    incrementSeconds: isNaN(inc) ? 0 : inc,
  };
};

export default function Home() {
  const [game, setGame] = useState<Chess>(new Chess());
  const [moveList, setMoveList] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"lobby" | "game">("lobby");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Auth Form State
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  // Deposit Modal State
  const [showDepositModal, setShowDepositModal] = useState(false);

  // Game & Lobby State
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [isSpectator, setIsSpectator] = useState<boolean>(false);
  const [userOrientation, setUserOrientation] = useState<"white" | "black">("white");
  const [boardTheme, setBoardTheme] = useState<"green" | "wood" | "slate">("green");

  // Timers State
  const [whiteTime, setWhiteTime] = useState<number>(180);
  const [blackTime, setBlackTime] = useState<number>(180);
  const [increment, setIncrement] = useState<number>(0);
  const [gameStatus, setGameStatus] = useState<string>("waiting");

  // Offer States
  const [drawOfferedBy, setDrawOfferedBy] = useState<string | null>(null);
  const [takebackOfferedBy, setTakebackOfferedBy] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);

  // Reset function
  const resetToLobby = useCallback(() => {
    setActiveTab("lobby");
    setCurrentChallenge(null);
    const newG = new Chess();
    setGame(newG);
    setMoveList([]);
    setGameStatus("waiting");
    setDrawOfferedBy(null);
    setTakebackOfferedBy(null);
  }, []);

  // Fetch Profile
  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(data as UserProfile);
    }
  }, []);

  // Fetch Session
  const fetchSessionAndProfile = useCallback(async () => {
    setLoadingProfile(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      await fetchProfile(session.user.id);
    } else {
      setProfile(null);
    }
    setLoadingProfile(false);
  }, [fetchProfile]);

  useEffect(() => {
    fetchSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile, fetchSessionAndProfile]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (isRegister) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: username || email.split("@")[0] },
        },
      });

      if (error) {
        setAuthError(error.message);
      } else if (data.user) {
        alert("Registration successful!");
        await fetchProfile(data.user.id);
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthError(error.message);
      } else if (data.user) {
        await fetchProfile(data.user.id);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    resetToLobby();
  };

  const handleTimeout = useCallback(
    async (timedOutColor: "w" | "b") => {
      if (gameStatus !== "live") return;

      const winner = timedOutColor === "w" ? "Black" : "White";

      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "game_ended",
          payload: { winner },
        });
      }

      await supabase
        .from("games")
        .update({ status: "completed", winner })
        .eq("id", currentChallenge?.id);

      alert(`⏰ Time's up! ${winner} wins on time!`);
      resetToLobby();
    },
    [gameStatus, currentChallenge?.id, resetToLobby]
  );

  // Realtime Subscriptions & Game State Sync
  useEffect(() => {
    if (!currentChallenge?.id) return;

    const gameId = currentChallenge.id;

    const fetchGame = async () => {
      const { data } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

      if (data) {
        if (data.status === "completed" || data.status === "finished") {
          alert(`🏆 Game Over! Winner: ${data.winner || "Opponent"}`);
          resetToLobby();
          return;
        }

        const newGame = new Chess();
        if (data.pgn) {
          newGame.loadPgn(data.pgn);
        } else if (data.fen) {
          newGame.load(data.fen);
        }
        setGame(newGame);
        setMoveList(newGame.history());
        setWhiteTime(data.white_time ?? 180);
        setBlackTime(data.black_time ?? 180);
        setGameStatus(data.status);

        if (data.white_player && data.black_player) {
          const opp =
            data.white_player === profile?.username
              ? data.black_player
              : data.white_player;
          setCurrentChallenge((prev) =>
            prev ? { ...prev, opponent: opp } : null
          );
        }
      }
    };

    fetchGame();

    const channel = supabase.channel(`game_room_${gameId}`, {
      config: { broadcast: { self: false } },
    });

    channel.on("broadcast", { event: "game_ended" }, (payload) => {
      const winnerName = payload.payload?.winner || "Opponent";
      alert(`🏆 Game Over! Winner: ${winnerName}`);
      resetToLobby();
    });

    channel.on("broadcast", { event: "draw_offer" }, (payload) => {
      setDrawOfferedBy(payload.payload.username);
    });

    channel.on("broadcast", { event: "draw_declined" }, () => {
      alert("Draw offer was declined.");
      setDrawOfferedBy(null);
    });

    channel.on("broadcast", { event: "takeback_offer" }, (payload) => {
      setTakebackOfferedBy(payload.payload.username);
    });

    channel.on("broadcast", { event: "takeback_declined" }, () => {
      alert("Takeback request was declined.");
      setTakebackOfferedBy(null);
    });

    channel.on("broadcast", { event: "takeback_accepted" }, (payload) => {
      const newGame = new Chess();
      if (payload.payload?.pgn) {
        newGame.loadPgn(payload.payload.pgn);
      } else if (payload.payload?.fen) {
        newGame.load(payload.payload.fen);
      }
      setGame(newGame);
      setMoveList(newGame.history());
      setTakebackOfferedBy(null);
    });

    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "games" },
      (payload) => {
        const updatedGame = payload.new as any;
        if (updatedGame && updatedGame.id === gameId) {
          if (
            updatedGame.status === "completed" ||
            updatedGame.status === "finished"
          ) {
            const winnerName = updatedGame.winner || "Opponent";
            alert(`🏆 Game Over! Winner: ${winnerName}`);
            resetToLobby();
            return;
          }

          const newGame = new Chess();
          if (updatedGame.pgn) {
            newGame.loadPgn(updatedGame.pgn);
          } else if (updatedGame.fen) {
            newGame.load(updatedGame.fen);
          }
          setGame(newGame);
          setMoveList(newGame.history());

          if (updatedGame.white_time !== undefined)
            setWhiteTime(updatedGame.white_time);
          if (updatedGame.black_time !== undefined)
            setBlackTime(updatedGame.black_time);
          if (updatedGame.status) setGameStatus(updatedGame.status);

          const opp =
            updatedGame.white_player === profile?.username
              ? updatedGame.black_player
              : updatedGame.white_player;
          setCurrentChallenge((prev) =>
            prev ? { ...prev, opponent: opp } : null
          );
        }

        if (payload.eventType === "DELETE" && (payload.old as any)?.id === gameId) {
          alert("Game was canceled.");
          resetToLobby();
        }
      }
    );

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [currentChallenge?.id, profile?.username, resetToLobby]);

  // Timer Countdown
  useEffect(() => {
    if (gameStatus !== "live" || game.isGameOver()) return;

    const timer = setInterval(() => {
      const turn = game.turn();
      if (turn === "w") {
        setWhiteTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleTimeout("w");
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleTimeout("b");
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus, game, handleTimeout]);

  const handleLeaveGame = async () => {
    if (!currentChallenge?.id || isSpectator) {
      resetToLobby();
      return;
    }

    const gameId = currentChallenge.id;

    if (gameStatus === "waiting") {
      if (confirm("Do you want to cancel this challenge?")) {
        await supabase.from("games").delete().eq("id", gameId);
        resetToLobby();
      }
      return;
    }

    if (gameStatus === "live") {
      if (
        confirm(
          "Are you sure you want to resign/leave? You will lose this match."
        )
      ) {
        const { data: currentGame } = await supabase
          .from("games")
          .select("white_player, black_player")
          .eq("id", gameId)
          .single();

        let winnerName = "Opponent";
        if (currentGame) {
          winnerName =
            currentGame.white_player === profile?.username
              ? currentGame.black_player || "Black"
              : currentGame.white_player || "White";
        }

        if (channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "game_ended",
            payload: { winner: winnerName },
          });
        }

        await supabase
          .from("games")
          .update({
            status: "completed",
            winner: winnerName,
          })
          .eq("id", gameId);

        resetToLobby();
      }
    } else {
      resetToLobby();
    }
  };

  const offerDraw = () => {
    if (!channelRef.current || !profile) return;
    channelRef.current.send({
      type: "broadcast",
      event: "draw_offer",
      payload: { username: profile.username },
    });
    alert("Draw offer sent to opponent.");
  };

  const respondDraw = async (accept: boolean) => {
    if (!channelRef.current) return;
    if (accept) {
      channelRef.current.send({
        type: "broadcast",
        event: "game_ended",
        payload: { winner: "Draw" },
      });

      await supabase
        .from("games")
        .update({ status: "completed", winner: "Draw" })
        .eq("id", currentChallenge?.id);

      alert("🤝 Game ended in a draw!");
      resetToLobby();
    } else {
      channelRef.current.send({
        type: "broadcast",
        event: "draw_declined",
      });
      setDrawOfferedBy(null);
    }
  };

  const requestTakeback = () => {
    if (!channelRef.current || !profile) return;
    channelRef.current.send({
      type: "broadcast",
      event: "takeback_offer",
      payload: { username: profile.username },
    });
    alert("Takeback request sent.");
  };

  const respondTakeback = async (accept: boolean) => {
    if (!channelRef.current) return;
    if (accept) {
      const gameCopy = new Chess();
      gameCopy.loadPgn(game.pgn());

      const undoneMove = gameCopy.undo();

      if (undoneMove) {
        const newFen = gameCopy.fen();
        const newPgn = gameCopy.pgn();

        setGame(gameCopy);
        setMoveList(gameCopy.history());

        await supabase
          .from("games")
          .update({ fen: newFen, pgn: newPgn, turn: gameCopy.turn() })
          .eq("id", currentChallenge?.id);

        channelRef.current.send({
          type: "broadcast",
          event: "takeback_accepted",
          payload: { fen: newFen, pgn: newPgn },
        });
      }
      setTakebackOfferedBy(null);
    } else {
      channelRef.current.send({
        type: "broadcast",
        event: "takeback_declined",
      });
      setTakebackOfferedBy(null);
    }
  };

  // Move Logic with PGN Sync & Sound
  const makeAMove = (move: any): boolean => {
    try {
      const gameCopy = new Chess();
      gameCopy.loadPgn(game.pgn());
      const currentTurn = gameCopy.turn();
      const result = gameCopy.move(move);

      if (result) {
        setGame(gameCopy);
        setMoveList(gameCopy.history());

        if (gameCopy.inCheck()) {
          soundEffects.playCheck();
        } else if (result.captured) {
          soundEffects.playCapture();
        } else {
          soundEffects.playMove();
        }

        const newWhiteTime =
          currentTurn === "w" ? whiteTime + increment : whiteTime;
        const newBlackTime =
          currentTurn === "b" ? blackTime + increment : blackTime;

        supabase
          .from("games")
          .update({
            fen: gameCopy.fen(),
            pgn: gameCopy.pgn(),
            turn: gameCopy.turn(),
            white_time: newWhiteTime,
            black_time: newBlackTime,
            last_move_at: new Date().toISOString(),
          })
          .eq("id", currentChallenge?.id)
          .then(({ error }) => {
            if (error) console.error("Error updating game:", error);
          });

        return true;
      }
    } catch {
      return false;
    }
    return false;
  };

  const onDrop = (sourceSquare: string, targetSquare: string): boolean => {
    if (isSpectator || gameStatus !== "live") return false;

    const turn = game.turn();

    if (turn === "w" && userOrientation !== "white") return false;
    if (turn === "b" && userOrientation !== "black") return false;

    return makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });
  };

  const handleCreateGame = async (
    bet: number,
    timeControl: string,
    color: string,
    theme: string
  ) => {
    if (!profile) {
      alert("You need to log in to create a game.");
      return;
    }

    if (profile.balance < bet) {
      alert("Insufficient balance to place this bet.");
      return;
    }

    const newGame = new Chess();
    const { baseSeconds, incrementSeconds } = parseTimeControl(timeControl);

    let assignedColor = color;
    if (color === "random") {
      assignedColor = Math.random() < 0.5 ? "white" : "black";
    }

    const isCreatorWhite = assignedColor === "white";

    const { data, error } = await supabase
      .from("games")
      .insert([
        {
          white_player: isCreatorWhite ? profile.username : null,
          black_player: isCreatorWhite ? null : profile.username,
          fen: newGame.fen(),
          pgn: newGame.pgn(),
          status: "waiting",
          turn: "w",
          bet,
          time_control: timeControl,
          color: assignedColor,
          theme,
          white_time: baseSeconds,
          black_time: baseSeconds,
        },
      ])
      .select()
      .single();

    if (error) {
      alert("Error creating game: " + (error.message || "Unknown error"));
      return;
    }

    if (data) {
      const challenge: Challenge = {
        id: data.id,
        creator: profile.username,
        rating: 1500,
        bet,
        timeControl,
        status: "waiting",
        theme: theme as any,
      };

      setGame(newGame);
      setMoveList([]);
      setCurrentChallenge(challenge);
      setIsSpectator(false);
      setUserOrientation(isCreatorWhite ? "white" : "black");
      setBoardTheme((theme as any) || "green");
      setWhiteTime(baseSeconds);
      setBlackTime(baseSeconds);
      setIncrement(incrementSeconds);
      setGameStatus("waiting");
      setActiveTab("game");
    }
  };

  const handleJoinGame = async (challenge: Challenge) => {
    if (!profile) {
      alert("You need to log in to join a game.");
      return;
    }

    if (profile.balance < (challenge.bet || 0)) {
      alert("Insufficient balance to join this game.");
      return;
    }

    const { data: existingGame } = await supabase
      .from("games")
      .select("white_player, black_player, theme, time_control, white_time, black_time, pgn, fen")
      .eq("id", challenge.id)
      .single();

    if (!existingGame) return;

    const isWhiteTaken = Boolean(existingGame.white_player);
    const myColor = isWhiteTaken ? "black" : "white";

    const updateData = isWhiteTaken
      ? { black_player: profile.username, status: "live" }
      : { white_player: profile.username, status: "live" };

    const { error } = await supabase
      .from("games")
      .update(updateData)
      .eq("id", challenge.id);

    if (error) {
      alert("Error joining game: " + (error.message || "Unknown error"));
      return;
    }

    const newGame = new Chess();
    if (existingGame.pgn) {
      newGame.loadPgn(existingGame.pgn);
    } else if (existingGame.fen) {
      newGame.load(existingGame.fen);
    }

    setGame(newGame);
    setMoveList(newGame.history());

    const { incrementSeconds } = parseTimeControl(
      existingGame.time_control || "3+0"
    );

    setCurrentChallenge({
      ...challenge,
      status: "live",
      opponent: profile.username,
    });
    setIsSpectator(false);
    setUserOrientation(myColor);
    setBoardTheme((existingGame.theme as any) || "green");
    setWhiteTime(existingGame.white_time || 180);
    setBlackTime(existingGame.black_time || 180);
    setIncrement(incrementSeconds);
    setGameStatus("live");
    setActiveTab("game");
  };

  const handleWatchGame = (challenge: Challenge) => {
    const { incrementSeconds } = parseTimeControl(
      challenge.timeControl || "3+0"
    );
    setCurrentChallenge(challenge);
    setIsSpectator(true);
    setUserOrientation("white");
    setIncrement(incrementSeconds);
    setActiveTab("game");
  };

  const toggleBoardOrientation = () => {
    setUserOrientation((prev) => (prev === "white" ? "black" : "white"));
  };

  const activeTheme = BOARD_THEMES[boardTheme] || BOARD_THEMES.green;

  const backgroundStyle = {
    backgroundImage: `linear-gradient(to bottom, rgba(2, 6, 23, 0.75), rgba(2, 6, 23, 0.85)), url('/bg-chess.png')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundAttachment: "fixed",
  };

  if (loadingProfile) {
    return (
      <main
        style={backgroundStyle}
        className="min-h-screen text-slate-100 flex items-center justify-center font-mono"
      >
        <div className="text-emerald-400 animate-pulse font-bold text-lg">
          Loading...
        </div>
      </main>
    );
  }

  if (!profile && activeTab === "lobby") {
    return (
      <main
        style={backgroundStyle}
        className="min-h-screen text-slate-100 flex flex-col items-center p-4 md:p-8 font-mono relative overflow-hidden"
      >
        <div className="fixed -top-20 -left-20 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="fixed -bottom-20 -right-20 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

        <header className="w-full max-w-6xl flex justify-between items-center pb-6 mb-6 border-b border-slate-800/80 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-xl font-black text-slate-950">♟</span>
            </div>
            <span className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              Chess<span className="text-emerald-400">Bet</span>
            </span>
          </div>
          <span className="text-xs text-slate-400 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            👁️ Spectator Mode
          </span>
        </header>

        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 z-10 items-start">
          <div className="lg:col-span-5 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="mb-6 text-center">
              <h2 className="text-xl sm:text-2xl font-black text-emerald-400 tracking-wide uppercase">
                {isRegister ? "Sign Up" : "Sign In"}
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                {isRegister
                  ? "Create an account to start playing"
                  : "Welcome back! Enter your credentials"}
              </p>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Grandmaster_99"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="player@chess.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:opacity-90 transition active:scale-95 cursor-pointer"
              >
                {isRegister ? "Create Account" : "Log In"}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
              {isRegister ? (
                <p>
                  Already have an account?{" "}
                  <button
                    onClick={() => setIsRegister(false)}
                    className="text-emerald-400 hover:underline font-bold cursor-pointer"
                  >
                    Log In
                  </button>
                </p>
              ) : (
                <p>
                  Don't have an account?{" "}
                  <button
                    onClick={() => setIsRegister(true)}
                    className="text-emerald-400 hover:underline font-bold cursor-pointer"
                  >
                    Sign Up
                  </button>
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-xl">
            <div className="mb-4 flex justify-between items-center bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                🔴 Live Matches (Spectate Only)
              </span>
            </div>

            <Lobby
              readOnly={true}
              onJoinGame={handleJoinGame}
              onWatchGame={handleWatchGame}
              onCreateGame={handleCreateGame}
            />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      style={backgroundStyle}
      className="min-h-screen text-slate-100 flex flex-col items-center p-4 md:p-8 font-mono"
    >
      <header className="w-full max-w-6xl flex justify-between items-center pb-6 mb-8 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-xl font-black text-slate-950">♟</span>
          </div>
          <span className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Chess<span className="text-emerald-400">Bet</span>
          </span>
        </div>

        <div className="flex gap-4 items-center">
          <button
            onClick={() => resetToLobby()}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer backdrop-blur-md ${
              activeTab === "lobby"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            Lobby
          </button>
          {profile ? (
            <div className="flex items-center gap-3">
              <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono text-emerald-400 flex items-center gap-2">
                <span>💰 {profile.balance} USDT</span>
                <button
                  onClick={() => setShowDepositModal(true)}
                  className="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 px-1.5 py-0.5 rounded text-[11px] font-bold cursor-pointer transition"
                >
                  +
                </button>
              </div>
              <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-200">
                👤 {profile.username}
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold rounded-xl text-xs hover:bg-rose-500/20 transition cursor-pointer backdrop-blur-md"
              >
                Log Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveTab("lobby")}
              className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-emerald-400 transition cursor-pointer shadow-md shadow-emerald-500/20"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {activeTab === "lobby" ? (
        <div className="w-full max-w-6xl">
          <Lobby
            readOnly={!profile}
            onJoinGame={handleJoinGame}
            onWatchGame={handleWatchGame}
            onCreateGame={handleCreateGame}
          />
        </div>
      ) : (
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 flex flex-col items-center gap-4">
            <div className="w-full bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex justify-between items-center text-sm font-semibold backdrop-blur-md">
              <div>
                <span className="text-slate-400">Creator: </span>
                <span className="text-emerald-400 font-bold">
                  {currentChallenge?.creator}
                </span>
              </div>
              {isSpectator && (
                <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/30">
                  👁️ Spectating
                </span>
              )}
              <div>
                <span className="text-slate-400">Opponent: </span>
                <span className="text-rose-400 font-bold">
                  {currentChallenge?.opponent || "Waiting..."}
                </span>
              </div>
            </div>

            <ChessClock
              whiteTime={whiteTime}
              blackTime={blackTime}
              activeTurn={game.turn()}
              isGameActive={gameStatus === "live"}
            />

            <div className="w-full flex flex-col gap-2 max-w-[500px]">
              {drawOfferedBy && drawOfferedBy !== profile?.username && (
                <div className="bg-amber-500/20 backdrop-blur-md border border-amber-500/40 p-3 rounded-xl flex items-center justify-between text-xs text-amber-300">
                  <span>🤝 {drawOfferedBy} offers a draw. Accept?</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => respondDraw(true)}
                      className="bg-emerald-500 text-slate-950 font-bold px-2 py-1 rounded hover:bg-emerald-400 cursor-pointer"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => respondDraw(false)}
                      className="bg-rose-500/30 text-rose-300 font-bold px-2 py-1 rounded hover:bg-rose-500/50 cursor-pointer"
                    >
                      No
                    </button>
                  </div>
                </div>
              )}

              {takebackOfferedBy && takebackOfferedBy !== profile?.username && (
                <div className="bg-amber-500/20 backdrop-blur-md border border-amber-500/40 p-3 rounded-xl flex items-center justify-between text-xs text-amber-300">
                  <span>↩️ {takebackOfferedBy} requests a takeback. Accept?</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => respondTakeback(true)}
                      className="bg-emerald-500 text-slate-950 font-bold px-2 py-1 rounded hover:bg-emerald-400 cursor-pointer"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => respondTakeback(false)}
                      className="bg-rose-500/30 text-rose-300 font-bold px-2 py-1 rounded hover:bg-rose-500/50 cursor-pointer"
                    >
                      No
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-between">
                {!isSpectator && gameStatus === "live" && (
                  <>
                    <button
                      onClick={offerDraw}
                      className="flex-1 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer"
                    >
                      🤝 Offer Draw
                    </button>
                    <button
                      onClick={requestTakeback}
                      className="flex-1 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer"
                    >
                      ↩️ Takeback
                    </button>
                  </>
                )}
                <button
                  onClick={toggleBoardOrientation}
                  className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer"
                  title="Flip Board"
                >
                  🔄
                </button>
                <button
                  onClick={handleLeaveGame}
                  className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-bold rounded-xl border border-rose-500/30 transition cursor-pointer"
                >
                  {gameStatus === "live" ? "🏳️ Resign" : "Leave"}
                </button>
              </div>
            </div>

            <div className="w-full max-w-[500px] aspect-square rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
              <Chessboard
                position={game.fen()}
                onPieceDrop={onDrop}
                boardOrientation={userOrientation}
                customDarkSquareStyle={{ backgroundColor: activeTheme.dark }}
                customLightSquareStyle={{ backgroundColor: activeTheme.light }}
              />
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-6 w-full">
            {/* 🔴 Փոխանցվում է moveList state-ը MoveHistory բաղադրիչին 🔴 */}
            <MoveHistory history={moveList} />

            {currentChallenge?.id && (
              <LiveChat
                gameId={currentChallenge.id}
                username={profile?.username || "Guest"}
              />
            )}
          </div>
        </div>
      )}

      {showDepositModal && (
        <DepositModal onClose={() => setShowDepositModal(false)} />
      )}
    </main>
  );
}