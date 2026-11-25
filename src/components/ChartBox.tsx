import dynamic from "next/dynamic";
import type { ChartConfiguration } from "chart.js";

// Chart.js hanya berjalan di browser; dimuat terpisah agar render awal ringan
const ChartCanvas = dynamic(() => import("@/components/ChartCanvas"), { ssr: false, loading: () => <div className="skeleton h-full w-full" /> });

export default function ChartBox({ config, height = 260, label }: { config: ChartConfiguration; height?: number; label: string }) {
  return <ChartCanvas config={config} height={height} label={label} />;
}
