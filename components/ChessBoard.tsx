"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Chess } from "chess.js";

const ReactChessboard = dynamic(
  () => import("react-chessboard").then((mod) => mod.Chessboard),
  { ssr: false }
);

interface ChessboardProps {
  gameId: string;
  fen: string;
  onDrop: (sourceSquare: string, targetSquare: string) => boolean;
  orientation?: "white" | "black";
}

export default function Chessboard({
  gameId,
  fen,
  onDrop,
  orientation = "white",
}: ChessboardProps) {
  const [moveFrom, setMoveFrom] = useState<string | null>(null);
  const [optionSquares, setOptionSquares] = useState<Record<string, any>>({});

  // 1. Հաշվում ենք հնարավոր քայլերը և պատրաստում visual highlight styles
  const getMoveOptions = (square: string) => {
    const game = new Chess(fen);
    const moves = game.moves({ square: square as any, verbose: true });

    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares: Record<string, any> = {};

    moves.forEach((move) => {
      newSquares[move.to] = {
        background:
          game.get(move.to as any) &&
          game.get(move.to as any)?.color !== game.get(square as any)?.color
            ? "radial-gradient(circle, rgba(212,175,55,0.85) 85%, transparent 85%)"
            : "radial-gradient(circle, rgba(212,175,55,0.65) 25%, transparent 25%)",
        borderRadius: "50%",
      };
    });

    newSquares[square] = {
      backgroundColor: "rgba(212, 175, 55, 0.4)",
    };

    setOptionSquares(newSquares);
    return true;
  };

  // 2. Click / Tap logic
  const handleSquareClick = (square: string) => {
    // Եթե դեռ ոչ մի ֆիգուր ընտրված չէ
    if (!moveFrom) {
      const hasMoves = getMoveOptions(square);
      if (hasMoves) {
        setMoveFrom(square);
      }
      return;
    }

    // Եթե սեղմում ենք նույն վանդակին -> չեղարկել
    if (moveFrom === square) {
      setMoveFrom(null);
      setOptionSquares({});
      return;
    }

    // Փորձում ենք քայլ անել Click-ով
    const moveSuccess = onDrop(moveFrom, square);

    if (moveSuccess) {
      setMoveFrom(null);
      setOptionSquares({});
    } else {
      // Եթե քայլը չանցավ, բայց սեղմել ենք մեր ուրիշ ֆիգուրի վրա -> ընտրել նոր ֆիգուրը
      const hasMoves = getMoveOptions(square);
      if (hasMoves) {
        setMoveFrom(square);
      } else {
        setMoveFrom(null);
        setOptionSquares({});
      }
    }
  };

  // 3. Drag and Drop logic
  const handlePieceDrop = (sourceSquare: string, targetSquare: string) => {
    const success = onDrop(sourceSquare, targetSquare);
    setMoveFrom(null);
    setOptionSquares({});
    return success;
  };

  return (
    <div className="w-full max-w-[500px] aspect-square shadow-2xl rounded-xl overflow-hidden bg-slate-950">
      <ReactChessboard
        id={`chess_board_${gameId}`}
        position={fen}
        boardOrientation={orientation}
        onPieceDrop={handlePieceDrop}
        onSquareClick={handleSquareClick}
        customSquareStyles={optionSquares}
        customDarkSquareStyle={{ backgroundColor: "#262421" }}
        customLightSquareStyle={{ backgroundColor: "#363431" }}
        animationDuration={200}
      />
    </div>
  );
}