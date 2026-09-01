import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, RefreshCw, Sun, Sandwich, Moon } from 'lucide-react';

const MEAL_ICONS = { Breakfast: Sun, Lunch: Sandwich, Dinner: Moon };

export default function AIMealKits() {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSuggestions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:
          "You are a Nigerian meal-planning assistant for UKART, a Lagos grocery delivery app. Suggest three affordable, locally relevant meal kits — one for breakfast, one for lunch, and one for dinner. For each, give a catchy name, a short description (1 sentence), a list of 4-6 grocery items with quantities (typical Nigerian ingredients available in Lagos markets), and an estimated total price in Naira. Keep prices realistic for Lagos.",
        response_json_schema: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  meal_type: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  items: { type: 'array', items: { type: 'string' } },
                  estimated_price: { type: 'number' },
                },
              },
            },
          },
        },
      });
      setSuggestions(res.suggestions || []);
    } catch {
      setError('Could not load suggestions. Try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  return (
    <section className="px-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#2E7D32]" />
          <h2 className="text-base font-bold text-gray-900">AI Meal Kit Ideas</h2>
        </div>
        <button
          onClick={fetchSuggestions}
          disabled={loading}
          className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : (
            <RefreshCw className="w-4 h-4 text-gray-500" />
          )}
        </button>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Smart suggestions for your breakfast, lunch and dinner.
      </p>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading && !suggestions && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[#2E7D32]" />
        </div>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="space-y-3">
          {suggestions.map((s, i) => {
            const Icon = MEAL_ICONS[s.meal_type] || Sun;
            return (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-8 h-8 rounded-full bg-[#E8F5E9] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-[#2E7D32]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-[#2E7D32] uppercase">
                      {s.meal_type}
                    </p>
                    <h3 className="text-sm font-bold text-gray-900 leading-tight line-clamp-1">
                      {s.name}
                    </h3>
                  </div>
                  <span className="ml-auto text-sm font-bold text-[#2E7D32] flex-shrink-0">
                    ₦{(s.estimated_price || 0).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{s.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {s.items?.map((it, j) => (
                    <span
                      key={j}
                      className="text-[11px] bg-gray-50 text-gray-600 px-2 py-1 rounded-full"
                    >
                      {it}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}