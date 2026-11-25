export type Status = "todo" | "doing" | "done" | "hold";
export interface Phase { id: string; name: string; color: string }
export interface Deliverable { id: string; name: string; phaseId: string }
/** Tanggal disimpan sebagai "YYYY-MM-DD" */
export interface Activity { id: string; phaseId: string; deliverable: string; task: string; start: string; end: string; actual: string; status: Status }
/** log = hari-hari saat ada pembaruan (untuk streak dan skor Drive) */
export interface StoredPlan { id: string; name: string; items: Activity[]; log: string[] }
/** Master data bersama semua plan */
export interface Master { phases: Phase[]; deliverables: Deliverable[] }
/** Plan aktif yang sudah digabung dengan master data */
export type Plan = StoredPlan & Master;
export interface Store extends Master { plans: StoredPlan[]; activeId: string }
