// lib/gameActions.ts
import { supabase } from "@/lib/supabase";
import { calculateRating } from "@/lib/rating";

export async function finishGame(gameId: string, winnerId: string, loserId: string) {
  try {
    const { data: winnerProfile } = await supabase
      .from("profiles")
      .select("rating")
      .eq("id", winnerId)
      .single();

    const { data: loserProfile } = await supabase
      .from("profiles")
      .select("rating")
      .eq("id", loserId)
      .single();

    const currentWinnerRating = winnerProfile?.rating ?? 1500;
    const currentLoserRating = loserProfile?.rating ?? 1500;

    const { winnerNewRating, loserNewRating } = calculateRating(
      currentWinnerRating,
      currentLoserRating
    );

    await supabase
      .from("profiles")
      .update({ rating: winnerNewRating })
      .eq("id", winnerId);

    await supabase
      .from("profiles")
      .update({ rating: loserNewRating })
      .eq("id", loserId);

    const { error: gameError } = await supabase
      .from("games")
      .update({ 
        status: "completed", 
        winner_id: winnerId 
      })
      .eq("id", gameId);

    if (gameError) throw gameError;
  } catch (err) {
    console.error("Error finishing game and updating ratings:", err);
  }
}