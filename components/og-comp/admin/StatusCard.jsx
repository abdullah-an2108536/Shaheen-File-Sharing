"use client";
import React from "react";

export default function StatusCard({
  icon: Icon,
  iconBgColor,
  title,
  value,
  percentage,
  showPercentage = false,
  width = "auto",
  small = false
}) {
  return (
    <div
      className={`flex items-center bg-white shadow-md rounded-xl px-4 py-3 ${
        width === "full" ? "w-full" : "w-64"
      }${small ? "min-w-[150px]" : "min-w-[200px]"}`}
    >
      {/* Icon Section */}
      <div className={`p-3 rounded-full ${iconBgColor}`}>
        <Icon size={24} className="text-white" />
      </div>

      {/* Text Content */}
      <div className="ml-4 flex-1">
        <div className="text-gray-500 text-sm">{title}</div>
        <div className="text-lg font-bold">{value}</div>
      </div>

      {/* Optional Percentage */}
      {showPercentage && percentage !== undefined && (
        <div
          className={`text-sm font-semibold ${
            percentage > 15 ? "text-green-500" : "text-red-500"
          }`}
        >
          {percentage}%
        </div>
      )}
    </div>
  );
}
