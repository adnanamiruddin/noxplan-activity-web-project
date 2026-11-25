import { LuDownload, LuPencil, LuPlus, LuTrash2, LuUpload } from "react-icons/lu";
import { useRouter } from "next/router";
import Swal from "sweetalert2";
import Ring from "@/components/Ring";
import PageHeader from "@/components/PageHeader";
import { useUI } from "@/components/UIContext";
import { usePlan } from "@/context/PlanContext";
import type { StoredPlan } from "@/types";
import { downloadTemplate } from "@/helpers/excel";
import { confirmDelete, notify } from "@/helpers/notify";
import { dmy } from "@/helpers/plan";
import { counts } from "@/helpers/stats";

export default function Plans() {
  const { plan, plans, master, switchPlan, renamePlan, removePlan } = usePlan();
  const { openCreatePlan } = useUI();
  const router = useRouter();

  const rename = async (p: StoredPlan) => {
    const r = await Swal.fire({ title: "Ubah nama plan", input: "text", inputValue: p.name, showCancelButton: true, confirmButtonText: "Simpan", cancelButtonText: "Batal", reverseButtons: true, buttonsStyling: false, customClass: { confirmButton: "btn btn-primary", cancelButton: "btn btn-ghost", actions: "gap-2" }, inputValidator: (v: string) => (v.trim() ? null : "Nama plan wajib diisi.") });
    if (r.isConfirmed) { renamePlan(p.id, String(r.value)); notify("Nama plan diperbarui"); }
  };
  const del = async (p: StoredPlan) => {
    if (plans.length < 2) return notify("Minimal harus ada 1 plan", "info");
    if ((await confirmDelete(`Hapus plan "${p.name}"?`, `${p.items.length} aktivitas di dalamnya ikut terhapus.`)).isConfirmed) { removePlan(p.id); notify(`Plan "${p.name}" dihapus`); }
  };

  return (
    <>
      <PageHeader title="Plan saya">
        <button type="button" className="btn btn-primary" onClick={() => openCreatePlan()}><LuPlus aria-hidden /> Plan baru</button>
        <button type="button" className="btn btn-outline" onClick={() => openCreatePlan(true)}><LuUpload aria-hidden /> Dari Excel</button>
        <button type="button" className="btn btn-outline" onClick={() => downloadTemplate(master).then(() => notify("Template diunduh"))}><LuDownload aria-hidden /> Template</button>
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => {
          const c = counts(p.items);
          const dates = p.items.filter((i) => i.start && i.end);
          const from = dates.map((i) => i.start).sort()[0], to = dates.map((i) => i.end).sort().reverse()[0];
          const on = p.id === plan.id;
          return (
            <article key={p.id} className={`panel flex flex-col ${on ? "ring-2 ring-primary" : ""}`}>
              <div className="panel-head"><h2 className="min-w-0 truncate">{p.name || "Tanpa nama"}</h2>{on && <span className="badge badge-primary badge-sm">Aktif</span>}</div>
              <div className="flex items-center gap-4 p-4">
                <Ring value={c.pct} size={84} stroke={9} label={`Progres ${c.pct}%`}><span className="font-display text-xl font-extrabold">{c.pct}%</span></Ring>
                <div className="min-w-0 text-sm">
                  <p className="font-semibold">{c.done}/{c.total} selesai</p>
                  <p className="text-xs text-base-content/60">{from ? `${dmy(from)} → ${dmy(to)}` : "Belum ada jadwal"}</p>
                  {c.late > 0 && <p className="mt-1 text-xs font-semibold text-error">{c.late} terlambat</p>}
                </div>
              </div>
              <div className="mt-auto flex gap-2 border-t border-base-300 p-3">
                <button type="button" className="btn btn-sm btn-primary flex-1" onClick={() => { switchPlan(p.id); notify(`Berhasil pindah ke plan "${p.name}"`); router.push("/"); }}>Buka</button>
                <button type="button" className="btn btn-sm btn-ghost btn-square" aria-label={`Ubah nama ${p.name}`} onClick={() => rename(p)}><LuPencil aria-hidden /></button>
                <button type="button" className="btn btn-sm btn-ghost btn-square text-error" aria-label={`Hapus ${p.name}`} onClick={() => del(p)}><LuTrash2 aria-hidden /></button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
