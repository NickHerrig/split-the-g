import { useLoaderData, useSubmit } from "react-router";
import { type LoaderFunctionArgs } from "react-router";
import { RoboflowLogo } from "../components/RoboflowLogo";
import { type Score } from "~/types/score";
import { supabase } from "~/utils/supabase";
import { LeaderboardButton } from "../components/LeaderboardButton";
import { Link } from "react-router";
import { useState } from "react";
import { EmailForm } from "../components/EmailForm";
import { BuyCreatorsABeer } from "../components/BuyCreatorsABeer";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { splitId } = params;

  // Get the session cookie
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split("; ").map((c) => {
      const [key, ...v] = c.split("=");
      return [key, v.join("=")];
    })
  );
  const sessionId = cookies["split-g-session"];

  // Get the score data
  const { data: score, error } = await supabase
    .from("scores")
    .select("*")
    .eq("id", splitId)
    .single();

  if (error || !score) {
    throw new Response("Score not found", { status: 404 });
  }

  // Calculate date 7 days ago
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Get count of all-time higher scores
  const { count: higherScoresCount, error: higherScoresError } = await supabase
    .from("scores")
    .select("*", { count: "exact", head: true })
    .gt("split_score", score.split_score);

  if (higherScoresError)
    console.error("Error getting higher scores:", higherScoresError);

  // Get count of weekly higher scores
  const { count: weeklyHigherScoresCount, error: weeklyHigherScoresError } =
    await supabase
      .from("scores")
      .select("*", { count: "exact", head: true })
      .gt("split_score", score.split_score)
      .gte("created_at", oneWeekAgo.toISOString());

  if (weeklyHigherScoresError)
    console.error(
      "Error getting weekly higher scores:",
      weeklyHigherScoresError
    );

  // Get total splits (all-time)
  const { count: totalSplits } = await supabase
    .from("scores")
    .select("*", { count: "exact", head: true });

  // Get total splits this week
  const { count: weeklyTotalSplits } = await supabase
    .from("scores")
    .select("*", { count: "exact", head: true })
    .gte("created_at", oneWeekAgo.toISOString());

  const allTimeRank = (higherScoresCount ?? 0) + 1;
  const weeklyRank = (weeklyHigherScoresCount ?? 0) + 1;

  // Check if the user owns this score
  const isOwner = sessionId === score.session_id;

  // Only show email modal if user is the owner and hasn't submitted email or opted out
  const showEmailModal = isOwner && !score.email && !score.email_opted_out;

  return {
    score,
    allTimeRank,
    weeklyRank,
    totalSplits,
    weeklyTotalSplits,
    showEmailModal,
    isOwner,
  };
}

