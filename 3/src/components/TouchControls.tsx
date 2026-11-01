import { useRef, useState } from "react";
import PixelSprite from "./PixelSprite";
import type { OperatorMeta } from "../game/engine";

interface Vec { x: number; y: number; on: boolean; }

function Stick({
  onChange,
  color,
  label,
  fireLabel,
  size = 128,
}: {
  onChange: (x: number, y: number, active: boolean) => void;
  color: string;
  label: string;
  fireLabel?: string;
  size?: number;
}) {
  const [nub, setNub] = useState<Vec>({ x: 0, y: 0, on: false });
  const pid = useRef<number | null>(null);
  const base = useRef<HTMLDivElement>(null);

  const handle = (e: React.PointerEvent) => {
    const r = base.current!.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const d = Math.hypot(dx, dy);
    const R = size * 0.34;
    if (d > R) { dx = (dx / d) * R; dy = (dy / d) * R; }
    setNub({ x: dx, y: dy, on: true });
    onChange(dx / R, dy / R, true);
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        ref={base}
        className="relative touch-none rounded-full border-4"
        style={{
          width: size, height: size,
          borderColor: "#2c3242",
          background: "radial-gradient(circle, rgba(20,24,34,0.85) 0%, rgba(13,16,24,0.92) 100%)",
          boxShadow: "inset 0 0 0 3px rgba(0,0,0,0.6), 3px 3px 0 rgba(0,0,0,0.5)",
        }}
        onPointerDown={(e) => {
          pid.current = e.pointerId;
          base.current?.setPointerCapture(e.pointerId);
          handle(e);
        }}
        onPointerMove={(e) => { if (pid.current === e.pointerId) handle(e); }}
        onPointerUp={(e) => {
          if (pid.current !== e.pointerId) return;
          pid.current = null;
          setNub({ x: 0, y: 0, on: false });
          onChange(0, 0, false);
        }}
        onPointerCancel={() => {
          pid.current = null;
          setNub({ x: 0, y: 0, on: false });
          onChange(0, 0, false);
        }}
      >
        {/* 方向刻痕 */}
        <div className="absolute left-1/2 top-1.5 h-3 w-1 -translate-x-1/2 bg-[#2c3242]" />
        <div className="absolute bottom-1.5 left-1/2 h-3 w-1 -translate-x-1/2 bg-[#2c3242]" />
        <div className="absolute left-1.5 top-1/2 h-1 w-3 -translate-y-1/2 bg-[#2c3242]" />
        <div className="absolute right-1.5 top-1/2 h-1 w-3 -translate-y-1/2 bg-[#2c3242]" />
        <div
          className="absolute left-1/2 top-1/2 rounded-full border-4 border-black/60 transition-transform"
          style={{
            width: size * 0.38, height: size * 0.38,
            background: nub.on ? color : "#3a4152",
            boxShadow: "0 3px 0 rgba(0,0,0,0.55), inset 0 -4px 0 rgba(0,0,0,0.3)",
            transform: `translate(calc(-50% + ${nub.x}px), calc(-50% + ${nub.y}px))`,
            transitionDuration: nub.on ? "0ms" : "120ms",
          }}
        />
        {fireLabel && nub.on && (
          <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em]" style={{ color }}>
            {fireLabel}
          </div>
        )}
      </div>
      <span className="text-[10px] tracking-[0.4em] text-[#5b6377]">{label}</span>
    </div>
  );
}

