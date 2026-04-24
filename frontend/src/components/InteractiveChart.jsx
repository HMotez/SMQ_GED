/**
 * components/InteractiveChart.jsx — Dynamic Chart Component
 * Enhanced Chart.js wrapper with interactivity, animations, and real-time updates
 * Features:
 * - Toggle datasets on/off
 * - Smooth animations
 * - Rich tooltips
 * - Responsive design
 * - Real-time data updates
 */

import { useEffect, useState, useRef } from "react";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { LuEye, LuEyeOff } from "react-icons/lu";

export function InteractiveChart({
  type = "line", // "line", "bar", "doughnut"
  datasets,
  title,
  height = 230,
  showLegend = true,
  enableToggle = true,
  enableAnimation = true,
  colors = [],
  onDataChange,
}) {
  const [visibleDatasets, setVisibleDatasets] = useState(
    datasets.map((_, i) => i) // All visible by default
  );
  const chartRef = useRef(null);

  // Toggle dataset visibility
  const toggleDataset = (index) => {
    setVisibleDatasets((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  // Filter datasets based on visibility
  const filteredDatasets = datasets
    .map((ds, i) => ({
      ...ds,
      hidden: !visibleDatasets.includes(i),
    }))
    .filter((_, i) => visibleDatasets.includes(i));

  if (!datasets || datasets.length === 0 || !datasets[0].data || datasets[0].data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-sm text-center" style={{ color: "rgba(168,191,212,0.5)" }}>
          Aucune donnée disponible
        </p>
      </div>
    );
  }

  const chartData = {
    labels: datasets[0].labels || [],
    datasets: filteredDatasets.map((ds) => ({
      label: ds.label,
      data: ds.data,
      borderColor: ds.lineColor || ds.borderColor,
      backgroundColor: ds.backgroundColor || "transparent",
      fill: ds.fill !== false,
      tension: ds.tension || 0.45,
      borderWidth: ds.borderWidth || 3,
      pointBackgroundColor: "#fff",
      pointBorderColor: ds.lineColor || ds.borderColor,
      pointBorderWidth: 2.5,
      pointRadius: 5,
      pointHoverRadius: 8,
      pointHoverBackgroundColor: ds.lineColor || ds.borderColor,
      borderSkipped: false,
    })),
  };

  const commonOptions = {
    animation: enableAnimation
      ? {
          duration: 1400,
          easing: "easeInOutQuart",
          onProgress: onDataChange,
          onComplete: onDataChange,
        }
      : false,
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        display: showLegend && filteredDatasets.length > 1,
        labels: {
          color: "rgba(168,191,212,0.8)",
          usePointStyle: true,
          pointStyleWidth: 8,
          font: { size: 11, weight: "600" },
          padding: 15,
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: "rgba(8,18,32,0.96)",
        titleColor: "#fff",
        bodyColor: "rgba(168,191,212,0.9)",
        borderColor: "rgba(255,255,255,0.12)",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        displayColors: true,
        callbacks: {
          label: (ctx) => {
            const value = ctx.parsed.y || ctx.parsed;
            return `  ${ctx.dataset.label}: ${value} document${value !== 1 ? "s" : ""}`;
          },
          afterLabel: (ctx) => {
            // Show percentage of total
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((ctx.parsed.y / total) * 100).toFixed(1);
            return `  (${percentage}% du total)`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.06)", borderDash: [4, 4], drawTicks: false },
        ticks: {
          color: "rgba(168,191,212,0.65)",
          font: { size: 11 },
          maxRotation: 45,
          minRotation: 0,
          padding: 8,
        },
        border: { display: false },
      },
      y: {
        grid: { color: "rgba(255,255,255,0.05)", drawTicks: false },
        ticks: {
          color: "rgba(168,191,212,0.45)",
          font: { size: 10 },
          stepSize: 1,
          padding: 8,
        },
        border: { display: false },
        beginAtZero: true,
      },
    },
  };

  // Apply gradient background for line charts
  const linePlugin = {
    id: "lineGradient_" + Math.random(),
    beforeDatasetsDraw(chart) {
      const { ctx, chartArea } = chart;
      if (!chartArea) return;
      chart.data.datasets.forEach((ds, i) => {
        if (datasets[i]?.gradientColors) {
          const [c1, c2] = datasets[i].gradientColors;
          const grad = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          grad.addColorStop(0, c1);
          grad.addColorStop(1, c2);
          ds.backgroundColor = grad;
        }
      });
    },
  };

  const barOptions = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
      y: {
        ...commonOptions.scales.y,
        stacked: false,
      },
    },
  };

  const doughnutOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      legend: {
        ...commonOptions.plugins.legend,
        display: true,
        position: "right",
      },
    },
  };

  let ChartComponent;
  let chartOptions;
  let chartPlugins = [];

  switch (type) {
    case "bar":
      ChartComponent = Bar;
      chartOptions = barOptions;
      break;
    case "doughnut":
      ChartComponent = Doughnut;
      chartOptions = doughnutOptions;
      break;
    case "line":
    default:
      ChartComponent = Line;
      chartOptions = commonOptions;
      chartPlugins = [linePlugin];
  }

  return (
    <div>
      {/* Dataset Toggle Buttons */}
      {enableToggle && datasets.length > 1 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {datasets.map((ds, i) => (
            <button
              key={i}
              onClick={() => toggleDataset(i)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border"
              style={{
                background: visibleDatasets.includes(i)
                  ? `${ds.lineColor || "#4ab83f"}20`
                  : "rgba(255,255,255,0.05)",
                borderColor: visibleDatasets.includes(i)
                  ? `${ds.lineColor || "#4ab83f"}50`
                  : "rgba(255,255,255,0.1)",
                color: visibleDatasets.includes(i)
                  ? ds.lineColor || "#4ab83f"
                  : "rgba(168,191,212,0.5)",
                cursor: "pointer",
              }}
            >
              {visibleDatasets.includes(i) ? (
                <LuEye size={13} />
              ) : (
                <LuEyeOff size={13} />
              )}
              {ds.label}
            </button>
          ))}
        </div>
      )}

      {/* Chart Container */}
      <div style={{ height, position: "relative" }}>
        {filteredDatasets.length > 0 ? (
          <ChartComponent
            ref={chartRef}
            data={chartData}
            options={chartOptions}
            plugins={chartPlugins}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm" style={{ color: "rgba(168,191,212,0.5)" }}>
              Sélectionnez au moins un jeu de données
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Enhanced Area Chart Card with real-time updates
 */
export function DynamicAreaCard({ datasets, title, enableRealtime = false }) {
  const [data, setData] = useState(datasets);
  const [updateCount, setUpdateCount] = useState(0);
  const updateIntervalRef = useRef(null);

  useEffect(() => {
    if (enableRealtime) {
      // Simulate real-time data updates every 10 seconds
      updateIntervalRef.current = setInterval(() => {
        setUpdateCount((prev) => prev + 1);
      }, 10000);
    }

    return () => {
      if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
    };
  }, [enableRealtime]);

  return (
    <div>
      <InteractiveChart
        type="line"
        datasets={data}
        title={title}
        height={230}
        showLegend={data.length > 1}
        enableToggle={true}
        enableAnimation={true}
        onDataChange={() => {
          // Optional: Handle animation completion
        }}
      />
      {enableRealtime && (
        <p className="text-xs mt-2" style={{ color: "rgba(168,191,212,0.4)" }}>
          Mise à jour: {updateCount} fois
        </p>
      )}
    </div>
  );
}

export default InteractiveChart;
