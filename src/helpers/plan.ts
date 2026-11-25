import type { Activity, Deliverable, Master, Phase, Plan, Status, StoredPlan } from "@/types";

export const DAY = 864e5;

/** Warna status: dipakai konsisten di badge, chart, dan board */
export const STATUS: Record<Status, { label: string; color: string; badge: string }> = {
  todo: { label: "Belum mulai", color: "#7b8798", badge: "badge-ghost" },
  doing: { label: "On progress", color: "#0070c0", badge: "badge-info" },
  hold: { label: "Tertunda", color: "#c77700", badge: "badge-warning" },
  done: { label: "Selesai", color: "#107c41", badge: "badge-success" },
};
export const STATUS_ORDER: Status[] = ["todo", "doing", "hold", "done"];
export const LATE_COLOR = "#c9372c";

export const PRESET: Phase[] = [
  { id: "p1", name: "Define", color: "#FF0000" },
  { id: "p2", name: "Measure", color: "#FFC000" },
  { id: "p3", name: "Analyze", color: "#FFFF00" },
  { id: "p4", name: "Improve", color: "#00B050" },
  { id: "p5", name: "Control", color: "#00B0F0" },
  { id: "p6", name: "Daily Task", color: "#A6A6A6" },
];
/** Warna pastel kolom FASE di Excel, sama dengan template */
export const PASTEL: Record<string, string> = { p1: "#DDEBF7", p2: "#E2EFDA", p3: "#FFF2CC", p4: "#FCE4D6", p5: "#EDEDED", p6: "#F2F2F2" };
export const PALETTE = ["#7C3AED", "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#84CC16"];

export const tint = (hex: string, amount = 0.8): string => {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount).toString(16).padStart(2, "0");
  return `#${mix((n >> 16) & 255)}${mix((n >> 8) & 255)}${mix(n & 255)}`.toUpperCase();
};
export const pastelOf = (ph: Phase) => PASTEL[ph.id] ?? tint(ph.color);

/** Master key deliverable awal, dari Excel DMAIC_Project_Timeline */
export const DELIVERABLES: Deliverable[] = ([
  ["p1", "Problem Selection"], ["p1", "VOC"], ["p1", "CTQ"], ["p1", "Project Charter"],
  ["p2", "Data Collection Plan"], ["p2", "Pengumpulan Data"], ["p2", "Visualisasi Data"],
  ["p6", "Technical Learning"],
  ["p3", "Fishbone Diagram"], ["p3", "Pareto Analysis"],
  ["p4", "Alternative Solution"], ["p4", "Implementation / Piloting"], ["p4", "Solution Selection Matrix"],
  ["p5", "Standarisasi"], ["p5", "Monitoring Review"],
] as const).map(([phaseId, name], i) => ({ id: `d${i + 1}`, name, phaseId }));

export const uid = () => Math.random().toString(36).slice(2, 9);
export const blankPlan = (name: string): StoredPlan => ({ id: uid(), name, items: [], log: [] });
export const withMaster = (p: StoredPlan, m: Master): Plan => ({ ...p, phases: m.phases, deliverables: m.deliverables });

/* ---------------- tanggal ---------------- */
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const today = () => iso(new Date());
export const toDate = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const monday = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));
export const diffDays = (a: string, b: string) => Math.round((+toDate(b) - +toDate(a)) / DAY);
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** Format Excel: 01-Sep-26 */
export const dmy = (s: string) => {
  if (!s) return "";
  const d = toDate(s);
  return `${String(d.getDate()).padStart(2, "0")}-${MON[d.getMonth()]}-${String(d.getFullYear()).slice(2)}`;
};
/** Format ringkas: 1 Sep */
export const short = (s: string) => (s ? `${toDate(s).getDate()} ${MON[toDate(s).getMonth()]}` : "");
export const range = (a: string, b: string) => (a === b ? short(a) : `${short(a)} – ${short(b)}`);

/* ---------------- perubahan status ---------------- */
export const touch = (p: { log: string[] }) => (p.log.includes(today()) ? p.log : [...p.log, today()].slice(-180));
export function setItemStatus<T extends StoredPlan>(p: T, id: string, status: Status): T {
  return {
    ...p,
    log: touch(p),
    items: p.items.map((i) => (i.id !== id ? i : { ...i, status, actual: status === "done" ? i.actual || today() : "" })),
  };
}
export const setItemActual = <T extends StoredPlan>(p: T, id: string, actual: string): T => ({
  ...p,
  items: p.items.map((i) => (i.id === id && i.status === "done" ? { ...i, actual } : i)),
});
export const ordered = (p: Plan) => {
  const ix = (id: string) => p.phases.findIndex((f) => f.id === id);
  return [...p.items].sort((a, b) => ix(a.phaseId) - ix(b.phaseId) || a.start.localeCompare(b.start) || a.end.localeCompare(b.end));
};

