"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Chess, Square } from "chess.js";

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

interface Premove {
  from: string;
  to: string;
}

export default function Chessboard({
  gameId,
  fen,
  onDrop,
  orientation = "white",
}: ChessboardProps) {
  // 1. Premove-ների ցուցակը (array)
  const [premoves, setPremoves] = useState<Premove[]>([]);
  
  // 2. Local FEN՝ տախտակի վրա premove-ները visual ցույց տալու համար
  const [displayFen, setDisplayFen] = useState<string>(fen);

  const premovesRef = useRef<Premove[]>([]);
  const onDropRef = useRef(onDrop);

  useEffect(() => {
    onDropRef.current = onDrop;
  }, [onDrop]);

  // Սինխրոնացնում ենք Ref-ը State-ի հետ
  const updatePremoves = (newPremoves: Premove[]) => {
    premovesRef.current = newPremoves;
    setPremoves(newPremoves);
  };

  // 3. Երբ սերվերից/parent-ից նոր FEN է գալիս (մրցակիցը քայլ արեց)
  useEffect(() => {
    const game = new Chess(fen);
    const isMyTurn =
      (orientation === "white" && game.turn() === "w") ||
      (orientation === "black" && game.turn() === "b");

    if (isMyTurn && premovesRef.current.length > 0) {
      const currentPremoves = [...premovesRef.current];
      const nextMove = currentPremoves.shift(); // Վերցնում ենք առաջին premove-ը

      if (nextMove) {
        // Ստուգում ենք՝ արդյոք առաջին premove-ն օրինական է նոր FEN-ի վրա
        const tempGame = new Chess(fen);
        try {
          const legal = tempGame.move({
            from: nextMove.from,
            to: nextMove.to,
            promotion: "q",
          });

          if (legal) {
            // Կատարում ենք քայլը
            onDropRef.current(nextMove.from, nextMove.to);
            
            // Մնացած premove-ները թարմացնում ենք local visual FEN-ի համար
            updatePremoves(currentPremoves);
            recalculateDisplayFen(tempGame.fen(), currentPremoves);
          } else {
            // Եթե առաջին premove-ն անօրինական դարձավ -> մաքրում ենք բոլոր premove-ները
            clearPremoves(fen);
          }
        } catch {
          clearPremoves(fen);
        }
      }
    } else if (premovesRef.current.length === 0) {
      setDisplayFen(fen);
    }
  }, [fen, orientation]);

  // Հաշվարկում է local FEN-ը բոլոր premove-ները կիրառելուց հետո
  const recalculateDisplayFen = (baseFen: string, premoveList: Premove[]) => {
    const tempGame = new Chess(baseFen);
    for (const move of premoveList) {
      const piece = tempGame.get(move.from as Square);
      if (piece) {
        tempGame.remove(move.from as Square);
        tempGame.put(piece, move.to as Square);
      }
    }
    setDisplayFen(tempGame.fen());
  };

  const clearPremoves = (resetFen?: string) => {
    updatePremoves([]);
    setDisplayFen(resetFen || fen);
  };

  // 4. Drag & Drop / Premove ավելացնելու տրամաբանություն
  const handlePieceDrop = (source: string, target: string): boolean => {
    const realGame = new Chess(fen);
    const isMyTurn =
      (orientation === "white" && realGame.turn() === "w") ||
      (orientation === "black" && realGame.turn() === "b");

    // --- PREMOVE LOGIC (Երբ մեր հերթը չէ) ---
    if (!isMyTurn) {
      const tempGame = new Chess(displayFen);
      const piece = tempGame.get(source as Square);

      // Ստուգում ենք, որ տեղափոխվող ֆիգուրը մեր գույնի է
      const isMyPiece =
        piece &&
        ((orientation === "white" && piece.color === "w") ||
          (orientation === "black" && piece.color === "b"));

      if (isMyPiece) {
        // Վիզուալ փոխում ենք local FEN-ը
        tempGame.remove(source as Square);
        tempGame.put(piece, target as Square);

        const newPremoves = [...premovesRef.current, { from: source, to: target }];
        updatePremoves(newPremoves);
        setDisplayFen(tempGame.fen());
      }
      return true;
    }

    // --- NORMAL MOVE LOGIC (Երբ մեր հերթն է) ---
    clearPremoves();
    return onDrop(source, target);
  };

  // 5. Աջ կտտոցով ԲՈԼՈՐ premove-ների չեղարկում
  const handleSquareRightClick = () => {
    clearPremoves(fen);
  };

  // 6. Highlight բոլոր premove-ների համար (կարմիր)
  const getCustomSquareStyles = () => {
    const styles: Record<string, any> = {};

    premoves.forEach((pm) => {
      styles[pm.from] = {
        backgroundColor: "rgba(235, 97, 80, 0.65)",
        borderRadius: "4px",
      };
      styles[pm.to] = {
        backgroundColor: "rgba(235, 97, 80, 0.85)",
        borderRadius: "4px",
      };
    });

    return styles;
  };

  return (
    <div className="w-full max-w-[500px] aspect-square shadow-2xl rounded-xl overflow-hidden bg-slate-950 relative">
      <ReactChessboard
        id={`chess_board_${gameId}`}
        position={displayFen}
        boardOrientation={orientation}
        onPieceDrop={handlePieceDrop}
        onSquareRightClick={handleSquareRightClick}
        customSquareStyles={getCustomSquareStyles()}
        customDarkSquareStyle={{ backgroundColor: "#262421" }}
        customLightSquareStyle={{ backgroundColor: "#363431" }}
        animationDuration={150}
        arePiecesDraggable={true}
      />
    </div>
  );
}