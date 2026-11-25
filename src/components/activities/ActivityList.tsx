import { LuCheck, LuChevronDown, LuChevronRight, LuPencil, LuTrash2 } from "react-icons/lu";
import { PhaseDot } from "@/components/Bits";
import { useUI } from "@/components/UIContext";
import { usePlan } from "@/context/PlanContext";
import { useStatusChange } from "@/hooks/useStatusChange";
import type { Activity } from "@/types";
import { ActivityMeta, ActivityTitle, LateTag, StatusSelect } from "./ActivityParts";

interface Props {
  rows: Activity[];
  closedPhases: string[];
  onToggleCollapse: (phaseId: string) => void;
  selecting: boolean;
  picked: string[];
  onPick: (id: string) => void;
  onDelete: (item: Activity) => void;
}

/** Aktivitas dikelompokkan per fase; tiap fase bisa dilipat */
export default function ActivityList({ rows, closedPhases, onToggleCollapse, selecting, picked, onPick, onDelete }: Props) {
  const { plan } = usePlan();
  const changeStatus = useStatusChange();
  const { openActivity } = useUI();

  return (
    <div className="space-y-4">
      {plan.phases.map((phase) => {
        const group = rows.filter((i) => i.phaseId === phase.id);
        if (!group.length) return null;
        const done = group.filter((i) => i.status === "done").length;
        const closed = closedPhases.includes(phase.id);
        return (
          <section key={phase.id} className="panel">
            <button type="button" className="panel-head w-full text-left" aria-expanded={!closed} onClick={() => onToggleCollapse(phase.id)}>
              <span className="flex items-center gap-2">{closed ? <LuChevronRight aria-hidden /> : <LuChevronDown aria-hidden />}<PhaseDot phase={phase} /> {phase.name}</span>
              <span className="flex items-center gap-3 font-medium text-base-content/60"><progress className="progress progress-primary hidden h-1.5 w-24 sm:block" value={done} max={group.length} aria-hidden />{done}/{group.length}</span>
            </button>
            {!closed && (
              <ul className="divide-y divide-base-300">
                {group.map((item) => (
                  <li key={item.id} className={`cell-frame grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 px-4 py-3 md:grid-cols-[auto_minmax(0,1fr)_auto_auto] ${picked.includes(item.id) ? "bg-primary/5" : ""}`}>
                    {selecting
                      ? <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={picked.includes(item.id)} aria-label={`Pilih: ${item.task}`} onChange={() => onPick(item.id)} />
                      : <button type="button" className="check-ring" data-done={item.status === "done"} aria-label={item.status === "done" ? `Batalkan selesai: ${item.task}` : `Tandai selesai: ${item.task}`} onClick={() => changeStatus(item, item.status === "done" ? "doing" : "done")}><LuCheck aria-hidden /></button>}
                    <div className="min-w-0"><ActivityTitle item={item} /><ActivityMeta item={item} /></div>
                    <div className="col-start-2 flex items-center gap-2 md:col-start-auto"><LateTag item={item} /><StatusSelect item={item} colored /></div>
                    <div className="col-start-2 flex md:col-start-auto">
                      <button type="button" className="btn btn-ghost btn-sm btn-square" aria-label={`Ubah: ${item.task}`} onClick={() => openActivity(item)}><LuPencil aria-hidden /></button>
                      <button type="button" className="btn btn-ghost btn-sm btn-square text-error" aria-label={`Hapus: ${item.task}`} onClick={() => onDelete(item)}><LuTrash2 aria-hidden /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
