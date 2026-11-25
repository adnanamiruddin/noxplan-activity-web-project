import { useMemo, useState } from "react";
import { LuChevronsDownUp, LuChevronsUpDown, LuColumns3, LuDownload, LuFileDown, LuList, LuListChecks, LuPlus, LuSearch, LuTrash2, LuUpload, LuX } from "react-icons/lu";
import ActivityBoard from "@/components/activities/ActivityBoard";
import ActivityFilters from "@/components/activities/ActivityFilters";
import type { StatusFilter } from "@/components/activities/ActivityFilters";
import ActivityList from "@/components/activities/ActivityList";
import { EmptyPlan } from "@/components/Bits";
import PageHeader from "@/components/PageHeader";
import { useUI } from "@/components/UIContext";
import { usePlan } from "@/context/PlanContext";
import { downloadTemplate, exportExcel } from "@/helpers/excel";
import { confirmDelete, notify } from "@/helpers/notify";
import { ordered, sample, today } from "@/helpers/plan";
import type { Activity } from "@/types";

export default function Activities() {
  const { plan, master, update } = usePlan();
  const { openActivity, openImport } = useUI();
  const [view, setView] = useState<"list" | "board">("list");
  const [q, setQ] = useState("");
  const [phase, setPhase] = useState("all");
  const [st, setSt] = useState<StatusFilter>("all");
  const [selecting, setSelecting] = useState(false);
  const [sel, setSel] = useState<string[]>([]);
  const [shut, setShut] = useState<string[]>([]);
  const t = today();

  const all = useMemo(() => ordered(plan), [plan]);
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return all.filter((i) =>
      (phase === "all" || i.phaseId === phase) &&
      (st === "all" || (st === "late" ? i.status !== "done" && i.end < t : i.status === st)) &&
      (!s || `${i.task} ${i.deliverable}`.toLowerCase().includes(s)));
  }, [all, q, phase, st, t]);
  const groupIds = plan.phases.filter((f) => rows.some((i) => i.phaseId === f.id)).map((f) => f.id);
  const allClosed = groupIds.length > 0 && groupIds.every((id) => shut.includes(id));
  const toggleAll = () => setShut(allClosed ? [] : groupIds);
  const picked = sel.filter((id) => plan.items.some((i) => i.id === id));
  const lateCount = all.filter((i) => i.status !== "done" && i.end < t).length;

  const del = async (i: Activity) => {
    if ((await confirmDelete("Hapus aktivitas ini?", i.task)).isConfirmed) { update((p) => ({ ...p, items: p.items.filter((x) => x.id !== i.id) })); notify("Aktivitas dihapus"); }
  };
  const bulkDel = async () => {
    const n = picked.length;
    if (!(await confirmDelete(`Hapus ${n} aktivitas terpilih?`)).isConfirmed) return;
    update((p) => ({ ...p, items: p.items.filter((i) => !picked.includes(i.id)) }));
    setSel([]); setSelecting(false);
    notify(`${n} aktivitas dihapus`);
  };
  const tpl = () => downloadTemplate(master).then(() => notify("Template Excel diunduh")).catch(() => notify("Gagal membuat template", "error"));
  const exp = async () => { try { await exportExcel(plan); notify("Excel diunduh"); } catch (e) { console.error(e); notify("Gagal membuat Excel", "error"); } };
  const toggle = (id: string) => setSel(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);
  const toggleCollapse = (id: string) => setShut(shut.includes(id) ? shut.filter((x) => x !== id) : [...shut, id]);
  const endSelect = () => { setSelecting(false); setSel([]); };

  if (!plan.items.length) {
    return (<><PageHeader title="Aktivitas" /><EmptyPlan onExcel={openImport} onAdd={() => openActivity()} onSample={() => update((p) => ({ ...p, items: sample() }))} /></>);
  }

  return (
    <>
      <PageHeader title="Aktivitas">
        <button type="button" className="btn btn-primary" onClick={() => openActivity()}><LuPlus aria-hidden /> Tambah</button>
        <button type="button" className="btn btn-outline" onClick={openImport}><LuUpload aria-hidden /> Upload Excel</button>
        <button type="button" className="btn btn-outline" onClick={tpl} title="Template Excel untuk bulk upload aktivitas"><LuFileDown aria-hidden /> Template Excel</button>
        <button type="button" className="btn btn-outline" onClick={exp} title="Unduh plan ini sebagai file Excel"><LuDownload aria-hidden /> Ekspor plan</button>
      </PageHeader>

      <div className="mb-4 space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <label className="input input-sm h-10 min-w-0 flex-1 sm:max-w-sm"><LuSearch className="text-base-content/50" aria-hidden /><input type="search" placeholder="Cari aktivitas atau deliverable" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari" /></label>
          {view === "list" && (
            <div className="ml-auto flex gap-1">
              <button type="button" className={`btn btn-sm h-10 ${selecting ? "btn-neutral" : "btn-ghost"}`} onClick={() => (selecting ? endSelect() : setSelecting(true))} aria-pressed={selecting}><LuListChecks aria-hidden /> {selecting ? "Selesai memilih" : "Pilih"}</button>
              <button type="button" className="btn btn-sm btn-ghost h-10" onClick={toggleAll}>
                {allClosed ? <LuChevronsUpDown aria-hidden /> : <LuChevronsDownUp aria-hidden />} {allClosed ? "Buka semua" : "Tutup semua"}
              </button>
            </div>
          )}
          <div className={`join ${view === "list" ? "" : "ml-auto"}`} role="group" aria-label="Tampilan">
            <button type="button" className={`btn btn-sm join-item h-10 ${view === "list" ? "btn-primary" : "btn-outline"}`} onClick={() => setView("list")} aria-pressed={view === "list"}><LuList aria-hidden /> Daftar</button>
            <button type="button" className={`btn btn-sm join-item h-10 ${view === "board" ? "btn-primary" : "btn-outline"}`} onClick={() => { endSelect(); setView("board"); }} aria-pressed={view === "board"}><LuColumns3 aria-hidden /> Board</button>
          </div>
        </div>
        <ActivityFilters phase={phase} onPhase={setPhase} status={st} onStatus={setSt} lateCount={lateCount} />
      </div>

      {selecting && (
        <div className="sticky top-3 z-20 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/40 bg-base-100 px-4 py-2 shadow-sm lg:top-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
            <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" aria-label="Pilih semua" checked={!!rows.length && rows.every((r) => picked.includes(r.id))} onChange={(e) => setSel(e.target.checked ? rows.map((r) => r.id) : [])} />
            {picked.length ? `${picked.length} dipilih` : "Pilih semua"}
          </label>
          <span className="flex gap-2">
            <button type="button" className="btn btn-sm btn-ghost" onClick={endSelect}><LuX aria-hidden /> Batal</button>
            <button type="button" className="btn btn-sm btn-error" disabled={!picked.length} onClick={bulkDel}><LuTrash2 aria-hidden /> Hapus terpilih</button>
          </span>
        </div>
      )}

      {!rows.length && <div className="panel"><p className="px-5 py-10 text-center text-sm text-base-content/60">Tidak ada aktivitas yang cocok dengan filter.</p></div>}

      {view === "list"
        ? <ActivityList rows={rows} closedPhases={shut} onToggleCollapse={toggleCollapse} selecting={selecting} picked={picked} onPick={toggle} onDelete={del} />
        : <ActivityBoard rows={rows} />}
    </>
  );
}
