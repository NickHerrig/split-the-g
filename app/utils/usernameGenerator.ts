const BEER_ADJECTIVES = [
  // Taste/Flavor
  "Hoppy", "Malty", "Bitter", "Sweet", "Roasted", "Smoky", "Crisp", "Bold",
  "Smooth", "Spicy", "Rich", "Robust", "Toasted", "Creamy", "Zesty", "Fresh",
  
  // Color/Appearance
  "Golden", "Amber", "Dark", "Copper", "Bronze", "Ruby", "Hazy", "Crystal",
  "Cloudy", "Bright", "Russet", "Mahogany", "Tawny", "Ebony", "Inky", "Misty",
  
  // Character/Quality
  "Noble", "Craft", "Vintage", "Artisan", "Wild", "Barrel", "Aged", "Classic",
  "Royal", "Rustic", "Sacred", "Hardy", "Hearty", "Proud", "Mighty", "Blessed"
];

const BEER_NOUNS = [
  // Containers
  "Pint", "Keg", "Cask", "Stein", "Tankard", "Barrel", "Growler", "Flask",
  "Chalice", "Pitcher", "Flagon", "Mug", "Goblet", "Vessel", "Firkin", "Tun",
  
  // Beer Types
  "Stout", "Porter", "Lager", "Ale", "Pilsner", "Wheat", "Draught", "Brew",
  "Bitter", "Bock", "Dubbel", "Tripel", "Saison", "Gose", "Kolsch", "Dunkel",
  
  // Beer Culture
  "Brewer", "Master", "Monk", "Scholar", "Guild", "Tavern", "Abbey", "Lodge",
  "Knight", "Sage", "Elder", "Keeper", "Legend", "Artisan", "Crafter", "Maven"
];

export function generateBeerUsername(): string {
  const adjective = BEER_ADJECTIVES[Math.floor(Math.random() * BEER_ADJECTIVES.length)];
  const noun = BEER_NOUNS[Math.floor(Math.random() * BEER_NOUNS.length)];
  
  return `${adjective} ${noun}`;
} 