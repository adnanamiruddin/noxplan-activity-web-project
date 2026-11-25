import Link from "next/link";
import { LuCheck, LuTriangleAlert } from "react-icons/lu";
import { EmptyPlan, Panel, PhaseDot } from "@/components/Bits";
import Ring from "@/components/Ring";
import { useUI } from "@/components/UIContext";
import { usePlan } from "@/context/PlanContext";
import { STATUS, diffDays, range, sample, today } from "@/helpers/plan";
import { counts, dayProgress, focusToday, nextUp, scores } from "@/helpers/stats";

export default function Beranda() {
  const { plan, update, setStatus } = usePlan();
  const { openActivity, openImport } = useUI();
  const c = counts(plan.items);
  const dp = dayProgress(plan.items);
  const focus = focusToday(plan.items);
  const sc = scores(plan);
  const t = today();
  const phase = (id: string) => plan.phases.find((p) => p.id === id);

  if (!plan.items.length) {
    return (
      <>
        <div className="mb-5"><h1 className="font-display text-4xl font-bold tracking-tight">{plan.name}</h1></div>
        <EmptyPlan onExcel={openImport} onAdd={() => openActivity()} onSample={() => update((p) => ({ ...p, items: sample() }))} />
      </>
    );
  }

  const SKILLS = [
    { k: "Planning", v: sc.planning, tip: sc.tips.planning, how: "50% aktivitas yang datanya lengkap (fase, deliverable, deskripsi, tanggal) + 50% fase yang sudah punya aktivitas." },
    { k: "Drive", v: sc.drive, tip: sc.tips.drive, how: `50% hari aktif dalam 7 hari terakhir (target 5 hari, sekarang ${sc.days}) + 50% aktivitas yang sudah lewat tanggal mulai dan benar-benar dimulai.` },
    { k: "Action", v: sc.action, tip: sc.tips.action, how: "50% aktivitas jatuh tempo yang sudah selesai + 50% aktivitas selesai yang tidak melewati rencana tanggal selesai." },
  ];
  const nx = nextUp(plan.items);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0"><h1 className="font-display text-[2rem] font-bold leading-tight tracking-tight md:text-4xl">{plan.name}</h1></div>
        {dp && <span className="rounded-full border border-base-300 bg-base-100 px-3 py-1.5 text-sm font-semibold">{dp.label}</span>}
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <Panel title="Progres plan" className="lg:col-span-5 lg:order-2" right={`${c.done} dari ${c.total}`}>
          <div className="flex items-center gap-5 p-5">
            <Ring value={c.pct} size={128} stroke={13} label={`Progres ${c.pct}%`}>
              <span className="font-display text-[2rem] font-extrabold leading-none">{c.pct}<span className="text-lg">%</span></span>
            </Ring>
            <dl className="grid flex-1 grid-cols-2 gap-px overflow-hidden rounded-lg border border-base-300 bg-base-300 text-sm">
              {([["Selesai", c.done, STATUS.done.color], ["On progress", c.doing, STATUS.doing.color], ["Tertunda", c.hold, STATUS.hold.color], ["Belum mulai", c.todo, STATUS.todo.color]] as const).map(([l, n, col]) => (
                <div key={l} className="bg-base-100 px-3 py-2"><dt className="flex items-center gap-1.5 text-xs text-base-content/60"><span className="size-2 rounded-full" style={{ background: col }} />{l}</dt><dd className="font-display text-xl font-bold">{n}</dd></div>
              ))}
            </dl>
          </div>
          {c.late > 0 && <p className="mx-5 mb-5 flex items-center gap-2 rounded-lg bg-error/10 px-3 py-2 text-sm font-semibold text-error"><LuTriangleAlert aria-hidden /> {c.late} aktivitas lewat tenggat</p>}
        </Panel>

        <Panel title="Fokus hari ini" className="lg:col-span-7 lg:order-1" right={<Link href="/activities" className="link link-hover">Semua aktivitas</Link>}>
          {focus.length ? (
            <ul className="divide-y divide-base-300">
              {focus.slice(0, 6).map((i) => {
                const late = i.end < t;
                return (
                  <li key={i.id} className="cell-frame flex items-start gap-3 px-4 py-3">
                    <button type="button" className="check-ring mt-0.5" data-done="false" aria-label={`Tandai selesai: ${i.task}`} onClick={() => setStatus(i.id, "done")}><LuCheck aria-hidden /></button>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-snug">{i.task}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-base-content/60"><PhaseDot phase={phase(i.phaseId)} /> {i.deliverable || phase(i.phaseId)?.name} <span aria-hidden>·</span> {range(i.start, i.end)}</p>
                    </div>
                    {late ? <span className="badge badge-error badge-soft badge-sm shrink-0">Terlambat {diffDays(i.end, t)} hari</span> : i.status === "doing" ? <span className="badge badge-info badge-soft badge-sm shrink-0">On progress</span> : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-5 py-10 text-center">
              <p className="font-display text-xl font-bold">{c.done === c.total ? "Semua aktivitas selesai" : "Tidak ada yang mendesak hari ini"}</p>
              {nx && c.done !== c.total && <p className="mt-1 text-sm text-base-content/65">Berikutnya mulai {range(nx.start, nx.start)}: {nx.task}</p>}
            </div>
          )}
        </Panel>

        <Panel title="Skill Planning, Drive, Action" className="lg:col-span-12 lg:order-3">
          <div className="grid divide-y divide-base-300 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {SKILLS.map((x) => (
              <div key={x.k} className="p-4">
                <div className="flex items-center gap-3">
                  <Ring value={x.v ?? 0} size={64} stroke={8} color={x.v === null ? "var(--grid)" : "var(--color-primary)"} label={`${x.k}: ${x.v ?? "belum ada data"}`}><span className="font-display text-lg font-bold">{x.v ?? "–"}</span></Ring>
                  <h3 className="font-display text-lg font-bold">{x.k}</h3>
                </div>
                <p className="mt-2.5 text-sm leading-snug text-base-content/75">{x.tip}</p>
                <details className="mt-2 text-xs text-base-content/60"><summary className="cursor-pointer font-semibold">Cara hitung</summary><p className="mt-1 leading-relaxed">{x.how}</p></details>
              </div>
            ))}
          </div>
        </Panel>

      </div>
    </div>
  );
}
