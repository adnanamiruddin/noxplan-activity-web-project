import { useRef } from "react";
import { toPng } from "html-to-image";
import { LuChevronDown, LuDownload, LuImage } from "react-icons/lu";
import { EmptyPlan, PhaseDot } from "@/components/Bits";
import Chip from "@/components/Chip";
import PageHeader from "@/components/PageHeader";
import { useUI } from "@/components/UIContext";
import { usePlan } from "@/context/PlanContext";
import { exportExcel } from "@/helpers/excel";
import { notify } from "@/helpers/notify";
import { isDmaic, sample, timeline } from "@/helpers/plan";
import { useStored } from "@/hooks/useStored";

const TH = "border border-[#7c8a82] bg-[#0070C0] px-3 py-2 font-bold text-white";
const TD = "border border-[#7c8a82] px-3 py-2";
// Garis tebal: pemisah antar fase, antara fase dan key deliverable, antar bulan, dan garis luar tabel
const EDGE = "3px solid #17231c";
const UNUSED_WEEK = "#c9cecb"; // minggu di luar rentang plan

export default function Timeline() {
  const { plan, update } = usePlan();
  const { openActivity, openImport } = useUI();
  const box = useRef<HTMLDivElement>(null);
  const dmaicIds = plan.phases.filter(isDmaic).map((f) => f.id);
  const usedPhases = plan.phases.filter((f) => plan.items.some((i) => i.phaseId === f.id));
  // Pilihan disimpan per browser. "dmaic" = ikuti fase DMAIC; `plainIds` = fase yang dirangkum jadi satu baris
  const [picked, setPicked] = useStored<"dmaic" | string[]>("noxplan:timeline-phases", "dmaic");
  const [plainIds, setPlainIds] = useStored<string[]>("noxplan:timeline-plain", []);
  const shown = picked === "dmaic" ? dmaicIds : picked.filter((id) => plan.phases.some((f) => f.id === id));
  const dmaicMode = shown.length === dmaicIds.length && dmaicIds.every((id) => shown.includes(id));
  const detailIds = plan.phases.map((f) => f.id).filter((id) => !plainIds.includes(id));
  const options = { phaseIds: shown, detailIds };
  const togglePhase = (id: string) => setPicked(shown.includes(id) ? shown.filter((x) => x !== id) : [...shown, id]);
  const toggleDetail = (id: string) => setPlainIds(plainIds.includes(id) ? plainIds.filter((x) => x !== id) : [...plainIds, id]);
  const { weeks, rows } = timeline(plan, options);
  const months = weeks.reduce<{ m: string; n: number }[]>((a, w) => {
    const l = a[a.length - 1];
    if (l && l.m === w.month) l.n++; else a.push({ m: w.month, n: 1 });
    return a;
  }, []);
  const cur = weeks.findIndex((w) => +w.from <= Date.now() && Date.now() < +w.to);
  const exp = async () => { try { await exportExcel(plan, options); notify("Excel diunduh"); } catch (e) { console.error(e); notify("Gagal membuat Excel", "error"); } };

  const png = async () => {
    const el = box.current;
    if (!el) return;
    try {
      const url = await toPng(el, { pixelRatio: 2, backgroundColor: "#ffffff", width: el.scrollWidth + 4, height: el.scrollHeight + 4, style: { overflow: "visible" } });
      const a = document.createElement("a");
      a.href = url; a.download = `Timeline ${plan.name}.png`; a.click();
      notify("Gambar timeline diunduh");
    } catch (e) { console.error(e); notify("Gagal membuat gambar", "error"); }
  };

  return (
    <>
      <PageHeader title="Timeline">
        <button type="button" className="btn btn-primary" onClick={png} disabled={!rows.length}><LuImage aria-hidden /> Unduh PNG</button>
        <button type="button" className="btn btn-outline" onClick={exp} disabled={!rows.length}><LuDownload aria-hidden /> Unduh Excel</button>
      </PageHeader>
      <div className="mb-4 flex flex-wrap items-center gap-1.5" role="group" aria-label="Fase yang ditampilkan">
        <button type="button" className={`btn btn-sm h-8 rounded-full ${dmaicMode ? "btn-primary" : "btn-outline btn-primary"}`} onClick={() => setPicked("dmaic")} aria-pressed={dmaicMode}>Mode DMAIC</button>
        <span className="mx-1 h-5 w-px bg-base-300" aria-hidden />
        {usedPhases.map((f) => <Chip key={f.id} active={shown.includes(f.id)} onClick={() => togglePhase(f.id)}><PhaseDot phase={f} /> {f.name}</Chip>)}
        <div className="dropdown dropdown-end ml-auto">
          <button type="button" tabIndex={0} className="btn btn-sm btn-ghost h-8">Rincian deliverable <LuChevronDown aria-hidden /></button>
          <div tabIndex={0} className="dropdown-content z-30 mt-2 w-64 rounded-lg border border-base-300 bg-base-100 p-2 shadow-lg">
            <ul>
              {usedPhases.map((f) => (
                <li key={f.id}>
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-base-200">
                    <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={!plainIds.includes(f.id)} onChange={() => toggleDetail(f.id)} />
                    <PhaseDot phase={f} /> <span className={shown.includes(f.id) ? "" : "text-base-content/45"}>{f.name}</span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="mt-1 flex gap-1 border-t border-base-300 pt-2">
              <button type="button" className="btn btn-xs btn-ghost flex-1" onClick={() => setPlainIds([])}>Semua rincian</button>
              <button type="button" className="btn btn-xs btn-ghost flex-1" onClick={() => setPlainIds(usedPhases.map((f) => f.id))}>Tanpa rincian</button>
            </div>
          </div>
        </div>
      </div>
      {!plan.items.length ? (
        <EmptyPlan onExcel={openImport} onAdd={() => openActivity()} onSample={() => update((p) => ({ ...p, items: sample() }))} />
      ) : !rows.length ? (
        <div className="panel"><p className="px-5 py-10 text-center text-sm text-base-content/60">Pilih minimal satu fase untuk ditampilkan.</p></div>
      ) : (
        <div className="panel overflow-x-auto" ref={box}>
          <table className="w-full border-collapse bg-base-100 text-center text-sm" style={{ border: EDGE }}>
            <thead>
              <tr><th rowSpan={2} colSpan={2} className={`${TH} min-w-48`} style={{ borderBottom: EDGE }}>Project Timeline</th>{months.map((m) => <th key={m.m} colSpan={m.n} className={TH} style={{ borderLeft: EDGE }}>{m.m}</th>)}</tr>
              <tr>{weeks.map((w, i) => <th key={i} className={`${TH} whitespace-nowrap`} style={{ borderBottom: EDGE, ...(w.n === 1 ? { borderLeft: EDGE } : {}), ...(i === cur ? { background: "#c77700" } : {}) }} title={i === cur ? "Minggu ini" : undefined}>Week {w.n}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const edge = r.first && i > 0 ? { borderTop: EDGE } : undefined;
                return (
                <tr key={i}>
                  {r.span === 1 ? <td colSpan={2} className={`${TD} font-bold`} style={edge}>{r.phase.name}</td> : (<>{r.first && <td rowSpan={r.span} className={`${TD} font-bold`} style={edge}>{r.phase.name}</td>}<td className={`${TD} text-left`} style={{ ...edge, borderLeft: EDGE }}>{r.label}</td></>)}
                  {r.cells.map((on, j) => (
                    <td key={j} className="min-w-16 border border-[#7c8a82]" style={{ ...edge, ...(weeks[j].n === 1 ? { borderLeft: EDGE } : {}), background: on ? r.phase.color : weeks[j].off ? UNUSED_WEEK : j === cur ? "#fdf3e1" : undefined }} title={on ? r.names[j].join("\n") : undefined} />
                  ))}
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
