import React, { useState } from 'react';
import { Bot, Send, Sparkles, User, ShieldCheck } from 'lucide-react';

export const AssistantPage: React.FC = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hello! I am ReCarbo AI Matchmaker. I can help parse natural language carbon requirements, explain 5-factor match fit scores, or evaluate optimal utilization routes for your captured CO2.',
    },
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setInput('');

    setTimeout(() => {
      let reply = 'I parsed your query. Based on deterministic server rules:';
      if (userText.toLowerCase().includes('concrete') || userText.toLowerCase().includes('cement')) {
        reply = 'For precast concrete mineral curing, a 95%+ industrial gas stream is optimal. Dahej or Hazira streams provide suitable pressure and purity with an estimated match fit of ~91.5%.';
      } else if (userText.toLowerCase().includes('polymer') || userText.toLowerCase().includes('plastic')) {
        reply = 'Polymer synthesis requires high-purity (≥99.5%) liquid CO2. The Dahej post-combustion stream (99.8%) delivers 50T capacity at ₹4.50/kg with 92.5% deterministic score.';
      } else {
        reply = `Analyzing query "${userText}". Our deterministic engine has filtered available Gujarat listings for purity, distance, and quantity. You can explore full match score breakdowns on the Marketplace page.`;
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
          <Bot className="w-7 h-7 text-brand-400" />
          <span>AI Circular Carbon Assistant</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Natural-language search parser, deal explainer, and carbon utilization advisor
        </p>
      </div>

      {/* Chat Area */}
      <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-6 shadow-2xl flex flex-col h-[520px]">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex items-start space-x-3 ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-brand-400 flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-charcoal-950 font-medium ml-auto'
                    : 'bg-charcoal-950 border border-emerald-950/60 text-slate-200'
                }`}
              >
                {m.content}
              </div>

              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-charcoal-800 flex items-center justify-center text-slate-300 flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="pt-4 border-t border-emerald-950/60 flex items-center space-x-3">
          <input
            type="text"
            placeholder="Ask for match recommendations, e.g. 'I need 30T liquid CO2 for polymers in Sanand'..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl bg-charcoal-950 border border-emerald-950 text-xs text-white placeholder:text-slate-600 focus:border-brand-500 focus:outline-none"
          />
          <button
            type="submit"
            className="p-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 text-charcoal-950 font-bold shadow-md shadow-brand-500/20 transition-all flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
