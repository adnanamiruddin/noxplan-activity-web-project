import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Activity } from "@/types";

interface UI {
  activity: Partial<Activity> | null;
  openActivity: (a?: Partial<Activity>) => void;
  closeActivity: () => void;
  create: { excel: boolean; append: boolean } | null;
  openCreatePlan: (excel?: boolean) => void;
  openImport: () => void;
  closeCreate: () => void;
}
const C = createContext<UI | null>(null);

/** Dialog global: tambah/ubah aktivitas dan buat plan bisa dibuka dari halaman mana pun */
export function UIProvider({ children }: { children: ReactNode }) {
  const [activity, setActivity] = useState<Partial<Activity> | null>(null);
  const [create, setCreate] = useState<{ excel: boolean; append: boolean } | null>(null);
  const openActivity = useCallback((a: Partial<Activity> = {}) => setActivity({ ...a }), []);
  const closeActivity = useCallback(() => setActivity(null), []);
  const openCreatePlan = useCallback((excel = false) => setCreate({ excel, append: false }), []);
  const openImport = useCallback(() => setCreate({ excel: true, append: true }), []);
  const closeCreate = useCallback(() => setCreate(null), []);
  const value = useMemo(() => ({ activity, openActivity, closeActivity, create, openCreatePlan, openImport, closeCreate }), [activity, openActivity, closeActivity, create, openCreatePlan, openImport, closeCreate]);
  return <C.Provider value={value}>{children}</C.Provider>;
}
export function useUI(): UI {
  const c = useContext(C);
  if (!c) throw new Error("useUI harus dipakai di dalam <UIProvider>");
  return c;
}
