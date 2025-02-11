import { RoutePoint } from "@/types/types";

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function processGpxFile(file: File): Promise<RoutePoint[]> {
  const text = await file.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, "text/xml");

  // Get all trackpoints
  const trackpoints = xmlDoc.getElementsByTagName("trkpt");
  const processedPoints: RoutePoint[] = [];

  for (let i = 0; i < trackpoints.length; i++) {
    const point = trackpoints[i];
    const elevation = parseFloat(
      point.getElementsByTagName("ele")[0]?.textContent || "0"
    );
    const lat = parseFloat(point.getAttribute("lat") || "0");
    const lon = parseFloat(point.getAttribute("lon") || "0");

    processedPoints.push({
      elevation,
      lat,
      lon,
      distance:
        i > 0
          ? calculateDistance(
              processedPoints[i - 1].lat,
              processedPoints[i - 1].lon,
              lat,
              lon
            )
          : 0,
      gradient: 0,
    });
  }

  // Calculate gradients
  return processedPoints.map((point, index) => {
    if (index === 0) return { ...point, gradient: 0 };

    const prevPoint = processedPoints[index - 1];
    const elevationChange = point.elevation - prevPoint.elevation;
    const gradient = (elevationChange / (point.distance * 1000)) * 100;

    return {
      ...point,
      gradient: Math.min(Math.max(gradient, -20), 20), // Limit gradient to ±20%
    };
  });
}
