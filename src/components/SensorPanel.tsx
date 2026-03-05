import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { QRCodeSVG } from 'qrcode.react';
import { Wifi, Smartphone, MapPin, Activity } from 'lucide-react';

export const SensorPanel: React.FC = () => {
  const sessions = useQuery(api.queries.sensorSessions.getAll) ?? [];
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const createSession = useMutation(api.mutations.sensorSessions.create);

  const sensorUrl = sessionCode
    ? `${window.location.origin}/sensor?code=${sessionCode}`
    : null;

  const handleCreateSession = async () => {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    await createSession({ code });
    setSessionCode(code);
  };

  const activeSessions = sessions.filter(s => s.status === 'active');

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-6">
        <Wifi className="w-5 h-5 text-purple-400" />
        <h2 className="text-lg font-bold text-white uppercase tracking-tight">Sensor Network</h2>
        <span className="text-xs font-mono text-zinc-500">{activeSessions.length} devices connected</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* QR Code generator */}
        <div className="border border-[#1e1e24] rounded p-6 bg-[#0a0a0c]">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">Connect Mobile Sensor</h3>
          </div>
          <p className="text-xs text-zinc-500 mb-5">
            Scan QR with any phone to stream GPS and accelerometer data into the network.
          </p>

          {!sensorUrl ? (
            <button
              onClick={handleCreateSession}
              className="px-5 py-2.5 bg-purple-500/20 border border-purple-500/40 rounded text-sm font-bold text-purple-400 hover:bg-purple-500/30 transition-colors uppercase tracking-widest"
            >
              Generate QR Code
            </button>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-lg">
                <QRCodeSVG value={sensorUrl} size={160} />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-mono text-zinc-500">SESSION CODE</p>
                <p className="text-xl font-mono font-bold text-purple-400 tracking-widest">{sessionCode}</p>
              </div>
              <p className="text-[10px] font-mono text-zinc-600 text-center break-all">{sensorUrl}</p>
            </div>
          )}
        </div>

        {/* Active sessions */}
        <div className="border border-[#1e1e24] rounded p-6 bg-[#0a0a0c]">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">Active Sessions</h3>
          </div>

          {activeSessions.length === 0 ? (
            <p className="text-zinc-600 font-mono text-xs">No active sensor sessions.</p>
          ) : (
            <div className="space-y-3">
              {activeSessions.map((session) => (
                <div key={session._id} className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded">
                  <div>
                    <p className="text-sm font-mono font-bold text-purple-400">{session.code}</p>
                    <p className="text-[10px] font-mono text-zinc-500">
                      Last heartbeat: {new Date(session.lastHeartbeat).toLocaleTimeString()}
                    </p>
                    {session.deviceInfo && (
                      <p className="text-[10px] font-mono text-zinc-600">{session.deviceInfo}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-mono text-emerald-400">LIVE</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
