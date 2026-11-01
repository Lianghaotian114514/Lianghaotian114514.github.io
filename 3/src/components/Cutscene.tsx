import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { drawSpr, drawPixelText, pixelText, buildSchoolExterior, buildRuins } from "../game/sprites";
import { sfx } from "../game/audio";
import ParadeScene from "./ParadeScene";

const CW = 480;
const CH = 270;

// ---------------- 通用播放器骨架 ----------------
function Frame({
  bind,
  onSkip,
  children,
}: {
  bind: (cv: HTMLCanvasElement | null) => void;
  onSkip: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black">
      <div className="relative w-full max-w-[960px]" style={{ aspectRatio: "16/9" }}>
        <canvas ref={bind} className="h-full w-full [image-rendering:pixelated]" width={CW} height={CH} />
        {children}
      </div>
      <button
        className="px-btn px-btn-dark absolute bottom-6 right-6 z-10 px-4 py-2 text-sm tracking-[0.3em] opacity-80 hover:opacity-100"
        onClick={onSkip}
      >
        跳过 ▸▸
      </button>
    </div>
  );
}

function useRaf(draw: (ctx: CanvasRenderingContext2D, t: number) => void) {
  const tRef = useRef(0);
  const rafRef = useRef(0);
  const cbRef = useRef(draw);
  cbRef.current = draw;
  const bind = useCallback((cv: HTMLCanvasElement | null) => {
    if (!cv) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    const ctx = cv.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    tRef.current = 0;
    let last = performance.now();
    const loop = (ts: number) => {
      const dt = Math.min((ts - last) / 1000, 0.05);
      last = ts;
      tRef.current += dt;
      cbRef.current(ctx, tRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);
  return { bind, tRef };
}

// ---------------- 打字机字幕 ----------------
function TypeCap({ text, size = 11 }: { text: string; size?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const t = setInterval(() => setN((v) => (v >= text.length ? v : v + 1)), 46);
    return () => clearInterval(t);
  }, [text]);
  const boxRef = useRef<HTMLDivElement>(null);
  const shown = text.slice(0, n);
  useEffect(() => {
    const box = boxRef.current!;
    box.innerHTML = "";
    const cv = pixelText(shown || " ", { size, color: "#fff4e0", scale: 3, bg: "rgba(10,12,16,0.72)", pad: 3 });
    cv.style.imageRendering = "pixelated";
    cv.style.maxWidth = "88vw";
    box.appendChild(cv);
  }, [shown, size]);
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center px-28">
      <div ref={boxRef} className={n >= text.length ? "" : "caret"} />
    </div>
  );
}

function drawBars(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, CW, 22);
  ctx.fillRect(0, CH - 22, CW, 22);
}

// ============================================================
// 开幕过场：四幕（2026 年 10 月中旬）
// ============================================================
const INTRO_SHOTS = [
  { dur: 5.4, caption: "2026年10月中旬 · 深秋 · 距离放学还有 4 分钟" },
  { dur: 5.8, caption: "昆虫组的实验隐翅虫「小赤」撞破纱窗——闯入七班领空" },
  { dur: 5.4, caption: "一人坠凳，群情激愤。谈判破裂，治安队倾巢而出" },
  { dur: 6.0, caption: "昆虫组武装大队 · 临危受命——守住大门，直到铃响" },
];

export function OpeningCutscene({ onDone }: { onDone: () => void }) {
  const [shot, setShot] = useState(0);
  const schoolRef = useRef<HTMLCanvasElement | null>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    schoolRef.current = buildSchoolExterior();
    sfx.ensure();
    sfx.startBgm("prep");
    sfx.wind();
  }, []);

  // 每幕计时 & 音效打点
  useEffect(() => {
    if (shot === 1) sfx.crash();
    if (shot === 2) { sfx.thump(); setTimeout(() => sfx.walkie(), 500); }
    if (shot === 3) { sfx.sting(); sfx.thump(); setTimeout(() => sfx.thump(), 700); }
    const timer = setTimeout(() => {
      if (shot + 1 >= INTRO_SHOTS.length) doneRef.current();
      else setShot(shot + 1);
    }, INTRO_SHOTS[shot].dur * 1000);
    return () => clearTimeout(timer);
  }, [shot]);

  const { bind } = useRaf((ctx, t) => {
    ctx.imageSmoothingEnabled = false;
    if (shot === 0) drawShotSchool(ctx, t, schoolRef.current);
    else if (shot === 1) drawShotBeetle(ctx, t, schoolRef.current);
    else if (shot === 2) drawShotStandoff(ctx, t);
    else drawShotSquad(ctx, t);
    drawBars(ctx);
  });

  return (
    <Frame bind={bind} onSkip={onDone}>
      <TypeCap key={shot} text={INTRO_SHOTS[shot].caption} />
      <div className="pointer-events-none absolute left-0 top-0 p-4 text-xs tracking-[0.4em] text-[#6d7690]">
        序章 · 第 {shot + 1} / {INTRO_SHOTS.length} 幕
      </div>
    </Frame>
  );
}

// 第一幕：校舍外观 + 日期钢印
function drawShotSchool(ctx: CanvasRenderingContext2D, t: number, school: HTMLCanvasElement | null) {
  if (school) {
    const zoom = 1 + Math.min(t * 0.032, 0.24);
    const w = CW * zoom, h = CH * zoom;
    ctx.drawImage(school, (CW - w) / 2, (CH - h) / 2 - t * 1.6, w, h);
    // 事发窗口闪烁
    if (Math.floor(t * 3) % 2 === 0) {
      ctx.fillStyle = "rgba(255,92,31,0.85)";
      const wx = (30 + 8 + 3 * 26) * zoom + (CW - w) / 2;
      const wy = (100 + 10 + 24) * zoom + (CH - h) / 2 - t * 1.6;
      ctx.fillRect(wx, wy, 13 * zoom, 11 * zoom);
    }
  }
  if (t > 0.6) {
    const stamp = pixelText("2026.10.14 星期三 · 霜降前后", { size: 11, color: "#f2b53d", scale: 2 });
    ctx.drawImage(stamp, 24, 36);
    const sub = pixelText("某 中 学 · 教 学 楼 五 层", { size: 11, color: "#e8e4d4", scale: 2 });
    ctx.drawImage(sub, 24, 36 + stamp.height + 6);
  }
}

// 第二幕：隐翅虫飞入七班窗口
function drawShotBeetle(ctx: CanvasRenderingContext2D, t: number, school: HTMLCanvasElement | null) {
  const zoom = 2.8;
  const cx2 = 30 + 8 + 3 * 26 + 8;
  const cy2 = 100 + 10 + 24 + 6;
  if (school) {
    ctx.save();
    ctx.translate(CW / 2, CH / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-cx2, -cy2);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(school, 0, 0);
    ctx.restore();
  }
  // 窗内剪影
  const px = CW / 2 - 66, py = CH / 2 + 34;
  ctx.fillStyle = "#0c0f16";
  ctx.fillRect(px - 40, py + 50, 200, 30);
  drawSpr(ctx, "soldA", px + 46, py + 44, { flip: true, scale: 2, alpha: 0.92 });
  if (t > 1.3) {
    drawPixelText(ctx, "！", px + 46, py - 2 + Math.sin(t * 10) * 2, { size: 16, color: "#ff5140", scale: 3, center: true });
    const rot = Math.min((t - 1.3) * 2.6, 1.25);
    ctx.save();
    ctx.translate(px + 112, py + 34);
    ctx.rotate(rot);
    ctx.fillStyle = "#8a6238";
    ctx.fillRect(-12, -6, 24, 8);
    ctx.fillRect(-12, 2, 4, 16);
    ctx.fillRect(8, 2, 4, 16);
    ctx.restore();
  }
  const bt = Math.min(t / 1.3, 1);
  const bx = CW + 30 - bt * (CW + 30 - (px + 34)) + (t >= 1.3 ? Math.sin(t * 7) * 8 : 0);
  const by = 44 + Math.sin(t * 5) * 16 + bt * (py - 60);
  drawSpr(ctx, Math.floor(t * 16) % 2 === 0 ? "beetleB" : "beetleA", bx, by, { flip: true, scale: 3, anchor: "c" });
  if (t > 1.2) {
    ctx.strokeStyle = "rgba(220,228,240,0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + 30, py - 42); ctx.lineTo(px + 62, py - 10); ctx.lineTo(px + 46, py + 24);
    ctx.stroke();
  }
  if (t > 4.2) {
    drawPixelText(ctx, "重伤（心理层面）", px + 110, py + 64, { size: 9, color: "#8fa3c8", scale: 2, center: true });
  }
}

// 第三幕：走廊对峙 · 谈判破裂
function drawShotStandoff(ctx: CanvasRenderingContext2D, t: number) {
  const g = ctx.createLinearGradient(0, 0, 0, CH);
  g.addColorStop(0, "#3a3324");
  g.addColorStop(0.6, "#57493a");
  g.addColorStop(1, "#3c362c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CW, CH);
  ctx.fillStyle = "rgba(255,214,140,0.08)";
  ctx.fillRect(0, 30, CW, 40);

  // 裂缝
  ctx.strokeStyle = "#15181f";
  ctx.lineWidth = 4;
  ctx.beginPath();
  let cx = CW / 2, cy = 0;
  ctx.moveTo(cx, cy);
  let seed = 7;
  while (cy < CH) {
    seed = (seed * 16807) % 2147483647;
    cx = CW / 2 + (seed % 32) - 16;
    cy += 16;
    if (cy < Math.min(t * 300, CH)) ctx.lineTo(cx, cy);
  }
  ctx.stroke();
  if (Math.random() < 0.25) {
    ctx.strokeStyle = "rgba(255,92,31,0.6)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  const bob = Math.sin(t * 6) * 2;
  // 左：武装大队三人
  drawSpr(ctx, "elecA", 118, 206 + bob * 0.4, { scale: 3 });
  drawSpr(ctx, "assA", 168, 214 + bob * 0.6, { scale: 2.6 });
  drawSpr(ctx, "medA", 70, 214 + bob * 0.5, { scale: 2.6 });
  drawPixelText(ctx, "八五班 武装大队", 122, 238, { size: 10, color: "#6f9fd8", scale: 2, center: true });
  // 右：治安队人海
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 4; i++) {
      const ex = 312 + i * 36 + row * 16 + Math.sin(t * 4 + i) * 2;
      drawSpr(ctx, Math.floor(t * 6 + i + row) % 2 === 0 ? "soldA" : "soldB", ex, 206 + row * 22, {
        flip: true, scale: 2.4, alpha: row === 0 ? 0.95 : 0.66,
      });
    }
  }
  drawSpr(ctx, "bossA", 432, 210, { flip: true, scale: 2.8 });
  drawPixelText(ctx, "七班治安队", 382, 238, { size: 10, color: "#7fb08f", scale: 2, center: true });

  if (t < 2.2) {
    drawPixelText(ctx, "赔偿！道歉！交出虫子！", 384, 62, { size: 11, color: "#14171f", scale: 2, center: true, bg: "rgba(243,234,210,0.94)" });
  } else if (t < 3.4) {
    drawPixelText(ctx, "……不可能。", 128, 62, { size: 11, color: "#fff4e0", scale: 2, center: true, bg: "rgba(20,23,31,0.9)" });
  } else {
    drawPixelText(ctx, "放学前，踏平八五班！！", 380, 62, { size: 12, color: "#ff5140", scale: 2, center: true, bg: "rgba(20,23,31,0.9)" });
  }
}

