import React from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Bell, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const SEVERITY_STYLE: Record<string, string> = {
  INFO: 'text-blue-400 border-blue-500/30 bg-blue-500/5',
  WARNING: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5',
  CRITICAL: 'text-orange-400 border-orange-500/30 bg-orange-500/5',
  EMERGENCY: 'text-red-400 border-red-500/30 bg-red-500/5',
};

export const AlertsPanel: React.FC = () => {
  const alerts = useQuery(api.queries.alerts.getAll) ?? [];
  const acknowledge = useMutation(api.mutations.alerts.acknowledge);
  const resolve = useMutation(api.mutations.alerts.resolve);

  const active = alerts.filter(a => a.status === 'active');
  const acked = alerts.filter(a => a.status === 'acknowledged');
  const resolved = alerts.filter(a => a.status === 'resolved');

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-5 h-5 text-orange-400" />
        <h2 className="text-lg font-bold text-white uppercase tracking-tight">Alert Management</h2>
        {active.length > 0 && (
          <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/40 rounded text-xs font-mono text-red-400">
            {active.length} ACTIVE
          </span>
        )}
      </div>

      {alerts.length === 0 && (
        <div className="text-zinc-500 font-mono text-sm">No alerts. All systems nominal.</div>
      )}

      <div className="space-y-3">
        {[...active, ...acked, ...resolved].map((alert) => (
          <div
            key={alert._id}
            className={`border rounded p-4 ${SEVERITY_STYLE[alert.severity] ?? 'text-zinc-400 border-zinc-700 bg-zinc-800/20'}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono font-bold uppercase">{alert.severity}</span>
                  <span className="text-[10px] font-mono text-zinc-500">{alert.nodeId ?? alert.agentId}</span>
                  <span className="text-[10px] font-mono text-zinc-600">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm font-semibold">{alert.title}</p>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{alert.description}</p>
                <span className={`inline-block mt-2 text-[10px] font-mono uppercase px-2 py-0.5 rounded border
                  ${alert.status === 'active' ? 'border-red-500/30 text-red-400'
                    : alert.status === 'acknowledged' ? 'border-yellow-500/30 text-yellow-400'
                    : 'border-emerald-500/30 text-emerald-400'}`}>
                  {alert.status}
                </span>
              </div>
              {alert.status === 'active' && (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => acknowledge({ alertId: alert._id })}
                    className="p-1.5 rounded hover:bg-yellow-500/10 transition-colors"
                    title="Acknowledge"
                  >
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  </button>
                  <button
                    onClick={() => resolve({ alertId: alert._id })}
                    className="p-1.5 rounded hover:bg-emerald-500/10 transition-colors"
                    title="Resolve"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  </button>
                </div>
              )}
              {alert.status === 'acknowledged' && (
                <button
                  onClick={() => resolve({ alertId: alert._id })}
                  className="p-1.5 rounded hover:bg-emerald-500/10 transition-colors flex-shrink-0"
                  title="Resolve"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
