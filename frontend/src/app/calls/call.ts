export interface CallLog {
  id: string;
  phoneNumber: string | null;
  contactName: string | null;
  callType: string | null;
  durationSeconds: number | null;
  audioUrl: string | null;
  timestamp: string;
}

export interface CallDevice {
  id: string;
  deviceName: string;
  model: string | null;
}