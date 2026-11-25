import dataValidation from "@onparallel/write-excel-file-data-validation";
import { STATUS, addDays, iso, ordered, pastelOf, timeline, toDate, today, uid } from "@/helpers/plan";
import type { TimelineOptions } from "@/helpers/plan";
import type { Activity, Master, Plan, Status } from "@/types";

/** Header template resmi. Urutan dan nama kolom sama dengan Excel DMAIC_Project_Timeline */
export const HEADERS = ["FASE", "KEY DELIVERABLES", "DESKRIPSI", "RENCANA MULAI", "RENCANA SELESAI"] as const;
const EXTRA = ["SELESAI AKTUAL", "STATUS"] as const;
const SHEET = "Project Timeline";
const GUIDE = "Panduan";
const BD = { borderColor: "#BFBFBF" };
const FONT = { fontFamily: "Aptos Display", fontSize: 11 };

type Cell = Record<string, unknown>;
type Row = (Cell | null)[];

/** Tanggal ditulis sebagai tengah hari UTC agar hari tidak bergeser di zona waktu mana pun */
const dateCell = (s: string): Cell =>
  s ? { value: new Date(Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10), 12)), type: Date, format: "d-mmm-yy", align: "center", alignVertical: "center", ...BD } : { value: " ", ...BD };
const txt = (v: string, extra: Cell = {}): Cell => ({ value: v || " ", wrap: true, alignVertical: "center", align: "left", ...BD, ...extra });
const head = (v: string): Cell => ({ value: v, fontWeight: "bold", backgroundColor: "#A6A6D1", align: "center", alignVertical: "center", wrap: true, ...BD });

