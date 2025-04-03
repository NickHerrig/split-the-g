import { Link } from "react-router";

export function LeaderboardButton() {
  return (
    <Link
      to="/leaderboard"
      className="inline-flex items-center justify-center px-3 py-2 bg-guinness-gold text-guinness-black rounded-lg hover:bg-guinness-tan transition-colors duration-300 text-sm"
    >
      View Top Splits
    </Link>
  );
}
