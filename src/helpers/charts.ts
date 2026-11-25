import type { ChartConfiguration, Plugin } from "chart.js";
import { STATUS, STATUS_ORDER, short } from "@/helpers/plan";
import { sCurve } from "@/helpers/stats";
import type { Activity, Plan } from "@/types";

const INK = "#4b5a51";
const tip = { backgroundColor: "#17231c", titleColor: "#fff", bodyColor: "#e8f3ec", padding: 10, cornerRadius: 8, boxPadding: 4 };

/** Garis putus-putus "Hari ini" pada kurva rencana vs aktual */
const todayLine = (idx: number): Plugin<"line"> => ({
  id: "todayLine",
  afterDatasetsDraw(chart) {
    if (idx < 0) return;
    const { ctx, chartArea, scales } = chart;
    const x = scales.x.getPixelForValue(idx);
    ctx.save();
    ctx.strokeStyle = "#c77700"; ctx.fillStyle = "#c77700"; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(x, chartArea.top); ctx.lineTo(x, chartArea.bottom); ctx.stroke();
    ctx.setLineDash([]); ctx.font = "600 11px 'Plus Jakarta Sans', sans-serif";
    const label = "Hari ini", w = ctx.measureText(label).width;
    ctx.fillText(label, Math.min(x + 5, chartArea.right - w), chartArea.top + 11);
    ctx.restore();
  },
});

export function sCurveConfig(items: Activity[]): ChartConfiguration<"line"> | null {
  const sc = sCurve(items);
  if (!sc) return null;
  return {
    type: "line",
    data: {
      labels: sc.dates.map(short),
      datasets: [
        { label: "Rencana", data: sc.planned, borderColor: "#7b8798", borderDash: [6, 4], borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, tension: 0.25 },
        { label: "Aktual", data: sc.actual, borderColor: "#107c41", backgroundColor: "rgb(16 124 65 / 0.12)", fill: true, borderWidth: 2.5, pointRadius: 3, pointHoverRadius: 6, pointBackgroundColor: "#107c41", pointBorderColor: "#fff", pointBorderWidth: 1.5, tension: 0.25, spanGaps: false },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
      scales: { y: { min: 0, max: 100, ticks: { callback: (v) => `${v}%`, color: INK, stepSize: 25 }, grid: { color: "#e3eae5" }, border: { display: false } }, x: { grid: { display: false }, ticks: { color: INK, maxRotation: 0, autoSkipPadding: 14 } } },
      plugins: { legend: { position: "top", align: "end", labels: { usePointStyle: true, boxWidth: 8, color: INK } }, tooltip: { ...tip, callbacks: { label: (c) => ` ${c.dataset.label}: ${c.parsed.y}%` } } },
    },
    plugins: [todayLine(sc.todayIndex)],
  };
}

export function statusConfig(items: Activity[]): ChartConfiguration<"doughnut"> {
  return {
    type: "doughnut",
    data: { labels: STATUS_ORDER.map((s) => STATUS[s].label), datasets: [{ data: STATUS_ORDER.map((s) => items.filter((i) => i.status === s).length), backgroundColor: STATUS_ORDER.map((s) => STATUS[s].color), borderColor: "#fff", borderWidth: 3, hoverOffset: 4 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: "68%", plugins: { legend: { display: false }, tooltip: { ...tip, callbacks: { label: (c) => ` ${c.label}: ${c.parsed} aktivitas` } } } },
  };
}

export function phaseConfig(plan: Plan): ChartConfiguration<"bar"> {
  const phases = plan.phases.filter((f) => plan.items.some((i) => i.phaseId === f.id));
  return {
    type: "bar",
    data: {
      labels: phases.map((f) => f.name),
      datasets: [...STATUS_ORDER].reverse().map((s) => ({
        label: STATUS[s].label, backgroundColor: STATUS[s].color, borderColor: "#fff", borderWidth: 2, borderRadius: 4, borderSkipped: false,
        data: phases.map((f) => plan.items.filter((i) => i.phaseId === f.id && i.status === s).length),
      })),
    },
    options: {
      indexAxis: "y", responsive: true, maintainAspectRatio: false,
      scales: { x: { stacked: true, ticks: { precision: 0, color: INK }, grid: { color: "#e3eae5" }, border: { display: false } }, y: { stacked: true, grid: { display: false }, ticks: { color: INK, font: { weight: 600 } } } },
      plugins: { legend: { position: "top", align: "end", labels: { usePointStyle: true, boxWidth: 8, color: INK } }, tooltip: { ...tip, callbacks: { label: (c) => ` ${c.dataset.label}: ${c.parsed.x}` } } },
    },
  };
}
