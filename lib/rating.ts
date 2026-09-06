// lib/rating.ts
export function calculateRating(winnerRating: number, loserRating: number, k = 32) {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));

  const newWinnerRating = Math.round(winnerRating + k * (1 - expectedWinner));
  const newLoserRating = Math.max(100, Math.round(loserRating + k * (0 - expectedLoser)));

  return {
    winnerNewRating: newWinnerRating,
    loserNewRating: newLoserRating,
  };
}