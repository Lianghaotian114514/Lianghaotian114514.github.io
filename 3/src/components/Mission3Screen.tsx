import { useCallback, useEffect, useRef, useState } from "react";
import { Mission3 } from "../game/mission3";
import type { M3Hud, M3End } from "../game/mission3";
import type { OperatorMeta, Tone } from "../game/engine";
import { sfx } from "../game/audio";
import TouchControls from "./TouchControls";
import CrtConsole from "./CrtConsole";
import { useStageFit } from "./useStageFit";

interface Ev { id: number; msg: string; tone: Tone; t: number }

const TONE_COLOR: Record<Tone, string> = {
  info: "#8fa3c8", good: "#7fe08a", bad: "#ff5140", warn: "#c2a14a",
};

function Bar({ v, max, color, h = 12 }: { v: number; max: number; color: string; h?: number }) {
  return (
    <div className="border-2 border-black bg-black/70">
      <div className="bar-chunk" style={{ width: `${Math.max(0, Math.min(1, v / max)) * 100}%`, height: h, background: color }} />
    </div>
  );
}

export default function Mission3Screen({
  operator,
  onFinish,
}: {
  operator: OperatorMeta;
  onFinish: (res: M3End) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Mission3 | null>(null);
  const [hud, setHud] = useState<M3Hud | null>(null);
  const [events, setEvents] = useState<Ev[]>([]);
  const [banner, setBanner] = useState<{ id: number; t: string; s: string; tone: Tone } | null>(null);
  const [paused, setPaused] = useState(false);
  const fit = useStageFit({ sideW: 304, reserveH: 58, touch: typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches });
  const stageW = fit.w;
  const portrait = fit.portrait;
  const [keying, setKeying] = useState(false);
  const [touch] = useState(() => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
  const seq = useRef(0);
  const elapsedRef = useRef(0);
  const bt = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  const pushEvent = useCallback((msg: string, tone: Tone = "info") => {
    setEvents((e) => [...e.slice(-40), { id: seq.current++, msg, tone, t: elapsedRef.current }]);
    setKeying(true);
    setTimeout(() => setKeying(false), 800);
  }, []);

  useEffect(() => {
    sfx.ensure();
    const g = new Mission3(canvasRef.current!, {
      operator: operator.id,
      sfx,
      onHud: (h) => { elapsedRef.current = h.timer; setHud(h); },
      onEvent: pushEvent,
      onBanner: (t, s, tone = "info") => {
        setBanner({ id: seq.current++, t, s, tone });
        if (bt.current) clearTimeout(bt.current);
        bt.current = setTimeout(() => setBanner(null), 2900);
      },
      onEnd: (res) => finishRef.current(res),
      onTogglePause: () => setPaused((p) => !p),
    });
    gameRef.current = g;
    g.start();
    return () => { g.destroy(); gameRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operator.id]);

  useEffect(() => { if (gameRef.current) gameRef.current.paused = paused; }, [paused]);

  const hudScale = fit.scale * (fit.phoneLandscape ? 1.32 : fit.phonePortrait ? 1.18 : 1);
  const actionLabel =
    hud?.phase === "sneak" ? "拉闸"
      : hud?.phase === "bomb" ? "投弹" : "行动";

  return (
    <div className={`relative z-10 flex h-screen w-screen select-none items-center justify-center overflow-hidden bg-[#05070a] ${fit.phoneLandscape ? "p-0" : "p-2"}`}>
      <div className="flex items-start justify-center gap-3">
        <div className="flex min-w-0 flex-col" style={{ width: fit.w }}>
          <div ref={stageRef} className="px-box-dark relative overflow-hidden" style={{ width: fit.w, height: fit.h }}>
            <canvas ref={canvasRef} className="pixel-canvas h-full w-full touch-none" />
            {touch && <div className="absolute inset-0 z-[5] touch-none" />}

            <div
              className="pointer-events-none absolute left-0 top-0 flex flex-col justify-between p-3"
              style={{ width: `${100 / hudScale}%`, height: `${100 / hudScale}%`, transform: `scale(${hudScale})`, transformOrigin: "top left" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="px-box-dark w-56 p-2.5">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm tracking-widest" style={{ color: operator.color }}>{operator.name}</span>
                    <span className="font-num text-xs text-[#8fa3c8]">{hud?.hp ?? 0}/{hud?.hpMax ?? 0}</span>
                  </div>
                  <Bar v={hud?.hp ?? 1} max={hud?.hpMax ?? 1} color="#b5362a" />
                  {hud?.phase === "sneak" && (
                    <>
                      <div className="mt-1.5 flex justify-between text-[10px] tracking-widest text-[#8fa3c8]">
                        <span>警戒度</span>
                        <span className="font-num" style={{ color: hud.alert > 0.6 ? "#ff5140" : "#c9d1dc" }}>
                          {Math.round(hud.alert * 100)}%
                        </span>
                      </div>
                      <Bar v={hud.alert} max={1} color={hud.alert > 0.6 ? "#ff5140" : "#c2a14a"} h={8} />
                    </>
                  )}
                  {(hud?.phase === "blackout" || hud?.phase === "crowd") && (
                    <>
                      <div className="mt-1.5 text-[10px] tracking-widest text-[#8fa3c8]">体力</div>
                      <Bar v={hud.stamina} max={100} color={hud.stamina > 25 ? "#8fd6a0" : "#ff7a63"} h={8} />
                    </>
                  )}
                  {hud?.phase === "bomb" && (
                    <div className="mt-1.5 flex items-center justify-between text-[11px] tracking-widest">
                      <span className="text-[#8fa3c8]">弹药</span>
                      <span className="font-num text-lg text-[#c4e368]">{hud.bombsLeft}</span>
                    </div>
                  )}
                </div>

                <div className="px-box-dark flex min-w-[260px] flex-col items-center px-4 py-2">
                  <span className="text-[10px] tracking-[0.5em] text-[#a8332a]">复 仇 行 动</span>
                  <span className="mt-0.5 text-xs tracking-[0.3em] text-[#c2a14a]">{hud?.title ?? "—"}</span>
                  <span className="mt-1 text-center text-sm tracking-[0.08em] text-[#e8e4d4]">{hud?.objective ?? "—"}</span>
                  <div className="mt-1.5 w-full"><Bar v={hud?.progress ?? 0} max={1} color="#8fd6a0" h={8} /></div>
                </div>

                <div className="px-box-dark px-3 py-2 text-right">
                  <div className="text-[10px] tracking-widest text-[#8fa3c8]">
                    {hud?.phase === "bomb" ? "命中目标" : "歼敌"}
                  </div>
                  <div className="font-num text-2xl leading-none text-[#c2a14a]">
                    {hud?.phase === "bomb" ? `${hud.targetsHit}/${hud.targetsTotal}` : (hud?.kills ?? 0)}
                  </div>
                </div>
              </div>

              <div className="flex items-end justify-between gap-3">
                <div className="flex-1" />
                {!touch && (
                  <div className="px-box-dark px-3 py-1.5 text-[10px] leading-5 tracking-[0.15em] text-[#6d7690]">
                    {hud?.phase === "bomb"
                      ? "移动鼠标选择落点 · 左键投弹（飞机自动巡航）· Esc 暂停"
                      : "WASD 移动 · Shift 潜行/冲刺 · 鼠标左键 射击 · F 行动 · Esc 暂停"}
                  </div>
                )}
              </div>
            </div>

            {banner && (
              <div className="pointer-events-none absolute inset-x-0 top-[20%] z-10 flex justify-center">
                <div className="anim-pop max-w-[92%] px-6 py-3 text-center"
                  style={{ background: "rgba(5,7,10,0.9)", border: `3px solid ${TONE_COLOR[banner.tone]}`, boxShadow: "6px 6px 0 rgba(0,0,0,0.6)" }}>
                  <div className={`${stageW < 700 ? "text-xl" : "text-3xl"} tracking-[0.2em]`} style={{ color: TONE_COLOR[banner.tone] }}>{banner.t}</div>
                  <div className="mt-1 text-xs tracking-[0.25em] text-[#c9d1dc] md:text-sm">{banner.s}</div>
                </div>
              </div>
            )}

            {touch && !portrait && (
              <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#05070a]/90 to-transparent">
                <TouchControls
                  landscape
                  operator={operator} weapon="gas" stink="none" abilityReady
                  actionLabel={actionLabel} hideWeapons
                  onMove={(x, y) => gameRef.current?.setVirtualMove(x, y)}
                  onAim={(x, y) => gameRef.current?.setVirtualAim(x, y)}
                  onFire={(f) => gameRef.current?.setVirtualFire(f)}
                  onWeapon={() => undefined}
                  onAbility={() => gameRef.current?.action()}
                  onTelegraph={() => gameRef.current?.action()}
                  onPause={() => setPaused(true)}
                />
              </div>
            )}

            {paused && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/78">
                <div className="px-paper anim-pop w-80 p-6 text-center text-[#14171f]">
                  <h3 className="text-3xl tracking-[0.4em]">暂 停</h3>
                  <p className="mt-2 text-xs tracking-[0.2em] text-[#7a7461]">复仇不急于一时</p>
                  <button className="px-btn px-btn-teal mt-5 w-full py-2.5 text-lg tracking-[0.3em]" onClick={() => setPaused(false)}>
                    ▶ 继续
                  </button>
                </div>
              </div>
            )}
          </div>

          {touch && portrait && (
            <TouchControls
              operator={operator} weapon="gas" stink="none" abilityReady
              actionLabel={actionLabel} hideWeapons
              onMove={(x, y) => gameRef.current?.setVirtualMove(x, y)}
              onAim={(x, y) => gameRef.current?.setVirtualAim(x, y)}
              onFire={(f) => gameRef.current?.setVirtualFire(f)}
              onWeapon={() => undefined}
              onAbility={() => gameRef.current?.action()}
              onTelegraph={() => gameRef.current?.action()}
              onPause={() => setPaused(true)}
            />
          )}

          {fit.narrow && (
            <div className="mt-1.5">
              <CrtConsole messages={events} compact keying={keying} />
            </div>
          )}
        </div>

        {!fit.narrow && (
        <aside style={{ height: fit.h }}>
          <CrtConsole messages={events} keying={keying} />
        </aside>
        )}
      </div>
    </div>
  );
}
