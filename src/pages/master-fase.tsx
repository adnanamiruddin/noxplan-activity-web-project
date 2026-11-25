import { useRef, useState } from "react";
import { LuLock, LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";
import PageHeader from "@/components/PageHeader";
import { PhaseDot } from "@/components/Bits";
import { usePlan } from "@/context/PlanContext";
import { requestSecretAccess } from "@/helpers/guard";
import { confirmDelete, notify } from "@/helpers/notify";
import { PALETTE, uid } from "@/helpers/plan";
import type { Phase } from "@/types";

type Draft = Omit<Phase, "id"> & { id?: string };

export default function MasterFase() {
  const { plan, update, allItems } = usePlan();
  const ref = useRef<HTMLDialogElement>(null);
  const [d, setD] = useState<Draft | null>(null);
  const used = (id: string) => allItems.filter((i) => i.phaseId === id).length;
  const kd = (id: string) => plan.deliverables.filter((k) => k.phaseId === id).length;

  const open = async (draft: Draft, action: string) => {
    if (!(await requestSecretAccess(action))) return;
    setD(draft);
    ref.current?.showModal();
  };
  const save = () => {
    if (!d) return;
    const name = d.name.trim();
    if (!name) return notify("Nama fase wajib diisi", "error");
    if (plan.phases.some((f) => f.id !== d.id && f.name.toLowerCase() === name.toLowerCase())) return notify("Fase sudah ada", "error");
    update((p) => ({ ...p, phases: d.id ? p.phases.map((f) => (f.id === d.id ? { ...f, name, color: d.color } : f)) : [...p.phases, { id: uid(), name, color: d.color }] }));
    ref.current?.close();
    notify(d.id ? "Fase diperbarui" : "Fase ditambahkan");
  };
  const del = async (f: Phase) => {
    if (!(await requestSecretAccess("hapus fase"))) return;
    if (used(f.id) || kd(f.id)) return notify(`Masih dipakai ${used(f.id)} aktivitas dan ${kd(f.id)} key deliverable`, "info");
    if ((await confirmDelete(`Hapus fase "${f.name}"?`, "Aksi ini tidak bisa dibatalkan.")).isConfirmed) { update((p) => ({ ...p, phases: p.phases.filter((x) => x.id !== f.id) })); notify(`Fase "${f.name}" dihapus`); }
  };

  return (
    <>
      <PageHeader title="Master Fase">
        <button type="button" className="btn btn-primary" onClick={() => open({ name: "", color: PALETTE[plan.phases.length % PALETTE.length] }, "tambah fase")}><LuLock aria-hidden /> <LuPlus aria-hidden /> Fase</button>
      </PageHeader>
      <section className="panel overflow-x-auto">
        <table className="table">
          <thead><tr className="bg-[var(--head)]"><th>Fase</th><th className="text-right">Key deliverable</th><th className="text-right">Aktivitas</th><th><span className="sr-only">Aksi</span></th></tr></thead>
          <tbody>
            {!plan.phases.length && <tr><td colSpan={4} className="py-10 text-center text-base-content/60">Belum ada fase.</td></tr>}
            {plan.phases.map((f) => (
              <tr key={f.id}>
                <td><span className="inline-flex items-center gap-2 font-semibold"><PhaseDot phase={f} className="!size-4" />{f.name}</span></td>
                <td className="text-right tabular-nums">{kd(f.id)}</td>
                <td className="text-right tabular-nums">{used(f.id)}</td>
                <td className="whitespace-nowrap text-right">
                  <button type="button" className="btn btn-ghost btn-sm btn-square" aria-label={`Ubah ${f.name}`} onClick={() => open(f, "ubah fase")}><LuPencil aria-hidden /></button>
                  <button type="button" className="btn btn-ghost btn-sm btn-square text-error" aria-label={`Hapus ${f.name}`} onClick={() => del(f)}><LuTrash2 aria-hidden /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <dialog ref={ref} className="modal modal-bottom sm:modal-middle">
        <div className="modal-box max-w-md p-0">
          <form method="dialog"><button type="submit" className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" aria-label="Tutup">✕</button></form>
          <div className="panel-head rounded-none pr-12"><span className="text-sm">{d?.id ? "Ubah fase" : "Tambah fase"}</span></div>
          {d && (
            <div className="px-5 pt-4">
              <fieldset className="fieldset"><legend className="fieldset-legend">Nama</legend><input className="input w-full" value={d.name} maxLength={24} onChange={(e) => setD({ ...d, name: e.target.value })} /></fieldset>
              <fieldset className="fieldset"><legend className="fieldset-legend">Warna</legend><input type="color" aria-label="Warna fase" value={d.color} className="h-10 w-20 cursor-pointer rounded-field border border-base-300 bg-base-100 p-1" onChange={(e) => setD({ ...d, color: e.target.value })} /></fieldset>
            </div>
          )}
          <div className="modal-action mx-5 mb-5"><form method="dialog"><button className="btn btn-ghost">Batal</button></form><button type="button" className="btn btn-primary" onClick={save}>Simpan</button></div>
        </div>
        <form method="dialog" className="modal-backdrop"><button type="submit" aria-label="Tutup">tutup</button></form>
      </dialog>
    </>
  );
}
