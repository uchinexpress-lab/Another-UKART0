import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, RefreshCw, Sun, Sandwich, Moon } from 'lucide-react';

const MEAL_ICONS = { Breakfast: Sun, Lunch: Sandwich, Dinner: Moon };

const getMealType = () => {
  const h = new Date().getHours();
  if (h < 11) return 'Breakfast';
  if (h < 16) return 'Lunch';
  return 'Dinner';
};

export default function AIMealKits() {
  const [mealType] = useState(getMealType());
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSuggestion = async (type) => {
    setLoading(true);
    setError('');
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a Nigerian meal-planning assistant for UKART, a Lagos grocery delivery app. Suggest one affordable, locally relevant meal kit for ${type}. Give a catchy name, a short description (1 sentence), a list of 4-6 grocery items with quantities (typical Nigerian ingredients available in Lagos markets), and an estimated total price in Naira. Keep the price realistic for Lagos.`,
        response_json_schema: {
          type: 'object',
          properties: {
            suggestion: {
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
      });
      setSuggestion(res.suggestion || null);
    } catch {
      setError('Could not load a suggestion. Try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestion(mealType);
  }, [mealType]);

  const Icon = MEAL_ICONS[mealType] || Sun;

  return (
    <section className="px-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#2E7D32]" />
          <h2 className="text-base font-bold text-gray-900">AI {mealType} Idea</h2>
        </div>
        <button
          onClick={() => fetchSuggestion(mealType)}
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
        A smart meal kit pick for your {mealType.toLowerCase()} right now.
      </p>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading && !suggestion && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[#2E7D32]" />
        </div>
      )}

      {suggestion && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-full bg-[#E8F5E9] flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-[#2E7D32]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-[#2E7D32] uppercase">
                {suggestion.meal_type || mealType}
              </p>
              <h3 className="text-sm font-bold text-gray-900 leading-tight line-clamp-1">
                {suggestion.name}
              </h3>
            </div>
            <span className="ml-auto text-sm font-bold text-[#2E7D32] flex-shrink-0">
              ₦{(suggestion.estimated_price || 0).toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-2">{suggestion.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestion.items?.map((it, j) => (
              <span
                key={j}
                className="text-[11px] bg-gray-50 text-gray-600 px-2 py-1 rounded-full"
              >
                {it}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}