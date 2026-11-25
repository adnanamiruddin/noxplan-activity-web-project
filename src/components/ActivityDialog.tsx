import { useEffect, useRef, useState } from "react";
import { useUI } from "@/components/UIContext";
import { usePlan } from "@/context/PlanContext";
import { notify } from "@/helpers/notify";
import { STATUS, STATUS_ORDER, today, touch, uid } from "@/helpers/plan";
import type { Activity, Status } from "@/types";

type Draft = Omit<Activity, "id"> & { id?: string };

export default function ActivityDialog() {
  const { activity, closeActivity } = useUI();
  const { plan, update } = usePlan();
  const ref = useRef<HTMLDialogElement>(null);
  const [d, setD] = useState<Draft | null>(null);

  useEffect(() => {
    if (!activity) return;
    setD({ phaseId: plan.phases[0]?.id ?? "", deliverable: "", task: "", start: today(), end: today(), actual: "", status: "todo", ...activity });
    if (!ref.current?.open) ref.current?.showModal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => (x ? { ...x, [k]: v } : x));
  const options = d ? plan.deliverables.filter((k) => k.phaseId === d.phaseId).map((k) => k.name) : [];
  if (d?.deliverable && !options.includes(d.deliverable)) options.push(d.deliverable);

  const save = () => {
    if (!d) return;
    if (!d.phaseId) return notify("Pilih fase dulu", "error");
    if (!d.task.trim()) return notify("Deskripsi aktivitas wajib diisi", "error");
    if (!d.start || !d.end) return notify("Tanggal mulai dan selesai wajib diisi", "error");
    if (d.end < d.start) return notify("Tanggal selesai tidak boleh sebelum tanggal mulai", "error");
    if (d.status === "done" && d.actual > today()) return notify("Tanggal selesai aktual tidak boleh di masa depan", "error");
    const it: Activity = { ...d, id: d.id || uid(), task: d.task.trim(), actual: d.status === "done" ? d.actual || today() : "" };
    update((p) => ({ ...p, log: touch(p), items: d.id ? p.items.map((x) => (x.id === it.id ? it : x)) : [...p.items, it] }));
    ref.current?.close();
    notify(d.id ? "Aktivitas diperbarui" : "Aktivitas ditambahkan");
  };

  return (
    <dialog ref={ref} className="modal modal-bottom sm:modal-middle" onClose={closeActivity}>
      <div className="modal-box max-w-xl p-0">
        <form method="dialog"><button type="submit" className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" aria-label="Tutup">✕</button></form>
        <div className="panel-head rounded-none pr-12"><span className="text-sm">{d?.id ? "Ubah aktivitas" : "Aktivitas baru"}</span></div>
        {d && (
          <div className="grid gap-x-3 px-5 pb-1 pt-4 sm:grid-cols-2">
            <fieldset className="fieldset"><legend className="fieldset-legend">Fase</legend>
              <select className="select w-full" value={d.phaseId} onChange={(e) => setD((x) => x && { ...x, phaseId: e.target.value, deliverable: plan.deliverables.some((k) => k.phaseId === e.target.value && k.name === x.deliverable) ? x.deliverable : "" })}>
                {plan.phases.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </fieldset>
            <fieldset className="fieldset"><legend className="fieldset-legend">Key deliverable</legend>
              <select className="select w-full" value={d.deliverable} onChange={(e) => set("deliverable", e.target.value)}>
                <option value="">Pilih key deliverable</option>
                {options.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </fieldset>
            <fieldset className="fieldset sm:col-span-2"><legend className="fieldset-legend">Deskripsi</legend><textarea className="textarea w-full" rows={3} value={d.task} onChange={(e) => set("task", e.target.value)} /></fieldset>
            <fieldset className="fieldset"><legend className="fieldset-legend">Rencana mulai</legend><input type="date" className="input w-full" value={d.start} onChange={(e) => set("start", e.target.value)} /></fieldset>
            <fieldset className="fieldset"><legend className="fieldset-legend">Rencana selesai</legend><input type="date" className="input w-full" value={d.end} min={d.start} onChange={(e) => set("end", e.target.value)} /></fieldset>
            <fieldset className="fieldset"><legend className="fieldset-legend">Status</legend>
              <select className="select w-full" value={d.status} onChange={(e) => setD((x) => x && { ...x, status: e.target.value as Status, actual: e.target.value === "done" ? x.actual || today() : x.actual })}>{STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}</select>
            </fieldset>
            {d.status === "done" && <fieldset className="fieldset"><legend className="fieldset-legend">Selesai aktual</legend><input type="date" className="input w-full" value={d.actual} max={today()} onChange={(e) => set("actual", e.target.value)} /></fieldset>}
          </div>
        )}
        <div className="modal-action mx-5 mb-5 mt-3"><form method="dialog"><button className="btn btn-ghost">Batal</button></form><button type="button" className="btn btn-primary" onClick={save}>Simpan</button></div>
      </div>
      <form method="dialog" className="modal-backdrop"><button type="submit" aria-label="Tutup">tutup</button></form>
    </dialog>
  );
}
