import { useCallback, useEffect, useRef, useState } from "react";
import { Game, SUPPLIES } from "../game/engine";
import type { HudState, EndStats, Tone, OperatorMeta } from "../game/engine";
import type { SFX } from "../game/audio";
import PixelSprite from "./PixelSprite";
import { ResultScreen } from "./Menu";
import { VictoryCutscene, DefeatCutscene } from "./Cutscene";
import TouchControls from "./TouchControls";
import CrtConsole from "./CrtConsole";
import { useStageFit } from "./useStageFit";

interface Ev { id: number; msg: string; tone: Tone; t: number }
interface Banner { id: number; title: string; sub: string; tone: Tone; }

const TONE_COLOR: Record<Tone, string> = {
  info: "#8fa3c8", good: "#7fe08a", bad: "#ff5140", warn: "#f2b53d",
};

function Bar({ v, max, color, h = 14 }: { v: number; max: number; color: string; h?: number }) {
  const pct = Math.max(0, Math.min(1, v / max));
  return (
    <div className="border-2 border-black bg-black/60" style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }}>
      <div
        className="bar-chunk transition-[width] duration-150"
        style={{ width: `${pct * 100}%`, height: h, background: color }}
      />
    </div>
  );
}

export default function GameScreen({
  operator,
  sfx,
  onQuit,
  onCampaignNext,
}: {
  operator: OperatorMeta;
  sfx: SFX;
  onQuit: () => void;
  onCampaignNext: (stats: EndStats) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [hud, setHud] = useState<HudState | null>(null);
  const [events, setEvents] = useState<Ev[]>([]);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [telegraph, setTelegraph] = useState(false);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<EndStats | null>(null);
  const [vicDone, setVicDone] = useState(false);
  const [defeatDone, setDefeatDone] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const fit = useStageFit({ sideW: 304, reserveH: 58, touch: typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches });
  const stageW = fit.w;
  const portrait = fit.portrait;
  const [touch] = useState(() => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
  const evSeq = useRef(0);
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const elapsedRef = useRef(0);
  const [keying, setKeying] = useState(false);
  const pushEvent = useCallback((msg: string, tone: Tone = "info") => {
    setEvents((ev) => [...ev.slice(-40), { id: evSeq.current++, msg, tone, t: elapsedRef.current }]);
    setKeying(true);
    setTimeout(() => setKeying(false), 900);
  }, []);

  const showBanner = useCallback((title: string, sub: string, tone: Tone = "info") => {
    setBanner({ id: evSeq.current++, title, sub, tone });
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => setBanner(null), 2600);
  }, []);

  useEffect(() => {
    setResult(null);
    setVicDone(false);
    setDefeatDone(false);
    setPaused(false);
    setTelegraph(false);
    setEvents([]);
    const game = new Game(canvasRef.current!, {
      operator: operator.id,
      sfx,
      onHud: (h) => { elapsedRef.current = 240 - h.timeLeft; setHud(h); },
      onEvent: pushEvent,
      onBanner: showBanner,
      onEnd: (s) => {
        setResult(s);
        sfx.stopAllLoops();
        if (s.win) sfx.startBgm("flag");   // 胜利 → 升旗的悲凉
        else sfx.stopBgm();
      },
      onToggleTelegraph: () => setTelegraph((t) => !t),
      onTogglePause: () => setPaused((p) => !p),
    });
    gameRef.current = game;
    game.start();
    sfx.startBgm("battle");   // 阵地战：雄壮军乐
    sfx.startTicker();        // 电报房背景：滴滴答答
    return () => {
      game.destroy();
      sfx.stopTicker();
      gameRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameKey, operator.id]);

  useEffect(() => {
    if (gameRef.current) gameRef.current.paused = paused || result !== null;
  }, [paused, result]);

  const restart = () => setGameKey((k) => k + 1);

  const timeLeft = hud?.timeLeft ?? 240;
  const mm = Math.floor(timeLeft / 60);
  const ss = Math.floor(timeLeft % 60);
  const urgent = timeLeft <= 30;
  // 手机端 HUD 适度放大，避免元素过小
  const hudScale = fit.scale * (fit.phoneLandscape ? 1.32 : fit.phonePortrait ? 1.18 : 1);

  // 武器栏：完全由引擎推送的编成数据驱动（支持任意武器组合）
  const WEAPON_META: Record<string, { name: string; icon: string; color: string }> = {
    gas: { name: "GAS喷枪", icon: "gunGas", color: "#ff9426" },
    laser: { name: "激光笔", icon: "gunLaser", color: "#ff5140" },
    hydro: { name: "高压水枪", icon: "gunHydro", color: "#49a0c4" },
    stapler: { name: "钉书机", icon: "gunStapler", color: "#d4788a" },
    rifle: { name: "粉笔狙", icon: "gunChalkRifle", color: "#b9c4d6" },
    eraser: { name: "黑板擦", icon: "gunEraser", color: "#c9a56a" },
    lamp: { name: "台灯炮", icon: "gunLampCannon", color: "#e8c15a" },
    melee: { name: "圆规", icon: "gunCompass", color: "#ece7d8" },
    bomb: { name: "臭水弹", icon: "bomb", color: "#7fae3f" },
  };
  const slots = (hud?.slots ?? []).map((sl, i) => {
    const meta = WEAPON_META[sl.id] ?? { name: sl.id, icon: "gunGas", color: "#8fa3c8" };
    return {
      key: String(i + 1),
      id: sl.id,
      name: meta.name,
      icon: meta.icon,
      color: meta.color,
      ammo: sl.ammo,
      ammoMax: sl.ammoMax,
      mags: sl.mags,
      magMax: sl.magMax,
      gauge: sl.ammoMax > 0 ? sl.ammo / sl.ammoMax : undefined,
      readout: sl.ammo < 0 ? "∞" : `${sl.ammo}/${sl.ammoMax}`,
    };
  });

  return (
    <div className={`relative z-10 flex h-screen w-screen select-none items-center justify-center overflow-hidden bg-[#0b0e14] ${fit.phoneLandscape ? "p-0" : "p-2"}`}>
      <div className="flex items-start justify-center gap-3">
      <div className="flex min-w-0 flex-col" style={{ width: fit.w }}>
        <div ref={stageRef} className="px-box-dark relative overflow-hidden" style={{ width: fit.w, height: fit.h }}>
          <canvas ref={canvasRef} key={gameKey} className="pixel-canvas h-full w-full touch-none" />

          {/* 触屏模式：屏蔽画布点按，防止误开火/页面滚动 */}
          {touch && <div className="absolute inset-0 z-[5] touch-none" />}

          {/* 手机竖屏：建议横屏提示 */}
          {fit.phonePortrait && !result && (
            <div className="pointer-events-none absolute left-1/2 top-2 z-30 -translate-x-1/2">
              <div className="px-box-dark flex items-center gap-2 px-2.5 py-1">
                <span className="text-sm">📱</span>
                <span className="text-[10px] tracking-[0.2em] text-[#c2a14a]">横屏体验更佳</span>
              </div>
            </div>
          )}

          {/* ============ HUD（整体随舞台宽度缩放） ============ */}
          <div
            className="pointer-events-none absolute left-0 top-0 flex flex-col justify-between p-3"
            style={{
              width: `${100 / hudScale}%`,
              height: `${100 / hudScale}%`,
              transform: `scale(${hudScale})`,
              transformOrigin: "top left",
            }}
          >
            {/* 顶部 */}
            <div className="flex items-start justify-between gap-3">
              {/* 左：玩家状态 */}
              <div className="px-box-dark w-60 p-2.5">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm tracking-widest" style={{ color: operator.color }}>
                    {operator.name}
                  </span>
                  <span className="px-2 text-[10px] text-[#8fa3c8]">{operator.title}</span>
                </div>
                <Bar v={hud?.hp ?? 1} max={hud?.hpMax ?? 1} color="#d53a26" />
                <div className="mt-1.5">
                  <div className="mb-0.5 flex justify-between text-[10px] tracking-widest text-[#8fa3c8]">
                    <span>大门耐久</span>
                    <span className="font-num text-xs text-[#f2b53d]">{hud?.door ?? 300}/{hud?.doorMax ?? 300}</span>
                  </div>
                  <Bar v={hud?.door ?? 1} max={hud?.doorMax ?? 1} color="#4e6584" h={10} />
                </div>
                {touch && (
                  <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                    <div>
                      <div className="flex justify-between text-[9px] tracking-widest text-[#8fa3c8]">
                        <span>燃气</span><span className="font-num">{hud?.fuel ?? 0}/{hud?.fuelMax ?? 0}</span>
                      </div>
                      <Bar v={hud?.fuel ?? 1} max={hud?.fuelMax ?? 1} color="#ff9426" h={7} />
                    </div>
                    <div>
                      <div className="flex justify-between text-[9px] tracking-widest text-[#8fa3c8]">
                        <span>电量</span><span className="font-num">{hud?.bat ?? 0}/{hud?.batMax ?? 0}</span>
                      </div>
                      <Bar v={hud?.bat ?? 1} max={hud?.batMax ?? 1} color="#ff5140" h={7} />
                    </div>
                  </div>
                )}
                {hud && hud.asthma >= 0 && (
                  <div className="mt-1.5">
                    <div className="mb-0.5 flex justify-between text-[10px] tracking-widest text-[#8fa3c8]">
                      <span>喘息值</span>
                      <span className="font-num text-xs" style={{ color: hud.asthma > 70 ? "#ff5140" : "#c9d1dc" }}>
                        {hud.asthma}%
                      </span>
                    </div>
                    <Bar v={hud.asthma} max={100} color={hud.asthma > 70 ? "#ff5140" : "#c9a0dc"} h={8} />
                  </div>
                )}
              </div>

              {/* 中：倒计时 */}
              <div className={`px-box-dark flex flex-col items-center px-5 py-1.5 ${urgent ? "anim-alert" : ""}`}>
                <span className="text-[10px] tracking-[0.5em] text-[#8fa3c8]">距离放学</span>
                <span className={`font-num text-4xl leading-none ${urgent ? "text-[#ff5140]" : "text-[#ece7d8]"}`}>
                  {mm}:{String(ss).padStart(2, "0")}
                </span>
                <span className="mt-0.5 text-[10px] tracking-[0.3em] text-[#6d7690]">
                  第 {hud?.wave ?? 1} 波 · 场上 {hud?.enemyCount ?? 0} 敌
                </span>
                {hud && hud.bossHp >= 0 && (
                  <div className="mt-1 w-56">
                    <div className="text-center text-[10px] tracking-[0.4em] text-[#ff5140]">治安队长</div>
                    <Bar v={hud.bossHp} max={hud.bossMax} color="#d53a26" h={8} />
                  </div>
                )}
              </div>

              {/* 右：班费 + 电报 + 在途 */}
              <div className="flex flex-col items-end gap-2">
                <div className="px-box-dark flex items-center gap-2 px-3 py-2">
                  <span className="h-3 w-3 bg-[#f2b53d]" style={{ clipPath: "polygon(50% 0,100% 50%,50% 100%,0 50%)" }} />
                  <span className="text-xs tracking-widest text-[#8fa3c8]">班费</span>
                  <span className="font-num text-3xl leading-none text-[#f2b53d]">{hud?.funds ?? 0}</span>
                </div>
                {!touch && (
                  <button
                    className="px-btn px-btn-amber pointer-events-auto px-4 py-2 text-sm tracking-[0.25em]"
                    onClick={() => setTelegraph((t) => !t)}
                  >
                    ▤ 电报机 [E]
                  </button>
                )}
                {hud && hud.pending.length > 0 && (
                  <div className="px-box-dark w-48 space-y-1 p-2">
                    {hud.pending.map((p) => (
                      <div key={p.name} className="text-[10px] text-[#c9d1dc]">
                        <div className="flex justify-between">
                          <span>✈ {p.name}</span>
                          <span className="font-num">{Math.ceil(p.t)}s</span>
                        </div>
                        <Bar v={p.total - p.t} max={p.total} color="#57d6e6" h={4} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 底部 */}
            <div className="flex items-end justify-between gap-3">
              {/* 武器栏（触屏移至操作台） */}
              {!touch ? (
                <div className="flex gap-1.5">
                  {slots.map((w) => {
                    const active = hud?.weapon === w.id;
                    const empty = w.ammo === 0;
                    return (
                      <button
                        key={w.id}
                        className={`px-box-dark pointer-events-auto relative flex w-[76px] flex-col items-center p-1.5 transition-transform ${active ? "-translate-y-1.5" : "opacity-75"}`}
                        style={active ? { borderColor: w.color } : undefined}
                        onClick={() => gameRef.current?.switchWeapon(w.id)}
                      >
                        <PixelSprite name={w.icon as "gunGas"} scale={1.6} />
                        <span className="mt-0.5 text-[10px] tracking-wide text-[#c9d1dc]">{w.name}</span>
                        <span className="absolute left-1 top-1 font-num text-xs text-[#6d7690]">{w.key}</span>
                        <span
                          className="font-num text-[11px] leading-none"
                          style={{ color: empty ? "#ff5140" : w.color }}
                        >
                          {w.readout}
                        </span>
                        {w.gauge !== undefined && (
                          <div className="mt-1 w-full">
                            <Bar v={w.gauge} max={1} color={empty ? "#ff5140" : w.color} h={4} />
                          </div>
                        )}
                        {/* 武装带弹匣指示 */}
                        {w.mags >= 0 && (
                          <div className="mt-1 flex gap-[3px]">
                            {Array.from({ length: w.magMax }).map((_, i) => (
                              <span
                                key={i}
                                className="block h-[9px] w-[4px] border border-black"
                                style={{ background: i < w.mags ? w.color : "#272d38" }}
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="w-1" />
              )}

              {/* 事件日志已移至右侧 CRT 终端，画面不再被遮挡 */}
              <div className="flex-1" />

              {/* 技能（触屏移至操作台） */}
              {!touch && (
                <div className="flex flex-col items-end gap-2">
                  <div className="px-box-dark relative flex w-[92px] flex-col items-center p-2">
                    <PixelSprite name={operator.id === "elec" ? "battery" : operator.id === "med" ? "medkit" : "inhaler"} scale={2.2} />
                    <span className="mt-1 text-[10px] tracking-wide text-[#c9d1dc]">
                      {operator.id === "ass" ? "被动·哮喘" : "Q · " + operator.ability}
                    </span>
                    {operator.id !== "ass" && hud && hud.abilityMax > 0 && (
                      <div className="mt-1 w-full">
                        <Bar v={hud.abilityMax - hud.abilityCd} max={hud.abilityMax} color={operator.color} h={5} />
                      </div>
                    )}
                  </div>
                  <div className="px-box-dark px-2 py-1 text-[9px] tracking-[0.2em] text-[#6d7690]">
                    短按=爆燃 / 长按=喷火
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 中央横幅 */}
          {banner && !result && (
            <div className="pointer-events-none absolute inset-x-0 top-[18%] z-10 flex flex-col items-center">
              <div
                className="anim-pop max-w-[92%] px-6 py-3 text-center"
                style={{
                  background: "rgba(10,12,18,0.85)",
                  border: `3px solid ${TONE_COLOR[banner.tone]}`,
                  boxShadow: "6px 6px 0 rgba(0,0,0,0.5)",
                }}
              >
                <div className={`${stageW < 700 ? "text-xl" : "text-3xl md:text-4xl"} tracking-[0.2em]`} style={{ color: TONE_COLOR[banner.tone] }}>
                  {banner.title}
                </div>
                <div className="mt-1 text-xs tracking-[0.25em] text-[#c9d1dc] md:text-sm">{banner.sub}</div>
              </div>
            </div>
          )}

          {/* 电报机面板 */}
          {telegraph && !result && (
            <div className="absolute bottom-0 right-0 top-0 z-20 w-[min(330px,86vw)] p-2 md:p-3">
              <div className="px-paper anim-rise flex h-full flex-col p-3 text-[#14171f]">
                <div className="mb-2 flex items-center justify-between border-b-4 border-[#14171f] pb-2">
                  <span className="text-xl tracking-[0.2em]">总 部 电 报</span>
                  <button className="px-btn px-btn-red px-2 py-0.5 text-xs" onClick={() => setTelegraph(false)}>✕</button>
                </div>
                <p className="mb-2 bg-[#14171f] px-2 py-1 text-[11px] leading-5 text-[#f2b53d]">
                  ⚠ 老式电报：价格昂贵、空投需时。战斗不会暂停，发报需谨慎！
                </p>
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {SUPPLIES.filter((s) => {
                    // 只展示本次携带武器对应的弹匣
                    if (!s.id.startsWith("mag_")) return true;
                    return (hud?.slots ?? []).some((sl) => sl.id === s.id.slice(4));
                  }).map((s) => {
                    const afford = (hud?.funds ?? 0) >= s.price;
                    const upgMaxed = s.id === "upg" && (hud?.upgrades ?? 0) >= 3;
                    const bombGone = s.once && hud?.stink !== "none";
                    const slot = s.id.startsWith("mag_")
                      ? (hud?.slots ?? []).find((x) => x.id === s.id.slice(4))
                      : undefined;
                    const inTransit = (hud?.pending ?? []).filter((p) => p.name === s.name).length;
                    const beltFull = !!slot && slot.mags + inTransit >= slot.magMax;
                    const disabled = !afford || upgMaxed || !!bombGone || beltFull;
                    return (
                      <div key={s.id} className="flex items-center gap-2 border-2 border-[#14171f] bg-[#fffaf0] p-2">
                        <PixelSprite name={s.icon} scale={2} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between">
                            <span className="text-sm">{s.name}</span>
                            <span className="font-num text-lg text-[#b33224]">{s.price}</span>
                          </div>
                          <div className="text-[10px] leading-4 text-[#7a7461]">{s.desc} · {s.delay}s 空投</div>
                          {slot && (
                            <div className="mt-0.5 flex items-center gap-1">
                              <span className="text-[9px] text-[#7a7461]">武装带</span>
                              {Array.from({ length: slot.magMax }).map((_, i) => (
                                <span
                                  key={i}
                                  className="block h-2 w-1.5 border border-[#14171f]"
                                  style={{ background: i < slot.mags ? "#b33224" : i < slot.mags + inTransit ? "#c9a56a" : "#ded2b0" }}
                                />
                              ))}
                              <span className="font-num text-[9px] text-[#7a7461]">{slot.mags}/{slot.magMax}</span>
                            </div>
                          )}
                        </div>
                        <button
                          className="px-btn px-btn-teal shrink-0 px-2 py-1 text-xs"
                          disabled={disabled}
                          onClick={() => gameRef.current?.buy(s.id)}
                        >
                          {upgMaxed ? "已满" : bombGone ? "已购" : beltFull ? "满载" : "发电"}
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 text-center text-[11px] tracking-[0.2em] text-[#7a7461]">
                  滴滴滴… 电键滚烫 · 最多 3 批在途
                </div>
              </div>
            </div>
          )}

          {/* 触屏横屏：操作台悬浮 */}
          {touch && !portrait && !result && (
            <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#0b0e14]/90 to-transparent">
              <TouchControls
                landscape
                operator={operator}
                weapon={hud?.weapon ?? "gas"}
                stink={hud?.stink ?? "none"}
                abilityReady={!hud || hud.abilityCd <= 0}
                onMove={(x, y) => gameRef.current?.setVirtualMove(x, y)}
                onAim={(x, y) => gameRef.current?.setVirtualAim(x, y)}
                onFire={(f) => gameRef.current?.setVirtualFire(f)}
                onWeapon={(w) => gameRef.current?.switchWeapon(w)}
                onAbility={() => gameRef.current?.useAbility()}
                onReload={() => gameRef.current?.reload()}
                onThrow={() => gameRef.current?.throwNade()}
                onTelegraph={() => setTelegraph((t) => !t)}
                onPause={() => setPaused(true)}
              />
            </div>
          )}

          {/* 暂停 */}
          {paused && !result && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70">
              <div className="px-paper anim-pop w-80 p-6 text-center text-[#14171f]">
                <h3 className="text-3xl tracking-[0.4em]">暂 停</h3>
                <p className="mt-2 text-xs tracking-[0.2em] text-[#7a7461]">战况稍纵即逝，治安队可不会等你</p>
                <div className="mt-5 flex flex-col gap-3">
                  <button className="px-btn px-btn-teal py-2.5 text-lg tracking-[0.3em]" onClick={() => setPaused(false)}>
                    ▶ 继续战斗
                  </button>
                  <button className="px-btn px-btn-dark py-2.5 text-lg tracking-[0.3em]" onClick={onQuit}>
                    撤离战场（回菜单）
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 触屏竖屏：操作台置于画布下方 */}
        {touch && portrait && !result && (
          <TouchControls
            operator={operator}
            weapon={hud?.weapon ?? "gas"}
            stink={hud?.stink ?? "none"}
            abilityReady={!hud || hud.abilityCd <= 0}
            onMove={(x, y) => gameRef.current?.setVirtualMove(x, y)}
            onAim={(x, y) => gameRef.current?.setVirtualAim(x, y)}
            onFire={(f) => gameRef.current?.setVirtualFire(f)}
            onWeapon={(w) => gameRef.current?.switchWeapon(w)}
            onAbility={() => gameRef.current?.useAbility()}
            onReload={() => gameRef.current?.reload()}
            onThrow={() => gameRef.current?.throwNade()}
            onTelegraph={() => setTelegraph((t) => !t)}
            onPause={() => setPaused(true)}
          />
        )}

        {/* 底部操作提示 */}
        {!touch && (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] tracking-[0.2em] text-[#5b6377]">
            <span>WASD 移动</span><span>鼠标 瞄准/射击</span><span>1-5 切换武器</span>
            <span>Q 技能</span><span>R 换弹</span><span>右键 开镜</span><span>G 投掷</span><span>E 电报机</span><span>Esc 暂停</span>
          </div>
        )}
        {touch && (
          <div className="mt-1 text-center text-[10px] tracking-[0.2em] text-[#5b6377]">
            左摇杆移动 · 右摇杆瞄准并开火（轻点爆燃 / 推住喷火）
          </div>
        )}

        {/* 窄屏：CRT 终端折叠到画面下方 */}
        {fit.narrow && (
          <div className="mt-1.5">
            <CrtConsole messages={events} compact online={!result} keying={keying} />
          </div>
        )}
      </div>

      {/* 宽屏：右侧独立 CRT 终端（不遮挡战场） */}
      {!fit.narrow && (
      <aside style={{ height: fit.h }}>
        <CrtConsole messages={events} online={!result} keying={keying} />
      </aside>
      )}
      </div>

      {/* 胜利过场：废墟升旗 */}
      {result && result.win && !vicDone && (
        <VictoryCutscene onDone={() => setVicDone(true)} />
      )}

      {/* 第一战役胜利 → 中场战报 → 第二战役 */}
      {result && result.win && vicDone && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/88 p-4">
          <div className="px-paper anim-pop w-full max-w-xl p-6 text-[#14171f]">
            <div className="flex items-center justify-between border-b-4 border-[#14171f] pb-3">
              <span className="text-lg tracking-[0.3em]">阶 段 战 报</span>
              <span className="border-4 border-[#2c6e4b] px-3 py-0.5 text-lg text-[#2c6e4b]" style={{ transform: "rotate(6deg)" }}>
                达 成
              </span>
            </div>
            <h3 className="mt-4 text-2xl leading-snug text-[#2c6e4b]">第一战役 · 门线保卫战 — 胜利</h3>
            <p className="mt-2 text-[14px] leading-7 text-[#4a4636]">
              治安队的拖把人海在铃声中退去。然而战斗尚未结束——
              <b>三人必须回家</b>。车棚里的边三轮摩托，是唯一的指望，而它周围已被重兵把守。
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                { k: "击杀", v: `${result.kills}` },
                { k: "伤害", v: `${result.dmg}` },
                { k: "坚守", v: `${Math.floor(result.time / 60)}:${String(Math.floor(result.time % 60)).padStart(2, "0")}` },
              ].map((it) => (
                <div key={it.k} className="border-2 border-[#14171f] bg-[#fffaf0] p-2">
                  <div className="text-xs text-[#7a7461]">{it.k}</div>
                  <div className="mt-1 text-lg">{it.v}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                className="px-btn px-btn-red px-8 py-3 text-xl tracking-[0.3em]"
                onClick={() => onCampaignNext(result)}
              >
                ▶ 进入第二战役
              </button>
              <button className="px-btn px-btn-dark px-6 py-3 text-base tracking-[0.3em]" onClick={onQuit}>
                回到菜单
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 战败过场 */}
      {result && !result.win && !defeatDone && (
        <DefeatCutscene reason={result.reason} onDone={() => setDefeatDone(true)} />
      )}

      {/* 失败结算 */}
      {result && !result.win && defeatDone && (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/85">
          <ResultScreen
            stats={result}
            operator={operator.name}
            onRestart={restart}
            onMenu={onQuit}
          />
        </div>
      )}
    </div>
  );
}