// 第四幕：临危受命 · 三人亮相
function drawShotSquad(ctx: CanvasRenderingContext2D, t: number) {
  ctx.fillStyle = "#0a0c12";
  ctx.fillRect(0, 0, CW, CH);
  const spot = ctx.createRadialGradient(240, 150, 20, 240, 150, 250);
  spot.addColorStop(0, "rgba(255,214,140,0.32)");
  spot.addColorStop(1, "rgba(255,214,140,0)");
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, CW, CH);
  // 身后大门
  ctx.fillStyle = "#22304a";
  ctx.fillRect(150, 56, 180, 174);
  ctx.fillStyle = "#1a2438";
  ctx.fillRect(232, 62, 16, 168);
  drawPixelText(ctx, "八五班", 240, 40, { size: 13, color: "#d8c9a3", scale: 2, center: true });

  const squad: { spr: "elecA" | "medA" | "assA"; name: string; color: string; at: number; x: number }[] = [
    { spr: "elecA", name: "牢电工", color: "#f2b53d", at: 0.9, x: 164 },
    { spr: "medA", name: "李听远", color: "#57d6e6", at: 2.1, x: 236 },
    { spr: "assA", name: "樊某某", color: "#d53a26", at: 3.3, x: 308 },
  ];
  for (const s of squad) {
    if (t <= s.at) continue;
    const pop = Math.min((t - s.at) * 6, 1);
    drawSpr(ctx, s.spr, s.x, 224, { scale: 3.4 - pop * 0.5 });
    if (pop > 0.6) {
      drawPixelText(ctx, s.name, s.x, 240, { size: 13, color: s.color, scale: 2, center: true });
    }
  }
  if (t > 4.5) {
    ctx.globalAlpha = Math.min((t - 4.5) * 3, 1);
    drawPixelText(ctx, "守 住 大 门 · 直 到 铃 响", 240, 116, { size: 14, color: "#fff4e0", scale: 3, center: true });
    ctx.globalAlpha = 1;
  }
  for (let i = 0; i < 22; i++) {
    const fy = (i * 37 + t * 34) % CH;
    ctx.fillStyle = `rgba(255,148,38,${0.2 + (i % 5) * 0.08})`;
    ctx.fillRect((i * 97) % CW, CH - fy, 2, 2);
  }
}

// ============================================================
// 胜利过场：三人废墟升旗
// ============================================================
const VIC_CAPS = [
  { at: 0.4, text: "2026年10月中旬 · 放学铃响 · 硝烟与粉笔灰缓缓落地" },
  { at: 5.4, text: "治安队撤退了。八五班的大门——仍然矗立" },
  { at: 9.8, text: "废墟之上，昆虫组的战旗升起来了" },
];

export function VictoryCutscene({ onDone }: { onDone: () => void }) {
  const ruinsRef = useRef<HTMLCanvasElement | null>(null);
  const [capIdx, setCapIdx] = useState(0);
  const [canNext, setCanNext] = useState(false);
  const fired = useRef({ bell: false, win: false, sting: false });

  useEffect(() => {
    ruinsRef.current = buildRuins();
    sfx.ensure();
    sfx.startBgm("flag");
    sfx.wind();
  }, []);

  const { bind } = useRaf((ctx, t) => {
    ctx.imageSmoothingEnabled = false;
    drawVictory(ctx, t, ruinsRef.current, (k) => {
      if (k === "bell" && !fired.current.bell) { fired.current.bell = true; sfx.bell(); }
      if (k === "win" && !fired.current.win) { fired.current.win = true; sfx.win(); }
      if (k === "sting" && !fired.current.sting) { fired.current.sting = true; sfx.sting(); }
    });
    for (let i = VIC_CAPS.length - 1; i >= 0; i--) {
      if (t >= VIC_CAPS[i].at) { setCapIdx(i); break; }
    }
    if (t > 3) setCanNext(true);
    drawBars(ctx);
  });

  return (
    <Frame bind={bind} onSkip={onDone}>
      <TypeCap key={capIdx} text={VIC_CAPS[capIdx].text} />
      <div className="pointer-events-none absolute left-0 top-0 p-4 text-xs tracking-[0.4em] text-[#6d7690]">
        终幕 · 升旗仪式
      </div>
      {canNext && (
        <button
          className="px-btn px-btn-amber absolute bottom-[4.2rem] right-6 z-10 px-5 py-2 text-sm tracking-[0.25em]"
          onClick={onDone}
        >
          查看战果 ▸
        </button>
      )}
    </Frame>
  );
}

function drawVictory(
  ctx: CanvasRenderingContext2D,
  t: number,
  ruins: HTMLCanvasElement | null,
  fire: (k: "bell" | "win" | "sting") => void
) {
  if (ruins) ctx.drawImage(ruins, 0, 0);

  // 瓦砾与残骸
  drawSpr(ctx, "rubbleA", 70, 238, { scale: 2, anchor: "bc" });
  drawSpr(ctx, "rubbleB", 170, 244, { scale: 2, anchor: "bc" });
  drawSpr(ctx, "rubbleA", 330, 246, { scale: 2.2, anchor: "bc", flip: true });
  drawSpr(ctx, "rubbleB", 424, 242, { scale: 1.8, anchor: "bc" });
  ctx.save();
  ctx.translate(112, 216);
  ctx.rotate(-0.28);
  drawSpr(ctx, "desk", 0, 0, { scale: 1.6, anchor: "c", alpha: 0.9 });
  ctx.restore();
  // 折断的簸箕盾 / 拖把残骸
  ctx.save();
  ctx.translate(390, 226);
  ctx.rotate(0.5);
  drawSpr(ctx, "shieldBroken", 0, 0, { scale: 2, anchor: "c", alpha: 0.85 });
  ctx.restore();
  drawSpr(ctx, "mopV", 300, 246, { scale: 2, anchor: "c", alpha: 0.8 });

  // ---- 旗杆 ----
  const poleX = 240;
  const raise = Math.min(Math.max((t - 1.6) / 4.2, 0), 1);
  const eased = raise * raise * (3 - 2 * raise);
  ctx.fillStyle = "#15181f";
  ctx.fillRect(poleX - 3, 88, 6, 152);
  ctx.fillStyle = "#8a6238";
  ctx.fillRect(poleX - 1, 88, 3, 152);

  // ---- 旗帜升起 ----
  const flagH = 16 * 2;
  const flagY = 236 - 20 - eased * (236 - 88 - flagH - 4);
  const waving = raise >= 1;
  const frame: "flagDown" | "flagA" | "flagB" = !waving
    ? "flagDown"
    : Math.floor(t * 5) % 2 === 0 ? "flagA" : "flagB";
  drawSpr(ctx, frame, poleX + 4, flagY, { scale: 2, anchor: "tl" });
  if (t > 1.4 && t < 3.2) {
    drawPixelText(ctx, "升旗——！", 240, 64, { size: 13, color: "#f2b53d", scale: 2, center: true });
  }

  // ---- 三名干员 ----
  const bob = Math.sin(t * 3) * 1.5;
  drawSpr(ctx, "medA", 206, 248 + bob * 0.4, { scale: 2.6 });
  drawSpr(ctx, "elecA", 240, 252 + bob * 0.2, { scale: 2.9 });
  drawSpr(ctx, "assA", 276, 248 + bob * 0.5, { scale: 2.6 });
  // 牢电工扶杆的手
  ctx.fillStyle = "#2b4a70";
  ctx.fillRect(poleX - 10, 220, 10, 4);
  ctx.fillStyle = "#f2c48d";
  ctx.fillRect(poleX - 5, 219, 4, 6);

  // 音效打点：铃响 → 到顶号角 → 终章凯歌
  if (t > 1.55) fire("bell");
  if (waving) fire("sting");
  if (t > 9.6) fire("win");

  // ---- 斜阳渐亮 ----
  const lightA = Math.min(t / 7, 1) * 0.34;
  const lg = ctx.createLinearGradient(0, 0, 480, 270);
  lg.addColorStop(0, `rgba(255,190,120,${lightA * 0.4})`);
  lg.addColorStop(0.6, `rgba(255,170,100,${lightA})`);
  lg.addColorStop(1, `rgba(255,220,150,${lightA * 1.2})`);
  ctx.fillStyle = lg;
  ctx.fillRect(0, 0, CW, CH);

  // ---- 余烬 & 粉尘 & 烟柱 ----
  for (let i = 0; i < 26; i++) {
    const fy = (i * 53 + t * (14 + (i % 4) * 8)) % CH;
    const fx = (i * 83 + Math.sin(t * 1.4 + i) * 14 + CW) % CW;
    ctx.fillStyle = i % 3 === 0 ? `rgba(255,148,38,${0.5 - (i % 5) * 0.07})` : "rgba(220,210,180,0.3)";
    ctx.fillRect(fx, CH - fy, 2, 2);
  }
  for (let i = 0; i < 3; i++) {
    const sx = 92 + i * 150;
    for (let s = 0; s < 5; s++) {
      ctx.fillStyle = `rgba(60,60,66,${0.05 + 0.04 * Math.sin(t * 2 + i)})`;
      ctx.fillRect(sx + Math.sin(t * 1.2 + s * 0.9 + i) * 8, 210 - s * 26 - ((t * 12) % 26), 16 - s * 2, 10);
    }
  }
}

// ============================================================
// 第二战役简报：放学后 · 车棚侦察
// ============================================================
const M2_SHOTS = [
  { dur: 5.4, caption: "放学后 17:40 · 铃声余音未散，走廊已空无一人" },
  { dur: 5.8, caption: "回家的唯一指望：车棚里那辆边三轮摩托" },
  { dur: 5.6, caption: "但治安队早已重兵把守——他们在等我们自投罗网" },
];

export function Mission2Cutscene({ onDone }: { onDone: () => void }) {
  const [shot, setShot] = useState(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    sfx.ensure();
    if (shot === 0) { sfx.startBgm("prep"); sfx.wind(); }
    if (shot === 1) sfx.engineStart(), setTimeout(() => sfx.engineStop(), 1400);
    if (shot === 2) { sfx.thump(); setTimeout(() => sfx.walkie(), 700); setTimeout(() => sfx.sting(), 1400); }
    const timer = setTimeout(() => {
      if (shot + 1 >= M2_SHOTS.length) doneRef.current();
      else setShot(shot + 1);
    }, M2_SHOTS[shot].dur * 1000);
    return () => clearTimeout(timer);
  }, [shot]);

  const { bind } = useRaf((ctx, t) => {
    ctx.imageSmoothingEnabled = false;
    if (shot === 0) drawM2Corridor(ctx, t);
    else if (shot === 1) drawM2Bike(ctx, t);
    else drawM2Ambush(ctx, t);
    drawBars(ctx);
  });

  return (
    <Frame bind={bind} onSkip={onDone}>
      <TypeCap key={shot} text={M2_SHOTS[shot].caption} />
      <div className="pointer-events-none absolute left-0 top-0 p-4 text-xs tracking-[0.4em] text-[#6d7690]">
        第二战役 · 简报 {shot + 1}/{M2_SHOTS.length}
      </div>
    </Frame>
  );
}

