import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { assistantService } from '../services/assistantService';
import { AssistantChatResponse } from '../types';
import { Bot, X, Send, Maximize2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FloatMessage {
  role: 'assistant' | 'user';
  text: string;
  generatedByAI?: boolean;
}

const WELCOME: FloatMessage = {
  role: 'assistant',
  text: `## 👋 Hi, I'm ReCarbo AI

I'm connected to the **live Gujarat CO₂ marketplace**. Here's what I can help with:

- 🔍 **Find suppliers** — *"I need 20T CO₂ ≥99% in Surat"*
- ⚖️ **Compare suppliers** — *"Compare supplier A vs B"*
- 🏭 **Utilization advice** — *"CO₂ purity for concrete?"*
- ℹ️ **Platform info** — *"How does pricing work?"*

What would you like to know?`,
};

const QUICK_PROMPTS = [
  'Find 20T CO₂ ≥99% in Surat',
  'Compare top two suppliers',
  'CO₂ purity for concrete?',
];

export const FloatingAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<FloatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, loading]);

  const handleSend = async (text?: string) => {
    const userText = text || input.trim();
    if (!userText || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.text }));
      const res: AssistantChatResponse = await assistantService.sendMessage(userText, history);
      setMessages((prev) => [...prev, { role: 'assistant', text: res.reply, generatedByAI: res.generatedByAI }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: '**Error** connecting to AI service. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center space-x-2 px-4 py-3 rounded-full bg-gradient-to-r from-brand-600 via-brand-500 to-emerald-400 text-charcoal-950 font-bold text-xs shadow-2xl shadow-brand-500/30 hover:shadow-brand-500/45 hover:scale-105 transition-all duration-200"
          >
            <Bot className="w-5 h-5" />
            <span className="hidden sm:inline">Ask ReCarbo AI</span>
            <span className="w-2 h-2 rounded-full bg-emerald-950 animate-ping absolute -top-0.5 -right-0.5" />
          </button>
        )}
      </div>

      {/* Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 w-[92vw] sm:w-[390px] h-[540px] rounded-3xl bg-charcoal-900 border border-emerald-500/40 shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="h-14 px-4 bg-charcoal-950 border-b border-emerald-950/80 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-brand-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block leading-tight">ReCarbo AI</span>
                <span className="text-[10px] text-brand-400 font-medium leading-tight flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse inline-block" />
                  <span>Grounded Live Engine</span>
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 text-slate-400">
              <Link
                to="/assistant"
                onClick={() => setIsOpen(false)}
                title="Open Full Assistant"
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

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex items-start space-x-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-md bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-brand-400 flex-shrink-0 mt-0.5">
                    <Bot className="w-3 h-3" />
                  </div>
                )}
                <div className={`max-w-[82%] rounded-2xl px-3 py-2.5 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-charcoal-950 font-medium ml-auto'
                    : 'bg-charcoal-950 border border-emerald-950 text-slate-200'
                }`}>
                  {m.role === 'assistant' ? (
                    <>
                      <div className="prose prose-invert prose-xs max-w-none
                        prose-p:my-0.5 prose-p:leading-relaxed
                        prose-ul:my-1 prose-ul:pl-4 prose-li:my-0.5
                        prose-strong:text-white prose-strong:font-semibold
                        prose-em:text-slate-300
                        prose-headings:text-white prose-headings:font-bold prose-headings:mt-1 prose-headings:mb-0.5 prose-h2:text-sm prose-h3:text-xs
                        prose-blockquote:border-brand-500 prose-blockquote:text-slate-400 prose-blockquote:not-italic prose-blockquote:pl-2
                        prose-code:text-brand-300 prose-code:bg-charcoal-900 prose-code:px-1 prose-code:rounded">
                        <ReactMarkdown>{m.text}</ReactMarkdown>
                      </div>
                      <div className={`flex items-center space-x-1 mt-1.5 text-[10px] font-semibold ${m.generatedByAI ? 'text-brand-400' : 'text-slate-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${m.generatedByAI ? 'bg-brand-400' : 'bg-slate-600'}`} />
                        <span>{m.generatedByAI ? 'Groq AI' : 'Rule-based'}</span>
                      </div>
                    </>
                  ) : (
                    <span>{m.text}</span>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-xs text-slate-400 pl-8">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                <span>Checking live marketplace...</span>
              </div>
            )}

            {/* Quick prompts — only show when only welcome message present */}
            {messages.length === 1 && !loading && (
              <div className="pl-8 flex flex-col space-y-1.5">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => handleSend(p)}
                    className="text-left px-3 py-1.5 rounded-xl bg-charcoal-900 border border-emerald-950 text-slate-300 hover:text-brand-300 hover:border-brand-500/40 text-[11px] transition-all"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="p-3 bg-charcoal-950 border-t border-emerald-950/80 flex items-center space-x-2 flex-shrink-0"
          >
            <input
              type="text"
              placeholder="e.g. Find 20T CO₂ in Surat..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 px-3 py-2 rounded-xl bg-charcoal-900 border border-emerald-950 text-xs text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none disabled:opacity-50"
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
