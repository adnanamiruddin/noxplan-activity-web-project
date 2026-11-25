import { DAY, addDays, diffDays, iso, range, today, toDate } from "@/helpers/plan";
import type { Activity, Plan } from "@/types";

/* ---------------- hitungan dasar ---------------- */
export interface Counts { total: number; done: number; doing: number; todo: number; hold: number; late: number; pct: number }
export function counts(items: Activity[]): Counts {
  const t = today();
  const c: Counts = { total: items.length, done: 0, doing: 0, todo: 0, hold: 0, late: 0, pct: 0 };
  for (const i of items) {
    c[i.status]++;
    if (i.status !== "done" && i.end && i.end < t) c.late++;
  }
  c.pct = c.total ? Math.round((c.done / c.total) * 100) : 0;
  return c;
}

/** Posisi hari ini terhadap rentang plan */
export function dayProgress(items: Activity[]) {
  const ds = items.filter((i) => i.start && i.end);
  if (!ds.length) return null;
  const from = ds.map((i) => i.start).sort()[0];
  const to = ds.map((i) => i.end).sort().reverse()[0];
  const t = today();
  const total = diffDays(from, to) + 1;
  const left = diffDays(t, to);
  const label = t < from ? `Mulai ${diffDays(t, from)} hari lagi` : t > to ? `Rencana selesai ${-left} hari lalu` : `Hari ke-${diffDays(from, t) + 1} dari ${total}`;
  return { from, to, total, left: Math.max(left, 0), label };
}

/* ---------------- fokus hari ini ---------------- */
export function focusToday(items: Activity[]) {
  const t = today();
  const rank = (i: Activity) => (i.end < t ? 0 : i.status === "doing" ? 1 : 2);
  return items
    .filter((i) => i.status !== "done" && i.status !== "hold" && i.start && i.end && (i.end < t || (i.start <= t && t <= i.end)))
    .sort((a, b) => rank(a) - rank(b) || a.end.localeCompare(b.end));
}
export const nextUp = (items: Activity[]) => {
  const t = today();
  return items.filter((i) => i.status !== "done" && i.start > t).sort((a, b) => a.start.localeCompare(b.start))[0];
};

/* ---------------- skor Planning / Drive / Action (0-100, null = belum cukup data) ---------------- */
export function scores(p: Plan) {
  const it = p.items, t = today(), n = it.length;
  const full = it.filter((i) => i.deliverable && i.start && i.end && i.task).length;
  const used = p.phases.filter((f) => it.some((i) => i.phaseId === f.id)).length;
  const planning = n && p.phases.length ? Math.round((full / n + used / p.phases.length) * 50) : null;

  const last7 = new Set(Array.from({ length: 7 }, (_, k) => iso(new Date(Date.now() - k * DAY))));
  const days = p.log.filter((d) => last7.has(d)).length;
  const started = it.filter((i) => i.start && i.start <= t);
  const idle = started.filter((i) => i.status === "todo").length;
  const act = Math.min(days / 5, 1);
  const ini = started.length ? started.filter((i) => i.status !== "todo").length / started.length : null;
  const drive = n ? Math.round((ini === null ? act : (act + ini) / 2) * 100) : null;

  const due = it.filter((i) => i.end && i.end <= t);
  const sch = due.length ? due.filter((i) => i.status === "done").length / due.length : null;
  const fin = it.filter((i) => i.status === "done" && i.actual && i.end);
  const ont = fin.length ? fin.filter((i) => i.actual <= i.end).length / fin.length : null;
  const parts = [sch, ont].filter((x): x is number => x !== null);
  const action = parts.length ? Math.round((parts.reduce((s, x) => s + x, 0) / parts.length) * 100) : null;

  const unfinished = n - full;
  const emptyPhases = p.phases.filter((f) => !it.some((i) => i.phaseId === f.id)).map((f) => f.name);
  const late = counts(it).late;
  return {
    planning, drive, action, days,
    tips: {
      planning: !n ? "Tambah aktivitas untuk mulai dinilai." : unfinished ? `${unfinished} aktivitas datanya belum lengkap.` : emptyPhases.length ? `Fase ${emptyPhases.slice(0, 2).join(", ")} belum punya aktivitas.` : "Rencana sudah lengkap.",
      drive: !n ? "Tambah aktivitas untuk mulai dinilai." : idle ? `${idle} aktivitas sudah lewat tanggal mulai tapi belum dimulai.` : days < 5 ? `Update progres ${5 - days} hari lagi minggu ini untuk capai target.` : "Konsisten, pertahankan.",
      action: action === null ? "Belum ada aktivitas yang jatuh tempo." : late ? `${late} aktivitas lewat tenggat. Selesaikan yang terdekat dulu.` : "Tidak ada yang terlambat.",
    },
  };
}
/* ---------------- data chart ---------------- */
export function sCurve(items: Activity[]) {
  const ds = items.filter((i) => i.start && i.end);
  if (!ds.length) return null;
  const t = today();
  const lo = ds.map((i) => i.start).sort()[0];
  const hi = [...ds.map((i) => i.end), ...ds.map((i) => i.actual).filter(Boolean)].sort().reverse()[0];
  const span = Math.max(diffDays(lo, hi), 1);
  const step = Math.max(1, Math.ceil(span / 22));
  const dates: string[] = [];
  for (let k = 0; k < span; k += step) dates.push(iso(addDays(toDate(lo), k)));
  dates.push(hi);
  if (t > lo && t < hi && !dates.includes(t)) dates.push(t);
  dates.sort();
  const n = ds.length;
  const planned = dates.map((d) => Math.round((ds.filter((i) => i.end <= d).length / n) * 100));
  const actual = dates.map((d) => (d > t ? null : Math.round((ds.filter((i) => i.status === "done" && (i.actual || i.end) <= d).length / n) * 100)));
  let todayIndex = -1;
  dates.forEach((d, k) => { if (d <= t) todayIndex = k; });
  if (t < lo) todayIndex = -1;
  return { dates, planned, actual, todayIndex };
}


export { range };
