import { BLUETOOTH_IDS } from "@/types/types";
import { PowerZone, calculatePowerZone } from "@/utils/PowerZoneUtils";
import { useState, useRef, useCallback, useEffect } from "react";

interface UseTrainerResult {
  device: BluetoothDevice | null;
  currentPower: number | null;
  smoothedPower: number | null;
  currentGradient: number;
  powerZone: PowerZone | null;
  error: string;
  connectToTrainer: () => Promise<void>;
  setTrainerGradient: (gradient: number) => Promise<void>;
}

export function useTrainer(ftp: number): UseTrainerResult {
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [currentPower, setCurrentPower] = useState<number | null>(null);
  const [smoothedPower, setSmoothedPower] = useState<number | null>(null);
  const [currentGradient, setCurrentGradient] = useState<number>(0);
  const [powerZone, setPowerZone] = useState<PowerZone | null>(null);
  const [error, setError] = useState<string>("");

  const controlCharacteristicRef =
    useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const powerBufferRef = useRef<{ power: number; timestamp: number }[]>([]);

  const handlePowerData = useCallback(
    (event: Event) => {
      const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
      const value = characteristic.value;
      if (!value) return;

      const power = value.getUint16(2, true);
      console.log("Power reading:", power, "watts");
      setCurrentPower(power);

      // Update power buffer for smoothing
      const timestamp = Date.now();
      powerBufferRef.current.push({ power, timestamp });

      // Remove data points older than 3 seconds
      const threeSecondsAgo = timestamp - 3000;
      powerBufferRef.current = powerBufferRef.current.filter(
        (point) => point.timestamp >= threeSecondsAgo
      );

      // Calculate 3s average power
      const smoothed = Math.round(
        powerBufferRef.current.reduce((sum, point) => sum + point.power, 0) /
          powerBufferRef.current.length
      );
      setSmoothedPower(smoothed);
      console.log("3s average power:", smoothed, "watts");

      // Calculate power zone based on smoothed power
      const newZone = calculatePowerZone(smoothed, ftp);
      if (newZone !== powerZone) {
        console.log("Power zone changed to:", newZone);
        setPowerZone(newZone);
      }
    },
    [ftp]
  );

  const connectToTrainer = async () => {
    try {
      setError("");
      console.log("Attempting to connect to trainer...");

      const bluetoothDevice = await navigator.bluetooth.requestDevice({
        filters: [{ services: [BLUETOOTH_IDS.FITNESS_MACHINE_SERVICE] }],
        optionalServices: [BLUETOOTH_IDS.CYCLING_POWER_SERVICE],
      });

      console.log("Device selected:", bluetoothDevice.name);

      const server = await bluetoothDevice.gatt?.connect();
      if (!server) throw new Error("Failed to connect to GATT server");

      console.log("Connected to GATT server");

      // Connect to services
      const fitnessService = await server.getPrimaryService(
        BLUETOOTH_IDS.FITNESS_MACHINE_SERVICE
      );
      console.log("Got Fitness Machine Service");

      const powerService = await server.getPrimaryService(
        BLUETOOTH_IDS.CYCLING_POWER_SERVICE
      );
      console.log("Got Cycling Power Service");

      // Set up power measurement
      const powerCharacteristic = await powerService.getCharacteristic(
        BLUETOOTH_IDS.CYCLING_POWER_MEASUREMENT
      );
      await powerCharacteristic.startNotifications();
      powerCharacteristic.addEventListener(
        "characteristicvaluechanged",
        handlePowerData
      );
      console.log("Power notifications enabled");

      // Set up trainer control
      controlCharacteristicRef.current = await fitnessService.getCharacteristic(
        BLUETOOTH_IDS.FITNESS_MACHINE_CONTROL_POINT
      );
      console.log("Trainer control characteristic ready");

      setDevice(bluetoothDevice);

      bluetoothDevice.addEventListener("gattserverdisconnected", () => {
        console.log("Trainer disconnected");
        setDevice(null);
        controlCharacteristicRef.current = null;
      });
    } catch (err) {
      setError(
        `Error connecting to trainer: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      console.error("Trainer connection error:", err);
    }
  };

  const setTrainerGradient = async (gradient: number) => {
    if (!controlCharacteristicRef.current) return;

    try {
      const gradientValue = Math.round(gradient * 100);
      const command = new Uint8Array([
        0x46, // Set gradient command
        gradientValue & 0xff, // LSB
        (gradientValue >> 8) & 0xff, // MSB
      ]);

      await controlCharacteristicRef.current.writeValue(command);
      setCurrentGradient(gradient);
    } catch (err) {
      setError(
        `Error setting gradient: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      console.error("Gradient control error:", err);
    }
  };

  useEffect(() => {
    return () => {
      if (device?.gatt?.connected) {
        device.gatt.disconnect();
      }
    };
  }, [device]);

  return {
    device,
    currentPower,
    smoothedPower,
    currentGradient,
    powerZone,
    error,
    connectToTrainer,
    setTrainerGradient,
  };
}
