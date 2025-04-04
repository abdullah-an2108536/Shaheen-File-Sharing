"use client";
import React, { useState } from "react";
import { Search } from "lucide-react";

export default function SearchBar({ query, setQuery }) {
  return (
    <div className="relative w-full max-w-xs"> {/* ✅ Constrain width */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <Search className="absolute right-3 top-2.5 text-gray-500" size={18} />
    </div>
  );
}
