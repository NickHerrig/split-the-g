export function Past24hrLeaderboardButton() {
  return (
    <a
      href="/past24hrleaderboard"
      className="inline-flex items-center px-4 py-2 bg-guinness-gold text-guinness-black rounded-lg hover:bg-guinness-tan transition-colors duration-300"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 md:mr-2"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
      <span className="hidden md:inline">Go to Past 24 Hour Leaderboard</span>
      <span className="inline md:hidden">Past 24h</span>
    </a>
  );
}
