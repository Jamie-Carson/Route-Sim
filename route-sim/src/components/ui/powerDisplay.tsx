import {
  PowerZone,
  getPowerZoneColor,
  getPowerZoneRanges,
} from "@/utils/PowerZoneUtils";
import React from "react";

interface PowerDisplayProps {
  currentPower: number | null;
  smoothedPower: number | null;
  powerZone: PowerZone | null;
  currentGradient: number;
  weight: number;
  ftp: number;
}

export const PowerDisplay: React.FC<PowerDisplayProps> = ({
  currentPower,
  smoothedPower,
  powerZone,
  currentGradient,
  weight,
  ftp,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-semibold">
            Current Gradient: {currentGradient.toFixed(1)}%
          </h3>
        </div>
        <div className={`p-4 rounded-lg ${getPowerZoneColor(powerZone)}`}>
          <h3 className="text-xl font-semibold text-black">
            Power: {smoothedPower !== null ? `${smoothedPower}W` : "N/A"}
            {powerZone && ` (Z${powerZone})`}
          </h3>
          <div className="mt-1 space-y-1 text-black">
            <p>Instant: {currentPower !== null ? `${currentPower}W` : "N/A"}</p>
            <p>
              {smoothedPower !== null
                ? `${(smoothedPower / weight).toFixed(1)} W/kg`
                : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Always show power zones */}
      <div className="grid grid-cols-7 gap-1 text-xs text-center">
        {getPowerZoneRanges(ftp).map((zone, index) => (
          <div
            key={index}
            className={`p-2 rounded ${
              powerZone === index + 1 ? "ring-2 ring-white shadow-lg" : ""
            }`}
            style={{
              backgroundColor:
                index + 1 === powerZone ? "rgb(59, 130, 246)" : "#64748b",
            }}
          >
            <div className="text-white">
              <div>Z{index + 1}</div>
              <div>{zone.range}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
