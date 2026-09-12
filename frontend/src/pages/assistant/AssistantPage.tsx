import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { assistantService } from '../../services/assistantService';
import { AssistantChatResponse, AssistantStructuredMatch } from '../../types';
import {
  Bot,
  Send,
  Sparkles,
  User,
  ShieldCheck,
  Building,
  Truck,
  Layers,
  ArrowRight,
  TrendingUp,
  Scale,
  RefreshCw,
  HelpCircle,
  Flame,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  actionType?: string;
  structuredData?: any;
  generatedByAI?: boolean;
  timestamp: string;
}

export const AssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      role: 'assistant',
      content: `## 👋 Welcome to ReCarbo AI

I'm your **Grounded Live Engine** — connected directly to the Gujarat circular carbon marketplace in real time.

Here's what I can do for you:

- 🔍 **Find CO2 suppliers** — e.g. *"I need 50T CO2 ≥99% purity near Ahmedabad"*
- ⚖️ **Compare suppliers side-by-side** — e.g. *"Compare Gujarat Carbon Capture vs Hazira Green"*
- 🏭 **CO2 utilization advice** — e.g. *"What purity is needed for concrete curing?"*
- ℹ️ **Platform info** — e.g. *"What is ReCarbo? How does pricing work?"*

> All match scores, pricing, and freight estimates are computed by **deterministic server logic** — never invented by the AI.

How can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const quickPrompts = [
    'I need 30 tonnes of CO2 with >=99% purity near Ahmedabad',
    'Why is Gujarat Carbon Capture better than Hazira Green Synthesis?',
    'What CO2 purity is required for precast concrete mineral curing?',
    'Show available Liquid CO2 streams under ₹4.50/kg',
  ];

  const handleSend = async (userPrompt?: string) => {
    const textToSend = userPrompt || input.trim();
    if (!textToSend || loading) return;

    const userMsgId = 'usr-' + Date.now();
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!userPrompt) setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.map((m) => ({ role: m.role, content: m.content }));
      const response: AssistantChatResponse = await assistantService.sendMessage(textToSend, historyPayload);

      const assistantMsg: ChatMessage = {
        id: 'ast-' + Date.now(),
        role: 'assistant',
        content: response.reply,
        actionType: response.actionType,
        structuredData: response.structuredData,
        generatedByAI: response.generatedByAI,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'assistant',
          content: 'Sorry, I encountered an issue accessing the live marketplace database. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="rounded-2xl bg-charcoal-900 border border-emerald-950/80 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Bot className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                ReCarbo AI
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/30 text-[10px] font-bold text-brand-400 uppercase tracking-wider flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>Grounded Live Engine</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Powered by <span className="text-brand-400 font-semibold">Groq AI</span> · Match scores, pricing &amp; freight are computed by deterministic logic — never invented by the LLM.
            </p>
            <div className="flex items-center space-x-3 mt-2">
              <span className="flex items-center space-x-1 text-[11px] text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                <span>Live marketplace data</span>
              </span>
              <span className="text-slate-700">·</span>
              <span className="flex items-center space-x-1 text-[11px] text-slate-500">
                <ShieldCheck className="w-3 h-3 text-cyan-500" />
                <span>Anti-hallucination grounded</span>
              </span>
              <span className="text-slate-700">·</span>
              <span className="flex items-center space-x-1 text-[11px] text-slate-500">
                <TrendingUp className="w-3 h-3 text-amber-400" />
                <span>5-factor scoring</span>
              </span>
            </div>
          </div>
        </div>
        <Link
          to="/marketplace"
          className="px-4 py-2 rounded-xl bg-charcoal-950 hover:bg-charcoal-800 border border-emerald-950 text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center space-x-1.5 flex-shrink-0"
        >
          <span>Live Marketplace</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1 flex-shrink-0">
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>Try asking:</span>
        </span>
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="px-3 py-1.5 rounded-full bg-charcoal-900 hover:bg-charcoal-800 border border-emerald-950 text-slate-300 hover:text-brand-300 whitespace-nowrap transition-all flex-shrink-0 disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Container */}
      <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 shadow-2xl flex flex-col h-[640px] overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start space-x-3 ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-emerald-950/90 border border-emerald-500/40 flex items-center justify-center text-brand-400 flex-shrink-0 mt-1 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-3xl p-4 sm:p-5 text-xs leading-relaxed space-y-3 ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-brand-600 via-brand-500 to-emerald-400 text-charcoal-950 font-medium ml-auto shadow-lg shadow-brand-500/15'
                    : 'bg-charcoal-950 border border-emerald-950/80 text-slate-200 shadow-xl'
                }`}
              >
                {/* Text Content */}
                {m.role === 'assistant' ? (
                  <div className="text-xs sm:text-sm leading-relaxed prose prose-invert prose-sm max-w-none
                    prose-p:my-1 prose-p:leading-relaxed
                    prose-ul:my-1 prose-ul:pl-4 prose-li:my-0.5
                    prose-ol:my-1 prose-ol:pl-4
                    prose-strong:text-white prose-strong:font-semibold
                    prose-em:text-slate-300
                    prose-headings:text-white prose-headings:font-bold prose-headings:mt-2 prose-headings:mb-1
                    prose-blockquote:border-brand-500 prose-blockquote:text-slate-400 prose-blockquote:not-italic
                    prose-code:text-brand-300 prose-code:bg-charcoal-900 prose-code:px-1 prose-code:rounded">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-xs sm:text-sm leading-relaxed">{m.content}</div>
                )}

                {/* Structured Match Result Cards (if present) */}
                {m.structuredData?.matches && m.structuredData.matches.length > 0 && (
                  <div className="pt-3 border-t border-emerald-950/80 space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand-400 block">
                      Live Matched Inventory Details
                    </span>
                    <div className="grid grid-cols-1 gap-3">
                      {m.structuredData.matches.map((match: AssistantStructuredMatch) => (
                        <div
                          key={match.listingId}
                          className="p-4 rounded-2xl bg-charcoal-900 border border-emerald-500/30 space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="font-bold text-white text-sm">{match.title}</h4>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-brand-400 border border-emerald-500/30">
                                  {match.overallScore}% Match Fit
                                </span>
                              </div>
                              <span className="text-xs text-slate-400">
                                Supplier: <strong className="text-white">{match.supplierName}</strong> ({match.supplierCity})
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-sm font-mono font-bold text-emerald-400">
                                ₹{match.pricePerKg.toFixed(2)}/kg
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                Landed: ~₹{match.landedCostPerKg.toFixed(2)}/kg
                              </span>
                            </div>
                          </div>

                          {/* 5-Factor Score Bar Breakdown */}
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 border-t border-emerald-950/60 text-[11px]">
                            <div className="p-2 rounded-xl bg-charcoal-950 border border-emerald-950/60 text-center">
                              <span className="text-[9px] text-slate-500 block uppercase">Quantity (30%)</span>
                              <span className="font-bold font-mono text-emerald-400">{match.scores.quantity}%</span>
                            </div>
                            <div className="p-2 rounded-xl bg-charcoal-950 border border-emerald-950/60 text-center">
                              <span className="text-[9px] text-slate-500 block uppercase">Purity (25%)</span>
                              <span className="font-bold font-mono text-cyan-400">{match.scores.purity}%</span>
                            </div>
                            <div className="p-2 rounded-xl bg-charcoal-950 border border-emerald-950/60 text-center">
                              <span className="text-[9px] text-slate-500 block uppercase">Distance (20%)</span>
                              <span className="font-bold font-mono text-amber-400">{match.scores.distance}%</span>
                            </div>
                            <div className="p-2 rounded-xl bg-charcoal-950 border border-emerald-950/60 text-center">
                              <span className="text-[9px] text-slate-500 block uppercase">Price (15%)</span>
                              <span className="font-bold font-mono text-emerald-400">{match.scores.price}%</span>
                            </div>
                            <div className="p-2 rounded-xl bg-charcoal-950 border border-emerald-950/60 text-center col-span-2 sm:col-span-1">
                              <span className="text-[9px] text-slate-500 block uppercase">Trust (10%)</span>
                              <span className="font-bold font-mono text-brand-400">{match.scores.availability}%</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-end space-x-2 pt-2">
                            <Link
                              to="/marketplace"
                              className="px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-500/30 text-brand-300 font-semibold text-xs transition-all flex items-center space-x-1"
                            >
                              <span>View in Marketplace</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Structured Comparison Cards (if present) */}
                {m.structuredData?.comparison && (
                  <div className="pt-3 border-t border-emerald-950/80 space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
                      Direct Supplier Feature Matrix
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-4 rounded-2xl bg-charcoal-900 border border-emerald-950 space-y-2">
                        <span className="font-bold text-white block">{m.structuredData.comparison.supplierA.name}</span>
                        <div className="space-y-1 text-slate-300 text-[11px]">
                          <p>Purity: <strong className="text-emerald-400">{m.structuredData.comparison.supplierA.purity}%</strong></p>
                          <p>Price: <strong className="font-mono">₹{m.structuredData.comparison.supplierA.price.toFixed(2)}/kg</strong></p>
                          <p>Capacity: <strong className="font-mono">{m.structuredData.comparison.supplierA.capacityTonnes} Tonnes</strong></p>
                          <p>Trust Rating: <strong className="text-cyan-400">{m.structuredData.comparison.supplierA.trustScore.toFixed(1)}/100</strong></p>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-charcoal-900 border border-emerald-950 space-y-2">
                        <span className="font-bold text-white block">{m.structuredData.comparison.supplierB.name}</span>
                        <div className="space-y-1 text-slate-300 text-[11px]">
                          <p>Purity: <strong className="text-emerald-400">{m.structuredData.comparison.supplierB.purity}%</strong></p>
                          <p>Price: <strong className="font-mono">₹{m.structuredData.comparison.supplierB.price.toFixed(2)}/kg</strong></p>
                          <p>Capacity: <strong className="font-mono">{m.structuredData.comparison.supplierB.capacityTonnes} Tonnes</strong></p>
                          <p>Trust Rating: <strong className="text-cyan-400">{m.structuredData.comparison.supplierB.trustScore.toFixed(1)}/100</strong></p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>{m.timestamp}</span>
                  {m.role === 'assistant' && (
                    <span className={`flex items-center space-x-1 font-semibold ${
                      m.generatedByAI ? 'text-brand-400' : 'text-slate-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        m.generatedByAI ? 'bg-brand-400' : 'bg-slate-600'
                      }`} />
                      <span>{m.generatedByAI ? 'Groq AI (compound-mini)' : 'Rule-based fallback'}</span>
                    </span>
                  )}
                </div>
              </div>

              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-charcoal-800 flex items-center justify-center text-slate-300 flex-shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* Loading Pulse */}
          {loading && (
            <div className="flex items-start space-x-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-emerald-950/90 border border-emerald-500/40 flex items-center justify-center text-brand-400 flex-shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-4 rounded-2xl bg-charcoal-950 border border-emerald-950 text-xs text-slate-400 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                <span>Querying live marketplace data & generating AI response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 bg-charcoal-950 border-t border-emerald-950/80 flex items-center space-x-3"
        >
          <input
            type="text"
            placeholder="Ask ReCarbo AI (e.g. 'I need 40T CO2 >99% purity in Bharuch at max ₹4.20')..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-2xl bg-charcoal-900 border border-emerald-950 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 text-charcoal-950 font-bold shadow-lg shadow-brand-500/20 disabled:opacity-40 transition-all flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