function drawM2Corridor(ctx: CanvasRenderingContext2D, t: number) {
  const g = ctx.createLinearGradient(0, 0, 0, CH);
  g.addColorStop(0, "#1b1d28");
  g.addColorStop(0.62, "#2e3038");
  g.addColorStop(1, "#1a1c22");
  ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CH);
  // 单点透视走廊
  ctx.strokeStyle = "rgba(190,186,160,0.18)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 9; i++) {
    ctx.beginPath(); ctx.moveTo(0, 30 + i * 30); ctx.lineTo(240, 130); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(CW, 30 + i * 30); ctx.lineTo(240, 130); ctx.stroke();
  }
  // 窗外夜色
  for (let i = 0; i < 4; i++) {
    const wx = 20 + i * 42, ww = 26 - i * 4, wy = 70 + i * 10;
    ctx.fillStyle = "#3a2c3e"; ctx.fillRect(wx, wy, ww, 54 - i * 8);
    ctx.fillStyle = "rgba(200,120,70,0.35)"; ctx.fillRect(wx, wy + 30 - i * 5, ww, 8);
  }
  // 地面反光
  ctx.fillStyle = "rgba(255,220,160,0.05)";
  ctx.fillRect(0, 196, CW, 74);
  // 三人远去的背影
  const walk = Math.min(t * 10, 40);
  drawSpr(ctx, Math.floor(t * 4) % 2 === 0 ? "elecA" : "elecB", 220 - walk * 0.3, 212, { scale: 1.8, alpha: 0.9 });
  drawSpr(ctx, Math.floor(t * 4) % 2 === 0 ? "medA" : "medB", 250 - walk * 0.3, 208, { scale: 1.6, alpha: 0.85 });
  drawSpr(ctx, Math.floor(t * 4) % 2 === 0 ? "assA" : "assB", 196 - walk * 0.3, 206, { scale: 1.6, alpha: 0.85 });
  // 残留硝烟
  for (let i = 0; i < 14; i++) {
    const fy = (i * 41 + t * 12) % CH;
    ctx.fillStyle = `rgba(190,190,180,${0.05 + (i % 4) * 0.02})`;
    ctx.fillRect((i * 67) % CW, CH - fy, 3, 3);
  }
  if (t > 1.2) {
    const stamp = pixelText("17:40  放学后", { size: 11, color: "#c2a14a", scale: 2 });
    ctx.drawImage(stamp, 22, 34);
  }
}

function drawM2Bike(ctx: CanvasRenderingContext2D, t: number) {
  // 车棚夜景
  const g = ctx.createLinearGradient(0, 0, 0, CH);
  g.addColorStop(0, "#12141f");
  g.addColorStop(0.55, "#262230");
  g.addColorStop(1, "#15171c");
  ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CH);
  ctx.fillStyle = "#0d101a"; ctx.fillRect(0, 150, CW, 24);
  for (const px of [40, 150, 300, 430]) { ctx.fillStyle = "#1b1f2b"; ctx.fillRect(px, 174, 8, 90); }
  ctx.fillStyle = "#23262e"; ctx.fillRect(0, 196, CW, 74);
  // 聚光打在摩托上
  const sp = ctx.createRadialGradient(240, 210, 10, 240, 210, 160);
  sp.addColorStop(0, "rgba(230,200,130,0.22)");
  sp.addColorStop(1, "rgba(230,200,130,0)");
  ctx.fillStyle = sp; ctx.fillRect(0, 60, CW, 210);
  // 其他自行车
  for (let i = 0; i < 4; i++) {
    const bx = 30 + i * 46;
    ctx.strokeStyle = "#2b303a"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(bx, 236, 7, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(bx + 20, 236, 7, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#1c1f27"; ctx.fillRect(bx, 222, 22, 3);
  }
  // 摩托（缓缓推近）
  const zoom = 2.6 + Math.min(t * 0.14, 0.7);
  drawSpr(ctx, Math.floor(t * 4) % 2 === 0 ? "motoA" : "motoB", 250, 250, { anchor: "bc", scale: zoom });
  if (t > 1.6) {
    drawPixelText(ctx, "边三轮摩托 · 唯一的回家方式", 240, 78, { size: 11, color: "#e8e4d4", scale: 2, center: true, bg: "rgba(10,12,16,0.78)" });
  }
  // 反光掠过
  const sx = ((t * 120) % 520) - 60;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = "rgba(255,240,200,0.10)";
  ctx.fillRect(sx, 170, 24, 92);
  ctx.restore();
}

function drawM2Ambush(ctx: CanvasRenderingContext2D, t: number) {
  ctx.fillStyle = "#0b0d14"; ctx.fillRect(0, 0, CW, CH);
  const sp = ctx.createRadialGradient(240, 150, 20, 240, 150, 240);
  sp.addColorStop(0, "rgba(180,60,40,0.22)");
  sp.addColorStop(1, "rgba(180,60,40,0)");
  ctx.fillStyle = sp; ctx.fillRect(0, 0, CW, CH);
  ctx.fillStyle = "#15181f"; ctx.fillRect(0, 214, CW, 56);
  // 摩托在中央，被包围
  drawSpr(ctx, "motoA", 240, 238, { anchor: "bc", scale: 2.4, alpha: 0.9 });
  // 守卫围成一圈（逐个出现）
  const guards = [[90, 226], [150, 244], [330, 244], [392, 226], [196, 214], [292, 214]];
  guards.forEach((gp, i) => {
    if (t < 0.5 + i * 0.35) return;
    const flip = gp[0] > 240;
    drawSpr(ctx, Math.floor(t * 5 + i) % 2 === 0 ? "soldA" : "soldB", gp[0], gp[1], { scale: 2.3, flip });
    drawSpr(ctx, "mopV", gp[0] + (flip ? -12 : 12), gp[1] - 30, { anchor: "c", flip: !flip, scale: 2 });
  });
  if (t > 2.8) drawSpr(ctx, "bossA", 432, 230, { scale: 2.6, flip: true });
  // 手电筒扫射光束
  const beam = Math.sin(t * 1.4) * 60;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = "rgba(255,230,170,0.08)";
  ctx.beginPath();
  ctx.moveTo(430, 200); ctx.lineTo(240 + beam, 270); ctx.lineTo(160 + beam, 270); ctx.closePath(); ctx.fill();
  ctx.restore();
  if (t > 3.4) {
    drawPixelText(ctx, "「他们一定会来取车。」", 240, 70, { size: 11, color: "#ff8f7a", scale: 2, center: true, bg: "rgba(10,12,16,0.85)" });
  }
  // 红色警戒闪烁
  if (Math.floor(t * 2) % 2 === 0) {
    ctx.fillStyle = "rgba(181,54,42,0.07)";
    ctx.fillRect(0, 0, CW, CH);
  }
}

// ============================================================
// 终章：总队驰援 · 全剧终（人山人海 · 钢铁洪流）
// ============================================================
export function FinaleCutscene({ onDone }: { onDone: () => void }) {
  const [capIdx, setCapIdx] = useState(0);
  const fired = useRef({ relay: false, rumble: false, sting: false, win: false, horn: false });
  const CAPS = [
    { at: 0.3, text: "隔间内，电码最后一次发出——滴、滴、滴" },
    { at: 5.2, text: "地平线开始震动。那不是风声，是履带与引擎" },
    { at: 10.4, text: "昆虫组总队全军出动——车灯连成一条火河" },
    { at: 15.6, text: "2026年10月 · 八五班全员平安到家。战争，暂告一段落" },
  ];
  useEffect(() => {
    sfx.ensure();
    sfx.startBgm("prep");
    const t = setTimeout(() => sfx.startBgm("epic"), 4600);
    return () => clearTimeout(t);
  }, []);
  const { bind } = useRaf((ctx, t) => {
    ctx.imageSmoothingEnabled = false;
    drawFinale(ctx, t, (k) => {
      if (k === "relay" && !fired.current.relay) { fired.current.relay = true; sfx.relay(); }
      if (k === "rumble" && !fired.current.rumble) {
        fired.current.rumble = true;
        sfx.thump(0.55);
        setTimeout(() => sfx.thump(0.5), 420);
        setTimeout(() => sfx.thump(0.6), 860);
        sfx.engineStart();
        sfx.engineThrottle(0.9);
      }
      if (k === "horn" && !fired.current.horn) {
        fired.current.horn = true;
        sfx.sting();
        setTimeout(() => sfx.snare(0.26), 300);
        setTimeout(() => sfx.snare(0.26), 520);
        setTimeout(() => sfx.snare(0.3), 740);
      }
      if (k === "sting" && !fired.current.sting) { fired.current.sting = true; sfx.sting(); }
      if (k === "win" && !fired.current.win) {
        fired.current.win = true;
        sfx.win();
        sfx.engineStop();
      }
    });
    for (let i = CAPS.length - 1; i >= 0; i--) if (t >= CAPS[i].at) { setCapIdx(i); break; }
    drawBars(ctx);
  });
  useEffect(() => () => { sfx.engineStop(); }, []);
  return (
    <Frame bind={bind} onSkip={onDone}>
      <TypeCap key={capIdx} text={CAPS[capIdx].text} />
      <button
        className="px-btn px-btn-amber absolute bottom-[4.2rem] right-6 z-10 px-5 py-2 text-sm tracking-[0.25em]"
        onClick={onDone}
      >
        鸣谢名单 ▸
      </button>
    </Frame>
  );
}

// --- 伪随机（固定种子，保证每帧一致） ---
function sr(i: number) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** 一名行军士兵（远景小像素兵，昆虫组蓝） */
function marchMan(ctx: CanvasRenderingContext2D, x: number, y: number, sc: number, t: number, i: number, dark: number) {
  const step = Math.floor(t * 7 + i) % 2 === 0;
  const c = (col: string, dx: number, dy: number, w: number, h: number) => {
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(x + dx * sc), Math.round(y + dy * sc), Math.max(1, w * sc), Math.max(1, h * sc));
  };
  const body = dark > 0.5 ? "#17203a" : "#2c4474";
  const head = dark > 0.5 ? "#1d2436" : "#3b4b6b";
  const skin = dark > 0.5 ? "#5e5a52" : "#c9a079";
  c(head, -1.5, -9, 3, 3);       // 头盔
  c(skin, -1, -6.5, 2, 2);       // 脸
  c(body, -2, -4.5, 4, 5);       // 身体
  // 腿（交替）
  c(body, -1.5, 0, 1.5, 3.5);
  c(body, 0.5, 0, 1.5, 3.5);
  if (step) { c(body, -2.5, 2, 1.5, 1.5); } else { c(body, 1.5, 2, 1.5, 1.5); }
  // 扛在肩上的武器（喷枪/旗杆斜线）
  ctx.strokeStyle = dark > 0.5 ? "#0f1420" : "#1b2435";
  ctx.lineWidth = Math.max(1, sc * 0.9);
  ctx.beginPath();
  ctx.moveTo(x + 2 * sc, y - 11 * sc);
  ctx.lineTo(x - 2 * sc, y - 2 * sc);
  ctx.stroke();
}

