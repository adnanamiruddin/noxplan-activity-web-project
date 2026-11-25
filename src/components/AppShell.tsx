import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { LuCalendarRange, LuCheck, LuChevronDown, LuDatabase, LuFolderOpen, LuFolders, LuLayers, LuLayoutDashboard, LuListChecks, LuMenu, LuPlus, LuTrendingUp } from "react-icons/lu";
import ActivityDialog from "@/components/ActivityDialog";
import CreatePlanDialog from "@/components/CreatePlanDialog";
import { useUI } from "@/components/UIContext";
import { APP_NAME } from "@/const/app";
import { usePlan } from "@/context/PlanContext";
import { notify } from "@/helpers/notify";
import { counts } from "@/helpers/stats";

const MAIN = [
  { href: "/", label: "Beranda", icon: LuLayoutDashboard },
  { href: "/activities", label: "Aktivitas", icon: LuListChecks },
  { href: "/timeline", label: "Timeline", icon: LuCalendarRange },
  { href: "/progress", label: "Progres", icon: LuTrendingUp },
];
const MANAGE = [{ href: "/plans", label: "Plan", icon: LuFolders }];
const MASTER = [
  { href: "/master-fase", label: "Master Fase", icon: LuLayers },
  { href: "/master-data", label: "Master Key Deliverable", icon: LuDatabase },
];

/** Name Box ala Excel: nama plan aktif sekaligus pengganti plan */
function PlanSwitcher() {
  const { plan, plans, switchPlan } = usePlan();
  const { openCreatePlan } = useUI();
  const blur = () => (document.activeElement as HTMLElement | null)?.blur();
  return (
    <div className="dropdown w-full">
      <div tabIndex={0} role="button" className="namebox w-full" aria-label="Ganti plan">
        <LuFolderOpen className="shrink-0 text-primary" aria-hidden />
        <span className="flex-1 truncate text-left">{plan.name || "Tanpa nama"}</span>
        <LuChevronDown className="shrink-0 text-base-content/50" aria-hidden />
      </div>
      <div tabIndex={0} className="dropdown-content z-50 mt-2 w-[15.5rem] overflow-hidden rounded-lg border border-base-300 bg-base-100 shadow-lg">
        <ul className="max-h-64 overflow-y-auto p-1">
          {plans.map((p) => {
            const c = counts(p.items);
            const on = p.id === plan.id;
            return (
              <li key={p.id}>
                <button type="button" className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-base-200 ${on ? "font-bold" : ""}`} onClick={() => { if (!on) { switchPlan(p.id); notify(`Berhasil pindah ke plan "${p.name}"`); } blur(); }}>
                  <span className="grid size-4 shrink-0 place-items-center text-primary">{on && <LuCheck aria-hidden />}</span>
                  <span className="min-w-0 flex-1 truncate">{p.name || "Tanpa nama"}</span>
                  <span className="text-xs tabular-nums text-base-content/55">{c.pct}%</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex border-t border-base-300 bg-base-200/60 p-1">
          <Link href="/plans" onClick={blur} className="btn btn-ghost btn-sm flex-1">Kelola plan</Link>
          <button type="button" className="btn btn-ghost btn-sm flex-1 text-primary" onClick={() => { openCreatePlan(); blur(); }}><LuPlus aria-hidden /> Plan baru</button>
        </div>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label={APP_NAME}>
      <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-content">
        <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden><path d="M7 7h18v18H7z M7 13h18 M7 19h18 M13 7v18" fill="none" stroke="currentColor" strokeWidth="1.9" /><path d="M14.6 21.6l2.5 2.5 5.2-5.9" fill="none" stroke="#f5b82e" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
      <span className="font-display text-lg font-extrabold leading-tight tracking-tight">{APP_NAME}</span>
    </Link>
  );
}

function NavGroup({ title, items }: { title?: string; items: typeof MAIN }) {
  const { pathname } = useRouter();
  return (
    <div>
      {title && <p className="mb-1.5 px-3 text-xs font-bold text-base-content/50">{title}</p>}
      <ul className="space-y-0.5">
        {items.map(({ href, label, icon: Icon }) => (
          <li key={href}><Link href={href} className="side-link" aria-current={pathname === href ? "page" : undefined}><Icon className="shrink-0 text-lg" aria-hidden />{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}

function Sidebar() {
  const { plan, ready } = usePlan();
  const { openActivity } = useUI();
  const c = counts(plan.items);
  return (
    <aside className="flex h-full w-64 flex-col gap-5 border-r border-base-300 bg-base-100 p-4">
      <Logo />
      <div className="space-y-2">
        <PlanSwitcher />
        <button type="button" className="btn btn-primary w-full" onClick={() => openActivity()}><LuPlus aria-hidden /> Tambah aktivitas</button>
      </div>
      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto" aria-label="Navigasi utama">
        <NavGroup title="Menu utama" items={MAIN} />
        <NavGroup title="Kelola" items={MANAGE} />
        <NavGroup title="Master" items={MASTER} />
      </nav>
      {ready && <p className="flex items-center gap-2 rounded-lg bg-base-200 px-3 py-2 text-sm font-semibold"><LuCheck className="text-primary" aria-hidden /> {c.done}/{c.total} selesai · {c.pct}%</p>}
    </aside>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { ready } = usePlan();
  const { pathname } = useRouter();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  return (
    <>
      <div className="drawer lg:drawer-open">
        <input id="nav-drawer" type="checkbox" className="drawer-toggle" checked={open} onChange={(e) => setOpen(e.target.checked)} aria-label="Menu" />
        <div className="drawer-content min-w-0">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-base-300 bg-base-100 px-3 py-2 lg:hidden">
            <label htmlFor="nav-drawer" className="btn btn-ghost btn-square btn-sm" aria-label="Buka menu"><LuMenu className="text-xl" aria-hidden /></label>
            <Logo />
          </header>
          <main className="mx-auto w-full max-w-[78rem] px-3 pb-16 pt-5 md:px-8 md:pt-8">
            {ready ? children : <div className="space-y-4" aria-busy><div className="skeleton h-10 w-64" /><div className="skeleton h-64 w-full" /></div>}
          </main>
        </div>
        <div className="drawer-side z-40">
          <label htmlFor="nav-drawer" aria-label="Tutup menu" className="drawer-overlay" />
          <Sidebar />
        </div>
      </div>
      <ActivityDialog />
      <CreatePlanDialog />
    </>
  );
}
