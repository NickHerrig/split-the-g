import { type LoaderFunction } from "react-router";
import { useLoaderData, Link } from "react-router";
import { supabase } from "~/utils/supabase";
import { CountryLeaderboardButton } from "../components/CountryLeaderboard";
import { LeaderboardButton } from "../components/LeaderboardButton";

type Submission = {
  id: string;
  username: string;
  split_image_url: string;
  pint_image_url: string;
  created_at: string;
  city?: string;
  region?: string;
  country?: string;
  country_code?: string;
  split_score: number;
};

export const loader: LoaderFunction = async () => {
  const { data, error } = await supabase
    .from("scores")
    .select(
      `
      id,
      username,
      split_image_url,
      pint_image_url,
      created_at,
      city,
      region,
      country,
      country_code,
      split_score
    `
    )
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) throw error;

  return { submissions: data };
};

export default function Collage() {
  const { submissions } = useLoaderData<{ submissions: Submission[] }>();

  const formatLocation = (submission: Submission) => {
    const parts = [];
    if (submission.city) parts.push(submission.city);
    if (submission.region) parts.push(submission.region);
    if (submission.country_code) parts.push(submission.country_code);

    return parts.length > 0 ? parts.join(", ") : "";
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="min-h-screen bg-guinness-black py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-guinness-gold mb-4">
            The World's Largest Split the G Contest
          </h1>
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 w-full mb-4">
            <CountryLeaderboardButton />
            <LeaderboardButton />
          </div>
          <Link
            to="/"
            className="text-guinness-gold hover:text-guinness-tan transition-colors inline-block"
          >
            ← Back to Split
          </Link>
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 max-w-[2000px] mx-auto">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="block bg-guinness-gold/10 rounded-lg p-3 mb-4 break-inside-avoid"
            >
              <div>
                <div className="rounded-lg overflow-hidden bg-guinness-black/50 aspect-[3/4]">
                  <img
                    src={submission.pint_image_url}
                    alt={`Pint by ${submission.username}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="bg-guinness-black/80 p-3 mt-2 rounded-lg backdrop-blur-sm">
                  <div className="text-lg font-semibold text-guinness-tan flex justify-between items-center">
                    <span>{submission.username}</span>
                    <span className="text-guinness-gold">
                      {submission.split_score.toFixed(2)}/5.0
                    </span>
                  </div>
                  <div className="text-sm text-guinness-tan/60">
                    {formatDateTime(submission.created_at)}
                  </div>
                  {formatLocation(submission) && (
                    <div className="text-xs text-guinness-tan/40 mt-1">
                      📍 {formatLocation(submission)}
                    </div>
                  )}
                </div>
              </div>
            </div>
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
