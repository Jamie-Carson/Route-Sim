"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Activity } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { RoutePoint } from "@/types/types";
import { PowerDisplay } from "@/components/ui/powerDisplay";
import { processGpxFile } from "@/utils/GpxProcessing";
import { getPowerZoneRanges } from "@/utils/PowerZoneUtils";
import { useTrainer } from "../hooks/useTrainer";
import RouteVisualization from "@/components/ui/RouteVisualization";

const GpxWorkoutController: React.FC = () => {
  const [workoutData, setWorkoutData] = useState<RoutePoint[] | null>(null);
  const [ftp, setFtp] = useState<number>(250);
  const [weight, setWeight] = useState<number>(75);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [routeProgress, setRouteProgress] = useState<number>(0);

  const {
    device,
    currentPower,
    smoothedPower,
    currentGradient,
    powerZone,
    error,
    connectToTrainer,
  } = useTrainer(ftp);

  // Update progress based on workout time
  useEffect(() => {
    if (device && workoutData) {
      const interval = setInterval(() => {
        setRouteProgress((prev) => (prev + 0.001) % 1);
      }, 50);

      return () => clearInterval(interval);
    }
  }, [device, workoutData]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !file.name.toLowerCase().endsWith(".gpx")) {
      return;
    }

    setIsProcessing(true);
    try {
      const processedData = await processGpxFile(file);
      setWorkoutData(processedData);
    } catch (err) {
      console.error("Error processing GPX file:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderElevationProfile = () => {
    if (!workoutData) return null;

    const chartData = workoutData.map((point, index) => ({
      distance: workoutData
        .slice(0, index + 1)
        .reduce((acc, p) => acc + p.distance, 0)
        .toFixed(1),
      elevation: point.elevation,
      gradient: point.gradient,
    }));

    return (
      <div className="h-64 w-full">
        <h3 className="font-semibold mb-2">Elevation Profile</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="distance"
              label={{ value: "Distance (km)", position: "bottom" }}
            />
            <YAxis
              label={{ value: "Elevation (m)", angle: -90, position: "left" }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-2 border rounded shadow">
                      <p>Distance: {payload[0].payload.distance} km</p>
                      <p>
                        Elevation: {payload[0].payload.elevation.toFixed(0)} m
                      </p>
                      <p>Gradient: {payload[0].payload.gradient.toFixed(1)}%</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="elevation"
              stroke="#3b82f6"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>GPX Workout Controller</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="ftp">FTP (Functional Threshold Power)</Label>
              <Input
                id="ftp"
                type="number"
                value={ftp}
                onChange={(e) => setFtp(Number(e.target.value))}
                className="w-full"
                min="50"
                max="500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full"
                min="30"
                max="200"
                step="0.1"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Button
              onClick={() => document.getElementById("gpxUpload")?.click()}
              className="w-full"
              disabled={isProcessing}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload GPX File
            </Button>
            <input
              id="gpxUpload"
              type="file"
              accept=".gpx"
              className="hidden"
              onChange={handleFileUpload}
            />

            {!device && (
              <Button
                onClick={connectToTrainer}
                className="w-full"
                disabled={!workoutData}
              >
                <Activity className="mr-2 h-4 w-4" />
                Connect to Trainer
              </Button>
            )}
            {device && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <h3 className="text-green-700 font-semibold">
                  Connected to: {device.name || "Unknown Device"}
                </h3>
                <p className="text-2xl font-bold mt-2">
                  {currentPower !== null ? `${currentPower}W` : "No power data"}
                </p>
              </div>
            )}
          </div>

          {device && (
            <PowerDisplay
              currentPower={currentPower}
              smoothedPower={smoothedPower}
              powerZone={powerZone}
              currentGradient={currentGradient}
              weight={weight}
              ftp={ftp}
            />
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {workoutData && (
            <div className="space-y-4">
              <RouteVisualization
                routeData={workoutData}
                progress={routeProgress}
              />
              <div>
                <h3 className="font-semibold mb-2">Route Statistics</h3>
                <p>Total Points: {workoutData.length}</p>
                <p>
                  Max Gradient:{" "}
                  {Math.max(...workoutData.map((p) => p.gradient)).toFixed(1)}%
                </p>
                <p>
                  Min Gradient:{" "}
                  {Math.min(...workoutData.map((p) => p.gradient)).toFixed(1)}%
                </p>
                <p>
                  Total Distance:{" "}
                  {workoutData
                    .reduce((acc, point) => acc + point.distance, 0)
                    .toFixed(1)}{" "}
                  km
                </p>
              </div>
              {renderElevationProfile()}
            </div>
          )}

          {powerZone && (
            <div className="grid grid-cols-7 gap-1 text-xs text-center">
              {getPowerZoneRanges(ftp).map((zone, index) => (
                <div
                  key={index}
                  className={`p-2 rounded ${
                    powerZone === index + 1 ? "ring-2 ring-white" : ""
                  }`}
                  style={{ backgroundColor: zone.color }}
                >
                  <div className="text-white">
                    <div>Z{index + 1}</div>
                    <div>{zone.range}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GpxWorkoutController;
