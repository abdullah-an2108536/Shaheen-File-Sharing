"use client";
import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, payload }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <g>
      <text x={x} y={y - 8} fill="white" textAnchor="middle" fontSize={12} fontWeight="bold">
        {payload.name}
      </text>
      <text x={x} y={y + 8} fill="white" textAnchor="middle" fontSize={12}>
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    </g>
  );
};

export default function StorageOverview({ title, data = defaultData, size = 220 }) {
  return (
    <div className="w-full h-auto min-h-[250px]">
      <div className="text-lg font-semibold text-gray-700 mb-2">{title}</div>
      <ResponsiveContainer width="100%" height={size}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={size / 2.8} // ← scale with container
            labelLine={false}
            label={renderCustomizedLabel}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

