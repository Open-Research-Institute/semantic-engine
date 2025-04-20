import { PCA } from 'ml-pca';

/**
 * Convert high-dimensional embeddings to lat/lng coordinates using ML-PCA
 * @param {Array<Array<number>>} embeddings - Array of embedding vectors
 * @param {Object} latLngBounds - Desired map bounds { north, south, east, west }
 * @returns {Array<{lat: number, lng: number}>} - Array of map coordinates
 */
export const embeddingsToLatLng = (embeddings, latLngBounds = {
  north: 85,  // Max latitude in Web Mercator
  south: -85, // Min latitude in Web Mercator
  east: 180,  // Max longitude
  west: -180  // Min longitude
}) => {
  // 1. Create a PCA instance
  const pca = new PCA(embeddings, {
    scale: true, // Scale the data to have unit variance
    center: true // Center the data to have zero mean
  });
  
  // 2. Project the data to 2 dimensions
  const twoDimData = pca.predict(embeddings, { nComponents: 2 });
  
  // 3. Get explained variance for logging
  const explainedVariance = pca.getExplainedVariance();
  console.log(`PCA explained variance: ${explainedVariance[0].toFixed(2)}%, ${explainedVariance[1].toFixed(2)}%`);
  
  // 4. Find min/max values for scaling
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  for (const point of twoDimData.data) {
    minX = Math.min(minX, point[0]);
    maxX = Math.max(maxX, point[0]);
    minY = Math.min(minY, point[1]);
    maxY = Math.max(maxY, point[1]);
  }
  
  // 5. Scale to lat/lng range
  const latRange = latLngBounds.north - latLngBounds.south;
  const lngRange = latLngBounds.east - latLngBounds.west;
  
  return twoDimData.data.map(point => {
    // Scale X to longitude range
    const scaledX = latLngBounds.west + 
      ((point[0] - minX) / (maxX - minX)) * lngRange;
    
    // Scale Y to latitude range
    const scaledY = latLngBounds.south + 
      ((point[1] - minY) / (maxY - minY)) * latRange;
    
    // Clamp values to valid geographical ranges
    const clampedLat = Math.max(Math.min(scaledY, 90), -90);
    const clampedLng = Math.max(Math.min(scaledX, 180), -180);
    
    // Log warnings if values were clamped
    if (clampedLat !== scaledY) {
      console.warn(`Latitude value ${scaledY.toFixed(2)} was clamped to ${clampedLat}`);
    }
    
    if (clampedLng !== scaledX) {
      console.warn(`Longitude value ${scaledX.toFixed(2)} was clamped to ${clampedLng}`);
    }
    
    return { lat: clampedLat, lng: clampedLng, point };
  });
};
