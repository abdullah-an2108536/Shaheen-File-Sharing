"use client";
import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// const defaultData = [
//   { year: "2023", transfers: 50000 },
//   { year: "2024", transfers: 100000 },
//   { year: "2025", transfers: 75000 },
//   { year: "2026", transfers: 200000 },
//   { year: "2028", transfers: 232311 },
//   { year: "2029", transfers: 275000 },
//   { year: "2030", transfers: 101010 },

// ];

export default function TransfersChart({ data = [] }) {
  if (data.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center w-full">
        No transfers available
      </div>
    );
  }

  return (
    <div className="w-full h-auto min-h-[300px]">
      <div className="text-lg font-semibold text-gray-700 mb-2">Number of Transfers</div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ left: 10, right: 10, top: 10, bottom: 10 }}
        >
          <XAxis dataKey="period" stroke="#8884d8" />
          <YAxis stroke="#8884d8" />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="transfers"
            stroke="#FFB300"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
