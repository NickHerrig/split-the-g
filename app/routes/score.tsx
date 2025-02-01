import { useLoaderData } from "react-router";
import { type LoaderFunctionArgs } from "react-router";
import { RoboflowLogo } from "../components/RoboflowLogo";
import { type Score } from "~/types/score";
import { supabase } from "~/utils/supabase";
import { LeaderboardButton } from "../components/LeaderboardButton";
import { Link } from "react-router";
import { useState } from "react";
import { EmailForm } from '../components/EmailForm';

export async function loader({ params }: LoaderFunctionArgs) {
  const { splitId } = params;

  // Get the initial score data
  const { data: score, error } = await supabase
    .from('scores')
    .select('*')
    .eq('id', splitId)
    .single();

  if (error || !score) {
    throw new Response("Score not found", { status: 404 });
  }

  // Get scores that are higher than the current score
  const { data: higherScores } = await supabase
    .from('scores')
    .select('split_score')
    .gt('split_score', score.split_score);

  const actualRank = (higherScores?.length ?? 0) + 1;

  // Get total splits
  const { count: totalSplits } = await supabase
    .from('scores')
    .select('*', { count: 'exact', head: true });

  // Simplified email modal visibility check - only based on database values
  const showEmailModal = !score.email && !score.email_opted_out;

  return { score, rank: actualRank, totalSplits, showEmailModal };
}

export default function Score() {
  const { score, rank, totalSplits, showEmailModal } = useLoaderData<{ 
    score: Score; 
    rank: number;
    totalSplits: number;
    showEmailModal: boolean;
  }>();
  const [shareSuccess, setShareSuccess] = useState(false);
  const [isEmailFormVisible, setIsEmailFormVisible] = useState(showEmailModal);

  const handleEmailFormComplete = () => {
    setIsEmailFormVisible(false);
  };

  const getScoreMessage = (score: number) => {
    if (score >= 4.70) return "Sláinte! 🏆 A Perfect Split!";
    if (score >= 3.75) return "Beautiful Split! ⭐ Like a True Dubliner!";
    if (score >= 3.0) return "Cheers for trying! 🍺 Have Another Go!";
    return "The Perfect Split Awaits! 🎓 Try Again!";
  };

  const getShareMessage = () => {
    const scoreUrl = `${window.location.origin}/score/${score.id}`;
    
    return `🍺 Split G Score: ${score.split_score.toFixed(2)}/5.0\n` +
           `Rank: #${rank} of ${totalSplits}\n` +
           `Check it out: ${scoreUrl}`;
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
      console.error('Error sharing:', error);
    }
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
                {score.username || 'Anonymous Pourer'}
              </div>
              <div className="text-lg text-guinness-tan/80 mb-4">
                Rank #{rank} of {totalSplits} Splits
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

        {/* Image Comparison */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {/* Split Analysis */}
          <div className="bg-guinness-gold/5 rounded-lg p-4">
            <h2 className="text-lg font-bold text-guinness-gold mb-2">Your Split G</h2>
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
            <h2 className="text-lg font-bold text-guinness-gold mb-2">Your Pint</h2>
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