let pointer = { x: 0, y: 0, set: false };
if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", (e) => { pointer = { x: e.clientX, y: e.clientY, set: true }; }, { capture: true, passive: true });
}

const COLORS = ["#107c41", "#2fbf71", "#f5b82e", "#0070c0", "#e8573d", "#7b5cff"];

/** Efek pesta: serpihan warna dari titik terakhir yang diklik */
export function confetti(power: "small" | "big" = "small"): void {
  if (typeof document === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cv = document.createElement("canvas");
  cv.setAttribute("aria-hidden", "true");
  Object.assign(cv.style, { position: "fixed", inset: "0", width: "100%", height: "100%", pointerEvents: "none", zIndex: "9999" });
  const dpr = window.devicePixelRatio || 1;
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  document.body.appendChild(cv);
  const ctx = cv.getContext("2d");
  if (!ctx) { cv.remove(); return; }
  ctx.scale(dpr, dpr);
  const ox = pointer.set ? pointer.x : innerWidth / 2, oy = pointer.set ? pointer.y : innerHeight / 3;
  const n = power === "big" ? 160 : 70;
  const ps = Array.from({ length: n }, () => {
    const a = Math.random() * Math.PI * 2, v = (power === "big" ? 9 : 6) * (0.4 + Math.random());
    return { x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 4, w: 5 + Math.random() * 6, h: 3 + Math.random() * 5, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: COLORS[(Math.random() * COLORS.length) | 0] };
  });
  const t0 = performance.now(), life = power === "big" ? 2200 : 1500;
  const tick = (t: number) => {
    const k = t - t0;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ps.forEach((p) => {
      p.vy += 0.22; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - k / life); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
    });
    if (k < life) requestAnimationFrame(tick); else cv.remove();
  };
  requestAnimationFrame(tick);
}
