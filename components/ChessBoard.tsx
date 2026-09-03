"use client";

import dynamic from "next/dynamic";

// Կանխում ենք SSR (Server-Side Rendering) խնդիրները react-chessboard-ի համար
const ReactChessboard = dynamic(
  () => import("react-chessboard").then((mod) => mod.Chessboard),
  { ssr: false }
);

// Կանաչ և սպիտակ դաշտերի հաստատուն գույներ (չեն թարթում re-render-ի ժամանակ)
const customDarkSquareStyle = { backgroundColor: "#769656" };
const customLightSquareStyle = { backgroundColor: "#eeeed2" };

interface ChessboardProps {
  gameId: string;
  fen: string;
  onDrop: (sourceSquare: string, targetSquare: string) => boolean;
  orientation?: "white" | "black";
  isSpectator?: boolean;
  isGameOver?: boolean;
}

export default function Chessboard({
  gameId,
  fen,
  onDrop,
  orientation = "white",
  isSpectator = false,
  isGameOver = false,
}: ChessboardProps) {
  return (
    <div className="w-full max-w-[500px] aspect-square shadow-2xl rounded-xl overflow-hidden border-2 border-slate-800 bg-slate-900">
      <ReactChessboard
        id={`chess_board_${gameId}`}
        position={fen}
        onPieceDrop={onDrop}
        boardOrientation={orientation}
        customDarkSquareStyle={customDarkSquareStyle}
        customLightSquareStyle={customLightSquareStyle}
        arePiecesDraggable={!isSpectator && !isGameOver}
        animationDuration={150}
      />
    </div>
  );
}