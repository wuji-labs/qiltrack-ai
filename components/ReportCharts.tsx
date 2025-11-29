"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { CompanyData } from "@/types/report";

type ChartProps = {
  companyData: CompanyData;
};

// Custom tooltip styling
const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: string | number }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--bg-base)] border border-[var(--stroke-soft)] rounded-lg p-3 shadow-lg backdrop-blur-sm">
        <p className="text-sm text-[var(--text-dim)] mb-1">{label}</p>
        <p className="text-base font-semibold text-[var(--accent-emerald)]">
          {typeof payload[0].value === "number"
            ? payload[0].value.toFixed(2)
            : payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export function PricePerformanceChart({ companyData }: ChartProps) {
  const { quote, metrics } = companyData;

  const data = [
    { name: "52W Low", value: metrics?.["52WeekLow"] || null },
    { name: "Prev Close", value: quote?.prevClose || null },
    { name: "Open", value: quote?.open || null },
    { name: "Current", value: quote?.current || null },
    { name: "52W High", value: metrics?.["52WeekHigh"] || null },
  ].filter((item) => item.value !== null);

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-dim)]">
        Insufficient price data
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-xl font-semibold mb-4 text-[var(--color-foreground)]">
        Price Performance
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="name"
            stroke="var(--text-subtle)"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            stroke="var(--text-subtle)"
            style={{ fontSize: "12px" }}
            domain={["auto", "auto"]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#5be0b0"
            strokeWidth={3}
            dot={{ fill: "#5be0b0", r: 5 }}
            activeDot={{ r: 7, fill: "#5be0b0", stroke: "#fff", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ValuationMetricsChart({ companyData }: ChartProps) {
  const { metrics } = companyData;

  const data = [
    { name: "P/E", value: metrics?.peTTM || null },
    { name: "P/B", value: metrics?.pbAnnual || null },
    { name: "P/S", value: metrics?.psTTM || null },
    { name: "ROE%", value: metrics?.roeTTM || null },
    { name: "ROA%", value: metrics?.roaRfy || null },
  ].filter((item) => item.value !== null);

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-dim)]">
        Valuation metrics unavailable
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-xl font-semibold mb-4 text-[var(--color-foreground)]">
        Valuation & Profitability
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="name"
            stroke="var(--text-subtle)"
            style={{ fontSize: "12px" }}
          />
          <YAxis stroke="var(--text-subtle)" style={{ fontSize: "12px" }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="value"
            fill="#4dd0a6"
            radius={[8, 8, 0, 0]}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function NewsTimelineWidget({ companyData }: ChartProps) {
  const news = companyData.recentNews?.slice(0, 5) || [];

  if (news.length === 0) {
    return null;
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="glass-card p-6">
      <h3 className="text-xl font-semibold mb-4 text-[var(--color-foreground)]">
        Recent News
      </h3>
      <div className="space-y-3">
        {news.map((item, idx) => (
          <div
            key={idx}
            className="border-l-2 border-[var(--accent-emerald)] pl-4 py-2 hover:bg-[var(--bg-layer)] transition-colors rounded-r-lg"
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-sm font-medium text-[var(--color-foreground)] line-clamp-2">
                {item.headline}
              </p>
              <span className="text-xs text-[var(--text-dim)] whitespace-nowrap">
                {item.datetime ? formatDate(item.datetime) : "N/A"}
              </span>
            </div>
            {item.source && (
              <p className="text-xs text-[var(--text-subtle)]">{item.source}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