async function save(sheets: unknown[], filename: string) {
  const { default: write } = await import("write-excel-file/universal");
  const blob = await (write as unknown as (s: unknown, o: unknown) => { toBlob: () => Promise<Blob> })(sheets, { features: [dataValidation], ...FONT }).toBlob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const safe = (s: string) => (s || "plan").replace(/[^\w-]+/g, "_").replace(/_+/g, "_").slice(0, 40);

/** Sheet "Panduan": daftar nilai yang valid, juga jadi sumber dropdown */
function guideSheet(m: Master) {
  const dl = [...m.deliverables].sort((a, b) => m.phases.findIndex((p) => p.id === a.phaseId) - m.phases.findIndex((p) => p.id === b.phaseId));
  const n = Math.max(m.phases.length, dl.length);
  const data: Row[] = [[head("FASE"), head("KEY DELIVERABLES"), head("MILIK FASE")]];
  for (let k = 0; k < n; k++) {
    const d = dl[k];
    data.push([
      m.phases[k] ? txt(m.phases[k].name.toUpperCase(), { align: "center", fontWeight: "bold", backgroundColor: pastelOf(m.phases[k]) }) : null,
      d ? txt(d.name) : null,
      d ? txt((m.phases.find((p) => p.id === d.phaseId)?.name ?? "").toUpperCase(), { align: "center" }) : null,
    ]);
  }
  return { data, sheet: GUIDE, columns: [{ width: 16 }, { width: 32 }, { width: 16 }], stickyRowsCount: 1, nPhases: m.phases.length, nDeliverables: dl.length };
}

function dropdowns(g: { nPhases: number; nDeliverables: number }, lastRow: number) {
  const rng = (col: number) => ({ from: { row: 2, column: col }, to: { row: lastRow, column: col } });
  return [
    { cellRange: rng(1), validation: { type: "list", valuesRange: `${GUIDE}!$A$2:$A$${g.nPhases + 1}`, errorTitle: "FASE tidak dikenal", error: "Pilih FASE dari daftar." } },
    { cellRange: rng(2), validation: { type: "list", valuesRange: `${GUIDE}!$B$2:$B$${g.nDeliverables + 1}`, errorTitle: "Key deliverable tidak dikenal", error: "Pilih KEY DELIVERABLES dari daftar." } },
  ];
}
const COLS = [{ width: 14 }, { width: 28 }, { width: 78 }, { width: 22.2 }, { width: 22.2 }];

/* ---------------- template ---------------- */
export function templateSheets(m: Master) {
  const g = guideSheet(m);
  const t = today();
  const ex = (ph: number, dl: string, task: string, s: number, e: number): Row => {
    const phase = m.phases[ph];
    return [
      txt(phase.name.toUpperCase(), { align: "center", fontWeight: "bold", backgroundColor: pastelOf(phase) }),
      txt(dl), txt(task),
      dateCell(iso(addDays(toDate(t), s))), dateCell(iso(addDays(toDate(t), e))),
    ];
  };
  const first = m.deliverables.find((d) => d.phaseId === m.phases[0]?.id)?.name ?? "";
  const second = m.deliverables.find((d) => d.phaseId === m.phases[1]?.id)?.name ?? first;
  const data: Row[] = [HEADERS.map(head), ex(0, first, "Contoh: tulis aktivitas yang akan dikerjakan (hapus baris ini)", 0, 2), ex(Math.min(1, m.phases.length - 1), second, "Contoh: satu baris untuk satu aktivitas (hapus baris ini)", 3, 5)];
  return [
    { data, sheet: SHEET, columns: COLS, stickyRowsCount: 1, dataValidation: dropdowns(g, 300) },
    { data: g.data, sheet: g.sheet, columns: g.columns, stickyRowsCount: 1 },
  ] as unknown[];
}
export const downloadTemplate = (m: Master) => save(templateSheets(m), "NoxPlan_Template_Activity_Plan.xlsx");

/* ---------------- export ---------------- */
export function planSheets(plan: Plan, timelineOptions: TimelineOptions = {}) {
  const items = ordered(plan);
  const g = guideSheet(plan);
  const rows: Row[] = [
    [...HEADERS, ...EXTRA].map(head),
    ...items.map((i): Row => {
      const ph = plan.phases.find((p) => p.id === i.phaseId);
      return [
        txt((ph?.name ?? "").toUpperCase(), { align: "center", fontWeight: "bold", backgroundColor: ph ? pastelOf(ph) : undefined }),
        txt(i.deliverable), txt(i.task), dateCell(i.start), dateCell(i.end), dateCell(i.actual),
        txt(STATUS[i.status].label, { align: "center" }),
      ];
    }),
  ];

  const { weeks, rows: tl } = timeline(plan, timelineOptions);
  const H = (v: string, extra: Cell = {}): Cell => ({ value: v, fontWeight: "bold", textColor: "#FFFFFF", backgroundColor: "#0070C0", align: "center", alignVertical: "center", borderColor: "#000000", ...extra });
  const r1: Row = [H("Project Timeline", { rowSpan: 2, columnSpan: 2 }), null];
  const r2: Row = [null, null];
  weeks.forEach((w, k) => {
    r2.push(H(`Week ${w.n}`));
    r1.push(k === 0 || weeks[k - 1].month !== w.month ? H(w.month, { columnSpan: weeks.filter((x) => x.month === w.month).length }) : null);
  });
  const body: Row[] = tl.map((r, idx) => {
    const edge: Cell = r.first && idx > 0 ? { topBorderStyle: "medium", topBorderColor: "#000000" } : {};
    const cells: Row = r.cells.map((on, k) => ({ value: " ", borderColor: "#000000", ...edge, ...(on ? { backgroundColor: r.phase.color } : weeks[k].off ? { backgroundColor: UNUSED_WEEK } : {}) }));
    const name = (extra: Cell): Cell => ({ value: r.phase.name, fontWeight: "bold", align: "center", alignVertical: "center", borderColor: "#000000", ...edge, ...extra });
    if (r.span === 1) return [name({ columnSpan: 2 }), null, ...cells];
    return [r.first ? name({ rowSpan: r.span }) : null, { value: r.label, align: "left", alignVertical: "center", borderColor: "#000000", ...edge }, ...cells];
  });
  const timelineData = thickBorders([r1, r2, ...body], weeks.map((w) => w.n === 1));
  const sheets: unknown[] = [
    { data: rows, sheet: SHEET, columns: [...COLS, { width: 22.2 }, { width: 16 }], stickyRowsCount: 1, dataValidation: dropdowns(g, Math.max(items.length + 1, 300)) },
    { data: timelineData, sheet: "Plan Timeline", columns: [{ width: 16 }, { width: 28 }, ...weeks.map(() => ({ width: 11 }))] },
    { data: g.data, sheet: g.sheet, columns: g.columns, stickyRowsCount: 1 },
  ];
  return sheets;
}
const UNUSED_WEEK = "#BFBFBF";
const THICK = { style: "medium", color: "#000000" } as const;

/** Garis tebal: tepi luar tabel, bawah header, antara fase dan key deliverable, dan awal tiap bulan (kolom label = 2 kolom pertama) */
function thickBorders(data: Row[], monthStart: boolean[]): Row[] {
  const lastRow = data.length - 1, lastCol = 1 + monthStart.length;
  return data.map((row, r) => row.map((cell, c) => {
    if (!cell) return cell;
    const bottom = r + ((cell.rowSpan as number | undefined) ?? 1) - 1, right = c + ((cell.columnSpan as number | undefined) ?? 1) - 1;
    const edges: Cell = {};
    if (c <= 1 || (c >= 2 && monthStart[c - 2])) Object.assign(edges, { leftBorderStyle: THICK.style, leftBorderColor: THICK.color });
    if (right === lastCol) Object.assign(edges, { rightBorderStyle: THICK.style, rightBorderColor: THICK.color });
    if (r === 0) Object.assign(edges, { topBorderStyle: THICK.style, topBorderColor: THICK.color });
    if (bottom === lastRow || bottom === 1) Object.assign(edges, { bottomBorderStyle: THICK.style, bottomBorderColor: THICK.color });
    return { ...cell, ...edges };
  }));
}

export const exportExcel = (plan: Plan, timelineOptions: TimelineOptions = {}) => save(planSheets(plan, timelineOptions), `NoxPlan_${safe(plan.name)}_${today()}.xlsx`);

/* ---------------- import ---------------- */
export interface ParsedRow { row: number; phaseId: string; deliverable: string; task: string; start: string; end: string; actual: string; status: Status }
export interface RowError { row: number; text: string }
export interface ParseResult { rows: ParsedRow[]; errors: RowError[]; fatal?: string; blank: number }

const norm = (s: unknown) => String(s ?? "").trim().replace(/\s+/g, " ").toLowerCase();
const ALIAS = {
  phase: ["fase", "phase"],
  deliverable: ["key deliverables", "key deliverable", "deliverable", "deliverables"],
  task: ["deskripsi", "task description", "deskripsi aktivitas", "aktivitas", "description"],
  start: ["rencana mulai", "start date", "tanggal mulai", "mulai"],
  end: ["rencana selesai", "plan end date", "tanggal selesai", "selesai"],
  actual: ["selesai aktual", "actual end date", "aktual selesai", "aktual"],
  status: ["status"],
} as const;
type Key = keyof typeof ALIAS;
const REQUIRED: Key[] = ["phase", "deliverable", "task", "start", "end"];
const STATUS_ALIAS: Record<string, Status> = { selesai: "done", done: "done", "on progress": "doing", progress: "doing", doing: "doing", "belum mulai": "todo", todo: "todo", "to do": "todo", tertunda: "hold", hold: "hold", "on hold": "hold" };
const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, mei: 5, jun: 6, jul: 7, aug: 8, agu: 8, agt: 8, sep: 9, oct: 10, okt: 10, nov: 11, dec: 12, des: 12 };
const ymd = (y: number, m: number, d: number) => {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d ? `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` : "";
};
const fullYear = (y: number) => (y < 100 ? 2000 + y : y);

