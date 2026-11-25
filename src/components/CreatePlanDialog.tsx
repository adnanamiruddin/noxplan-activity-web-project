import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { LuCircleAlert, LuDownload, LuFileSpreadsheet, LuPlus, LuUpload } from "react-icons/lu";
import { useUI } from "@/components/UIContext";
import { usePlan } from "@/context/PlanContext";
import { downloadTemplate, planNameFromFile, readPlanFile, toActivities } from "@/helpers/excel";
import type { ParseResult } from "@/helpers/excel";
import { notify } from "@/helpers/notify";
import { dmy } from "@/helpers/plan";

export default function CreatePlanDialog() {
  const { create, closeCreate } = useUI();
  const { master, plan, addPlan, addItems } = usePlan();
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const [mode, setMode] = useState<"blank" | "excel">("blank");
  const append = !!create?.append;
  const [file, setFile] = useState("");
  const [res, setRes] = useState<ParseResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    if (!create) return;
    setName(""); setTouched(false); setMode(create.excel ? "excel" : "blank"); setFile(""); setRes(null);
    if (!ref.current?.open) ref.current?.showModal();
  }, [create]);

  const pick = async (f?: File | null) => {
    if (!f) return;
    setBusy(true); setFile(f.name); setRes(null);
    const r = await readPlanFile(f, master);
    setRes(r); setBusy(false);
    if (!touched) setName(planNameFromFile(f.name));
  };

  const sum = useMemo(() => {
    if (!res?.rows.length) return null;
    const dates = res.rows.flatMap((r) => [r.start, r.end]).sort();
    const per = master.phases.map((f) => ({ f, n: res.rows.filter((r) => r.phaseId === f.id).length })).filter((x) => x.n > 0);
    return { from: dates[0], to: dates[dates.length - 1], per };
  }, [res, master.phases]);

  const canCreate = (append || !!name.trim()) && (mode === "blank" || !!res?.rows.length);
  const submit = () => {
    if (!canCreate) return;
    if (append && res) {
      const items = toActivities(res.rows);
      addItems(items);
      ref.current?.close();
      notify(`${items.length} aktivitas ditambahkan ke plan "${plan.name}"`);
      return;
    }
    const items = mode === "excel" && res ? toActivities(res.rows) : [];
    const p = addPlan(name, items);
    ref.current?.close();
    if (items.length) {
      notify(`Plan "${p.name}" siap dengan ${items.length} aktivitas`);
      router.push("/");
    } else {
      notify(`Plan "${p.name}" dibuat`);
      router.push("/activities");
    }
  };

  return (
    <dialog ref={ref} className="modal modal-bottom sm:modal-middle" onClose={closeCreate}>
      <div className="modal-box max-w-2xl p-0">
        <form method="dialog"><button type="submit" className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" aria-label="Tutup">✕</button></form>
        <div className="panel-head rounded-none pr-12"><span className="text-sm">{append ? `Upload Excel ke plan "${plan.name}"` : "Plan baru"}</span></div>
        <div className="space-y-4 px-5 pb-1 pt-4">
          {!append && <fieldset className="fieldset"><legend className="fieldset-legend">Nama plan</legend>
            <input className="input w-full" value={name} maxLength={60} placeholder="mis. Event Management" onChange={(e) => { setName(e.target.value); setTouched(true); }} />
          </fieldset>}

          {!append && <div role="radiogroup" aria-label="Cara membuat plan" className="grid grid-cols-2 gap-2">
            {([["blank", LuPlus, "Mulai kosong", "Tambah aktivitas satu per satu"], ["excel", LuFileSpreadsheet, "Dari Excel", "Upload file, aktivitas langsung jadi"]] as const).map(([k, Icon, t, s]) => (
              <button key={k} type="button" role="radio" aria-checked={mode === k} onClick={() => setMode(k)} className={`flex items-start gap-3 rounded-lg border p-3 text-left transition ${mode === k ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-base-300 hover:border-primary/50"}`}>
                <Icon className="mt-0.5 shrink-0 text-lg text-primary" aria-hidden />
                <span><span className="block text-sm font-bold">{t}</span><span className="block text-xs text-base-content/60">{s}</span></span>
              </button>
            ))}
          </div>}

          {mode === "excel" && (
            <div className="space-y-3">
              <label
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); void pick(e.dataTransfer.files[0]); }}
                className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-6 text-center transition ${drag ? "border-primary bg-primary/10" : "border-base-300 bg-base-200/50 hover:border-primary/60"}`}
              >
                {busy ? <span className="loading loading-spinner text-primary" /> : <LuUpload className="text-2xl text-primary" aria-hidden />}
                <span className="text-sm font-semibold">{file || "Tarik file .xlsx ke sini atau klik untuk memilih"}</span>
                <input type="file" accept=".xlsx" className="sr-only" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ""; }} />
              </label>
              <button type="button" className="btn btn-sm btn-ghost text-primary" onClick={() => downloadTemplate(master).then(() => notify("Template diunduh"))}><LuDownload aria-hidden /> Unduh template Excel untuk bulk upload</button>

              {res?.fatal && <div role="alert" className="alert alert-error alert-soft text-sm"><LuCircleAlert aria-hidden /> <span>{res.fatal}</span></div>}
              {sum && res && (
                <div className="panel">
                  <div className="panel-head"><span>{res.rows.length} aktivitas siap {append ? "ditambahkan" : "dibuat"}</span><span className="font-medium text-base-content/60">{dmy(sum.from)} → {dmy(sum.to)}</span></div>
                  <div className="flex flex-wrap gap-2 p-3">
                    {sum.per.map(({ f, n }) => <span key={f.id} className="inline-flex items-center gap-1.5 rounded-full border border-base-300 px-2.5 py-1 text-xs font-semibold"><span className="size-2.5 rounded-full" style={{ background: f.color }} />{f.name} {n}</span>)}
                  </div>
                </div>
              )}
              {!!res?.errors.length && (
                <div role="alert" className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
                  <p className="font-semibold text-warning">{res.errors.length} baris dilewati{res.rows.length ? `, sisanya tetap ${append ? "ditambahkan" : "dibuat"}` : ""}</p>
                  <ul className="mt-1.5 max-h-36 space-y-0.5 overflow-y-auto text-xs">
                    {res.errors.map((e) => <li key={e.row}><span className="font-bold">Baris {e.row}:</span> {e.text}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="modal-action mx-5 mb-5 mt-4"><form method="dialog"><button className="btn btn-ghost">Batal</button></form><button type="button" className="btn btn-primary" disabled={!canCreate || busy} onClick={submit}>{append ? (res?.rows.length ? `Tambahkan ${res.rows.length} aktivitas` : "Tambahkan") : "Buat plan"}</button></div>
      </div>
      <form method="dialog" className="modal-backdrop"><button type="submit" aria-label="Tutup">tutup</button></form>
    </dialog>
  );
}
