import { useRef, useState } from "react";
import { LuLock, LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";
import { PhaseDot } from "@/components/Bits";
import PageHeader from "@/components/PageHeader";
import { usePlan } from "@/context/PlanContext";
import { requestSecretAccess } from "@/helpers/guard";
import { confirmDelete, notify } from "@/helpers/notify";
import { uid } from "@/helpers/plan";
import type { Deliverable } from "@/types";

type Draft = Omit<Deliverable, "id"> & { id?: string };

export default function MasterData() {
  const { plan, update, allItems, renameDeliverable } = usePlan();
  const ref = useRef<HTMLDialogElement>(null);
  const [d, setD] = useState<Draft | null>(null);
  const rank = (id: string) => plan.phases.findIndex((p) => p.id === id);
  const list = [...plan.deliverables].sort((a, b) => rank(a.phaseId) - rank(b.phaseId));
  const usage = (name: string) => allItems.filter((i) => i.deliverable === name).length;

  const open = async (draft: Draft, action: string) => {
    if (!(await requestSecretAccess(action))) return;
    setD(draft);
    ref.current?.showModal();
  };
  const save = () => {
    if (!d) return;
    const name = d.name.trim();
    if (!name) return notify("Nama key deliverable wajib diisi", "error");
    if (plan.deliverables.some((k) => k.id !== d.id && k.name.toLowerCase() === name.toLowerCase())) return notify("Key deliverable sudah ada", "error");
    const old = plan.deliverables.find((k) => k.id === d.id)?.name;
    update((p) => ({ ...p, deliverables: d.id ? p.deliverables.map((k) => (k.id === d.id ? { ...k, name, phaseId: d.phaseId } : k)) : [...p.deliverables, { id: uid(), name, phaseId: d.phaseId }] }));
    if (old && old !== name) renameDeliverable(old, name);
    ref.current?.close();
    notify(d.id ? "Key deliverable diperbarui" : "Key deliverable ditambahkan");
  };
  const del = async (k: Deliverable) => {
    if (!(await requestSecretAccess("hapus key deliverable"))) return;
    if (usage(k.name)) return notify(`Masih dipakai ${usage(k.name)} aktivitas`, "info");
    if ((await confirmDelete(`Hapus "${k.name}"?`)).isConfirmed) { update((p) => ({ ...p, deliverables: p.deliverables.filter((x) => x.id !== k.id) })); notify(`"${k.name}" dihapus`); }
  };

  return (
    <>
      <PageHeader title="Master Key Deliverable">
        <button type="button" className="btn btn-primary" onClick={() => open({ name: "", phaseId: plan.phases[0]?.id ?? "" }, "tambah key deliverable")}><LuLock aria-hidden /> <LuPlus aria-hidden /> Key deliverable</button>
      </PageHeader>
      <section className="panel overflow-x-auto">
        <table className="table">
          <thead><tr className="bg-[var(--head)]"><th>Key deliverable</th><th>Fase</th><th className="text-right">Dipakai</th><th><span className="sr-only">Aksi</span></th></tr></thead>
          <tbody>
            {!list.length && <tr><td colSpan={4} className="py-10 text-center text-base-content/60">Belum ada key deliverable.</td></tr>}
            {list.map((k) => {
              const f = plan.phases.find((p) => p.id === k.phaseId);
              return (
                <tr key={k.id}>
                  <td className="font-semibold">{k.name}</td>
                  <td><span className="inline-flex items-center gap-2 whitespace-nowrap"><PhaseDot phase={f} />{f?.name ?? "–"}</span></td>
                  <td className="text-right tabular-nums">{usage(k.name)}</td>
                  <td className="whitespace-nowrap text-right">
                    <button type="button" className="btn btn-ghost btn-sm btn-square" aria-label={`Ubah ${k.name}`} onClick={() => open(k, "ubah key deliverable")}><LuPencil aria-hidden /></button>
                    <button type="button" className="btn btn-ghost btn-sm btn-square text-error" aria-label={`Hapus ${k.name}`} onClick={() => del(k)}><LuTrash2 aria-hidden /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
      <dialog ref={ref} className="modal modal-bottom sm:modal-middle">
        <div className="modal-box max-w-md p-0">
          <form method="dialog"><button type="submit" className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" aria-label="Tutup">✕</button></form>
          <div className="panel-head rounded-none pr-12"><span className="text-sm">{d?.id ? "Ubah key deliverable" : "Tambah key deliverable"}</span></div>
          {d && (
            <div className="px-5 pt-4">
              <fieldset className="fieldset"><legend className="fieldset-legend">Nama</legend><input className="input w-full" value={d.name} maxLength={60} onChange={(e) => setD({ ...d, name: e.target.value })} /></fieldset>
              <fieldset className="fieldset"><legend className="fieldset-legend">Fase</legend><select className="select w-full" value={d.phaseId} onChange={(e) => setD({ ...d, phaseId: e.target.value })}>{plan.phases.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></fieldset>
            </div>
          )}
          <div className="modal-action mx-5 mb-5"><form method="dialog"><button className="btn btn-ghost">Batal</button></form><button type="button" className="btn btn-primary" onClick={save}>Simpan</button></div>
        </div>
        <form method="dialog" className="modal-backdrop"><button type="submit" aria-label="Tutup">tutup</button></form>
      </dialog>
    </>
  );
}