export default function TouchControls({
  operator,
  weapon,
  stink,
  abilityReady,
  onMove,
  onAim,
  onFire,
  onWeapon,
  onAbility,
  onTelegraph,
  onPause,
  actionLabel,
  hideWeapons = false,
  onActionDown,
  onReload,
  onThrow,
  landscape = false,
}: {
  operator: OperatorMeta;
  weapon: string;
  stink: string;
  abilityReady: boolean;
  onMove: (x: number, y: number) => void;
  onAim: (x: number, y: number, active: boolean) => void;
  onFire: (f: boolean) => void;
  onWeapon: (w: "gas" | "laser" | "melee" | "hydro" | "bomb") => void;
  onAbility: () => void;
  onTelegraph: () => void;
  onPause: () => void;
  actionLabel?: string;
  hideWeapons?: boolean;
  onActionDown?: (down: boolean) => void;
  onReload?: () => void;
  onThrow?: () => void;
  landscape?: boolean;
}) {
  const weapons = [
    { id: "gas" as const, icon: "gunGas" as const, c: "#ff9426" },
    { id: "laser" as const, icon: "gunLaser" as const, c: "#ff5140" },
    { id: "melee" as const, icon: "gunCompass" as const, c: "#ece7d8" },
    { id: "hydro" as const, icon: "gunHydro" as const, c: "#49a0c4" },
    { id: "bomb" as const, icon: "bomb" as const, c: "#7fae3f" },
  ];
  const SZ = landscape ? 108 : 128;
  return (
    <div className={`flex w-full items-end justify-between gap-2 px-2 ${landscape ? "pb-1 pt-0" : "pb-3 pt-2"}`}>
      {/* 左摇杆：移动 */}
      <Stick onChange={(x, y) => onMove(x, y)} color="#6f9fd8" label="移 动" size={SZ} />

      {/* 中央：武器 + 功能键 */}
      <div className="flex flex-col items-center gap-1.5">
        {hideWeapons ? (
          <>
            <button
              className="px-btn px-btn-amber anim-blink h-16 w-28 p-0 text-lg tracking-[0.2em] touch-none"
              onPointerDown={(e) => { e.preventDefault(); onAbility(); onActionDown?.(true); }}
              onPointerUp={(e) => { e.preventDefault(); onActionDown?.(false); }}
              onPointerCancel={() => onActionDown?.(false)}
              onPointerLeave={() => onActionDown?.(false)}
            >
              {actionLabel ?? "行动"}
            </button>
            <button
              className="px-btn px-btn-dark h-9 w-16 p-0 text-sm touch-none"
              onPointerDown={(e) => { e.preventDefault(); onPause(); }}
            >
              II
            </button>
            <span className="text-[9px] tracking-[0.3em] text-[#5b6377]">右摇杆瞄准开火</span>
          </>
        ) : (
          <>
            <div className="flex gap-1.5">
              <button
                className="px-btn px-btn-amber h-10 w-10 p-0 text-lg touch-none"
                onPointerDown={(e) => { e.preventDefault(); onTelegraph(); }}
              >
                ⚡
              </button>
              <button
                className="px-btn h-10 w-10 p-0 touch-none"
                style={{ background: operator.color, color: "#14171f", opacity: abilityReady ? 1 : 0.5 }}
                onPointerDown={(e) => { e.preventDefault(); onAbility(); }}
              >
                Q
              </button>
              <button
                className="px-btn px-btn-teal h-10 w-10 p-0 text-xs touch-none"
                onPointerDown={(e) => { e.preventDefault(); onReload?.(); }}
              >
                换弹
              </button>
              <button
                className="px-btn px-btn-red h-10 w-10 p-0 text-xs touch-none"
                onPointerDown={(e) => { e.preventDefault(); onThrow?.(); }}
              >
                投掷
              </button>
              <button
                className="px-btn px-btn-dark h-10 w-10 p-0 text-sm touch-none"
                onPointerDown={(e) => { e.preventDefault(); onPause(); }}
              >
                II
              </button>
            </div>
            <div className="flex gap-1.5">
              {weapons.map((w) => {
                const locked = w.id === "bomb" && stink !== "ready";
                return (
                  <button
                    key={w.id}
                    className={`px-box-dark flex h-11 w-11 items-center justify-center p-1 touch-none ${locked ? "grayscale opacity-50" : ""}`}
                    style={weapon === w.id ? { borderColor: w.c, transform: "translateY(-3px)" } : undefined}
                    onPointerDown={(e) => { e.preventDefault(); onWeapon(w.id); }}
                  >
                    <PixelSprite name={w.icon} scale={1.6} />
                  </button>
                );
              })}
            </div>
            <span className="text-[9px] tracking-[0.3em] text-[#5b6377]">⚡电报 · Q技能 · 武器栏</span>
          </>
        )}
      </div>

      {/* 右摇杆：瞄准 + 开火 */}
      <Stick
        onChange={(x, y, on) => {
          onAim(x, y, on);
          onFire(on && Math.hypot(x, y) > 0.25);
        }}
        color="#d53a26"
        label="瞄准 · 开火"
        fireLabel="开 火"
        size={SZ}
      />
    </div>
  );
}
