import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { Chart, type ChartConfiguration, registerables } from "chart.js";
import type { CompanyData } from "@/types/report";

Chart.register(...registerables);

type ChartDataset = {
  label: string;
  data: Array<number | null>;
  borderColor: string;
  backgroundColor: string;
  fill?: boolean;
  tension?: number;
};

export type ReportChart = {
  id: "performance" | "valuation";
  type: "line" | "bar";
  title: string;
  labels: string[];
  datasets: ChartDataset[];
  note?: string;
  hasData: boolean;
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const pickValues = (values: Array<number | undefined | null>): Array<number | null> => {
  return values.map((value) => (isFiniteNumber(value) ? value : null));
};

export function buildPerformanceChart(company: CompanyData): ReportChart {
  const quote = company.quote || {};
  const metrics = company.metrics || {};
  const labels = ["52W Low", "Prev Close", "Open", "Current", "52W High"];
  const values = pickValues([
    metrics["52WeekLow"],
    quote.prevClose,
    quote.open,
    quote.current,
    metrics["52WeekHigh"],
  ]);
  const hasData = values.some((value) => isFiniteNumber(value));

  return {
    id: "performance",
    type: "line",
    title: "Price & volatility",
    labels,
    datasets: [
      {
        label: company.symbol,
        data: values,
        borderColor: "rgba(91,224,176,1)",
        backgroundColor: "rgba(91,224,176,0.16)",
        fill: true,
        tension: 0.25,
      },
    ],
    note: hasData ? undefined : "Insufficient price data",
    hasData,
  };
}

export function buildValuationChart(company: CompanyData): ReportChart {
  const metrics = company.metrics || {};
  const labels = ["P/E", "P/B", "P/S", "ROE", "ROA"];
  const values = pickValues([
    metrics.peTTM,
    metrics.pbAnnual,
    metrics.psTTM,
    metrics.roeTTM,
    metrics.roaRfy,
  ]);
  const hasData = values.some((value) => isFiniteNumber(value));

  return {
    id: "valuation",
    type: "bar",
    title: "Valuation & profitability",
    labels,
    datasets: [
      {
        label: "Multiples & returns",
        data: values,
        borderColor: "rgba(77,208,166,1)",
        backgroundColor: "rgba(77,208,166,0.32)",
      },
    ],
    note: hasData ? undefined : "Valuation metrics unavailable",
    hasData,
  };
}

export async function renderChartPng(
  chart: ReportChart,
  options: { width?: number; height?: number } = {}
): Promise<Buffer | null> {
  if (typeof window !== "undefined") {
    return null;
  }

  if (!chart.hasData) {
    return null;
  }

  const width = options.width ?? 900;
  const height = options.height ?? 480;

  const configuration: ChartConfiguration = {
    type: chart.type,
    data: {
      labels: chart.labels,
      datasets: chart.datasets.map((dataset) => ({
        ...dataset,
        data: dataset.data.map((value) => (value === null ? null : value)),
      })),
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: "#dce7ff",
            font: { size: 12 },
          },
        },
        title: {
          display: true,
          text: chart.title,
          color: "#e9f7ff",
          font: { size: 16, weight: 600 },
        },
      },
      scales: {
        x: {
          ticks: { color: "#c8d5ff", font: { size: 11 } },
          grid: { display: false },
        },
        y: {
          ticks: { color: "#c8d5ff", font: { size: 11 } },
          grid: { color: "rgba(255,255,255,0.06)" },
        },
      },
    },
  };

  try {
    const canvas = new ChartJSNodeCanvas({
      width,
      height,
      backgroundColour: "rgba(10,10,12,1)",
    });
    return await canvas.renderToBuffer(configuration);
  } catch (error) {
    console.error("Failed to render chart PNG:", error);
    return null;
  }
}