/** Nilai sel tanggal Excel -> "YYYY-MM-DD" (kosong bila tidak terbaca) */
export function toIsoDate(v: unknown): string {
  if (v instanceof Date && !isNaN(+v)) {
    // Excel menyimpan hari tanpa zona waktu; library mengembalikannya sebagai UTC tengah malam
    return ymd(v.getUTCFullYear(), v.getUTCMonth() + 1, v.getUTCDate());
  }
  if (typeof v === "number" && v > 20000 && v < 80000) {
    const d = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 864e5);
    return ymd(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }
  if (typeof v === "string") {
    const s = v.trim();
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return ymd(+m[1], +m[2], +m[3]);
    m = s.match(/^(\d{1,2})[-/ .]([A-Za-z]{3})[A-Za-z]*[-/ .,]*(\d{2,4})$/);
    if (m && MONTHS[m[2].toLowerCase()]) return ymd(fullYear(+m[3]), MONTHS[m[2].toLowerCase()], +m[1]);
    m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
    if (m) return ymd(fullYear(+m[3]), +m[2], +m[1]);
  }
  return "";
}

/** Validasi baris hasil bacaan Excel terhadap master data */
export function parseRows(data: unknown[][], m: Master): ParseResult {
  const res: ParseResult = { rows: [], errors: [], blank: 0 };
  let hr = -1;
  let col: Partial<Record<Key, number>> = {};
  for (let r = 0; r < Math.min(data.length, 10) && hr < 0; r++) {
    const found: Partial<Record<Key, number>> = {};
    (data[r] ?? []).forEach((c, ci) => {
      const k = (Object.keys(ALIAS) as Key[]).find((key) => (ALIAS[key] as readonly string[]).includes(norm(c)));
      if (k && found[k] === undefined) found[k] = ci;
    });
    if (REQUIRED.every((k) => found[k] !== undefined)) { hr = r; col = found; }
  }
  if (hr < 0) {
    res.fatal = `Header tidak ditemukan. Pastikan baris pertama berisi ${HEADERS.join(", ")}. Unduh template untuk contohnya.`;
    return res;
  }
  const body = data.slice(hr + 1);
  if (body.length > 500) { res.fatal = "Maksimal 500 baris per file."; return res; }
  const find = <T extends { name: string }>(list: T[], v: string) => list.find((x) => norm(x.name) === norm(v));

  body.forEach((cells, k) => {
    const row = hr + k + 2; // nomor baris di Excel
    const get = (key: Key) => (col[key] === undefined ? undefined : cells?.[col[key] as number]);
    const empty = REQUIRED.every((key) => String(get(key) ?? "").trim() === "");
    if (empty) { res.blank++; return; }
    const err = (text: string) => res.errors.push({ row, text });

    const phaseName = String(get("phase") ?? "").trim();
    const delName = String(get("deliverable") ?? "").trim();
    const task = String(get("task") ?? "").trim();
    if (!phaseName) return err("FASE kosong.");
    const phase = find(m.phases, phaseName);
    if (!phase) return err(`FASE "${phaseName}" tidak ada di Master Data.`);
    if (!delName) return err("KEY DELIVERABLES kosong.");
    const del = find(m.deliverables, delName);
    if (!del) return err(`Key deliverable "${delName}" tidak ada di Master Data.`);
    if (del.phaseId !== phase.id && m.phases.some((p) => p.id === del.phaseId)) return err(`"${del.name}" milik fase ${m.phases.find((p) => p.id === del.phaseId)?.name ?? "lain"}, bukan ${phase.name}.`);
    if (!task) return err("DESKRIPSI kosong.");
    const start = toIsoDate(get("start"));
    if (!start) return err("RENCANA MULAI kosong atau bukan tanggal (contoh: 16-Nov-26).");
    const end = toIsoDate(get("end"));
    if (!end) return err("RENCANA SELESAI kosong atau bukan tanggal (contoh: 17-Nov-26).");
    if (end < start) return err("RENCANA SELESAI lebih awal dari RENCANA MULAI.");
    const st = STATUS_ALIAS[norm(get("status"))] ?? "todo";
    const actual = st === "done" ? toIsoDate(get("actual")) || end : "";
    res.rows.push({ row, phaseId: phase.id, deliverable: del.name, task, start, end, actual, status: st });
  });
  if (!res.rows.length && !res.errors.length) res.fatal = "Tidak ada baris aktivitas di file ini.";
  return res;
}

export async function readPlanFile(file: File, m: Master): Promise<ParseResult> {
  if (!/\.xlsx$/i.test(file.name)) return { rows: [], errors: [], blank: 0, fatal: "Format harus .xlsx." };
  if (file.size > 5 * 1024 * 1024) return { rows: [], errors: [], blank: 0, fatal: "Ukuran file maksimal 5 MB." };
  try {
    const { readSheet } = await import("read-excel-file/browser");
    return parseRows((await readSheet(file)) as unknown[][], m);
  } catch (e) {
    console.error(e);
    return { rows: [], errors: [], blank: 0, fatal: "File tidak bisa dibaca. Pastikan file .xlsx asli dari Excel." };
  }
}

export const toActivities = (rows: ParsedRow[]): Activity[] =>
  rows.map((r) => ({ id: uid(), phaseId: r.phaseId, deliverable: r.deliverable, task: r.task, start: r.start, end: r.end, actual: r.actual, status: r.status }));

export const planNameFromFile = (name: string) =>
  name.replace(/\.[^.]+$/, "").replace(/^[0-9a-f]{8}-/i, "").replace(/^DMAIC[_ ]Project[_ ]Timeline[_ -]*/i, "").replace(/_+/g, " ").trim() || "Plan baru";

