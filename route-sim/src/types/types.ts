// Web Bluetooth API types
declare global {
  interface Navigator {
    bluetooth: {
      requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
    };
  }

  interface BluetoothDevice {
    gatt?: BluetoothRemoteGATTServer;
    id: string;
    name?: string;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
  }

  interface BluetoothRemoteGATTServer {
    device: BluetoothDevice;
    connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(
      service: BluetoothServiceUUID
    ): Promise<BluetoothRemoteGATTService>;
  }

  interface BluetoothRemoteGATTService {
    getCharacteristic(
      characteristic: BluetoothCharacteristicUUID
    ): Promise<BluetoothRemoteGATTCharacteristic>;
  }

  interface BluetoothRemoteGATTCharacteristic {
    service: BluetoothRemoteGATTService;
    value: DataView | null;
    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    writeValue(value: BufferSource): Promise<void>;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
  }

  interface RequestDeviceOptions {
    filters?: Array<{
      services?: BluetoothServiceUUID[];
      name?: string;
      namePrefix?: string;
      manufacturerId?: number;
      serviceDataUUID?: BluetoothServiceUUID;
    }>;
    optionalServices?: BluetoothServiceUUID[];
    acceptAllDevices?: boolean;
  }

  type BluetoothServiceUUID = number | string;
  type BluetoothCharacteristicUUID = number | string;
}

// Application specific types
export interface RoutePoint {
  elevation: number;
  lat: number;
  lon: number;
  distance: number;
  gradient: number;
}

export interface PowerDataPoint {
  power: number;
  timestamp: number;
}

export interface BluetoothIds {
  FITNESS_MACHINE_SERVICE: number;
  FITNESS_MACHINE_CONTROL_POINT: number;
  FITNESS_MACHINE_STATUS: number;
  CYCLING_POWER_SERVICE: number;
  CYCLING_POWER_MEASUREMENT: number;
}

export const BLUETOOTH_IDS: BluetoothIds = {
  FITNESS_MACHINE_SERVICE: 0x1826,
  FITNESS_MACHINE_CONTROL_POINT: 0x2ad9,
  FITNESS_MACHINE_STATUS: 0x2ada,
  CYCLING_POWER_SERVICE: 0x1818,
  CYCLING_POWER_MEASUREMENT: 0x2a63,
};
