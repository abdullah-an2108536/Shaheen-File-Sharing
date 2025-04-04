"use client";

import React from "react";

export default function IncrementDecrement({
  value,
  onChange,
  min = 1,
  className = "",
}) {
  const decrement = () => {
    onChange(Math.max(value - 1, min));
  };

  const increment = () => {
    onChange(value + 1);
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button onClick={decrement} className="px-2 py-1 bg-gray-200 rounded">
        -
      </button>
      <span>{value}</span>
      <button onClick={increment} className="px-2 py-1 bg-gray-200 rounded">
        +
      </button>
    </div>
  );
}
