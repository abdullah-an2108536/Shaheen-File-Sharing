"use client";
import React, { useState } from "react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function DaySelector({ selectedDays, onChange }) {
  // selectedDays could be an array of strings or indexes

  const handleToggleDay = (day) => {
    const isSelected = selectedDays.includes(day);
    if (isSelected) {
      onChange(selectedDays.filter((d) => d !== day));
    } else {
      onChange([...selectedDays, day]);
    }
  };

  return (
    <div className="flex space-x-2 mt-2">
      {DAYS.map((day) => (
        <button
          key={day}
          type="button"
          onClick={() => handleToggleDay(day)}
          className={`px-2 py-1 rounded   border-4
            ${
              selectedDays.includes(day)
                ? "bg-blue-600 text-white"
                : "bg-gray-100"
            }`}
        >
          {day}
        </button>
      ))}
    </div>
  );
}
