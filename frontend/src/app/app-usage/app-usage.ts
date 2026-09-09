export interface AppUsage {
  id: string;
  packageName: string;
  appName: string;
  usageSeconds: number;
  lastUsedAt: string | null;
  recordedDate: string;
}

export interface UsageDevice {
  id: string;
  deviceName: string;
  model: string | null;
}