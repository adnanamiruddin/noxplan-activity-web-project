import type { ReactNode } from "react";
import type { Phase } from "@/types";

export const PhaseDot = ({ phase, className = "" }: { phase?: Phase; className?: string }) => (
  <span className={`inline-block size-3 shrink-0 rounded-[3px] border border-black/10 ${className}`} style={{ background: phase?.color ?? "#ccc" }} aria-hidden />
);

export function Panel({ title, right, children, className = "" }: { title: ReactNode; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-head"><h2>{title}</h2>{right && <div className="text-xs font-medium text-base-content/60">{right}</div>}</div>
      {children}
    </section>
  );
}

export function EmptyPlan({ onExcel, onAdd, onSample }: { onExcel: () => void; onAdd: () => void; onSample: () => void }) {
  return (
    <div className="panel">
      <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
        <h2 className="font-display text-2xl font-bold">Plan ini masih kosong</h2>
        <p className="max-w-md text-sm text-base-content/70">Upload Excel dan semua aktivitas langsung jadi, atau tambah satu per satu.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" className="btn btn-primary" onClick={onExcel}>Upload Excel</button>
          <button type="button" className="btn btn-outline btn-primary" onClick={onAdd}>Tambah aktivitas</button>
          <button type="button" className="btn btn-ghost" onClick={onSample}>Muat contoh</button>
        </div>
      </div>
    </div>
  );
}
