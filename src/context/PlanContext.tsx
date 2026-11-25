import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { confetti } from "@/helpers/confetti";
import { DELIVERABLES, PRESET, blankPlan, setItemActual, setItemStatus, touch, uid, withMaster } from "@/helpers/plan";
import type { Activity, Master, Plan, Store, StoredPlan } from "@/types";

const KEY = "noxplan:v2";
const KEY_V1 = "noxplan:plan:v1";

const first = blankPlan("Activity Plan Saya");
const INIT: Store = { plans: [first], activeId: first.id, phases: PRESET, deliverables: DELIVERABLES };

function load(): Store | null {
  try {
    const r2 = localStorage.getItem(KEY);
    if (r2) {
      const s = JSON.parse(r2) as Partial<Store>;
      if (s.plans?.length) return { ...INIT, ...s, plans: s.plans, activeId: s.activeId ?? s.plans[0].id } as Store;
    }
    const r1 = localStorage.getItem(KEY_V1); // data versi pertama: satu plan
    if (r1) {
      const s = JSON.parse(r1);
      let phases = s.phases ?? PRESET;
      if (!s.deliverables && !phases.some((f: { id: string }) => f.id === "p6")) phases = [...phases, PRESET[5]];
      const id = uid();
      return { ...INIT, plans: [{ id, name: s.name || first.name, items: s.items ?? [], log: s.log ?? [] }], activeId: id, phases, deliverables: s.deliverables ?? DELIVERABLES };
    }
  } catch { /* abaikan */ }
  return null;
}

interface Ctx {
  ready: boolean;
  plan: Plan; plans: StoredPlan[]; master: Master; allItems: Activity[];
  isNew: (id: string) => boolean;
  update: (fn: (p: Plan) => Plan) => void;
  setStatus: (id: string, status: Activity["status"]) => void;
  setActual: (id: string, actual: string) => void;
  switchPlan: (id: string) => void;
  addPlan: (name: string, items?: Activity[]) => StoredPlan;
  addItems: (items: Activity[]) => void;
  renamePlan: (id: string, name: string) => void;
  removePlan: (id: string) => void;
  renameDeliverable: (from: string, to: string) => void;
}
const C = createContext<Ctx | null>(null);
const activeOf = (s: Store) => s.plans.find((p) => p.id === s.activeId) ?? s.plans[0];

/** Seluruh data tersimpan di localStorage browser (tanpa login) */
export function PlanProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(INIT);
  const [ready, setReady] = useState(false);
  const ref = useRef(store);
  const known = useRef(new Set<string>()); // id aktivitas yang sudah ada saat halaman dibuka; sisanya bertanda NEW
  const commit = useCallback((next: Store) => { ref.current = next; setStore(next); }, []);

  useEffect(() => { const s = load(); if (s) { s.plans.forEach((p) => p.items.forEach((i) => known.current.add(i.id))); commit(s); } setReady(true); }, [commit]);
  useEffect(() => {
    if (ready) try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { /* penuh / mode privat */ }
  }, [store, ready]);

  const active = activeOf(store);
  const master = useMemo<Master>(() => ({ phases: store.phases, deliverables: store.deliverables }), [store.phases, store.deliverables]);
  const plan = useMemo(() => withMaster(active, master), [active, master]);
  const allItems = useMemo(() => store.plans.flatMap((p) => p.items), [store.plans]);

  const update = useCallback((fn: (p: Plan) => Plan) => {
    const s = ref.current, a = activeOf(s);
    const n = fn(withMaster(a, s));
    commit({ ...s, phases: n.phases, deliverables: n.deliverables, plans: s.plans.map((p) => (p.id === a.id ? { id: a.id, name: n.name, items: n.items, log: n.log } : p)) });
  }, [commit]);

  const setStatus = useCallback((id: string, status: Activity["status"]) => {
    const s = ref.current, a = activeOf(s);
    const it = a.items.find((i) => i.id === id);
    if (!it || it.status === status) return;
    const n = setItemStatus(a, id, status);
    commit({ ...s, plans: s.plans.map((p) => (p.id === a.id ? n : p)) });
    if (status === "done") confetti(n.items.every((i) => i.status === "done") ? "big" : "small");
  }, [commit]);

  const setActual = useCallback((id: string, actual: string) => {
    const s = ref.current, a = activeOf(s);
    commit({ ...s, plans: s.plans.map((p) => (p.id === a.id ? setItemActual(p, id, actual) : p)) });
  }, [commit]);

  const addItems = useCallback((items: Activity[]) => {
    const s = ref.current, a = activeOf(s);
    commit({ ...s, plans: s.plans.map((p) => (p.id === a.id ? { ...p, items: [...p.items, ...items], log: touch(p) } : p)) });
  }, [commit]);
  const isNew = useCallback((id: string) => !known.current.has(id), []);

  const switchPlan = useCallback((id: string) => { commit({ ...ref.current, activeId: id }); }, [commit]);
  const addPlan = useCallback((name: string, items: Activity[] = []) => {
    const s = ref.current;
    const p: StoredPlan = { ...blankPlan(name.trim() || "Plan baru"), items };
    commit({ ...s, plans: [...s.plans, p], activeId: p.id });
    return p;
  }, [commit]);
  const renamePlan = useCallback((id: string, name: string) => {
    commit({ ...ref.current, plans: ref.current.plans.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p)) });
  }, [commit]);
  const removePlan = useCallback((id: string) => {
    const s = ref.current;
    if (s.plans.length < 2) return;
    const plans = s.plans.filter((p) => p.id !== id);
    commit({ ...s, plans, activeId: plans.some((p) => p.id === s.activeId) ? s.activeId : plans[0].id });
  }, [commit]);
  const renameDeliverable = useCallback((from: string, to: string) => {
    const s = ref.current;
    commit({ ...s, plans: s.plans.map((p) => ({ ...p, items: p.items.map((i) => (i.deliverable === from ? { ...i, deliverable: to } : i)) })) });
  }, [commit]);

  const value = useMemo<Ctx>(
    () => ({ ready, plan, plans: store.plans, master, allItems, isNew, update, setStatus, setActual, switchPlan, addPlan, addItems, renamePlan, removePlan, renameDeliverable }),
    [ready, plan, store.plans, master, allItems, isNew, update, setStatus, setActual, switchPlan, addPlan, addItems, renamePlan, removePlan, renameDeliverable],
  );
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function usePlan(): Ctx {
  const c = useContext(C);
  if (!c) throw new Error("usePlan harus dipakai di dalam <PlanProvider>");
  return c;
}
