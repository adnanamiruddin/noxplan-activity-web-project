import { useRef } from "react";
import { LuCalendarCheck } from "react-icons/lu";
import { PhaseDot } from "@/components/Bits";
import { usePlan } from "@/context/PlanContext";
import { notify } from "@/helpers/notify";
import { STATUS, STATUS_ORDER, diffDays, range, short, today } from "@/helpers/plan";
import { useStatusChange } from "@/hooks/useStatusChange";
import type { Activity, Status } from "@/types";

/** Judul aktivitas, dengan tanda NEW untuk aktivitas yang ditambahkan setelah halaman dibuka */
export function ActivityTitle({ item }: { item: Activity }) {
  const { plan, isNew } = usePlan();
  // Kalau semua aktivitas baru (mis. plan hasil import), penanda tidak berguna
  const showNew = isNew(item.id) && plan.items.some((i) => !isNew(i.id));
  return (
    <p className={`text-sm font-semibold leading-snug ${item.status === "done" ? "text-base-content/50 line-through" : ""}`}>
      {showNew && <span className="badge badge-success badge-sm mr-1.5 font-bold text-success-content">NEW</span>}
      {item.task}
    </p>
  );
}

export function ActivityMeta({ item }: { item: Activity }) {
  const { plan } = usePlan();
  const phase = plan.phases.find((p) => p.id === item.phaseId);
  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-base-content/60">
      <PhaseDot phase={phase} /> <span className="font-medium text-base-content/75">{item.deliverable || phase?.name}</span>
      <span aria-hidden>·</span> {range(item.start, item.end)}
      {item.status === "done" && item.actual && <><span aria-hidden>·</span> <DoneDate item={item} /></>}
    </p>
  );
}

/** Tanggal selesai aktual; diklik untuk mengubah, mis. kalau aktivitas sebenarnya selesai lebih awal dari hari ia ditandai */
function DoneDate({ item }: { item: Activity }) {
  const { setActual } = usePlan();
  const input = useRef<HTMLInputElement>(null);

  const open = () => {
    try { input.current?.showPicker(); } catch { input.current?.focus(); }
  };
  const change = (value: string) => {
    if (!value || value === item.actual) return;
    if (value > today()) return notify("Tanggal selesai tidak boleh di masa depan", "error");
    setActual(item.id, value);
    notify(`Tanggal selesai diubah ke ${short(value)}`);
  };

  return (
    <span className="relative inline-flex">
      <button type="button" className="inline-flex items-center gap-1 rounded px-1 text-primary underline decoration-dotted underline-offset-2 hover:bg-primary/10" title="Ubah tanggal selesai" aria-label={`Selesai ${short(item.actual)}, ubah tanggal`} onClick={open}>
        <LuCalendarCheck aria-hidden /> selesai {short(item.actual)}
      </button>
      <input ref={input} type="date" tabIndex={-1} aria-hidden className="pointer-events-none absolute inset-0 opacity-0" value={item.actual} max={today()} onChange={(e) => change(e.target.value)} />
    </span>
  );
}

export function LateTag({ item }: { item: Activity }) {
  const t = today();
  if (item.status === "done" || item.end >= t) return null;
  return <span className="badge badge-error badge-soft badge-sm">Terlambat {diffDays(item.end, t)} hari</span>;
}

// Kelas ditulis utuh supaya terdeteksi Tailwind (tidak boleh dirangkai dinamis)
const SELECT_CLASS = { sm: "select select-sm w-32", xs: "select select-xs w-28" } as const;

export function StatusSelect({ item, size = "sm", colored = false }: { item: Activity; size?: keyof typeof SELECT_CLASS; colored?: boolean }) {
  const changeStatus = useStatusChange();
  const color = STATUS[item.status].color;
  return (
    <select
      className={SELECT_CLASS[size]}
      aria-label={`Status: ${item.task}`}
      value={item.status}
      onChange={(e) => changeStatus(item, e.target.value as Status)}
      style={colored ? { borderColor: color, color, fontWeight: 600 } : undefined}
    >
      {STATUS_ORDER.map((s) => <option key={s} value={s} style={{ color: "#17231c" }}>{STATUS[s].label}</option>)}
    </select>
  );
}
