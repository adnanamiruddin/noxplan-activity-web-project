import { useCallback } from "react";
import { usePlan } from "@/context/PlanContext";
import { confirmReopen } from "@/helpers/notify";
import { short } from "@/helpers/plan";
import type { Activity, Status } from "@/types";

/** Ubah status aktivitas; membatalkan status selesai harus dikonfirmasi agar tanggal selesai tidak hilang tanpa sengaja */
export function useStatusChange() {
  const { setStatus } = usePlan();
  return useCallback(async (item: Activity, status: Status) => {
    if (item.status === status) return;
    if (item.status === "done" && !(await confirmReopen(item.task, item.actual && short(item.actual))).isConfirmed) return;
    setStatus(item.id, status);
  }, [setStatus]);
}