/** 远景载具（卡车/三轮，带车灯） */
function marchVehicle(ctx: CanvasRenderingContext2D, x: number, y: number, sc: number, i: number, lightOn: boolean) {
  const R = (col: string, dx: number, dy: number, w: number, h: number) => {
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(x + dx * sc), Math.round(y + dy * sc), Math.max(1, w * sc), Math.max(1, h * sc));
  };
  const kind = Math.floor(sr(i * 3.1) * 3);
  const olive = "#2e3a26", oliveD = "#1d2618";
  if (kind === 0) {
    // 军卡：驾驶室 + 篷布货厢
    R(oliveD, -11, -9, 8, 7);
    R(olive, -10, -8, 6, 5);
    R("#4a5a3c", -3, -11, 13, 9);   // 篷布
    R(oliveD, -3, -11, 13, 2);
    R("#121620", -9, -2, 20, 2);
    R("#0d1016", -8, 0, 3, 3);      // 轮
    R("#0d1016", 4, 0, 3, 3);
  } else if (kind === 1) {
    // 边三轮（远景简化）
    R(olive, -7, -6, 10, 4);
    R(oliveD, 1, -5, 6, 4);
    R("#0d1016", -6, -2, 3, 3);
    R("#0d1016", 2, -2, 3, 3);
    R("#0d1016", 5, -1, 2, 2);
  } else {
    // 装甲清洁车（拖把桶战车缴获改装）
    R(oliveD, -10, -10, 18, 9);
    R("#54604a", -8, -8, 14, 5);
    R("#9aa48c", -1, -14, 3, 5);     // 炮塔似的拖把杆
    R("#0d1016", -9, -1, 4, 3);
    R("#0d1016", 3, -1, 4, 3);
  }
  if (lightOn) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(255,236,170,0.85)";
    ctx.fillRect(x + 9 * sc, y - 6 * sc, 2 * sc, 2 * sc);
    const bg = ctx.createRadialGradient(x + 10 * sc, y - 5 * sc, 1, x + 10 * sc, y - 5 * sc, 46 * sc);
    bg.addColorStop(0, "rgba(255,230,160,0.35)");
    bg.addColorStop(1, "rgba(255,230,160,0)");
    ctx.fillStyle = bg;
    ctx.fillRect(x, y - 30 * sc, 70 * sc, 40 * sc);
    ctx.restore();
  }
}

