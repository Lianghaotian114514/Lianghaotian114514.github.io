import { useState, type ReactNode } from "react";

/* 全屏 CRT 覆盖层：扫描线 + 噪点 + 暗角 + 扫描光带 */
export function Overlays() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[90]" aria-hidden>
      <div className="absolute inset-0 fx-scanlines" />
      <div className="absolute inset-0 fx-noise" />
      <div className="absolute inset-0 fx-vignette" />
      <div className="absolute left-0 w-full fx-scanbar" />
    </div>
  );
}

/* 故障抖动文字 */
export function GlitchText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <span className={`glitch ${className}`} data-text={text}>
      {text}
    </span>
  );
}

/* 机密涂抹条：默认 ████，点击显示原文，再次点击重新涂抹 */
export function Redacted({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      title={open ? "点击重新涂抹" : "机要涂抹·点击临时还原"}
      className={`mx-0.5 inline-block translate-y-[0.08em] cursor-pointer rounded-[3px] px-1.5 py-px font-tech text-[0.82em] leading-tight tracking-widest transition-all duration-200 hover:brightness-150 ${
        open
          ? "border border-[#ffb319]/60 bg-[#ffb319]/10 text-[#ffd97a] text-glow-amber"
          : "redacted-hidden"
      }`}
    >
      {open ? text : "█".repeat(Math.max(2, Math.min(6, text.length + 1)))}
    </button>
  );
}

/* 含 [[红acted]] 语法的富文本渲染 */
export function RichText({ text, className = "" }: { text: string; className?: string }) {
  const parts = text.split(/(\[\[[^\]]+\]\])/g);
  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.startsWith("[[") && p.endsWith("]]") ? (
          <Redacted key={i} text={p.slice(2, -2)} />
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </span>
  );
}

/* 四角瞄准框装饰 */
export function CornerFrame({ className = "" }: { className?: string }) {
  const c = "absolute h-3.5 w-3.5 border-[#3dff88]/70";
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden>
      <span className={`${c} left-0 top-0 border-l-2 border-t-2`} />
      <span className={`${c} right-0 top-0 border-r-2 border-t-2`} />
      <span className={`${c} bottom-0 left-0 border-b-2 border-l-2`} />
      <span className={`${c} bottom-0 right-0 border-b-2 border-r-2`} />
    </div>
  );
}

/* 旋转的盖章印章 */
export function Stamp({
  text,
  sub,
  tone = "red",
  className = "",
}: {
  text: string;
  sub?: string;
  tone?: "red" | "amber";
  className?: string;
}) {
  const color = tone === "red" ? "text-[#ff3b3b] border-[#ff3b3b]" : "text-[#ffb319] border-[#ffb319]";
  return (
    <div
      className={`pointer-events-none select-none rounded-md border-[3px] px-4 py-2 text-center font-display tracking-[0.3em] opacity-85 mix-blend-screen ${color} ${className}`}
      style={{ textShadow: "0 0 14px currentColor" }}
    >
      <div className="text-lg leading-none sm:text-xl">{text}</div>
      {sub && <div className="mt-1 font-tech text-[9px] tracking-[0.25em]">{sub}</div>}
    </div>
  );
}

/* 分隔线 */
export function Divider({ children }: { children?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-[10px] tracking-[0.4em] text-[#2f7a4a]">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#1d5c35] to-[#1d5c35]" />
      {children}
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[#1d5c35] to-[#1d5c35]" />
    </div>
  );
}
