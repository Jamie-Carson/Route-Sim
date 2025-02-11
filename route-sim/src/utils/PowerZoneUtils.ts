export type PowerZone = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface ZoneColor {
  background: string;
  text: string;
}

export interface PowerZoneRange {
  range: string;
  name: string;
  description: string;
  color: string;
}

const POWER_ZONE_COLORS: Record<PowerZone, ZoneColor> = {
  1: { background: "bg-gray-500", text: "text-white" }, // Active Recovery
  2: { background: "bg-blue-600", text: "text-white" }, // Endurance
  3: { background: "bg-green-600", text: "text-white" }, // Tempo
  4: { background: "bg-yellow-500", text: "text-black" }, // Threshold
  5: { background: "bg-orange-500", text: "text-white" }, // VO2 Max
  6: { background: "bg-red-600", text: "text-white" }, // Anaerobic
  7: { background: "bg-purple-600", text: "text-white" }, // Neuromuscular
};

export const POWER_ZONE_DETAILS: Record<PowerZone, PowerZoneRange> = {
  1: {
    range: "<55% FTP",
    name: "Active Recovery",
    description: "Very light intensity for recovery",
    color: "grey",
  },
  2: {
    range: "55-75% FTP",
    name: "Endurance",
    description: "Light intensity for building endurance",
    color: "blue",
  },
  3: {
    range: "75-90% FTP",
    name: "Tempo",
    description: "Moderate intensity sustainable for long periods",
    color: "yellow",
  },
  4: {
    range: "90-105% FTP",
    name: "Threshold",
    description: "Hard intensity at or near FTP",
    color: "orange",
  },
  5: {
    range: "105-120% FTP",
    name: "VO2 Max",
    description: "Very hard intensity for VO2 Max development",
    color: "red",
  },
  6: {
    range: "120-150% FTP",
    name: "Anaerobic",
    description: "Extremely hard intensity for anaerobic capacity",
    color: "pink",
  },
  7: {
    range: ">150% FTP",
    name: "Neuromuscular",
    description: "Maximum intensity for neuromuscular power",
    color: "black",
  },
};

export function calculatePowerZone(power: number, ftp: number): PowerZone {
  const powerPercentage = (power / ftp) * 100;

  if (powerPercentage < 55) return 1;
  if (powerPercentage < 75) return 2;
  if (powerPercentage < 90) return 3;
  if (powerPercentage < 105) return 4;
  if (powerPercentage < 120) return 5;
  if (powerPercentage < 150) return 6;
  return 7;
}

export function getPowerZoneColor(zone: PowerZone | null): string {
  if (!zone) return "bg-gray-100 text-gray-500";
  return `${POWER_ZONE_COLORS[zone].background} ${POWER_ZONE_COLORS[zone].text}`;
}

export function getPowerZoneRanges(ftp: number): PowerZoneRange[] {
  return Object.entries(POWER_ZONE_DETAILS).map(([zone, details]) => {
    const zoneNum = parseInt(zone) as PowerZone;
    const powerRanges = calculateZonePowerRanges(zoneNum, ftp);
    return {
      ...details,
      range: `${powerRanges.min}${
        powerRanges.max ? "-" + powerRanges.max : "+"
      } W`,
    };
  });
}

interface PowerRange {
  min: number;
  max: number | null;
}

function calculateZonePowerRanges(zone: PowerZone, ftp: number): PowerRange {
  const ranges: Record<PowerZone, PowerRange> = {
    1: { min: 0, max: Math.round(ftp * 0.55) },
    2: { min: Math.round(ftp * 0.55), max: Math.round(ftp * 0.75) },
    3: { min: Math.round(ftp * 0.75), max: Math.round(ftp * 0.9) },
    4: { min: Math.round(ftp * 0.9), max: Math.round(ftp * 1.05) },
    5: { min: Math.round(ftp * 1.05), max: Math.round(ftp * 1.2) },
    6: { min: Math.round(ftp * 1.2), max: Math.round(ftp * 1.5) },
    7: { min: Math.round(ftp * 1.5), max: null },
  };

  return ranges[zone];
}
