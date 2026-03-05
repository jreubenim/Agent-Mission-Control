import React, { useEffect, useRef, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Wifi, WifiOff, MapPin, Activity } from 'lucide-react';

export const MobileSensor: React.FC = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code') ?? '';

  const [connected, setConnected] = useState(false);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [accel, setAccel] = useState<{ x: number; y: number; z: number } | null>(null);
  const [status, setStatus] = useState('Connecting…');

  const heartbeat = useMutation(api.mutations.sensorSessions.heartbeat);
  const sendReading = useMutation(api.mutations.sensorReadings.submit);
  const disconnect = useMutation(api.mutations.sensorSessions.disconnect);

  const sessionId = useRef(`sess-${Date.now()}`);

  useEffect(() => {
    if (!code) { setStatus('No session code in URL'); return; }

    // Start heartbeat
    const hb = setInterval(() => heartbeat({ code }), 5000);
    setConnected(true);
    setStatus('Connected — streaming sensor data');

    // GPS
    let watchId: number | undefined;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          setGps({ lat, lng });
          sendReading({
            sessionId: sessionId.current,
            type: 'gps',
            data: { lat, lng, accuracy: pos.coords.accuracy },
          });
        },
        (err) => console.warn('GPS error:', err),
        { enableHighAccuracy: true }
      );
    }

    // Accelerometer
    const handleMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const reading = { x: a.x ?? 0, y: a.y ?? 0, z: a.z ?? 0 };
      setAccel(reading);
      // Only send significant motion events to avoid flooding
      if (Math.abs(reading.x) + Math.abs(reading.y) + Math.abs(reading.z) > 15) {
        sendReading({
          sessionId: sessionId.current,
          type: 'accelerometer',
          data: reading,
        });
      }
    };
    window.addEventListener('devicemotion', handleMotion);

    return () => {
      clearInterval(hb);
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
      window.removeEventListener('devicemotion', handleMotion);
      disconnect({ code });
    };
  }, [code]);

  return (
    <div className="min-h-screen bg-[#050507] text-zinc-200 font-mono flex flex-col items-center justify-center p-6 gap-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-white tracking-widest uppercase">G-TT&C Sensor Node</h1>
        <p className="text-xs text-zinc-500 mt-1">Mobile Sensor Bridge</p>
      </div>

      {/* Status */}
      <div className={`flex items-center gap-3 px-6 py-3 border rounded-full ${
        connected ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-red-500/40 bg-red-500/5'
      }`}>
        {connected
          ? <Wifi className="w-4 h-4 text-emerald-400" />
          : <WifiOff className="w-4 h-4 text-red-400" />
        }
        <span className={`text-sm ${connected ? 'text-emerald-400' : 'text-red-400'}`}>{status}</span>
      </div>

      <div className="text-center">
        <p className="text-[10px] text-zinc-500 uppercase">Session Code</p>
        <p className="text-3xl font-bold text-purple-400 tracking-widest mt-1">{code || '—'}</p>
      </div>

      {/* Readings */}
      <div className="w-full max-w-sm space-y-4">
        <div className="border border-[#1e1e24] rounded-lg p-5 bg-[#0a0a0c]">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-blue-400" />
            <span className="text-xs uppercase tracking-wide text-zinc-400">GPS Location</span>
          </div>
          {gps ? (
            <div className="space-y-1">
              <p className="text-sm text-white">Lat: <span className="text-blue-400">{gps.lat.toFixed(6)}</span></p>
              <p className="text-sm text-white">Lng: <span className="text-blue-400">{gps.lng.toFixed(6)}</span></p>
            </div>
          ) : (
            <p className="text-xs text-zinc-600">Acquiring GPS…</p>
          )}
        </div>

        <div className="border border-[#1e1e24] rounded-lg p-5 bg-[#0a0a0c]">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-orange-400" />
            <span className="text-xs uppercase tracking-wide text-zinc-400">Accelerometer</span>
          </div>
          {accel ? (
            <div className="space-y-1 text-sm">
              <p>X: <span className="text-orange-400">{accel.x.toFixed(2)}</span></p>
              <p>Y: <span className="text-orange-400">{accel.y.toFixed(2)}</span></p>
              <p>Z: <span className="text-orange-400">{accel.z.toFixed(2)}</span></p>
            </div>
          ) : (
            <p className="text-xs text-zinc-600">Waiting for motion…</p>
          )}
        </div>
      </div>

      <p className="text-[10px] text-zinc-700 text-center max-w-xs">
        Keep this page open. Your device is streaming sensor data to mission control.
      </p>
    </div>
  );
};
