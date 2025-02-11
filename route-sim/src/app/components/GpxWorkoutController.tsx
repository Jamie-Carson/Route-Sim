"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

// Bluetooth Service/Characteristic UUIDs for Fitness Machine Control
const FITNESS_MACHINE_SERVICE = 0x1826;
const FITNESS_MACHINE_CONTROL_POINT = 0x2ad9;
const FITNESS_MACHINE_STATUS = 0x2ada;

const GpxWorkoutController = () => {
  const [device, setDevice] = useState(null);
  const [workoutData, setWorkoutData] = useState(null);
  const [currentGradient, setCurrentGradient] = useState(0);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const controlCharacteristicRef = useRef(null);

  const processGpxFile = async (file) => {
    try {
      setIsProcessing(true);
      setError("");

      const text = await file.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");

      // Get all trackpoints
      const trackpoints = xmlDoc.getElementsByTagName("trkpt");
      const processedPoints = [];

      for (let i = 0; i < trackpoints.length; i++) {
        const point = trackpoints[i];
        const elevation = parseFloat(
          point.getElementsByTagName("ele")[0]?.textContent || 0
        );
        const lat = parseFloat(point.getAttribute("lat"));
        const lon = parseFloat(point.getAttribute("lon"));

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
        });
      }

      // Calculate gradients
      const segments = processedPoints.map((point, index) => {
        if (index === 0) return { ...point, gradient: 0 };

        const prevPoint = processedPoints[index - 1];
        const elevationChange = point.elevation - prevPoint.elevation;
        const gradient = (elevationChange / (point.distance * 1000)) * 100; // Convert to percentage

        return {
          ...point,
          gradient: Math.min(Math.max(gradient, -20), 20), // Limit gradient to ±20%
        };
      });

      setWorkoutData(segments);
    } catch (err) {
      setError("Error processing GPX file: " + err.message);
      console.error("GPX processing error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
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
  };

  const connectToTrainer = async () => {
    try {
      setError("");

      const bluetoothDevice = await navigator.bluetooth.requestDevice({
        filters: [{ services: [FITNESS_MACHINE_SERVICE] }],
      });

      const server = await bluetoothDevice.gatt.connect();
      const service = await server.getPrimaryService(FITNESS_MACHINE_SERVICE);

      // Get control characteristic
      const controlCharacteristic = await service.getCharacteristic(
        FITNESS_MACHINE_CONTROL_POINT
      );
      controlCharacteristicRef.current = controlCharacteristic;

      // Get status characteristic for monitoring
      const statusCharacteristic = await service.getCharacteristic(
        FITNESS_MACHINE_STATUS
      );
      await statusCharacteristic.startNotifications();
      statusCharacteristic.addEventListener(
        "characteristicvaluechanged",
        handleStatusUpdate
      );

      setDevice(bluetoothDevice);

      bluetoothDevice.addEventListener("gattserverdisconnected", () => {
        setDevice(null);
        controlCharacteristicRef.current = null;
      });
    } catch (err) {
      setError("Error connecting to trainer: " + err.message);
      console.error("Trainer connection error:", err);
    }
  };

  const handleStatusUpdate = (event) => {
    // Process trainer status updates
    const status = new Uint8Array(event.target.value.buffer);
    console.log("Trainer status update:", status);
  };

  const setTrainerGradient = async (gradient) => {
    if (!controlCharacteristicRef.current) return;

    try {
      // Convert gradient to trainer-specific format
      // Most trainers expect a signed int16 representing gradient * 100
      const gradientValue = Math.round(gradient * 100);
      const command = new Uint8Array([
        0x46, // Set gradient command
        gradientValue & 0xff, // LSB
        (gradientValue >> 8) & 0xff, // MSB
      ]);

      await controlCharacteristicRef.current.writeValue(command);
      setCurrentGradient(gradient);
    } catch (err) {
      setError("Error setting gradient: " + err.message);
      console.error("Gradient control error:", err);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.name.toLowerCase().endsWith(".gpx")) {
      processGpxFile(file);
    } else {
      setError("Please upload a valid GPX file");
    }
  };

  const startWorkout = async () => {
    if (!workoutData || !device) return;

    // Implementation for starting the workout simulation
    // This would typically involve setting up intervals to progress through
    // the workout data and update the trainer gradient accordingly
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>GPX Workout Controller</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col gap-4">
            <Button
              onClick={() => document.getElementById("gpxUpload").click()}
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

            {workoutData && device && (
              <Button
                onClick={startWorkout}
                className="w-full"
                variant="default"
              >
                Start Workout
              </Button>
            )}
          </div>

          {currentGradient !== 0 && (
            <div className="text-center">
              <h3 className="text-xl font-semibold">
                Current Gradient: {currentGradient.toFixed(1)}%
              </h3>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {workoutData && (
            <div className="mt-4 space-y-4">
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
              </div>

              <div className="h-64 w-full">
                <h3 className="font-semibold mb-2">Elevation Profile</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={workoutData.map((point, index) => ({
                      distance: workoutData
                        .slice(0, index + 1)
                        .reduce((acc, p) => acc + p.distance, 0)
                        .toFixed(1),
                      elevation: point.elevation,
                      gradient: point.gradient,
                    }))}
                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="distance"
                      label={{ value: "Distance (km)", position: "bottom" }}
                    />
                    <YAxis
                      label={{
                        value: "Elevation (m)",
                        angle: -90,
                        position: "left",
                      }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-2 border rounded shadow">
                              <p>Distance: {payload[0].payload.distance} km</p>
                              <p>
                                Elevation:{" "}
                                {payload[0].payload.elevation.toFixed(0)} m
                              </p>
                              <p>
                                Gradient:{" "}
                                {payload[0].payload.gradient.toFixed(1)}%
                              </p>
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
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GpxWorkoutController;
