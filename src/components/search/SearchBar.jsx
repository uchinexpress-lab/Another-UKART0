import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search groceries, fruits, rice, vegetables…"
        className="w-full pl-12 pr-4 h-12 rounded-2xl bg-gray-100 border-0 text-sm font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-[#2E7D32] focus:bg-white outline-none transition-all"
      />
    </form>
  );
}