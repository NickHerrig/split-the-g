interface Prediction {
  width: number;
  height: number;
  x: number;
  y: number;
  confidence: number;
  class: string;
}

interface ImageDimensions {
  width: number;
  height: number;
}

function normalizeCoordinates(pred: Prediction, imgDims: ImageDimensions) {
  return {
    x: pred.x / imgDims.width,
    y: pred.y / imgDims.height,
    width: pred.width / imgDims.width,
    height: pred.height / imgDims.height,
  };
}

function calculateSplitScore(splitResults: any): number {
  if (!splitResults?.predictions?.predictions?.[0]) {
    return 0; // No split detected
  }
  const split = splitResults.predictions.predictions[0];
  const imgDims = splitResults.predictions.image;
  const normalizedSplit = normalizeCoordinates(split, imgDims);
  const splitTopY = normalizedSplit.y - (normalizedSplit.height / 2);
  const distanceFromCenter = Math.abs(splitTopY - 0.5);
  const normalizedDistance = Math.min(distanceFromCenter / 0.5, 1);
  return 3.75 + (1.25 * (1 - normalizedDistance));
}

function calculateNonSplitScore(pintResults: any): number {
  const predictions = pintResults?.predictions?.predictions || [];
  const imgDims = pintResults?.predictions?.image;
  const beer = predictions.find(p => p.class === 'beer');
  const g = predictions.find(p => p.class === 'G');
  
  if (!beer || !g) {
    return 0; 
  }

  const normalizedBeer = normalizeCoordinates(beer, imgDims);
  const normalizedG = normalizeCoordinates(g, imgDims);
  const beerTopY = normalizedBeer.y - (normalizedBeer.height / 2);
  const gCenterY = normalizedG.y;
  const distanceFromCenter = Math.abs(beerTopY - gCenterY);
  const maxDistance = 0.5; 
  const normalizedDistance = Math.min(distanceFromCenter / maxDistance, 1);
  const decayFactor = Math.pow(1 - normalizedDistance, 2);
  return 3.75 * decayFactor;
}

export function calculateScore(results: any): number {
  // Check for split first
  const splitScore = calculateSplitScore(results["split results"][0]);
  
  if (splitScore > 0) {
    return splitScore;
  }
  
  // If no split, calculate based on beer level to G center
  return calculateNonSplitScore(results["pint results"]);
} 