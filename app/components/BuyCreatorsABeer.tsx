export function BuyCreatorsABeer({ className = "" }: { className?: string }) {
  return (
    <div className={`${className}`}>
      <a
        href="https://www.buymeacoffee.com/splittheg"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-6 py-3 bg-guinness-gold/10 hover:bg-guinness-gold/20 text-guinness-gold border border-guinness-gold/20 rounded-lg transition-colors duration-300"
      >
        <span className="font-bold">Buy the Creators a Beer</span>
        <span className="text-xl">🍺</span>
      </a>
    </div>
  );
}
