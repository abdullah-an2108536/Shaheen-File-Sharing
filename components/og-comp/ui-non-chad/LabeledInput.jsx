// LabeledInput.jsx
"use client";
import React from "react";

export default function LabeledInput({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  className = "",
  disabled = false,
}) {
  return (
    <div className={`mb-4 ${className}`}>
      <label className="block mb-2 text-gray-700">
        {label}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="inputBlock_label"
          required={required}
          disabled={disabled}
        />
      </label>
    </div>
  );
}
