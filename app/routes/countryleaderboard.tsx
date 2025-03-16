import { type LoaderFunction } from "react-router";
import { useLoaderData, Link } from "react-router";
import { supabase } from "~/utils/supabase";
import { LeaderboardNavigation } from "~/components/LeaderboardNavigation";

type CountryStats = {
  country: string;
  country_code: string;
  submission_count: number;
  average_score: number;
};

export const loader: LoaderFunction = async () => {
  const { data, error } = await supabase
    .from("scores")
    .select("country, country_code, split_score")
    .not("country", "is", null);

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
    <main className="min-h-screen bg-guinness-black py-4 md:py-8">
      <div className="container mx-auto px-2 md:px-4">
        <div className="text-center mb-4 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-guinness-gold mb-4">
            The World's Largest Split the G Contest
          </h1>
          <Link
            to="/"
            className="text-guinness-gold hover:text-guinness-tan transition-colors inline-block"
          >
            ← Back to Split
          </Link>
        </div>
        <div className="flex justify-center gap-4 mb-4 md:mb-8">
          <LeaderboardNavigation activePage="alltime" />
        </div>
        <div className="max-w-4xl mx-auto">
          <p className="text-xl md:text-2xl font-bold text-guinness-gold mb-4 px-2 md:px-4">
            All Time Splits By Country
          </p>
          <div className="bg-guinness-gold/10 rounded-lg overflow-hidden">
            <div className="grid grid-cols-12 gap-1 md:gap-4 p-2 md:p-4 text-guinness-gold font-bold border-b border-guinness-gold/20 text-xs md:text-base">
              <div className="col-span-1">#</div>
              <div className="col-span-5">Country</div>
              <div className="col-span-3 text-right">Splits</div>
              <div className="col-span-3 text-right">Avg</div>
            </div>
            {submissions.map((stat, index) => (
              <div
                key={stat.country}
                className="grid grid-cols-12 gap-1 md:gap-4 p-2 md:p-4 text-guinness-tan hover:bg-guinness-gold/5 transition-colors border-b border-guinness-gold/10 last:border-0 text-xs md:text-base"
              >
                <div className="col-span-1 text-guinness-gold">
                  #{index + 1}
                </div>
                <div className="col-span-5 flex items-center gap-1 md:gap-2">
                  <span className="text-sm md:text-xl flex-shrink-0">
                    {getCountryFlag(stat.country_code)}
                  </span>
                  <span className="text-[0.65rem] md:text-base leading-tight">
                    {stat.country}
                  </span>
                </div>
                <div className="col-span-3 text-right">
                  {stat.submission_count}
                </div>
                <div className="col-span-3 text-right">
                  {stat.average_score.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 md:mt-8 text-center">
          <Link
            to="/"
            className="inline-block px-4 md:px-6 py-2 md:py-3 bg-guinness-gold/10 hover:bg-guinness-gold/20 text-guinness-gold border border-guinness-gold/20 rounded-lg transition-colors text-sm md:text-base"
          >
            Back to Split
          </Link>
        </div>
      </div>
    </main>
  );
}