export function sample(): Activity[] {
  const m = monday(new Date());
  const d = (k: number) => iso(addDays(m, k));
  const a = (phaseId: string, deliverable: string, task: string, s: number, e: number, status: Status): Activity => ({ id: uid(), phaseId, deliverable, task, start: d(s), end: d(e), actual: status === "done" ? d(e) : "", status });
  return [
    a("p1", "Problem Selection", "Identifikasi dan inventarisasi masalah", 0, 2, "done"),
    a("p1", "Project Charter", "Susun SIPOC dan project charter", 3, 6, "doing"),
    a("p2", "Data Collection Plan", "Rencana pengambilan data", 7, 9, "todo"),
    a("p2", "Pengumpulan Data", "Ambil data historis", 9, 13, "todo"),
    a("p3", "Fishbone Diagram", "Root cause analysis bersama tim", 14, 18, "todo"),
  ];
}

/* ---------------- timeline: minggu per bulan sesuai kalender (Senin–Minggu) ----------------
   Sebuah minggu masuk ke bulan yang memuat hari Rabu-nya (mayoritas hari kerja Senin–Jumat ada di bulan itu).
   Week n = urutan hari Rabu di bulan tersebut, jadi sebulan bisa 4 atau 5 minggu.
   Minggu di luar rentang plan ditandai `off` (abu-abu). */
export interface Week { from: Date; to: Date; month: string; n: number; off: boolean }

const monthLabel = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" });
const WEDNESDAY = 3;
const weekMidpoint = (d: Date) => addDays(monday(d), 2);

export function buildWeeks(items: Activity[]): Week[] {
  const dated = items.filter((i) => i.start && i.end);
  if (!dated.length) return [];
  const lo = new Date(Math.min(...dated.map((i) => +toDate(i.start))));
  const hi = new Date(Math.max(...dated.map((i) => +toDate(i.end))));
  const first = weekMidpoint(lo), last = weekMidpoint(hi);
  const weeks: Week[] = [];
  for (let m = new Date(first.getFullYear(), first.getMonth(), 1); m <= last; m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) {
    let n = 0;
    for (let d = new Date(m); d.getMonth() === m.getMonth(); d = addDays(d, 1)) {
      if (d.getDay() !== WEDNESDAY) continue;
      const from = addDays(d, -2), to = addDays(from, 7);
      weeks.push({ from, to, month: monthLabel.format(m), n: ++n, off: +to <= +lo || +from > +hi });
    }
  }
  return weeks;
}
const covers = (w: Week, a: Activity) => +toDate(a.start) < +w.to && +toDate(a.end) >= +w.from;

export interface Row { phase: Phase; label: string; cells: boolean[]; names: string[][]; first: boolean; span: number }
/** Fase DMAIC = semua fase selain Daily Task */
export const isDmaic = (f: Phase) => !/daily\s*task/i.test(f.name);

export interface TimelineOptions {
  /** Fase yang ditampilkan (default: fase DMAIC) */
  phaseIds?: string[];
  /** Fase yang menampilkan baris per key deliverable; fase lain jadi satu baris (default: semua) */
  detailIds?: string[];
}

export function timeline(p: Plan, { phaseIds, detailIds }: TimelineOptions = {}) {
  const dmaic = p.phases.filter((f) => (phaseIds ? phaseIds.includes(f.id) : isDmaic(f)));
  const base = p.items.filter((i) => dmaic.some((f) => f.id === i.phaseId));
  const weeks = buildWeeks(base);
  const rows: Row[] = [];
  dmaic.forEach((ph) => {
    const its = base.filter((i) => i.phaseId === ph.id && i.start && i.end);
    if (!its.length) return;
    const key = (i: Activity) => i.deliverable || ph.name;
    const detail = !detailIds || detailIds.includes(ph.id);
    const groups = detail ? [...new Set(its.map(key))] : [ph.name];
    groups.forEach((g, k) => {
      const sub = detail ? its.filter((i) => key(i) === g) : its;
      const names = weeks.map((w) => sub.filter((a) => covers(w, a)).map((a) => a.task));
      rows.push({ phase: ph, label: g, cells: names.map((n) => n.length > 0), names, first: k === 0, span: groups.length });
    });
  });
  return { weeks, rows };
}
