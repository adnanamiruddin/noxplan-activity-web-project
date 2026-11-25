import type { ReactNode } from "react";

/** Chip filter bulat; aktif = gelap */
export default function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" className={`btn btn-xs h-8 shrink-0 rounded-full ${active ? "btn-neutral" : "btn-outline border-base-300"}`} onClick={onClick}>{children}</button>;
}
