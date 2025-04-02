import { type LoaderFunction } from "react-router";
import { useLoaderData, Link } from "react-router";
import { supabase } from "~/utils/supabase";
import { LeaderboardNavigation } from "~/components/LeaderboardNavigation";

type BarStats = {
  bar_with_city: string;
  distinct_count: number;
  average_pour_score: number;
};

export const loader: LoaderFunction = async () => {
  const { data, error } = await supabase.rpc("get_bar_stats");

  if (error) {
    console.error("Error fetching bar stats:", error);
    throw error;
  }

  return { submissions: data || [] };
};

export default function BestBar() {
  const { submissions } = useLoaderData<{ submissions: BarStats[] }>();

  return (
    <main className="min-h-screen bg-guinness-black py-4 md:py-8">
      <div className="container mx-auto px-2 md:px-4">
        <div className="text-center mb-4 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-guinness-gold mb-4">
            Best Guinness Pours by Bar
          </h1>
          <Link
            to="/"
            className="text-guinness-gold hover:text-guinness-tan transition-colors inline-block"
          >
            ← Back to Split
          </Link>
        </div>
        <p className="text-guinness-gold mb-4 md:mb-6 text-center text-lg md:text-xl">
          What bar pours the best Guinness?
        </p>
        <p className="text-guinness-gold mb-4 md:mb-8 text-center text-xs md:text-base">
          After you submit a score, add a rating to help us find the best Guinness bar!
        </p>
        <div className="max-w-4xl mx-auto">
          <div className="bg-guinness-gold/10 rounded-lg overflow-hidden">
            <div className="grid grid-cols-12 gap-1 md:gap-4 p-2 md:p-4 text-guinness-gold font-bold border-b border-guinness-gold/20 text-xs md:text-base">
              <div className="col-span-1">#</div>
              <div className="col-span-5">Bar (City)</div>
              <div className="col-span-3 text-right">Guinness Scored</div>
              <div className="col-span-3 text-right">Avg Pour Score</div>
            </div>
            {submissions.map((stat, index) => (
              <div
                key={stat.bar_with_city}
                className="grid grid-cols-12 gap-1 md:gap-4 p-2 md:p-4 text-guinness-tan hover:bg-guinness-gold/5 transition-colors border-b border-guinness-gold/10 last:border-0 text-xs md:text-base"
              >
                <div className="col-span-1 text-guinness-gold">
                  #{index + 1}
                </div>
                <div className="col-span-5">
                  <span className="text-[0.65rem] md:text-base leading-tight">
                    {stat.bar_with_city}
                  </span>
                </div>
                <div className="col-span-3 text-right">
                  {stat.distinct_count}
                </div>
                <div className="col-span-3 text-right">
                  {stat.average_pour_score.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
