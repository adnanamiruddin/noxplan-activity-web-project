import type { ReactNode } from "react";

export default function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-[1.9rem] font-bold leading-tight tracking-tight md:text-4xl">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </header>
  );
}