export default function Score() {
  const {
    score,
    allTimeRank,
    weeklyRank,
    totalSplits,
    weeklyTotalSplits,
    showEmailModal,
    isOwner,
  } = useLoaderData<{
    score: Score;
    allTimeRank: number;
    weeklyRank: number;
    totalSplits: number;
    weeklyTotalSplits: number;
    showEmailModal: boolean;
    isOwner: boolean;
  }>();
  const [shareSuccess, setShareSuccess] = useState(false);
  const [isEmailFormVisible, setIsEmailFormVisible] = useState(showEmailModal);
  const [barName, setBarName] = useState(score.bar_name || "");
  const [pourRating, setPourRating] = useState(score.pour_rating || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const submit = useSubmit();

  const handleEmailFormComplete = () => {
    setIsEmailFormVisible(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("scores")
        .update({
          bar_name: barName,
          pour_rating: pourRating ? parseFloat(pourRating) : null,
        })
        .eq("id", score.id);

      if (error) throw error;

      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating score:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreMessage = (score: number) => {
    if (score >= 4.7) return "Sláinte! 🏆 A Perfect Split!";
    if (score >= 3.75) return "Beautiful Split! ⭐ Like a True Dubliner!";
    if (score >= 3.0) return "Cheers for trying! 🍺 Have Another Go!";
    return "The Perfect Split Awaits! 🎓 Try Again!";
  };

  const getShareMessage = () => {
    const scoreUrl = `${window.location.origin}/score/${score.id}`;

    return (
      `🍺 Split G Score: ${score.split_score.toFixed(2)}/5.0\n` +
      `All-Time Rank: #${allTimeRank} of ${totalSplits}\n` +
      `Weekly Rank: #${weeklyRank} of ${weeklyTotalSplits}\n` +
      `Check it out: ${scoreUrl}`
    );
  };

  const handleShare = async () => {
    const shareText = getShareMessage();

    try {
      if (navigator.share) {
        await navigator.share({
          text: shareText,
        });
        setShareSuccess(true);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareText);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const formatLocation = (score: Score) => {
    const parts = [];
    if (score.city) parts.push(score.city);
    if (score.region) parts.push(score.region);
    if (score.country) parts.push(score.country);

    return parts.length > 0 ? parts.join(", ") : "Unknown location";
  };

  return (
    <main className="min-h-screen bg-guinness-black">
      <div className="container mx-auto p-4 md:p-8">
        {/* Logo and Title */}
        <div className="flex flex-col items-center">
          <div className="w-28 md:w-36 text-guinness-gold">
            <RoboflowLogo />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-guinness-gold mt-4">
            Split G Results
          </h1>
        </div>

        {/* Score Card */}
        <div className="mt-8 text-center">
          <div className="mt-4 inline-block bg-guinness-gold/10 rounded-xl p-8 backdrop-blur-sm">
            <div className="flex flex-col items-center">
              <div className="text-xl text-guinness-tan mb-2">
                {score.username || "Anonymous Pourer"}
              </div>
              <div className="text-sm text-guinness-tan/80 mb-4">
                {formatLocation(score)}
              </div>
              <div className="text-lg text-guinness-tan/80 mb-4 flex flex-col gap-1">
                <div>
                  All-Time: #{allTimeRank} of {totalSplits}
                </div>
                <div>
                  This Week: #{weeklyRank} of {weeklyTotalSplits}
                </div>
              </div>
              <div className="text-6xl md:text-7xl font-bold text-guinness-gold mb-2">
                {score.split_score.toFixed(2)}
              </div>
              <div className="text-xl md:text-2xl text-guinness-tan/80 mb-3">
                out of 5.0
              </div>
              <div className="text-lg md:text-xl text-guinness-tan mt-2 max-w-md">
                {getScoreMessage(score.split_score)}
              </div>
            </div>
          </div>
        </div>

        {/* Bar Name and Pour Rating Form */}
        {isOwner && (
          <div className="mt-8 max-w-md mx-auto">
            {score.bar_name && score.pour_rating ? (
              // Show submitted values
              <div className="bg-guinness-gold/10 rounded-xl p-6 backdrop-blur-sm border border-guinness-gold/20">
                <h2 className="text-xl font-bold text-guinness-gold mb-4">
                  Your Rating
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-guinness-tan mb-1">
                      Bar Name
                    </label>
                    <div className="w-full px-4 py-2 bg-guinness-black/50 border border-guinness-gold/20 rounded-lg text-guinness-tan">
                      {score.bar_name}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-guinness-tan mb-1">
                      Pour Rating
                    </label>
                    <div className="w-full px-4 py-2 bg-guinness-black/50 border border-guinness-gold/20 rounded-lg text-guinness-tan">
                      {score.pour_rating.toFixed(2)}/5.00
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Show form for submission
              <form
                onSubmit={handleSubmit}
                className="bg-guinness-gold/10 rounded-xl p-6 backdrop-blur-sm border border-guinness-gold/20"
              >
                <h2 className="text-xl font-bold text-guinness-gold mb-4">
                  Rate The Pour
                </h2>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="barName"
                      className="block text-sm font-medium text-guinness-tan mb-1"
                    >
                      Bar Name
                    </label>
                    <input
                      type="text"
                      id="barName"
                      value={barName}
                      onChange={(e) => setBarName(e.target.value)}
                      className="w-full px-4 py-2 bg-guinness-black/50 border border-guinness-gold/20 rounded-lg text-guinness-tan focus:outline-none focus:border-guinness-gold"
                      placeholder="Enter bar name"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="pourRating"
                      className="block text-sm font-medium text-guinness-tan mb-1"
                    >
                      Pour Rating (0.00-5.00)
                    </label>
                    <input
                      type="number"
                      id="pourRating"
                      value={pourRating}
                      onChange={(e) => setPourRating(e.target.value)}
                      min="0"
                      max="5"
                      step="0.01"
                      className="w-full px-4 py-2 bg-guinness-black/50 border border-guinness-gold/20 rounded-lg text-guinness-tan focus:outline-none focus:border-guinness-gold"
                      placeholder="Enter rating (0-5)"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 bg-guinness-gold text-guinness-black rounded-lg font-medium hover:bg-guinness-tan transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Saving..." : "Save Rating"}
                  </button>
                  {submitSuccess && (
                    <p className="text-guinness-gold text-center">
                      Rating saved successfully!
                    </p>
                  )}
                </div>
              </form>
            )}
          </div>
        )}

        {/* Image Comparison */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {/* Split Analysis */}
          <div className="bg-guinness-gold/5 rounded-lg p-4">
            <h2 className="text-lg font-bold text-guinness-gold mb-2">
              Your Split G
            </h2>
            <div className="aspect-square bg-guinness-black rounded-lg overflow-hidden">
              {score.split_image_url ? (
                <img
                  src={score.split_image_url}
                  alt="Split analysis"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-guinness-tan">
                  No image available
                </div>
              )}
            </div>
          </div>

          {/* Original Pour */}
          <div className="bg-guinness-gold/5 rounded-lg p-4">
            <h2 className="text-lg font-bold text-guinness-gold mb-2">
              Original Pour
            </h2>
            <div className="aspect-square bg-guinness-black rounded-lg overflow-hidden">
              {score.pint_image_url ? (
                <img
                  src={score.pint_image_url}
                  alt="Original pour"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-guinness-tan">
                  No image available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Buy Creators a Beer button here - just after the images */}
        <div className="flex justify-center mt-6 mb-8">
          <div className="text-center">
            <p className="text-guinness-tan mb-3">Enjoying Split the G?</p>
            <BuyCreatorsABeer />
          </div>
        </div>

        {/* Email Form */}
        <EmailForm
          scoreId={score.id}
          show={isEmailFormVisible}
          onComplete={handleEmailFormComplete}
        />

        {/* Action Buttons */}
        <div className="mt-12 flex flex-col items-center gap-4 md:flex-row md:justify-center md:gap-6">
          <button
            onClick={handleShare}
            className="w-64 px-8 py-4 bg-guinness-gold/20 text-guinness-gold rounded-full font-bold 
                     hover:bg-guinness-gold/30 active:bg-guinness-gold/40 
                     transition-all duration-300 text-lg
                     flex items-center justify-center gap-2"
          >
            {shareSuccess ? (
              <>
                <span>Copied!</span>
                <span className="text-xl">📋</span>
              </>
            ) : (
              <>
                <span>Share Score</span>
                <span className="text-xl">🍺</span>
              </>
            )}
          </button>

          <Link
            to="/"
            className="w-64 px-8 py-4 bg-guinness-gold text-guinness-black rounded-full font-bold 
                     hover:bg-guinness-tan active:bg-guinness-tan/90
                     transition-all duration-300 text-lg
                     flex items-center justify-center gap-2"
          >
            <span>Try Again</span>
            <span className="text-xl">🎯</span>
          </Link>

          <div className="w-64">
            <LeaderboardButton
              className="w-full px-8 py-4 bg-guinness-gold/10 text-guinness-tan rounded-full font-bold 
                        hover:bg-guinness-gold/20 active:bg-guinness-gold/30
                        transition-all duration-300 text-lg
                        flex items-center justify-center gap-2"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
