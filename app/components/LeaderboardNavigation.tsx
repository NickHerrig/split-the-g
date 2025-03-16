type Props = {
  activePage: "past24hr" | "alltime";
};

export function LeaderboardNavigation({ activePage }: Props) {
  return (
    <div className="flex justify-center gap-2 mb-4 md:mb-8">
      <a
        href="/past24hrleaderboard"
        className={`flex-1 md:flex-none inline-flex items-center justify-center px-3 md:px-4 py-2 rounded-lg transition-colors duration-300 text-xs md:text-base ${
          activePage === "past24hr"
            ? "bg-guinness-tan text-guinness-black"
            : "bg-guinness-gold text-guinness-black hover:bg-guinness-tan"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 md:h-5 md:w-5 md:mr-2"
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
        <span className="hidden md:inline">Past 24 Hours</span>
        <span className="inline md:hidden ml-1">24h</span>
      </a>
      <a
        href="/countryleaderboard"
        className={`flex-1 md:flex-none inline-flex items-center justify-center px-3 md:px-4 py-2 rounded-lg transition-colors duration-300 text-xs md:text-base ${
          activePage === "alltime"
            ? "bg-guinness-tan text-guinness-black"
            : "bg-guinness-gold text-guinness-black hover:bg-guinness-tan"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 md:h-5 md:w-5 md:mr-2"
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
        <span className="hidden md:inline">All Time</span>
        <span className="inline md:hidden ml-1">All</span>
      </a>
    </div>
  );
}
