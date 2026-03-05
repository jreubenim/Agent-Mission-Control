/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader2, WifiOff } from 'lucide-react';
import { useQuery, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { INITIAL_NODES, INITIAL_AGENTS } from '../constants';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LocalMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SESSION_ID = `chat-${Date.now()}`;
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';
const SYSTEM_PROMPT = `You are an AI mission analyst embedded in the G-TT&C (Global Tracking, Telemetry & Command) Mission Control dashboard. You have access to real-time data about a network of surveillance and communications nodes spread across Europe.

Segments: DOMESTIC (London, Paris, Berlin, Brussels, Amsterdam, Frankfurt, Munich, Rome), OVERSEAS (Madrid, Warsaw, Bucharest, Stockholm, Athens, Istanbul), MARITIME (North Sea, Mediterranean, Baltic, English Channel, Adriatic, Norwegian Sea), SPACE (GEO satellites, polar relays, Azores, Svalbard).

You help operators by analyzing node status, telemetry anomalies, coverage gaps, and recommending tactical responses. Keep responses concise and tactical.`;

// Check if Convex is actually connected (not just the placeholder URL)
const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
const hasConvex = !!convexUrl && !convexUrl.includes('placeholder');

export const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Try Convex queries — will return undefined if not connected
  const convexMessages = hasConvex
    ? useQuery(api.queries.chatMessages.getBySession, { sessionId: SESSION_ID })
    : undefined;

  let sendConvexMessage: any = null;
  try {
    if (hasConvex) sendConvexMessage = useAction(api.actions.chat.sendMessage);
  } catch { /* no provider */ }

  const displayMessages = convexMessages
    ? convexMessages.filter((m: any) => m.role !== 'system').map((m: any) => ({ role: m.role, content: m.content }))
    : localMessages;

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages]);

  // Direct DeepSeek call (fallback when no Convex)
  async function chatDirectly(userMessage: string) {
    const online = INITIAL_NODES.filter(n => n.status === 'ONLINE').length;
    const degraded = INITIAL_NODES.filter(n => n.status === 'DEGRADED' || n.status === 'OFFLINE');
    const context = `[DASHBOARD] ${INITIAL_NODES.length} nodes: ${online} ONLINE, ${degraded.length} problem. Active agents: ${INITIAL_AGENTS.length}.`;

    const history = localMessages.map(m => ({ role: m.role, content: m.content }));
    history.push({ role: 'user', content: `${context}\n\nOperator query: ${userMessage}` });

    const resp = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${(import.meta.env.VITE_DEEPSEEK_API_KEY as string) || ''}` },
      body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history], temperature: 0.7, max_tokens: 1024 }),
    });

    if (!resp.ok) throw new Error(`DeepSeek API error: ${resp.status}`);
    const data = await resp.json();
    return data.choices?.[0]?.message?.content ?? '[No response]';
  }

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      if (sendConvexMessage) {
        // Server-side path (Convex connected)
        await sendConvexMessage({ sessionId: SESSION_ID, content: trimmed });
      } else {
        // Client-side fallback
        setLocalMessages(prev => [...prev, { role: 'user', content: trimmed }]);
        const reply = await chatDirectly(trimmed);
        setLocalMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Chat unavailable';
      if (sendConvexMessage) {
        // Convex failed — try direct fallback
        try {
          setLocalMessages(prev => [...prev, { role: 'user', content: trimmed }]);
          const reply = await chatDirectly(trimmed);
          setLocalMessages(prev => [...prev, { role: 'assistant', content: reply }]);
        } catch {
          setError('Chat offline — set VITE_DEEPSEEK_API_KEY or connect Convex backend');
        }
      } else {
        setError(errMsg.includes('API') ? errMsg : 'Chat offline — connect Convex backend or set VITE_DEEPSEEK_API_KEY');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-96 h-full bg-[#0d0d12] border-l border-[#1e1e24] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e24]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-emerald-500/20 border border-emerald-500/40 rounded flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <span className="text-xs font-bold text-white tracking-wider">AI ANALYST</span>
            <span className={`ml-2 text-[9px] font-mono ${hasConvex ? 'text-emerald-500' : 'text-amber-500'}`}>
              {hasConvex ? 'ONLINE' : 'LOCAL'}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {displayMessages.length === 0 && !error && (
          <div className="text-center py-8">
            <Bot className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
            <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest mb-2">Mission Analyst Ready</p>
            <p className="text-xs text-zinc-500">Ask about node status, coverage gaps, or request a situation brief.</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <WifiOff className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <p className="text-[10px] text-amber-400 font-mono">{error}</p>
          </div>
        )}

        {displayMessages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-5 h-5 mt-0.5 bg-emerald-500/20 border border-emerald-500/40 rounded flex items-center justify-center flex-shrink-0">
                <Bot className="w-3 h-3 text-emerald-400" />
              </div>
            )}
            <div className={`max-w-[80%] px-3 py-2 rounded-lg text-xs font-mono leading-relaxed
              ${msg.role === 'user'
                ? 'bg-blue-500/10 border border-blue-500/20 text-blue-200'
                : 'bg-[#111116] border border-[#1e1e24] text-zinc-300'}`}>
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-5 h-5 mt-0.5 bg-blue-500/20 border border-blue-500/40 rounded flex items-center justify-center flex-shrink-0">
                <User className="w-3 h-3 text-blue-400" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2 items-center">
            <div className="w-5 h-5 bg-emerald-500/20 border border-emerald-500/40 rounded flex items-center justify-center flex-shrink-0">
              <Bot className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="bg-[#111116] border border-[#1e1e24] px-3 py-2 rounded-lg">
              <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-[#1e1e24]">
        <div className="flex items-center gap-2 bg-[#111116] border border-[#1e1e24] rounded-lg px-3 py-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Query the analyst..."
            className="flex-1 bg-transparent text-xs text-zinc-200 font-mono placeholder-zinc-600 outline-none"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="text-emerald-400 hover:text-emerald-300 disabled:text-zinc-700 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[8px] text-zinc-700 font-mono mt-1.5 text-center">
          Powered by DeepSeek {hasConvex ? '· Server-side via Convex' : '· Client-side fallback'}
        </p>
      </div>
    </div>
  );
};
