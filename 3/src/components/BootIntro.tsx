import { useEffect, useRef, useState } from "react";
import { drawSpr, drawPixelText, pixelText } from "../game/sprites";
import { sfx } from "../game/audio";

const CW = 480;
const CH = 270;

function bars(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, CW, 20);
  ctx.fillRect(0, CH - 20, CW, 20);
}

function grain(ctx: CanvasRenderingContext2D) {
  for (let i = 0; i < 22; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`;
    ctx.fillRect(Math.random() * CW, Math.random() * CH, 2, 2);
  }
}

// ============================================================
// 开场动画：交代两大组织的由来（与第一战役"事发经过"不重复）
// ============================================================

/** 幕一：档案袋开启 */
function shotArchive(ctx: CanvasRenderingContext2D, t: number) {
  ctx.fillStyle = "#07090d";
  ctx.fillRect(0, 0, CW, CH);
  const sp = ctx.createRadialGradient(CW / 2, 130, 10, CW / 2, 130, 210);
  sp.addColorStop(0, "rgba(194,161,74,0.16)");
  sp.addColorStop(1, "rgba(194,161,74,0)");
  ctx.fillStyle = sp;
  ctx.fillRect(0, 0, CW, CH);

  // 牛皮纸档案袋
  const open = Math.min(t / 2.2, 1);
  const ease = open * open * (3 - 2 * open);
  ctx.fillStyle = "#8a6f3c";
  ctx.fillRect(110, 70, 260, 150);
  ctx.fillStyle = "#a5874c";
  ctx.fillRect(114, 74, 252, 142);
  // 封口翻盖
  ctx.save();
  ctx.translate(240, 72);
  ctx.rotate(-ease * 1.5);
  ctx.fillStyle = "#7a6134";
  ctx.fillRect(-130, -44, 260, 46);
  ctx.fillStyle = "#8f7440";
  ctx.fillRect(-126, -40, 252, 38);
  ctx.restore();
  // 红绳扣
  ctx.fillStyle = "#8d2a21";
  ctx.beginPath(); ctx.arc(240, 76, 7, 0, Math.PI * 2); ctx.fill();

  // 露出的文件
  if (t > 1.4) {
    const rise = Math.min((t - 1.4) / 1.4, 1);
    ctx.fillStyle = "#ded2b0";
    ctx.fillRect(140, 96 - rise * 26, 200, 120);
    ctx.fillStyle = "#8d2a21";
    ctx.fillRect(152, 110 - rise * 26, 74, 3);
    drawPixelText(ctx, "八五班 · 战时档案", 240, 120 - rise * 26, {
      size: 12, color: "#14171f", scale: 2, center: true,
    });
    ctx.fillStyle = "#9a9079";
    for (let i = 0; i < 5; i++) ctx.fillRect(160, 146 - rise * 26 + i * 11, 160 - i * 14, 3);
    // 绝密印章
    if (t > 2.8) {
      ctx.save();
      ctx.translate(300, 190 - rise * 26);
      ctx.rotate(-0.22);
      ctx.strokeStyle = "#8d2a21";
      ctx.lineWidth = 3;
      ctx.strokeRect(-44, -15, 88, 30);
      drawPixelText(ctx, "绝 密", 0, -9, { size: 13, color: "#8d2a21", scale: 2, center: true });
      ctx.restore();
    }
  }
  grain(ctx);
}

/** 幕二：昆虫组的诞生 */
function shotInsectClub(ctx: CanvasRenderingContext2D, t: number) {
  // 教室内景
  const g = ctx.createLinearGradient(0, 0, 0, CH);
  g.addColorStop(0, "#3a3c30");
  g.addColorStop(0.7, "#4a4c3c");
  g.addColorStop(0.71, "#334445");
  g.addColorStop(1, "#2a3a3b");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CW, 200);
  ctx.fillStyle = "#5c5445";
  ctx.fillRect(0, 196, CW, CH - 196);

  // 黑板
  ctx.fillStyle = "#22332e";
  ctx.fillRect(60, 40, 220, 100);
  ctx.fillStyle = "#d8c9a3";
  ctx.fillRect(56, 36, 228, 6);
  ctx.fillRect(56, 138, 228, 6);
  drawPixelText(ctx, "昆虫观察兴趣小组", 170, 60, { size: 13, color: "#e8e4d4", scale: 2, center: true });
  drawPixelText(ctx, "— 成立大会 —", 170, 92, { size: 10, color: "#9fd0a8", scale: 2, center: true });

  // 玻璃观察箱（逐个点亮）
  for (let i = 0; i < 4; i++) {
    if (t < 0.8 + i * 0.55) continue;
    const bx = 310 + (i % 2) * 70;
    const by = 56 + Math.floor(i / 2) * 62;
    ctx.fillStyle = "#1b2426";
    ctx.fillRect(bx, by, 56, 50);
    ctx.fillStyle = "rgba(160,200,210,0.22)";
    ctx.fillRect(bx + 4, by + 4, 48, 42);
    ctx.strokeStyle = "#8c94a3";
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, 56, 50);
    // 箱里的虫
    const wig = Math.sin(t * 5 + i) * 4;
    drawSpr(ctx, Math.floor(t * 10 + i) % 2 === 0 ? "beetleA" : "beetleB",
      bx + 28 + wig, by + 32, { anchor: "c", scale: 1.5 });
  }

  // 三名创始成员
  const bob = Math.sin(t * 2.6) * 1.2;
  if (t > 0.5) drawSpr(ctx, "elecA", 110, 250 + bob, { scale: 3 });
  if (t > 1.3) drawSpr(ctx, "medA", 62, 248 + bob * 0.7, { scale: 2.6 });
  if (t > 2.1) drawSpr(ctx, "assA", 162, 248 + bob * 0.8, { scale: 2.6 });

  if (t > 3.4) {
    drawPixelText(ctx, "「虫子不咬人，咬人的是隔壁班。」", 240, 162, {
      size: 10, color: "#e8e4d4", scale: 2, center: true, bg: "rgba(8,10,14,0.85)",
    });
  }
  grain(ctx);
}

/** 幕三：治安队的扩张 */
function shotPatrol(ctx: CanvasRenderingContext2D, t: number) {
  ctx.fillStyle = "#121a16";
  ctx.fillRect(0, 0, CW, CH);
  const g = ctx.createLinearGradient(0, 0, 0, 200);
  g.addColorStop(0, "#1c2620");
  g.addColorStop(1, "#38402e");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CW, 200);
  ctx.fillStyle = "#2a2f26";
  ctx.fillRect(0, 196, CW, CH - 196);

  // 红色权力感光晕
  const rg = ctx.createRadialGradient(240, 150, 10, 240, 150, 230);
  rg.addColorStop(0, `rgba(120,160,90,${0.2 + Math.sin(t * 2) * 0.05})`);
  rg.addColorStop(1, "rgba(120,160,90,0)");
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, CW, CH);

  // 列队：从少到多，象征扩张
  const grown = Math.min(t / 4, 1);
  const rows = 3;
  for (let row = 0; row < rows; row++) {
    const n = Math.floor((6 + row * 4) * grown);
    const y = 206 + row * 16;
    const sc = 1.7 + row * 0.5;
    for (let i = 0; i < n; i++) {
      const x = 30 + i * (CW - 60) / Math.max(1, n - 1 || 1);
      drawSpr(ctx, Math.floor(t * 5 + i + row) % 2 === 0 ? "soldA" : "soldB", x, y, { scale: sc });
      drawSpr(ctx, "mopV", x - 9 * sc * 0.4, y - 20 * sc * 0.42, { anchor: "c", scale: sc * 0.7 });
    }
  }

  // 公告牌
  ctx.fillStyle = "#ded2b0";
  ctx.fillRect(140, 34, 200, 84);
  ctx.fillStyle = "#14171f";
  ctx.fillRect(140, 34, 200, 5);
  drawPixelText(ctx, "七班治安队", 240, 48, { size: 14, color: "#2c4430", scale: 2, center: true });
  drawPixelText(ctx, "负责本层走廊秩序", 240, 78, { size: 9, color: "#5c5747", scale: 2, center: true });
  if (t > 2.6) {
    drawPixelText(ctx, "· 最终解释权归本队所有 ·", 240, 98, { size: 8, color: "#8d2a21", scale: 2, center: true });
  }
  grain(ctx);
}

/** 幕四：两强对峙 · 标题浮现 */
function shotStandoff(ctx: CanvasRenderingContext2D, t: number) {
  ctx.fillStyle = "#06080c";
  ctx.fillRect(0, 0, CW, CH);
  // 中线裂隙
  const split = Math.min(t / 1.6, 1);
  ctx.fillStyle = "#101620";
  ctx.fillRect(0, 0, CW, CH);
  // 左蓝右绿两股势力
  const lg = ctx.createLinearGradient(0, 0, CW / 2, 0);
  lg.addColorStop(0, "rgba(60,90,150,0.3)");
  lg.addColorStop(1, "rgba(60,90,150,0)");
  ctx.fillStyle = lg;
  ctx.fillRect(0, 0, CW / 2, CH);
  const rg2 = ctx.createLinearGradient(CW, 0, CW / 2, 0);
  rg2.addColorStop(0, "rgba(90,140,80,0.3)");
  rg2.addColorStop(1, "rgba(90,140,80,0)");
  ctx.fillStyle = rg2;
  ctx.fillRect(CW / 2, 0, CW / 2, CH);

  ctx.fillStyle = "#0b0f14";
  ctx.fillRect(0, 206, CW, CH - 206);

  // 左：昆虫组
  for (let i = 0; i < 3; i++) {
    const x = 50 + i * 42 - split * 14;
    drawSpr(ctx, (["medA", "elecA", "assA"] as const)[i], x, 250, { scale: 2.6 });
  }
  // 右：治安队人海
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 5; i++) {
      const x = 290 + i * 38 + row * 16 + split * 14;
      if (x > CW + 20) continue;
      ctx.globalAlpha = row === 0 ? 1 : 0.6;
      drawSpr(ctx, Math.floor(t * 5 + i) % 2 === 0 ? "soldA" : "soldB", x, 248 + row * 12, { flip: true, scale: 2.4 });
      ctx.globalAlpha = 1;
    }
  }

  // 中央裂缝电光
  ctx.strokeStyle = `rgba(200,80,60,${0.4 + Math.sin(t * 8) * 0.2})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  let cy = 196;
  ctx.moveTo(CW / 2, cy);
  let seed = 3;
  while (cy < CH) {
    seed = (seed * 16807) % 2147483647;
    cy += 14;
    ctx.lineTo(CW / 2 + (seed % 26) - 13, cy);
  }
  ctx.stroke();

  // 标题浮现
  if (t > 2.2) {
    const a = Math.min((t - 2.2) * 0.9, 1);
    ctx.globalAlpha = a;
    ctx.fillStyle = "rgba(6,8,12,0.72)";
    ctx.fillRect(0, 58, CW, 72);
    drawPixelText(ctx, "八五班 门线保卫战", 240, 70, { size: 20, color: "#f0e0a8", scale: 3, center: true });
    drawPixelText(ctx, "2026 年 10 月 · 深秋", 240, 112, { size: 9, color: "#c2a14a", scale: 2, center: true });
    ctx.globalAlpha = 1;
  }
  grain(ctx);
}

const SHOTS: { dur: number; cap: string; paint: (c: CanvasRenderingContext2D, t: number) => void }[] = [
  { dur: 5.0, cap: "某中学 · 教学楼五层 · 一份被封存的档案", paint: shotArchive },
  { dur: 5.6, cap: "八五班「昆虫组」——一群养虫子的人，和他们的玻璃箱", paint: shotInsectClub },
  { dur: 5.6, cap: "隔壁七班「治安队」——自封的走廊秩序维护者，人数逐年膨胀", paint: shotPatrol },
  { dur: 5.4, cap: "两个班，一条走廊。火药味，早就攒够了", paint: shotStandoff },
];

const TOTAL = SHOTS.reduce((s, x) => s + x.dur, 0);

export default function BootIntro({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shot, setShot] = useState(0);
  const [capN, setCapN] = useState(0);
  const timeRef = useRef(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  // 音效
  useEffect(() => {
    sfx.ensure();
    sfx.startBgm("prep");
    sfx.wind();
  }, []);
  useEffect(() => {
    if (shot === 1) sfx.click();
    if (shot === 2) { sfx.thump(0.4); setTimeout(() => sfx.walkie(), 600); }
    if (shot === 3) { sfx.sting(); }
  }, [shot]);

  // 打字机
  useEffect(() => {
    setCapN(0);
    const txt = SHOTS[shot].cap;
    const t = setInterval(() => setCapN((v) => (v >= txt.length ? v : v + 1)), 42);
    return () => clearInterval(t);
  }, [shot]);

  // 主循环
  useEffect(() => {
    const cv = canvasRef.current!;
    const ctx = cv.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    let raf = 0;
    let last = performance.now();
    const loop = (ts: number) => {
      const dt = Math.min((ts - last) / 1000, 0.05);
      last = ts;
      timeRef.current += dt;
      // 定位镜头
      let acc = 0, idx = 0, local = 0;
      for (let i = 0; i < SHOTS.length; i++) {
        if (timeRef.current < acc + SHOTS[i].dur) { idx = i; local = timeRef.current - acc; break; }
        acc += SHOTS[i].dur;
        idx = i; local = SHOTS[i].dur;
      }
      setShot((v) => (v === idx ? v : idx));
      ctx.clearRect(0, 0, CW, CH);
      SHOTS[idx].paint(ctx, local);
      // 转场淡入淡出
      const f = 0.55;
      if (local < f) { ctx.fillStyle = `rgba(0,0,0,${1 - local / f})`; ctx.fillRect(0, 0, CW, CH); }
      else if (SHOTS[idx].dur - local < f) {
        ctx.fillStyle = `rgba(0,0,0,${1 - (SHOTS[idx].dur - local) / f})`;
        ctx.fillRect(0, 0, CW, CH);
      }
      bars(ctx);
      if (timeRef.current >= TOTAL) { doneRef.current(); return; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // 字幕渲染
  const capRef = useRef<HTMLDivElement>(null);
  const shownCap = SHOTS[shot].cap.slice(0, capN);
  useEffect(() => {
    const box = capRef.current;
    if (!box) return;
    box.innerHTML = "";
    const cv = pixelText(shownCap || " ", {
      size: 11, color: "#fff4e0", scale: 3, bg: "rgba(8,10,14,0.76)", pad: 3,
    });
    cv.style.imageRendering = "pixelated";
    cv.style.maxWidth = "86vw";
    box.appendChild(cv);
  }, [shownCap]);

  return (
    <div className="fixed inset-0 z-[94] flex items-center justify-center bg-black">
      <div className="relative w-full max-w-[1100px]" style={{ aspectRatio: "16/9" }}>
        <canvas
          ref={canvasRef}
          width={CW}
          height={CH}
          className="h-full w-full [image-rendering:pixelated]"
        />
        {/* 字幕：居中靠下，右侧留出按钮空间 */}
        <div className="pointer-events-none absolute inset-x-0 bottom-[8%] flex justify-center px-28">
          <div ref={capRef} className={capN >= SHOTS[shot].cap.length ? "" : "caret"} />
        </div>
        {/* 左上角进度 */}
        <div className="pointer-events-none absolute left-4 top-4 text-[11px] tracking-[0.4em] text-[#6d7690]">
          战前简报 {shot + 1}/{SHOTS.length}
        </div>
      </div>
      {/* 跳过：右下角，不压字幕 */}
      <button
        className="px-btn px-btn-dark absolute bottom-6 right-6 px-4 py-2 text-sm tracking-[0.3em] opacity-80 hover:opacity-100"
        onClick={onDone}
      >
        跳过 ▸▸
      </button>
    </div>
  );
}
