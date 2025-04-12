import { Link } from "react-router";

export function LeaderboardButton() {
  return (
    <Link
      to="/leaderboard"
      className="inline-flex items-center justify-center px-4 py-2.5 bg-guinness-gold text-guinness-brown rounded-lg hover:bg-guinness-tan transition-all duration-300 text-sm font-bold shadow-lg shadow-guinness-gold/20 hover:shadow-xl hover:shadow-guinness-gold/30 hover:scale-[1.02] active:scale-[0.98]"
    >
      View Top Splits
    </Link>
  );
}
