const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4001';

export async function createRide(payload: any) {
  const res = await fetch(`${API_BASE}/api/rides`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create ride');
  return res.json();
}

export async function getRide(id: string) {
  const res = await fetch(`${API_BASE}/api/rides/${id}`);
  if (!res.ok) throw new Error('Failed to fetch ride');
  return res.json();
}

export const WS_URL = (import.meta.env.VITE_WS_URL || 'ws://localhost:4001');

// Safety API re-exports
export { sendGpsUpdate, triggerEmergency, batchUploadLocations, getEmergencyLog } from './emergencyApi';
