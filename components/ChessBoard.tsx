"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const ReactChessboard = dynamic(
  () => import("react-chessboard").then((mod) => mod.Chessboard),
  { ssr: false }
);

// Dark Luxury ոճի դաշտերի գույներ (մուգ մոխրագույն/ոսկեգույն երանգով)
const customDarkSquareStyle = { backgroundColor: "#262421" };
const customLightSquareStyle = { backgroundColor: "#363431" };

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
  // Պահում ենք առաջին սեղմած վանդակը (օր. "e2")
  const [moveFrom, setMoveFrom] = useState<string | null>(null);

  // Tap-to-Move տրամաբանություն
  const handleSquareClick = (square: string) => {
    if (isSpectator || isGameOver) return;

    // 1. Եթե ոչ մի վանդակ ընտրված չէ, ընտրում ենք սույն վանդակը
    if (!moveFrom) {
      setMoveFrom(square);
      return;
    }

    // 2. Եթե նորից սեղմել է նույն վանդակին, չեղարկում ենք
    if (moveFrom === square) {
      setMoveFrom(null);
      return;
    }

    // 3. Փորձում ենք կատարել քայլը (moveFrom -> square)
    const success = onDrop(moveFrom, square);

    if (success) {
      setMoveFrom(null); // Քայլը հաջողվեց
    } else {
      // Եթե անթույլատրելի քայլ էր, նոր սեղմած վանդակն ենք սարքում առաջնային
      setMoveFrom(square);
    }
  };

  // Drag-and-Drop-ի ժամանակ մաքրում ենք Tap-ի selection-ը
  const handlePieceDrop = (sourceSquare: string, targetSquare: string) => {
    setMoveFrom(null);
    return onDrop(sourceSquare, targetSquare);
  };

  // Ընտրված վանդակի Dark Luxury (ոսկեգույն) styling
  const customSquareStyles = moveFrom
    ? {
        [moveFrom]: {
          backgroundColor: "rgba(212, 175, 55, 0.4)", // Golden highlight
          boxShadow: "inset 0 0 8px #d4af37",
        },
      }
    : {};

  return (
    <div className="w-full max-w-[500px] aspect-square shadow-2xl rounded-xl overflow-hidden border-2 border-amber-500/20 bg-slate-950">
      <ReactChessboard
        id={`chess_board_${gameId}`}
        position={fen}
        onPieceDrop={handlePieceDrop}
        onSquareClick={handleSquareClick}
        boardOrientation={orientation}
        customDarkSquareStyle={customDarkSquareStyle}
        customLightSquareStyle={customLightSquareStyle}
        customSquareStyles={customSquareStyles}
        arePiecesDraggable={!isSpectator && !isGameOver}
        animationDuration={150}
      />
    </div>
  );
}