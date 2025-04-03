import { Link } from "react-router";

export function SubmissionsButton() {
  return (
    <a
      href="/collage"
      className="inline-flex items-center justify-center px-3 py-2 bg-guinness-gold/10 text-guinness-gold border border-guinness-gold/20 rounded-lg hover:bg-guinness-gold/20 transition-colors duration-300 text-sm"
    >
      Recent Submissions
    </a>
  );
}
