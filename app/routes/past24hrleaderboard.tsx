import { type LoaderFunction } from "react-router";
import { useLoaderData, Link } from "react-router";
import { supabase } from "~/utils/supabase";
import { AllTimeCountryLeaderboardButton } from "~/components/AllTimeCountryLeaderboardButton";

type CountryStats = {
  country: string;
  country_code: string;
  submission_count: number;
  average_score: number;
  created_at: string;
};

export const loader: LoaderFunction = async () => {
  const { data, error } = await supabase
    .from("scores")
    .select("country, country_code, split_score")
    .not("country", "is", null)
    .gte(
      "created_at",
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    );

  if (error) throw error;

  // Group the data by country
  const countryStats = data.reduce((acc: any, curr) => {
    if (!acc[curr.country]) {
      acc[curr.country] = {
        country: curr.country,
        country_code: curr.country_code,
        submission_count: 0,
        total_score: 0,
      };
    }
    acc[curr.country].submission_count += 1;
    acc[curr.country].total_score += curr.split_score || 0;
    return acc;
  }, {});

  // Convert to array and calculate averages
  const submissions = Object.values(countryStats)
    .map((stat: any) => ({
      ...stat,
      average_score: stat.total_score / stat.submission_count,
    }))
    .sort((a: any, b: any) => b.submission_count - a.submission_count);

  return { submissions };
};

function getCountryFlag(countryCode: string) {
  // Convert country code to regional indicator symbols
  // Each letter is converted to an emoji letter by adding 127397 to its UTF-16 code
  if (!countryCode) return "";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export default function Collage() {
  const { submissions } = useLoaderData<{ submissions: CountryStats[] }>();

  return (
    <main className="min-h-screen bg-guinness-black py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-guinness-gold mb-4">
            The World's Largest Split the G Contest
          </h1>
          <Link
            to="/"
            className="text-guinness-gold hover:text-guinness-tan transition-colors inline-block"
          >
            ← Back to Split
          </Link>
        </div>
        <div className="flex justify-center gap-4 mb-8">
          <AllTimeCountryLeaderboardButton />
        </div>
        <div className="max-w-4xl mx-auto">
          <p className="text-2xl font-bold text-guinness-gold mb-4">
            Past 24 Hour Splits By Country
          </p>
          <div className="bg-guinness-gold/10 rounded-lg overflow-hidden">
            <div className="grid grid-cols-4 gap-4 p-4 text-guinness-gold font-bold border-b border-guinness-gold/20">
              <div>Rank</div>
              <div>Country</div>
              <div className="text-right">Submissions</div>
              <div className="text-right">Avg Score</div>
            </div>
            {submissions.map((stat, index) => (
              <div
                key={stat.country}
                className="grid grid-cols-4 gap-4 p-4 text-guinness-tan hover:bg-guinness-gold/5 transition-colors border-b border-guinness-gold/10 last:border-0"
              >
                <div className="text-guinness-gold">#{index + 1}</div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {getCountryFlag(stat.country_code)}
                  </span>
                  <span>{stat.country}</span>
                </div>
                <div className="text-right">{stat.submission_count}</div>
                <div className="text-right">
                  {stat.average_score.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
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
