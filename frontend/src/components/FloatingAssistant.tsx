import React, { useState, useRef, useEffect } from 'react';
import { assistantService } from '../services/assistantService';
import { AssistantChatResponse } from '../types';
import { Bot, X, Send, Sparkles, User, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FloatingAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'assistant' | 'user'; text: string }>>([
    {
      role: 'assistant',
      text: 'Hi! Ask me anything about CO2 matching, prices, or comparison.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.text }));
      const res: AssistantChatResponse = await assistantService.sendMessage(userText, history);
      setMessages((prev) => [...prev, { role: 'assistant', text: res.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Error connecting to AI service. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Entry Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center space-x-2 px-4 py-3 rounded-full bg-gradient-to-r from-brand-600 via-brand-500 to-emerald-400 text-charcoal-950 font-bold text-xs shadow-2xl shadow-brand-500/30 hover:shadow-brand-500/45 hover:scale-105 transition-all duration-200"
          >
            <Bot className="w-5 h-5 text-charcoal-950" />
            <span className="hidden sm:inline">Ask ReCarbo AI</span>
            <span className="w-2 h-2 rounded-full bg-emerald-950 animate-ping absolute -top-0.5 -right-0.5" />
          </button>
        )}
      </div>

      {/* Floating Dialog Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 w-[92vw] sm:w-[380px] h-[500px] rounded-3xl bg-charcoal-900 border border-emerald-500/40 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="h-14 px-4 bg-charcoal-950 border-b border-emerald-950/80 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-brand-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block leading-tight">ReCarbo AI</span>
                <span className="text-[10px] text-emerald-400 font-medium leading-tight">Grounded Live Engine</span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 text-slate-400">
              <Link
                to="/assistant"
                onClick={() => setIsOpen(false)}
                title="Open Full Workstation"
                className="p-1.5 rounded-lg hover:text-white hover:bg-charcoal-800 transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:text-white hover:bg-charcoal-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex items-start space-x-2 ${
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-md bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-brand-400 flex-shrink-0 mt-0.5">
                    <Bot className="w-3 h-3" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-charcoal-950 font-medium ml-auto'
                      : 'bg-charcoal-950 border border-emerald-950 text-slate-200'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-xs text-slate-400 pl-8">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                <span>Checking marketplace data...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Compact Input */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-charcoal-950 border-t border-emerald-950/80 flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder="e.g. Find 20T CO2 in Surat..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-charcoal-900 border border-emerald-950 text-xs text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-charcoal-950 font-bold disabled:opacity-40 transition-all flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
