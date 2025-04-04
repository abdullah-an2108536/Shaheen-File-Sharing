"use client";
import React from "react";

export default function ToggleSwitch({ label, checked, onChange }) {
  return (
    <div className="flex items-center mb-4">
      <span className="mr-2 text-gray-700">{label}</span>
      <label className="relative inline-block w-10 h-5">
        <input
          type="checkbox"
          className="opacity-0 w-0 h-0 peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          className="absolute cursor-pointer inset-0 bg-gray-300 rounded-full 
                     peer-checked:bg-blue-600 transition-colors duration-200"
        />
        <span
          className="absolute left-0 top-0 bg-white w-5 h-5 rounded-full
                     transform transition-transform duration-200 
                     peer-checked:translate-x-5"
        />
      </label>
    </div>
  );
}
