import { type LoaderFunction } from "react-router";
import { useLoaderData, Link } from "react-router";
import { supabase } from "~/utils/supabase";
import { CountryLeaderboardButton } from "../components/CountryLeaderboard";
import { SubmissionsButton } from "../components/SubmissionsButton";

type LeaderboardEntry = {
  id: string;
  username: string;
  split_score: number;
  created_at: string;
  split_image_url: string;
};

export const loader: LoaderFunction = async () => {
  // Calculate date 7 days ago
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const { data, error } = await supabase
    .from("scores")
    .select(
      `
      id,
      username,
      split_score,
      created_at,
      split_image_url
    `
    )
    .gte("created_at", oneWeekAgo.toISOString())
    .order("split_score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(15);

  if (error) throw error;

  return { entries: data };
};

export default function Leaderboard() {
  const { entries } = useLoaderData<{ entries: LeaderboardEntry[] }>();

  return (
    <main className="min-h-screen bg-guinness-black py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-guinness-gold mb-4">
            Top Splits This Week
          </h1>
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 w-full mb-4">
            <CountryLeaderboardButton />
            <SubmissionsButton />
          </div>
          <Link
            to="/"
            className="text-guinness-gold hover:text-guinness-tan transition-colors inline-block"
          >
            ← Back to Split
          </Link>
        </div>

        <div className="max-w-3xl mx-auto">
          {entries.map((entry, index) => (
            <Link
              key={entry.id}
              to={`/score/${entry.id}`}
              className="block mb-4 bg-guinness-gold/10 rounded-lg hover:bg-guinness-gold/20 transition-colors"
            >
              <div className="flex items-center p-4">
                <div className="text-2xl font-bold text-guinness-gold w-12">
                  #{index + 1}
                </div>

                <div className="w-16 h-16 rounded-lg overflow-hidden bg-guinness-black/50 mr-4">
                  <img
                    src={entry.split_image_url}
                    alt={`Split by ${entry.username}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="flex-grow">
                  <div className="text-lg font-semibold text-guinness-tan">
                    {entry.username}
                  </div>
                  <div className="text-sm text-guinness-tan/60">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="text-2xl font-bold text-guinness-gold ml-4">
                  {entry.split_score.toFixed(2)}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-guinness-gold/10 hover:bg-guinness-gold/20 text-guinness-gold border border-guinness-gold/20 rounded-lg transition-colors"
          >
            Back to Split
          </Link>
        </div>
      </div>
    </main>
  );
}
