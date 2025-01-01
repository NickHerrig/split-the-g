import { type LoaderFunction } from "react-router";
import { useLoaderData, Link } from "react-router";
import { supabase } from "~/utils/supabase";

type LeaderboardEntry = {
  id: number;
  user_name: string;
  score: number;
  created_at: string;
};

export const loader: LoaderFunction = async () => {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('score', { ascending: false })
    .limit(100);

  if (error) throw error;

  return { entries: data };
};

export default function Leaderboard() {
  const { entries } = useLoaderData<{ entries: LeaderboardEntry[] }>();

  return (
    <main className="min-h-screen bg-guinness-black">
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-guinness-gold">Top Splits</h1>
          <Link 
            to="/"
            className="px-4 py-2 bg-guinness-gold text-guinness-black rounded-lg hover:bg-guinness-tan transition-colors"
          >
            Try Your Split
          </Link>
        </div>

        <div className="bg-guinness-gold/10 rounded-xl p-6">
          <table className="w-full">
            <thead>
              <tr className="text-guinness-gold border-b border-guinness-gold/20">
                <th className="py-2 px-4 text-left">Rank</th>
                <th className="py-2 px-4 text-left">Name</th>
                <th className="py-2 px-4 text-right">Score</th>
                <th className="py-2 px-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr 
                  key={entry.id}
                  className="border-b border-guinness-gold/10 hover:bg-guinness-gold/5"
                >
                  <td className="py-3 px-4 text-guinness-cream">{index + 1}</td>
                  <td className="py-3 px-4 text-guinness-cream">{entry.user_name}</td>
                  <td className="py-3 px-4 text-right text-guinness-cream">
                    {entry.score.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right text-guinness-tan">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
