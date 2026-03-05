/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Send, Bot, User, Loader2 } from 'lucide-react';
import { useQuery, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Stable session ID for this browser tab (persists across re-renders, resets on page reload)
const SESSION_ID = `chat-${Date.now()}`;

export const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const messages = useQuery(api.queries.chatMessages.getBySession, { sessionId: SESSION_ID }) ?? [];
  const sendMessage = useAction(api.actions.chat.sendMessage);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    setIsLoading(true);
    try {
      await sendMessage({ sessionId: SESSION_ID, content: trimmed });
    } catch (err: any) {
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-96 h-full bg-[#0d0d12] border-l border-[#1e1e24] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e24]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-emerald-500/20 border border-emerald-500/40 rounded flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <span className="text-xs font-bold text-white tracking-wider">AI ANALYST</span>
            <span className="ml-2 text-[9px] text-emerald-500 font-mono">ONLINE</span>
          </div>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
            <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest mb-2">Mission Analyst Ready</p>
            <p className="text-xs text-zinc-500">Ask about node status, coverage gaps, or request a situation brief.</p>
          </div>
        )}

        {messages.filter(m => m.role !== 'system').map((msg, i) => (
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

      {/* Input */}
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
          Powered by DeepSeek · Live dashboard context injected server-side
        </p>
      </div>
    </div>
  );
};
