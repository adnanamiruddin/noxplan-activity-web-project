import { useEffect, useRef } from "react";
import {
  ArcElement, BarController, BarElement, CategoryScale, Chart, DoughnutController, Filler, Legend, LinearScale,
  LineController, LineElement, PointElement, Tooltip,
} from "chart.js";
import type { ChartConfiguration } from "chart.js";

Chart.register(ArcElement, BarController, BarElement, CategoryScale, DoughnutController, Filler, Legend, LinearScale, LineController, LineElement, PointElement, Tooltip);
Chart.defaults.font.family = '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif';
Chart.defaults.color = "#4b5a51";
Chart.defaults.borderColor = "#e3eae5";

/** Chart dibuat ulang tiap config berubah (data kecil, plugin ikut diperbarui) */
export default function ChartCanvas({ config, height, label }: { config: ChartConfiguration; height: number; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const chart = new Chart(ref.current, config);
    return () => chart.destroy();
  }, [config]);
  return (
    <div className="relative w-full" style={{ height }}>
      <canvas ref={ref} role="img" aria-label={label} />
    </div>
  );
}
