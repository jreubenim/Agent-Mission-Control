import React from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Radio, ArrowRight, CheckCircle } from 'lucide-react';

const TYPE_COLOR: Record<string, string> = {
  alert: 'text-red-400',
  order: 'text-blue-400',
  status: 'text-zinc-400',
  ack: 'text-emerald-400',
  report: 'text-purple-400',
};

export const AgentIPCLog: React.FC = () => {
  const messages = useQuery(api.queries.agentMessages.getAll) ?? [];
  const acknowledge = useMutation(api.mutations.agentMessages.acknowledge);

  const sorted = [...messages].sort((a, b) => b.timestamp - a.timestamp).slice(0, 100);

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-6">
        <Radio className="w-5 h-5 text-purple-400" />
        <h2 className="text-lg font-bold text-white uppercase tracking-tight">Agent IPC Log</h2>
        <span className="text-xs font-mono text-zinc-500">{messages.length} messages</span>
      </div>

      {sorted.length === 0 && (
        <p className="text-zinc-500 font-mono text-sm">No inter-agent messages yet. Agents will communicate here.</p>
      )}

      <div className="space-y-2 font-mono">
        {sorted.map((msg) => (
          <div
            key={msg._id}
            className={`flex items-start gap-3 p-3 border rounded text-xs ${
              msg.acknowledged ? 'border-zinc-800 bg-zinc-900/20 opacity-60' : 'border-[#1e1e24] bg-[#0a0a0c]'
            }`}
          >
            <span className="text-zinc-600 flex-shrink-0 w-20">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
            <span className="text-zinc-400 flex-shrink-0">{msg.senderId}</span>
            <ArrowRight className="w-3 h-3 text-zinc-600 flex-shrink-0 mt-0.5" />
            <span className="text-zinc-400 flex-shrink-0">{msg.recipientId}</span>
            <span className={`flex-shrink-0 uppercase font-bold ${TYPE_COLOR[msg.type] ?? 'text-zinc-400'}`}>
              [{msg.type}]
            </span>
            <span className="text-zinc-500 flex-1 min-w-0 break-all">
              {typeof msg.payload === 'object'
                ? JSON.stringify(msg.payload).slice(0, 120)
                : String(msg.payload)}
            </span>
            {!msg.acknowledged && (
              <button
                onClick={() => acknowledge({ messageId: msg._id })}
                className="flex-shrink-0 p-1 hover:text-emerald-400 text-zinc-600 transition-colors"
                title="Mark acknowledged"
              >
                <CheckCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
