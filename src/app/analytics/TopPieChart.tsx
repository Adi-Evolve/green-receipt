"use client";
import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#1e90ff", "#00c49f", "#ffbb28", "#ff8042", "#a259ff"];

export default function TopPieChart({
  data,
  title,
}: {
  data: { name: string; value: number }[];
  title: string;
}) {
  return (
    <div style={{ width: "100%", height: 250 }}>
      <h3 className="font-semibold mb-2">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={70}
            fill="#8884d8"
            label
          >
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
