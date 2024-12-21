export function PintGlassOverlay({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 150"
      className={`${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      {/* Wider pint glass shape */}
      <path
        d="
          M20,10 
          L30,140 
          L90,140 
          L100,10 
          Z
        "
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Optional: Add the ideal split line */}
      <path
        d="M30,45 L90,45"
        strokeDasharray="4 4"
        strokeOpacity="0.7"
      />
    </svg>
  );
} 