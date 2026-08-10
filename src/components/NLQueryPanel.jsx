import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Bot, Loader2, HelpCircle } from 'lucide-react';

export default function NLQueryPanel() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setResponse(null);

    // Simulate AI reasoning delay for demo feel
    setTimeout(() => {
      setLoading(false);
      setResponse({
        answer:
          "Room 305 wasted the most energy today, consuming 1,800 W while completely unoccupied for over 2 hours.",
        chart_data: null,
      });
    }, 800);
  };

  const sampleQueries = [
    "Which room wasted the most energy today?",
    "Show energy savings for CSE Block",
    "Any active alerts in ECE Block?",
  ];

  return (
    <section className="p-[1px] bg-gradient-to-br from-indigo-500/30 via-violet-500/20 to-cyan-500/20 rounded-2xl shadow-sm">
      <div className="bg-white/85 backdrop-blur-xl p-6 rounded-[15px] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                AI Energy Intelligence Assistant
              </h3>
              <p className="text-xs text-slate-500">
                Ask natural language questions about telemetry, wastage, and room efficiency
              </p>
            </div>
          </div>

          <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 flex items-center gap-1">
            <Bot className="w-3.5 h-3.5 text-indigo-600" />
            ClassWatch AI
          </span>
        </div>

        {/* Query Input Form */}
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about your rooms... e.g. 'which room wasted the most energy today?'"
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200/90 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-tr from-indigo-600 to-violet-600 text-white rounded-lg hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>

        {/* Quick Sample Queries */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            Try asking:
          </span>
          {sampleQueries.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuery(sample);
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              "{sample}"
            </button>
          ))}
        </div>

        {/* Loading / Answer Display Area */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center gap-3"
            >
              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
              <span className="text-xs font-semibold text-indigo-700">
                Analyzing campus telemetry data & sensor logs...
              </span>
            </motion.div>
          )}

          {response && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 bg-gradient-to-r from-indigo-50/80 via-violet-50/60 to-slate-50/80 rounded-xl border border-indigo-100/90 shadow-xs flex items-start gap-3"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider">
                  AI Answer
                </p>
                <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                  {response.answer}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
