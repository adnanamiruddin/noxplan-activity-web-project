import { EmptyPlan, Panel } from "@/components/Bits";
import ChartBox from "@/components/ChartBox";
import PageHeader from "@/components/PageHeader";
import { useUI } from "@/components/UIContext";
import { usePlan } from "@/context/PlanContext";
import { phaseConfig, sCurveConfig, statusConfig } from "@/helpers/charts";
import { STATUS, STATUS_ORDER, sample } from "@/helpers/plan";
import { counts } from "@/helpers/stats";

export default function Progres() {
  const { plan, update } = usePlan();
  const { openActivity, openImport } = useUI();
  const c = counts(plan.items);
  const curve = sCurveConfig(plan.items);

  if (!plan.items.length) return (<><PageHeader title="Progres" /><EmptyPlan onExcel={openImport} onAdd={() => openActivity()} onSample={() => update((p) => ({ ...p, items: sample() }))} /></>);

  return (
    <>
      <PageHeader title="Progres" />
      <div className="grid gap-5 lg:grid-cols-12">
        <Panel title="Rencana vs aktual" className="lg:col-span-12" right="Persen aktivitas selesai dari waktu ke waktu">
          <div className="p-4">{curve ? <ChartBox config={curve} height={280} label="Kurva rencana dan aktual penyelesaian aktivitas" /> : <p className="py-10 text-center text-sm text-base-content/60">Isi tanggal aktivitas untuk melihat kurva.</p>}</div>
        </Panel>

        <Panel title="Status aktivitas" className="lg:col-span-5">
          <div className="flex flex-col items-center gap-5 p-5 sm:flex-row">
            <div className="relative size-44 shrink-0">
              <ChartBox config={statusConfig(plan.items)} height={176} label="Distribusi status aktivitas" />
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><span><span className="block font-display text-3xl font-extrabold leading-none">{c.pct}%</span><span className="text-xs text-base-content/60">selesai</span></span></div>
            </div>
            <ul className="w-full space-y-2 text-sm">
              {STATUS_ORDER.map((s) => (
                <li key={s} className="flex items-center justify-between gap-3"><span className="flex items-center gap-2"><span className="size-3 rounded-[3px]" style={{ background: STATUS[s].color }} />{STATUS[s].label}</span><span className="font-bold tabular-nums">{c[s]}</span></li>
              ))}
              {c.late > 0 && <li className="flex items-center justify-between gap-3 border-t border-base-300 pt-2 font-semibold text-error"><span>Terlambat</span><span className="tabular-nums">{c.late}</span></li>}
            </ul>
          </div>
        </Panel>

        <Panel title="Progres per fase" className="lg:col-span-7">
          <div className="p-4"><ChartBox config={phaseConfig(plan)} height={Math.max(190, plan.phases.filter((f) => plan.items.some((i) => i.phaseId === f.id)).length * 46 + 70)} label="Status aktivitas per fase" /></div>
        </Panel>

      </div>
    </>
  );
}
