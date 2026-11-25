import { PhaseDot } from "@/components/Bits";
import Chip from "@/components/Chip";
import { usePlan } from "@/context/PlanContext";
import { STATUS, STATUS_ORDER } from "@/helpers/plan";
import type { Status } from "@/types";

export type StatusFilter = Status | "all" | "late";

interface Props {
  phase: string;
  onPhase: (id: string) => void;
  status: StatusFilter;
  onStatus: (s: StatusFilter) => void;
  lateCount: number;
}

/** Baris chip filter fase dan status */
export default function ActivityFilters({ phase, onPhase, status, onStatus, lateCount }: Props) {
  const { plan } = usePlan();
  const usedPhases = plan.phases.filter((f) => plan.items.some((i) => i.phaseId === f.id));
  const statusChips: [StatusFilter, string][] = [
    ["all", "Semua status"],
    ...STATUS_ORDER.map((s): [StatusFilter, string] => [s, STATUS[s].label]),
    ["late", lateCount ? `Terlambat ${lateCount}` : "Terlambat"],
  ];
  return (
    <>
      <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Filter fase">
        <Chip active={phase === "all"} onClick={() => onPhase("all")}>Semua fase</Chip>
        {usedPhases.map((f) => <Chip key={f.id} active={phase === f.id} onClick={() => onPhase(phase === f.id ? "all" : f.id)}><PhaseDot phase={f} /> {f.name}</Chip>)}
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Filter status">
        {statusChips.map(([key, label]) => (
          <Chip key={key} active={status === key} onClick={() => onStatus(status === key ? "all" : key)}>
            {key !== "all" && key !== "late" && <span className="size-2 rounded-full" style={{ background: STATUS[key].color }} />}{label}
          </Chip>
        ))}
      </div>
    </>
  );
}