function drawFinale(ctx: CanvasRenderingContext2D, t: number, fire: (k: "relay" | "rumble" | "horn" | "sting" | "win") => void) {
  // ======== 第一段：隔间内发报（0 ~ 5s） ========
  if (t < 5.0) {
    const g = ctx.createLinearGradient(0, 0, 0, CH);
    g.addColorStop(0, "#0d1014");
    g.addColorStop(1, "#06080b");
    ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CH);
    // 隔间轮廓
    ctx.fillStyle = "#1a211c"; ctx.fillRect(60, 40, 360, 200);
    ctx.fillStyle = "#121713"; ctx.fillRect(68, 48, 344, 184);
    // 高窗微光
    ctx.fillStyle = "rgba(180,150,90,0.16)";
    ctx.fillRect(300, 56, 90, 40);
    drawSpr(ctx, "telegraph", 240, 226, { anchor: "bc", scale: 3 });
    drawSpr(ctx, "elecA", 176, 240, { scale: 2.4 });
    drawSpr(ctx, "medA", 300, 238, { scale: 2.2, flip: true });
    drawSpr(ctx, "assA", 338, 236, { scale: 2.2, flip: true });
    // 电码火花与信号波
    if (Math.floor(t * 6) % 2 === 0) {
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = "rgba(255,230,150,0.9)";
      ctx.fillRect(236 + Math.random() * 6, 192, 3, 3);
      ctx.restore();
      fire("relay");
    }
    // 电波扩散圈
    for (let r = 0; r < 3; r++) {
      const rad = ((t * 70 + r * 46) % 140);
      ctx.strokeStyle = `rgba(110,220,150,${0.3 * (1 - rad / 140)})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(240, 196, rad, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    }
    drawPixelText(ctx, "· · ·   — — —   · · ·", 240, 126, { size: 12, color: "#5de08a", scale: 2, center: true });
    // 渐出
    if (t > 4.3) { ctx.fillStyle = `rgba(0,0,0,${(t - 4.3) / 0.7})`; ctx.fillRect(0, 0, CW, CH); }
    return;
  }

  const T = t - 5.0;   // 大军段本地时间
  fire("rumble");

  // ======== 背景：破晓前的夜空 ========
  const sky = ctx.createLinearGradient(0, 0, 0, 200);
  sky.addColorStop(0, "#0a0d1c");
  sky.addColorStop(0.5, "#1d2238");
  sky.addColorStop(1, "#4a3350");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, CW, 200);
  for (let i = 0; i < 90; i++) {
    const a = 0.12 + sr(i) * 0.4;
    ctx.fillStyle = `rgba(226,222,200,${a})`;
    ctx.fillRect(sr(i * 2.3) * CW, sr(i * 5.7) * 130, 2, 2);
  }
  // 远山
  ctx.fillStyle = "#121524";
  for (let x = -20; x < CW + 20; x += 70) {
    const h = 26 + sr(x) * 26;
    ctx.beginPath();
    ctx.moveTo(x, 200); ctx.lineTo(x + 35, 200 - h); ctx.lineTo(x + 70, 200);
    ctx.closePath(); ctx.fill();
  }
  // 地面（公路 + 原野）
  const gr = ctx.createLinearGradient(0, 196, 0, CH);
  gr.addColorStop(0, "#1a1d1a");
  gr.addColorStop(1, "#0d0f0e");
  ctx.fillStyle = gr; ctx.fillRect(0, 196, CW, CH - 196);
  // 路面
  ctx.fillStyle = "#23262c"; ctx.fillRect(0, 232, CW, 38);
  ctx.fillStyle = "rgba(220,210,170,0.22)";
  for (let x = 0; x < CW; x += 44) ctx.fillRect(x - ((T * 70) % 44), 250, 22, 3);

  // ======== 地平线光晕（大军到来） ========
  const approach = Math.min(T / 4.0, 1);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const horizon = ctx.createLinearGradient(0, 160, 0, 240);
  horizon.addColorStop(0, `rgba(255,214,140,0)`);
  horizon.addColorStop(0.6, `rgba(255,206,130,${0.1 + approach * 0.26})`);
  horizon.addColorStop(1, `rgba(255,232,170,${0.05 + approach * 0.16})`);
  ctx.fillStyle = horizon; ctx.fillRect(0, 150, CW, 100);
  ctx.restore();

  // ======== 第三排（最远）：人海剪影 —— 密密麻麻 ========
  const waveY = [205, 214, 224, 236, 250];
  const counts = [46, 38, 30, 22, 15];
  const scales = [0.5, 0.62, 0.78, 1.0, 1.3];
  const darks = [0.95, 0.8, 0.6, 0.35, 0.1];

  for (let row = 0; row < waveY.length; row++) {
    const n = counts[row];
    const sc = scales[row];
    const speed = 7 + row * 5;
    const spread = CW + 160;
    for (let i = 0; i < n; i++) {
      const seed = row * 100 + i;
      const base = (sr(seed) * spread + T * speed) % spread - 80;
      const x = base;
      const y = waveY[row] + sr(seed * 1.7) * 4;
      const bob = Math.sin(T * 7 + i * 1.3) * (0.6 * sc);
      if (x < -30 || x > CW + 30) continue;
      // 每行夹杂载具
      if (row >= 2 && sr(seed * 3.3) > 0.86) {
        marchVehicle(ctx, x, y + bob, sc * 0.9, seed, row >= 3);
      } else {
        marchMan(ctx, x, y + bob, sc, T, i, darks[row]);
      }
      // 第 3、4 排夹杂旗帜
      if (row >= 2 && sr(seed * 7.1) > 0.9) {
        ctx.fillStyle = darks[row] > 0.5 ? "#2a1418" : "#8d2a21";
        ctx.fillRect(Math.round(x), Math.round(y - 20 * sc), Math.max(1, 1.5 * sc), 11 * sc);
        const fw = Math.floor(T * 5 + i) % 2 === 0 ? 7 : 6;
        ctx.fillRect(Math.round(x + 1.5 * sc), Math.round(y - 20 * sc), fw * sc, 5 * sc);
      }
    }
  }

  // ======== 前景：车灯火河 ========
  if (T > 1.2) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 26; i++) {
      const lx = ((sr(i * 9.3) * (CW + 120)) + T * (26 + sr(i) * 24)) % (CW + 120) - 60;
      const ly = 212 + sr(i * 4.4) * 44;
      const s = 0.5 + sr(i * 2.2) * 1.3;
      const bg = ctx.createRadialGradient(lx, ly, 1, lx, ly, 30 * s);
      bg.addColorStop(0, "rgba(255,236,176,0.5)");
      bg.addColorStop(1, "rgba(255,220,150,0)");
      ctx.fillStyle = bg;
      ctx.fillRect(lx - 34 * s, ly - 34 * s, 68 * s, 68 * s);
      ctx.fillStyle = "rgba(255,248,210,0.9)";
      ctx.fillRect(lx - 1, ly - 1, 2.4 * s, 2.4 * s);
    }
    ctx.restore();
  }

  // ======== 最前景：三名主角背影（迎接大军） ========
  if (T > 2.0) {
    const a = Math.min((T - 2.0) / 1.0, 1);
    ctx.globalAlpha = a;
    const bob = Math.sin(T * 2.4) * 1.2;
    drawSpr(ctx, "elecA", 128, 266 + bob, { scale: 3.6 });
    drawSpr(ctx, "medA", 86, 262 + bob * 0.7, { scale: 3.1 });
    drawSpr(ctx, "assA", 170, 263 + bob * 0.8, { scale: 3.1 });
    // 他们的边三轮停在旁边
    drawSpr(ctx, "motoA", 290, 268, { anchor: "bc", scale: 2.2, alpha: 0.95 });
    ctx.globalAlpha = 1;
  }

  // ======== 举起的战旗（前景大旗） ========
  if (T > 3.2) {
    fire("horn");
    const rise = Math.min((T - 3.2) / 1.2, 1);
    const poleY = 250 - rise * 150;
    ctx.fillStyle = "#15181f";
    ctx.fillRect(40, poleY, 4, 250 - poleY + 16);
    drawSpr(ctx, Math.floor(T * 5) % 2 === 0 ? "flagA" : "flagB", 44, poleY + 4, { anchor: "tl", scale: 2.2 });
  }

  // ======== 扬尘 & 火星 ========
  for (let i = 0; i < 46; i++) {
    const px = (sr(i * 1.9) * CW + T * (10 + sr(i) * 40)) % CW;
    const py = 200 + sr(i * 6.1) * 70 - ((T * 8 + i * 3) % 24);
    ctx.fillStyle = i % 4 === 0
      ? `rgba(255,180,90,${0.25 + sr(i) * 0.3})`
      : `rgba(190,180,150,${0.08 + sr(i) * 0.12})`;
    ctx.fillRect(px, py, 2, 2);
  }

  // ======== 标题 ========
  if (T > 5.4) {
    fire("win");
    const a = Math.min((T - 5.4) * 0.7, 1);
    ctx.globalAlpha = a;
    ctx.fillStyle = `rgba(6,8,12,${a * 0.42})`;
    ctx.fillRect(0, 60, CW, 90);
    drawPixelText(ctx, "全 军 驰 援", 240, 72, { size: 20, color: "#f0e0a8", scale: 3, center: true });
    drawPixelText(ctx, "昆虫组武装大队 · 2026 秋", 240, 118, { size: 10, color: "#c2a14a", scale: 2, center: true });
    ctx.globalAlpha = 1;
  }
  // 画面震动感（履带轰鸣）
  if (T > 0.4 && T < 5.4 && Math.random() < 0.35) {
    ctx.fillStyle = "rgba(255,230,180,0.03)";
    ctx.fillRect(0, 0, CW, CH);
  }
}

// ============================================================
// 鸣谢名单（滚动字幕）
// ============================================================
interface CreditLine {
  kind: "section" | "entry" | "gap" | "note";
  role?: string;
  name?: string;
  note?: string;
  big?: boolean;
  wide?: boolean;   // 超长名称：独占整行居中排版
}

/** 两位真实制作者：仅「总制作」一处带身份备注 */
const JI = "纪文川";
const JI_CHIEF = "纪文川（牢电工）";
const LIU = "刘";

const CREDITS: CreditLine[] = [
  { kind: "section", role: "制 作" },
  { kind: "entry", role: "总制作", name: JI_CHIEF, big: true },
  { kind: "entry", role: "美术监督", name: LIU, big: true },
  { kind: "entry", role: "技术支持", name: LIU, big: true },
  { kind: "gap" },

  { kind: "section", role: "企 划 与 设 计" },
  { kind: "entry", role: "原案 · 世界观", name: JI },
  { kind: "entry", role: "剧本 · 分镜", name: JI },
  { kind: "entry", role: "关卡设计", name: JI },
  { kind: "entry", role: "战斗与数值", name: JI },
  { kind: "entry", role: "系统策划", name: LIU },
  { kind: "gap" },

  { kind: "section", role: "美 术" },
  { kind: "entry", role: "像素作画", name: LIU },
  { kind: "entry", role: "角色 · 武器设定", name: JI },
  { kind: "entry", role: "动画 · 特效", name: JI },
  { kind: "entry", role: "界面设计", name: LIU },
  { kind: "gap" },

  { kind: "section", role: "程 序" },
  { kind: "entry", role: "引擎 · 渲染", name: JI },
  { kind: "entry", role: "敌军 AI", name: JI },
  { kind: "entry", role: "音频系统", name: LIU },
  { kind: "entry", role: "移动端适配", name: JI },
  { kind: "gap" },

  { kind: "section", role: "音 响" },
  { kind: "entry", role: "配乐总监", name: JI, note: "简谱由一个骰子抛出" },
  { kind: "entry", role: "音效设计", name: JI },
  { kind: "entry", role: "混音", name: LIU },
  { kind: "gap" },

  { kind: "section", role: "参 加" },
  { kind: "entry", role: "参加", name: JI },
  { kind: "entry", role: "参加", name: "樊某某" },
  { kind: "entry", role: "参加", name: "李听远" },
  { kind: "gap" },

  { kind: "section", role: "特 别 鸣 谢" },
  {
    kind: "entry", role: "精神支持", wide: true,
    name: "阿莫西林克拉维酸钾干混悬剂与布洛芬溶液混合物",
    note: "（纪文川的猫）",
  },
  { kind: "gap" },

  { kind: "note", note: "本作所有像素、音乐与代码均为手工制作" },
  { kind: "note", note: "没有使用任何 AI 生成素材" },
  { kind: "note", note: "隐翅虫在拍摄过程中未受到伤害" },
  { kind: "gap" },
];

export function CreditsScreen({ onDone }: { onDone: () => void }) {
  const [scrollY, setScrollY] = useState(0);
  const [done, setDone] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const [total, setTotal] = useState(1200);
  const speedRef = useRef(42);          // px/s
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    sfx.ensure();
    sfx.startBgm("epic");
  }, []);

  // 测量总高度
  useEffect(() => {
    const el = listRef.current;
    if (el) setTotal(el.scrollHeight + 420);
  }, []);

  // 滚动
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (ts: number) => {
      const dt = Math.min((ts - last) / 1000, 0.05);
      last = ts;
      setScrollY((y) => {
        const ny = y + speedRef.current * dt;
        if (ny >= total) { setDone(true); return total; }
        return ny;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [total]);

  return (
    <div
      className="fixed inset-0 z-[85] overflow-hidden bg-black"
      onPointerDown={() => { speedRef.current = 190; }}
      onPointerUp={() => { speedRef.current = 42; }}
    >
      {/* 背景：武装大队三军阅兵（动态像素场景） */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <ParadeScene className="absolute left-1/2 top-1/2 h-full w-auto min-w-full -translate-x-1/2 -translate-y-1/2 opacity-95" />
        {/* 让字幕可读的压暗层 */}
        <div className="absolute inset-0 bg-black/35" />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(90deg, rgba(5,6,10,0.72) 0%, rgba(5,6,10,0.3) 35%, rgba(5,6,10,0.3) 65%, rgba(5,6,10,0.72) 100%)" }}
        />
      </div>
      {/* 上下渐隐遮罩 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-28"
        style={{ background: "linear-gradient(#000 10%, transparent)" }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-28"
        style={{ background: "linear-gradient(transparent, #000 85%)" }} />

      {/* 滚动内容 */}
      <div className="absolute inset-x-0" style={{ transform: `translateY(${-scrollY}px)` }}>
        <div ref={listRef} className="mx-auto w-full max-w-2xl px-6 pt-[70vh]">
          <div className="mb-12 text-center">
            <div className="text-[11px] tracking-[0.6em] text-[#5b6377]">八五班门线保卫战</div>
            <h2 className="mt-2 text-5xl tracking-[0.4em] text-[#c2a14a]" style={{ textShadow: "4px 4px 0 #000" }}>
              鸣 谢
            </h2>
            <div className="mx-auto mt-4 h-[3px] w-44 bg-[#8d2a21]" />
          </div>

          {CREDITS.map((c, i) => {
            if (c.kind === "gap") return <div key={i} className="h-10" />;
            if (c.kind === "section") {
              return (
                <div key={i} className="mb-5 mt-6 flex items-center gap-3">
                  <span className="h-px flex-1 bg-[#2c3242]" />
                  <span className="text-sm tracking-[0.5em] text-[#8d6a3a]">{c.role}</span>
                  <span className="h-px flex-1 bg-[#2c3242]" />
                </div>
              );
            }
            if (c.kind === "note") {
              return (
                <p key={i} className="py-1 text-center text-[12px] tracking-[0.25em] text-[#5b6377]">
                  {c.note}
                </p>
              );
            }
            if (c.wide) {
              return (
                <div key={i} className="flex flex-col items-center gap-1.5 py-4 text-center">
                  <span className="text-[11px] tracking-[0.3em] text-[#6d7690]">{c.role}</span>
                  <span
                    className="max-w-[26rem] text-[15px] leading-relaxed tracking-[0.08em]"
                    style={{ color: "#dcd8c8", textShadow: "2px 2px 0 #000" }}
                  >
                    {c.name}
                  </span>
                  {c.note && (
                    <span className="text-[11px] tracking-[0.2em] text-[#8a8370]">{c.note}</span>
                  )}
                </div>
              );
            }
            return (
              <div key={i} className="flex items-baseline justify-center gap-6 py-[7px]">
                <span className="w-36 shrink-0 text-right text-[11px] tracking-[0.25em] text-[#6d7690]">
                  {c.role}
                </span>
                <span
                  className={`w-44 text-left tracking-[0.12em] ${c.big ? "text-xl" : "text-base"}`}
                  style={{ color: c.big ? "#f0e0a8" : "#dcd8c8", textShadow: "2px 2px 0 #000" }}
                >
                  {c.name}
                  {c.note && (
                    <span className="ml-2 text-[10px] tracking-normal text-[#8a8370]">{c.note}</span>
                  )}
                </span>
              </div>
            );
          })}

          {/* 落幕 */}
          <div className="mt-20 text-center">
            <div className="mx-auto mb-8 h-[3px] w-56 bg-[#8d2a21]" />
            <div className="text-4xl tracking-[0.5em] text-[#dcd8c8]" style={{ textShadow: "3px 3px 0 #000" }}>
              全 剧 终
            </div>
            <div className="mt-4 text-[11px] tracking-[0.35em] text-[#6d7690]">
              2026 年 10 月 · 献给所有守住过那扇门的人
            </div>
          </div>
          <div className="h-[40vh]" />
        </div>
      </div>

      {/* 控制 */}
      <div className="absolute bottom-6 left-1/2 z-30 -translate-x-1/2 text-[10px] tracking-[0.3em] text-[#4d5668]">
        按住画面可加速
      </div>
      {done && (
        <button
          className="px-btn px-btn-amber anim-pop absolute bottom-20 left-1/2 z-30 -translate-x-1/2 px-8 py-3 text-lg tracking-[0.3em]"
          onClick={onDone}
        >
          查看战果 ▸
        </button>
      )}
      <button
        className="px-btn px-btn-dark absolute bottom-6 right-6 z-30 px-4 py-2 text-sm tracking-[0.3em] opacity-70 hover:opacity-100"
        onClick={onDone}
      >
        跳过 ▸▸
      </button>
    </div>
  );
}

// ============================================================
// 出击准备：干员专属装备检查（第一战役开战前）
// ============================================================
const DEPLOY_LINES: Record<string, { name: string; spr: "elecA" | "assA" | "medA"; color: string; items: string[]; vow: string }> = {
  elec: {
    name: "牢电工", spr: "elecA", color: "#c2a14a",
    items: ["安全帽 · 扣紧", "改装电瓶 ×1 · 满电", "GAS喷枪 · 压力正常", "绝缘手套 · 完好"],
    vow: "「地板我来通电，门交给我。」",
  },
  ass: {
    name: "樊某某", spr: "assA", color: "#a8332a",
    items: ["红头带 · 系紧", "抗哮喘药 ×2 · 随身", "GAS喷枪 · 高压档", "跑鞋 · 鞋带双结"],
    vow: "「只要我还喘得上气，他们就过不来。」",
  },
  med: {
    name: "李听远", spr: "medA", color: "#57d6e6",
    items: ["急救包 ×6 · 已消毒", "纱布绷带 · 三卷", "创可贴 · 一整盒", "激光笔 · 电量满"],
    vow: "「你们尽管冲，倒下了我接着。」",
  },
};

export function DeployCutscene({ operator, onDone }: { operator: string; onDone: () => void }) {
  const d = DEPLOY_LINES[operator] ?? DEPLOY_LINES.elec;
  const [shown, setShown] = useState(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    sfx.ensure();
    sfx.startBgm("prep");
    sfx.startTicker();
    const timers: ReturnType<typeof setTimeout>[] = [];
    d.items.forEach((_, i) => {
      timers.push(setTimeout(() => { setShown(i + 1); sfx.click(); }, 900 + i * 780));
    });
    timers.push(setTimeout(() => { sfx.sting(); setShown(d.items.length + 1); }, 900 + d.items.length * 780 + 400));
    timers.push(setTimeout(() => doneRef.current(), 900 + d.items.length * 780 + 2600));
    return () => { timers.forEach(clearTimeout); sfx.stopTicker(); };
  }, [d]);

  const { bind } = useRaf((ctx, t) => {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#14161c"; ctx.fillRect(0, 0, CW, CH);
    const sp = ctx.createRadialGradient(150, 150, 10, 150, 150, 210);
    sp.addColorStop(0, "rgba(220,190,130,0.22)");
    sp.addColorStop(1, "rgba(220,190,130,0)");
    ctx.fillStyle = sp; ctx.fillRect(0, 0, CW, CH);
    for (let i = 0; i < 4; i++) {
      const x = 16 + i * 62;
      ctx.fillStyle = "#1e2531"; ctx.fillRect(x, 48, 54, 150);
      ctx.fillStyle = "#171d27"; ctx.fillRect(x + 4, 52, 46, 142);
      ctx.fillStyle = "#39414f"; ctx.fillRect(x + 40, 112, 6, 14);
      for (let v = 0; v < 3; v++) ctx.fillRect(x + 12 + v * 8, 62, 3, 10);
    }
    ctx.fillStyle = "#101319"; ctx.fillRect(0, 198, CW, 72);
    ctx.fillStyle = "rgba(220,190,130,0.05)"; ctx.fillRect(60, 198, 200, 72);
    const breathe = Math.sin(t * 2.2) * 1.2;
    drawSpr(ctx, d.spr, 120, 214 + breathe, { scale: 4.6 });
    ctx.fillStyle = "rgba(8,10,14,0.86)";
    ctx.fillRect(226, 44, 236, 170);
    ctx.strokeStyle = "#c2a14a"; ctx.lineWidth = 2;
    ctx.strokeRect(226, 44, 236, 170);
    drawPixelText(ctx, "装 备 检 查 表", 344, 52, { size: 12, color: "#c2a14a", scale: 2, center: true });
    ctx.fillStyle = "#3c4454"; ctx.fillRect(236, 74, 216, 2);
    d.items.forEach((it, i) => {
      if (i >= shown) return;
      drawPixelText(ctx, `[✓] ${it}`, 240, 84 + i * 26, { size: 11, color: "#8fd6a0", scale: 2 });
    });
    if (shown > d.items.length) {
      ctx.save();
      ctx.translate(372, 182);
      ctx.rotate(-0.16);
      ctx.strokeStyle = "#a8332a"; ctx.lineWidth = 4;
      ctx.strokeRect(-58, -17, 116, 34);
      ctx.restore();
      drawPixelText(ctx, "准 予 出 击", 372, 174, { size: 13, color: "#d4544a", scale: 2, center: true });
    }
    drawPixelText(ctx, d.name, 120, 236, { size: 14, color: d.color, scale: 2, center: true });
    if (shown > d.items.length) {
      ctx.globalAlpha = Math.min((shown - d.items.length) * 0.9, 1);
      drawPixelText(ctx, d.vow, CW / 2, 232, { size: 11, color: "#e8e4d4", scale: 2, center: true, bg: "rgba(8,10,14,0.85)" });
      ctx.globalAlpha = 1;
    }
    drawBars(ctx);
  });

  return (
    <Frame bind={bind} onSkip={onDone}>
      <div className="pointer-events-none absolute left-0 top-0 p-4 text-xs tracking-[0.4em] text-[#6d7690]">
        出 击 准 备
      </div>
    </Frame>
  );
}

// ============================================================
// 战败过场：大门失守 / 干员倒下
// ============================================================
export function DefeatCutscene({ reason, onDone }: { reason: string; onDone: () => void }) {
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const fired = useRef(false);
  const CAPS: Record<string, string> = {
    door: "铁门最终还是倒下了……治安队的拖把洪流涌进八五班",
    down: "干员倒在了自家门口。没有火力的大门，只是一块铁皮",
    boom: "臭水弹在手中炸开。整层楼的味道，三天没能散去",
    survive: "战斗结束",
    bomb: "战斗结束",
  };
  useEffect(() => {
    sfx.ensure();
    sfx.stopBgm();
    sfx.wind();
    const t1 = setTimeout(() => sfx.lose(), 500);
    const t2 = setTimeout(() => doneRef.current(), 7200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const { bind } = useRaf((ctx, t) => {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#0e1014"; ctx.fillRect(0, 0, CW, CH);
    const g = ctx.createLinearGradient(0, 0, 0, CH);
    g.addColorStop(0, "#272a2e");
    g.addColorStop(0.7, "#191b1f");
    g.addColorStop(1, "#0d0f12");
    ctx.fillStyle = g; ctx.fillRect(0, 30, CW, 240);
    ctx.fillStyle = "#1a2030"; ctx.fillRect(40, 60, 120, 170);
    ctx.fillStyle = "#0a0d14"; ctx.fillRect(48, 68, 104, 162);
    ctx.save();
    ctx.translate(120, 214);
    ctx.rotate(0.42);
    ctx.fillStyle = "#2c3a52"; ctx.fillRect(-46, -8, 92, 16);
    ctx.restore();
    ctx.save();
    ctx.translate(86, 236);
    ctx.rotate(-0.5);
    ctx.fillStyle = "#cfc6ab"; ctx.fillRect(-22, -8, 44, 16);
    ctx.restore();
    drawPixelText(ctx, "八五班", 86, 228, { size: 9, color: "#5c6a8a", scale: 1, center: true });
    for (let i = 0; i < 9; i++) {
      const x = 200 + i * 34 - ((t * 16) % 34);
      const row = i % 2;
      ctx.globalAlpha = 0.55 - row * 0.2;
      drawSpr(ctx, Math.floor(t * 5 + i) % 2 === 0 ? "soldA" : "soldB", x, 228 + row * 14, { scale: 2.4 + row * 0.3, flip: true });
      ctx.globalAlpha = 1;
    }
    ctx.save();
    ctx.translate(176, 246);
    ctx.rotate(1.3);
    drawSpr(ctx, "gunGas", 0, 0, { anchor: "c", scale: 1.8, alpha: 0.9 });
    ctx.restore();
    for (let i = 0; i < 30; i++) {
      const fy = (i * 47 + t * 10) % CH;
      ctx.fillStyle = `rgba(160,160,150,${0.05 + (i % 4) * 0.03})`;
      ctx.fillRect((i * 71) % CW, CH - fy, 2, 2);
    }
    ctx.fillStyle = `rgba(10,10,12,${0.2 + Math.min(t * 0.06, 0.4)})`;
    ctx.fillRect(0, 0, CW, CH);
    if (t > 1.2 && !fired.current) { fired.current = true; sfx.thump(0.4); }
    if (t > 4.6) {
      ctx.globalAlpha = Math.min((t - 4.6) * 0.9, 1);
      drawPixelText(ctx, "战 败", CW / 2, 96, { size: 20, color: "#a8332a", scale: 3, center: true });
      ctx.globalAlpha = 1;
    }
    drawBars(ctx);
  });

  return (
    <Frame bind={bind} onSkip={onDone}>
      <TypeCap text={CAPS[reason] ?? "战斗结束"} />
      <div className="pointer-events-none absolute left-0 top-0 p-4 text-xs tracking-[0.4em] text-[#6d7690]">
        战 后 影 像
      </div>
    </Frame>
  );
}

// ============================================================
// 复仇 · 开场简报：樊某某震怒，百万雄兵集结
// ============================================================
const REV_SHOTS = [
  { dur: 6.0, caption: "撤离当晚 · 昆虫组总部 · 组长樊某某砸碎了第三个杯子" },
  { dur: 6.2, caption: "「集结。海陆空，一个都别留。」百万雄兵一夜成形" },
  { dur: 6.0, caption: "但大军之前，需要一把钥匙——机动大队侦察支队，单刀赴会" },
];

export function RevengeBriefCutscene({ onDone }: { onDone: () => void }) {
  const [shot, setShot] = useState(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  useEffect(() => {
    sfx.ensure();
    if (shot === 0) { sfx.startBgm("prep"); sfx.crash(); }
    if (shot === 1) { sfx.startBgm("epic"); sfx.thump(0.6); setTimeout(() => sfx.sting(), 600); }
    if (shot === 2) { sfx.startBgm("prep"); sfx.wind(); }
    const tm = setTimeout(() => {
      if (shot + 1 >= REV_SHOTS.length) doneRef.current();
      else setShot(shot + 1);
    }, REV_SHOTS[shot].dur * 1000);
    return () => clearTimeout(tm);
  }, [shot]);

  const { bind } = useRaf((ctx, t) => {
    ctx.imageSmoothingEnabled = false;
    if (shot === 0) drawRevRage(ctx, t);
    else if (shot === 1) drawRevMuster(ctx, t);
    else drawRevRecon(ctx, t);
    drawBars(ctx);
  });

  return (
    <Frame bind={bind} onSkip={onDone}>
      <TypeCap key={shot} text={REV_SHOTS[shot].caption} />
      <div className="pointer-events-none absolute left-0 top-0 p-4 text-xs tracking-[0.4em] text-[#8d2a21]">
        复 仇 · 简报 {shot + 1}/{REV_SHOTS.length}
      </div>
    </Frame>
  );
}

// 第一幕：作战室暴怒
function drawRevRage(ctx: CanvasRenderingContext2D, t: number) {
  ctx.fillStyle = "#0b0d12"; ctx.fillRect(0, 0, CW, CH);
  // 顶灯摇晃
  const sw = Math.sin(t * 2.2) * 14;
  const gl = ctx.createRadialGradient(240 + sw, 40, 10, 240 + sw, 40, 230);
  gl.addColorStop(0, "rgba(255,210,140,0.3)");
  gl.addColorStop(1, "rgba(255,210,140,0)");
  ctx.fillStyle = gl; ctx.fillRect(0, 0, CW, CH);
  ctx.fillStyle = "#15181f"; ctx.fillRect(238 + sw * 0.4, 0, 3, 24);
  ctx.fillStyle = "#cfc6ab"; ctx.fillRect(224 + sw, 24, 32, 8);
  // 墙上作战地图
  ctx.fillStyle = "#1b2130"; ctx.fillRect(300, 46, 150, 104);
  ctx.fillStyle = "#2c3a2a"; ctx.fillRect(306, 52, 138, 92);
  ctx.strokeStyle = "#a8332a"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(378, 98, 26, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(352, 72); ctx.lineTo(404, 124); ctx.moveTo(404, 72); ctx.lineTo(352, 124); ctx.stroke();
  drawPixelText(ctx, "七班", 378, 90, { size: 9, color: "#ff8f7a", scale: 1, center: true });
  // 长桌
  ctx.fillStyle = "#2a2318"; ctx.fillRect(40, 190, 400, 16);
  ctx.fillStyle = "#1d1810"; ctx.fillRect(40, 206, 400, 10);
  // 樊某某（震怒，抖动）
  const shake = t > 1.2 ? Math.sin(t * 40) * 2 : 0;
  drawSpr(ctx, Math.floor(t * 8) % 2 === 0 ? "assA" : "assB", 150 + shake, 192, { scale: 4.2 });
  // 两侧军官
  drawSpr(ctx, "elecA", 72, 196, { scale: 2.8, alpha: 0.9 });
  drawSpr(ctx, "medA", 232, 194, { scale: 2.6, alpha: 0.9 });
  // 摔碎的杯子
  if (t > 1.2) {
    for (let i = 0; i < 9; i++) {
      const px = 200 + Math.cos(i * 2.1) * (16 + (t - 1.2) * 30);
      const py = 206 + Math.abs(Math.sin(i * 1.7)) * 6;
      ctx.fillStyle = "#cfd6df";
      ctx.fillRect(px, py, 3, 3);
    }
  }
  if (t > 2.6) {
    drawPixelText(ctx, "「我的人，在厕所里发的电报。」", 240, 238, {
      size: 11, color: "#ff8f7a", scale: 2, center: true, bg: "rgba(5,7,10,0.88)",
    });
  }
  // 红色怒意闪烁
  if (t > 1.2 && Math.floor(t * 3) % 2 === 0) {
    ctx.fillStyle = "rgba(168,51,42,0.07)"; ctx.fillRect(0, 0, CW, CH);
  }
}

// 第二幕：百万雄兵集结（海陆空）
function drawRevMuster(ctx: CanvasRenderingContext2D, t: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, 200);
  sky.addColorStop(0, "#0a0f1e"); sky.addColorStop(0.6, "#2a2440"); sky.addColorStop(1, "#6b3f33");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, CW, 200);
  ctx.fillStyle = "#121a12"; ctx.fillRect(0, 196, CW, CH - 196);
  // 机群（空军）：三个梯队水平巡航掠过夜空
  for (let row = 0; row < 3; row++) {
    const n = 5;
    const sc = 0.5 + row * 0.16;
    const by = 30 + row * 30;
    const spd = 26 + row * 16;
    for (let i = 0; i < n; i++) {
      const bx = (((i * 112 + row * 46 + t * spd) % (CW + 200)) + CW + 200) % (CW + 200) - 100;
      const prop = Math.floor(t * 18 + i) % 2 === 0 ? "bomberSideA" : "bomberSideB";
      drawSpr(ctx, prop, bx, by + Math.sin(t * 1.6 + i) * 2, { anchor: "c", scale: sc });
    }
  }
  // 地面方阵（陆军，密集）
  for (let row = 0; row < 5; row++) {
    const n = 34 - row * 4;
    const y = 206 + row * 13;
    const sc = 0.5 + row * 0.14;
    for (let i = 0; i < n; i++) {
      const x = ((i * (CW / n) + t * (4 + row * 2)) % (CW + 40)) - 20;
      const step = Math.floor(t * 6 + i + row) % 2 === 0;
      ctx.fillStyle = row > 2 ? "#2c4474" : "#141c30";
      ctx.fillRect(x, y - 7 * sc, 3 * sc, 7 * sc);
      ctx.fillRect(x - 1 * sc, y - 10 * sc, 5 * sc, 3 * sc);
      ctx.fillRect(x + (step ? -1 : 1) * sc, y, 2 * sc, 3 * sc);
      // 枪/旗
      ctx.strokeStyle = row > 2 ? "#0f1420" : "#0a0e18";
      ctx.lineWidth = Math.max(1, sc);
      ctx.beginPath(); ctx.moveTo(x + 3 * sc, y - 13 * sc); ctx.lineTo(x, y - 4 * sc); ctx.stroke();
    }
  }
  // 车队（前排）
  for (let i = 0; i < 7; i++) {
    const vx = ((i * 86 + t * 22) % (CW + 120)) - 60;
    drawSpr(ctx, i % 2 === 0 ? "trikeA" : "motoA", vx, 268, { anchor: "bc", scale: 1.5 });
  }
  // 大旗
  ctx.fillStyle = "#15181f"; ctx.fillRect(48, 108, 4, 150);
  drawSpr(ctx, Math.floor(t * 5) % 2 === 0 ? "flagA" : "flagB", 52, 110, { anchor: "tl", scale: 2.2 });
  // 探照灯柱
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 4; i++) {
    const bx = 90 + i * 110 + Math.sin(t * 0.6 + i) * 30;
    const g2 = ctx.createLinearGradient(bx, 200, bx, 0);
    g2.addColorStop(0, "rgba(220,230,255,0.2)"); g2.addColorStop(1, "rgba(220,230,255,0)");
    ctx.fillStyle = g2;
    ctx.beginPath(); ctx.moveTo(bx - 8, 200); ctx.lineTo(bx + 8, 200); ctx.lineTo(bx + 46, 0); ctx.lineTo(bx - 46, 0); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  if (t > 2.4) {
    drawPixelText(ctx, "海 · 陆 · 空  三军集结", 240, 70, {
      size: 14, color: "#f0e0a8", scale: 3, center: true, bg: "rgba(5,7,10,0.72)",
    });
  }
}

// 第三幕：侦察支队出发
function drawRevRecon(ctx: CanvasRenderingContext2D, t: number) {
  ctx.fillStyle = "#06080e"; ctx.fillRect(0, 0, CW, CH);
  const sky = ctx.createLinearGradient(0, 0, 0, 180);
  sky.addColorStop(0, "#05070f"); sky.addColorStop(1, "#131a2a");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, CW, 180);
  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = `rgba(210,220,236,${0.1 + sr(i) * 0.4})`;
    ctx.fillRect(sr(i * 3.1) * CW, sr(i * 7.7) * 150, 2, 2);
  }
  // 远处学校轮廓（目标）
  ctx.fillStyle = "#0b0f16"; ctx.fillRect(250, 96, 220, 110);
  for (let f = 0; f < 3; f++) for (let w2 = 0; w2 < 6; w2++) {
    ctx.fillStyle = (f === 0 && w2 > 3) ? "#4a5a32" : "#070a10";
    ctx.fillRect(262 + w2 * 34, 108 + f * 32, 20, 18);
  }
  drawPixelText(ctx, "目标：七班治安队校区", 360, 78, { size: 10, color: "#8fa3c8", scale: 2, center: true });
  // 高空侦察机掠过（侧视巡航）
  for (let i = 0; i < 2; i++) {
    const bx = (((i * 200 + t * 30) % (CW + 160)) + CW + 160) % (CW + 160) - 80;
    const prop = Math.floor(t * 16 + i) % 2 === 0 ? "bomberSideA" : "bomberSideB";
    drawSpr(ctx, prop, bx, 34 + i * 16, { anchor: "c", scale: 0.42, alpha: 0.75 });
  }
  // 地面
  ctx.fillStyle = "#0d120f"; ctx.fillRect(0, 206, CW, CH - 206);
  // 侦察小队潜行前进（剪影）
  const adv = Math.min(t * 14, 70);
  for (let i = 0; i < 3; i++) {
    const sp = ["elecA", "assA", "medA"][i] as "elecA";
    const x = 40 + i * 30 + adv;
    const y = 250 + (i % 2) * 6;
    ctx.globalAlpha = 0.92;
    drawSpr(ctx, sp, x, y, { scale: 2.4 });
    ctx.globalAlpha = 1;
  }
  // 草丛前景
  ctx.fillStyle = "#070d08";
  for (let i = 0; i < 40; i++) {
    const gx = (i * 13) % CW;
    const gh = 14 + sr(i) * 20;
    ctx.fillRect(gx, CH - gh, 5, gh);
  }
  // 夜风
  for (let i = 0; i < 20; i++) {
    const px = ((i * 47 + t * 60) % (CW + 60)) - 30;
    ctx.fillStyle = `rgba(190,206,230,${0.05 + sr(i) * 0.06})`;
    ctx.fillRect(px, 180 + sr(i * 2) * 70, 10, 1);
  }
  if (t > 3.0) {
    drawPixelText(ctx, "「电闸在厕所走廊尽头。」", 240, 52, {
      size: 11, color: "#c9d1dc", scale: 2, center: true, bg: "rgba(5,7,10,0.85)",
    });
  }
}

// ============================================================
// 复仇终局：樊某某率三军踏平治安队（长过场）
// ============================================================
const AVENGE_CAPS = [
  { at: 0.4, text: "臭水空爆弹在校区上空次第绽开——绿色的雾笼罩了一切" },
  { at: 6.0, text: "信号弹升空。那是总攻的命令" },
  { at: 12.0, text: "樊某某亲自带队。百万雄兵跨过围墙，踏平治安队阵地" },
  { at: 19.0, text: "拖把折断，簸箕碾碎，对讲机里只剩下忙音" },
  { at: 25.5, text: "2026年10月下旬 · 七班治安队，番号撤销" },
];

export function AvengeFinaleCutscene({ onDone }: { onDone: () => void }) {
  const [capIdx, setCapIdx] = useState(0);
  const [canSkipEnd, setCanSkipEnd] = useState(false);
  const fired = useRef<Record<string, boolean>>({});
  useEffect(() => {
    sfx.ensure();
    sfx.startBgm("epic");
    const t = setTimeout(() => setCanSkipEnd(true), 4000);
    return () => { clearTimeout(t); sfx.engineStop(); };
  }, []);
  const { bind } = useRaf((ctx, t) => {
    ctx.imageSmoothingEnabled = false;
    drawAvenge(ctx, t, (k) => {
      if (fired.current[k]) return;
      fired.current[k] = true;
      if (k === "boom") { sfx.explosion(true); setTimeout(() => sfx.explosion(true), 700); }
      if (k === "flare") sfx.sting();
      if (k === "charge") { sfx.thump(0.6); sfx.snare(0.3); setTimeout(() => sfx.sting(), 500); }
      if (k === "crush") { sfx.crash(); setTimeout(() => sfx.explosion(true), 400); }
      if (k === "win") sfx.win();
    });
    for (let i = AVENGE_CAPS.length - 1; i >= 0; i--) if (t >= AVENGE_CAPS[i].at) { setCapIdx(i); break; }
    drawBars(ctx);
  });
  return (
    <Frame bind={bind} onSkip={onDone}>
      <TypeCap key={capIdx} text={AVENGE_CAPS[capIdx].text} />
      <div className="pointer-events-none absolute left-0 top-0 p-4 text-xs tracking-[0.4em] text-[#8d2a21]">
        复 仇 · 终 幕
      </div>
      {canSkipEnd && (
        <button
          className="px-btn px-btn-amber absolute bottom-[4.2rem] right-6 z-10 px-5 py-2 text-sm tracking-[0.25em]"
          onClick={onDone}
        >
          鸣谢名单 ▸
        </button>
      )}
    </Frame>
  );
}

function drawAvenge(ctx: CanvasRenderingContext2D, t: number, fire: (k: string) => void) {
  // ---- 段 1：空爆弹绽放（0~6） ----
  if (t < 6.0) {
    fire("boom");
    const sky = ctx.createLinearGradient(0, 0, 0, 200);
    sky.addColorStop(0, "#0a1016"); sky.addColorStop(1, "#243026");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, CW, 200);
    ctx.fillStyle = "#101712"; ctx.fillRect(0, 196, CW, CH - 196);
    // 校区轮廓
    for (let i = 0; i < 5; i++) {
      const bx = 20 + i * 92;
      ctx.fillStyle = "#1a2219"; ctx.fillRect(bx, 140 - (i % 2) * 20, 72, 70 + (i % 2) * 20);
    }
    // 连续绽放的绿色蘑菇云
    for (let i = 0; i < 6; i++) {
      const st = i * 0.7;
      if (t < st) continue;
      const k = Math.min((t - st) / 2.4, 1);
      const bx = 50 + i * 78;
      const r = 10 + k * 64;
      ctx.fillStyle = `rgba(90,140,40,${0.5 * (1 - k * 0.5)})`;
      ctx.beginPath(); ctx.arc(bx, 170 - k * 56, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(150,200,80,${0.42 * (1 - k * 0.5)})`;
      ctx.beginPath(); ctx.arc(bx, 170 - k * 56, r * 0.6, 0, Math.PI * 2); ctx.fill();
      // 蘑菇柄
      ctx.fillStyle = `rgba(80,120,36,${0.34 * (1 - k * 0.4)})`;
      ctx.fillRect(bx - 8 * k, 170 - k * 40, 16 * k, 60 * k);
    }
    // 飘散的毒雾
    for (let i = 0; i < 50; i++) {
      const px = (sr(i) * CW + t * 16) % CW;
      const py = 120 + sr(i * 3) * 120 - ((t * 10 + i * 4) % 50);
      ctx.fillStyle = `rgba(127,174,63,${0.06 + sr(i * 5) * 0.12})`;
      ctx.fillRect(px, py, 6, 4);
    }
    // 远处的轰炸机编队（水平巡航，刚投完弹）
    for (let i = 0; i < 5; i++) {
      const bx = (((i * 108 + t * 34) % (CW + 180)) + CW + 180) % (CW + 180) - 90;
      const by = 26 + (i % 2) * 18;
      const prop = Math.floor(t * 18 + i) % 2 === 0 ? "bomberSideA" : "bomberSideB";
      drawSpr(ctx, prop, bx, by, { anchor: "c", scale: 0.55 + (i % 2) * 0.1 });
    }
    if (t > 4.8) { ctx.fillStyle = `rgba(0,0,0,${(t - 4.8) / 1.2})`; ctx.fillRect(0, 0, CW, CH); }
    return;
  }

  // ---- 段 2：信号弹 + 总攻（6~12） ----
  const T = t - 6.0;
  const sky = ctx.createLinearGradient(0, 0, 0, 210);
  sky.addColorStop(0, "#080c16");
  sky.addColorStop(0.55, "#1c1b30");
  sky.addColorStop(1, "#4a2f30");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, CW, 212);
  ctx.fillStyle = "#0e1310"; ctx.fillRect(0, 206, CW, CH - 206);

  // 信号弹
  if (T < 6) {
    fire("flare");
    const fk = Math.min(T / 1.6, 1);
    const fx = 380, fy = 190 - fk * 140;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const fg = ctx.createRadialGradient(fx, fy, 2, fx, fy, 120);
    fg.addColorStop(0, "rgba(255,120,90,0.8)");
    fg.addColorStop(1, "rgba(255,80,60,0)");
    ctx.fillStyle = fg; ctx.fillRect(fx - 130, fy - 130, 260, 260);
    ctx.fillStyle = "#fff1d0"; ctx.fillRect(fx - 2, fy - 2, 4, 4);
    ctx.restore();
    // 红光笼罩战场
    ctx.fillStyle = `rgba(190,60,44,${0.1 * fk})`;
    ctx.fillRect(0, 0, CW, CH);
  }

  // ---- 冲锋的洪流（层层叠叠）----
  if (T > 1.0) {
    fire("charge");
    const adv = (T - 1.0);
    // 远排：无尽人海
    for (let row = 0; row < 6; row++) {
      const n = 48 - row * 6;
      const y = 206 + row * 11;
      const sc = 0.42 + row * 0.16;
      const spd = 10 + row * 7;
      for (let i = 0; i < n; i++) {
        const x = ((i * (CW / n) + adv * spd + sr(row * 10 + i) * 20) % (CW + 60)) - 30;
        const step = Math.floor(T * 8 + i + row) % 2 === 0;
        const col = row > 3 ? "#2c4474" : row > 1 ? "#1b2744" : "#0e1526";
        ctx.fillStyle = col;
        ctx.fillRect(x, y - 8 * sc, 3.4 * sc, 8 * sc);
        ctx.fillRect(x - 1 * sc, y - 11.5 * sc, 5.4 * sc, 3.4 * sc);
        ctx.fillRect(x + (step ? -1.4 : 1.4) * sc, y, 2.4 * sc, 3.4 * sc);
        ctx.strokeStyle = row > 3 ? "#121a2c" : "#0a0e18";
        ctx.lineWidth = Math.max(1, sc * 0.9);
        ctx.beginPath(); ctx.moveTo(x + 3.4 * sc, y - 14 * sc); ctx.lineTo(x, y - 4 * sc); ctx.stroke();
        if (sr(row * 7 + i * 3) > 0.93) {
          ctx.fillStyle = "#8d2a21";
          ctx.fillRect(x, y - 22 * sc, 1.6 * sc, 12 * sc);
          ctx.fillRect(x + 1.6 * sc, y - 22 * sc, (Math.floor(T * 5 + i) % 2 ? 8 : 7) * sc, 5 * sc);
        }
      }
    }
    // 载具洪流
    for (let i = 0; i < 10; i++) {
      const vx = ((i * 64 + adv * 46) % (CW + 140)) - 70;
      const vy = 262 + (i % 3) * 6;
      drawSpr(ctx, i % 3 === 0 ? "trikeA" : i % 3 === 1 ? "motoA" : "trikeB", vx, vy, { anchor: "bc", scale: 1.5 + (i % 3) * 0.2 });
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      const hg = ctx.createRadialGradient(vx + 26, vy - 12, 1, vx + 26, vy - 12, 40);
      hg.addColorStop(0, "rgba(255,236,170,0.4)"); hg.addColorStop(1, "rgba(255,236,170,0)");
      ctx.fillStyle = hg; ctx.fillRect(vx - 20, vy - 50, 90, 70);
      ctx.restore();
    }
    // 空中掩护：两个梯队低空水平掠过
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 4; i++) {
        const spd = 42 + row * 22;
        const bx = (((i * 136 + row * 64 + T * spd) % (CW + 200)) + CW + 200) % (CW + 200) - 100;
        const by = 24 + row * 26;
        const prop = Math.floor(T * 20 + i + row) % 2 === 0 ? "bomberSideA" : "bomberSideB";
        drawSpr(ctx, prop, bx, by, { anchor: "c", scale: 0.5 + row * 0.2 });
      }
    }
  }

  // ---- 樊某某领衔（最前景）----
  if (T > 2.2) {
    const lead = Math.min((T - 2.2) / 1.2, 1);
    ctx.globalAlpha = lead;
    const bob = Math.sin(T * 7) * 2;
    drawSpr(ctx, Math.floor(T * 7) % 2 === 0 ? "assA" : "assB", 150, 290 + bob, { scale: 4.4 });
    drawSpr(ctx, Math.floor(T * 6) % 2 === 0 ? "elecA" : "elecB", 86, 286 + bob * 0.6, { scale: 3.4 });
    drawSpr(ctx, Math.floor(T * 6) % 2 === 0 ? "medA" : "medB", 214, 286 + bob * 0.7, { scale: 3.4 });
    // 樊某某高举的战旗
    ctx.fillStyle = "#15181f"; ctx.fillRect(176, 196, 4, 100);
    drawSpr(ctx, Math.floor(T * 5) % 2 === 0 ? "flagA" : "flagB", 180, 198, { anchor: "tl", scale: 2.0 });
    ctx.globalAlpha = 1;
  }

  // ---- 治安队防线崩溃 ----
  if (T > 4.2) {
    fire("crush");
    const cr = Math.min((T - 4.2) / 2.0, 1);
    // 折断的拖把与碾碎的簸箕散落
    for (let i = 0; i < 14; i++) {
      const dx = 300 + sr(i) * 180 - cr * 40;
      const dy = 240 + sr(i * 3) * 60;
      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(sr(i * 7) * 3.1 + cr);
      ctx.globalAlpha = 0.85;
      if (i % 2 === 0) drawSpr(ctx, "mopV", 0, 0, { anchor: "c", scale: 1.3 });
      else drawSpr(ctx, "shieldBroken", 0, 0, { anchor: "c", scale: 1.2 });
      ctx.globalAlpha = 1;
      ctx.restore();
    }
    // 溃逃的治安队
    for (let i = 0; i < 10; i++) {
      const fx2 = 320 + ((i * 36 + T * 70) % 240);
      if (fx2 > CW) continue;
      ctx.globalAlpha = 0.7;
      drawSpr(ctx, Math.floor(T * 9 + i) % 2 === 0 ? "soldA" : "soldB", fx2, 248 + (i % 3) * 10, { scale: 1.6, flip: true });
      ctx.globalAlpha = 1;
    }
  }

  // ---- 烟尘与火光 ----
  for (let i = 0; i < 60; i++) {
    const px = (sr(i) * CW + T * (14 + sr(i * 2) * 36)) % CW;
    const py = 200 + sr(i * 4) * 70 - ((T * 11 + i * 3) % 40);
    ctx.fillStyle = i % 5 === 0
      ? `rgba(255,170,80,${0.25 + sr(i) * 0.3})`
      : `rgba(170,170,160,${0.05 + sr(i) * 0.1})`;
    ctx.fillRect(px, py, 2, 2);
  }
  // 右侧燃烧的治安队阵地
  if (T > 3.0) {
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 4; i++) {
      const fx3 = 360 + i * 32;
      const fh = 20 + Math.sin(T * 7 + i) * 10;
      const fg2 = ctx.createRadialGradient(fx3, 220, 2, fx3, 220, 60);
      fg2.addColorStop(0, `rgba(255,150,60,${0.3 + Math.sin(T * 6 + i) * 0.1})`);
      fg2.addColorStop(1, "rgba(255,120,40,0)");
      ctx.fillStyle = fg2; ctx.fillRect(fx3 - 60, 160, 120, 120);
      ctx.fillStyle = "rgba(255,190,90,0.5)";
      ctx.fillRect(fx3 - 4, 220 - fh, 8, fh);
    }
    ctx.restore();
  }

  // ---- 终章字幕 ----
  if (T > 13.0) {
    fire("win");
    const a = Math.min((T - 13.0) * 0.6, 1);
    ctx.fillStyle = `rgba(5,7,10,${a * 0.6})`; ctx.fillRect(0, 0, CW, CH);
    ctx.globalAlpha = a;
    drawPixelText(ctx, "治 安 队 · 番 号 撤 销", 240, 94, { size: 18, color: "#f0e0a8", scale: 3, center: true });
    drawPixelText(ctx, "昆虫组武装大队 · 复仇行动 完成", 240, 146, { size: 10, color: "#c2a14a", scale: 2, center: true });
    ctx.globalAlpha = 1;
  } else if (T > 7.5) {
    const a = Math.min((T - 7.5) * 0.8, 1);
    ctx.globalAlpha = a;
    drawPixelText(ctx, "踏 平 治 安 队", 240, 64, { size: 16, color: "#ffd9a0", scale: 3, center: true, bg: "rgba(5,7,10,0.6)" });
    ctx.globalAlpha = 1;
  }
}

// ============================================================
// 对外暴露分镜绘制器（供「电影模式」复用，避免重复实现）
// ============================================================
export const SCENE = {
  CW, CH,
  bars: drawBars,
  sr,
  marchMan,
  marchVehicle,
  school: drawShotSchool,
  beetle: drawShotBeetle,
  standoff: drawShotStandoff,
  squad: drawShotSquad,
  victory: drawVictory,
  m2Corridor: drawM2Corridor,
  m2Bike: drawM2Bike,
  m2Ambush: drawM2Ambush,
  finale: drawFinale,
  revRage: drawRevRage,
  revMuster: drawRevMuster,
  revRecon: drawRevRecon,
  avenge: drawAvenge,
};
