import { useState } from "react";
import { LuPencil } from "react-icons/lu";
import { useUI } from "@/components/UIContext";
import { usePlan } from "@/context/PlanContext";
import { STATUS, STATUS_ORDER } from "@/helpers/plan";
import { useStatusChange } from "@/hooks/useStatusChange";
import type { Activity, Status } from "@/types";
import { ActivityMeta, ActivityTitle, LateTag, StatusSelect } from "./ActivityParts";

/** Board per status; kartu bisa di-drag antar kolom untuk mengubah status */
export default function ActivityBoard({ rows }: { rows: Activity[] }) {
  const { plan } = usePlan();
  const changeStatus = useStatusChange();
  const { openActivity } = useUI();
  const [overColumn, setOverColumn] = useState<Status | null>(null);

  const drop = (e: React.DragEvent, status: Status) => {
    e.preventDefault();
    setOverColumn(null);
    const id = e.dataTransfer.getData("text/plain");
    const item = rows.find((i) => i.id === id);
    if (item) changeStatus(item, status);
  };

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {STATUS_ORDER.map((status) => {
        const column = rows.filter((i) => i.status === status);
        return (
          <section
            key={status}
            className={`panel flex min-h-48 flex-col transition ${overColumn === status ? "ring-2 ring-primary" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setOverColumn(status); }}
            onDragLeave={() => setOverColumn(null)}
            onDrop={(e) => drop(e, status)}
          >
            <div className="panel-head" style={{ boxShadow: `inset 0 3px 0 ${STATUS[status].color}` }}><h2>{STATUS[status].label}</h2><span className="font-medium text-base-content/60">{column.length}</span></div>
            <ul className="flex flex-1 flex-col gap-2 p-2.5">
              {column.map((item) => (
                <li key={item.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", item.id)} className="cell-frame cursor-grab rounded-md border border-base-300 bg-base-100 p-3 active:cursor-grabbing" style={{ borderLeft: `4px solid ${plan.phases.find((p) => p.id === item.phaseId)?.color ?? "#ccc"}` }}>
                  <ActivityTitle item={item} />
                  <ActivityMeta item={item} />
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <LateTag item={item} />
                    <span className="ml-auto flex">
                      <StatusSelect item={item} size="xs" />
                      <button type="button" className="btn btn-ghost btn-xs btn-square" aria-label={`Ubah: ${item.task}`} onClick={() => openActivity(item)}><LuPencil aria-hidden /></button>
                    </span>
                  </div>
                </li>
              ))}
              {!column.length && <li className="grid flex-1 place-items-center rounded-md border border-dashed border-base-300 py-6 text-xs text-base-content/45">Tarik aktivitas ke sini</li>}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
