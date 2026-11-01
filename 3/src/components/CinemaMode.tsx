import { useCallback, useEffect, useRef, useState } from "react";
import { SCENE } from "./Cutscene";
import { drawSpr, drawPixelText, buildSchoolExterior, buildRuins } from "../game/sprites";
import { sfx } from "../game/audio";
import type { BgmMode } from "../game/audio";

const CW = SCENE.CW;
const CH = SCENE.CH;
const sr = SCENE.sr;

type Painter = (ctx: CanvasRenderingContext2D, local: number, assets: Assets) => void;

interface Assets {
  school: HTMLCanvasElement | null;
  ruins: HTMLCanvasElement | null;
}

interface Shot {
  dur: number;
  caption: string;
  chapter?: string;        // 章节卡（出现在该镜头开头）
  bgm?: BgmMode;
  paint: Painter;
}

// ============================================================
// 新增分镜：标题卡 / 门线激战 / 摩托突围 / 厕所发报 / 落幕
// ============================================================

function vignette(ctx: CanvasRenderingContext2D, a = 0.55) {
  const g = ctx.createRadialGradient(CW / 2, CH / 2, CH * 0.25, CW / 2, CH / 2, CH * 0.92);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${a})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CW, CH);
}

/** 胶片颗粒 + 偶发划痕，营造纪录片质感 */
function filmGrain(ctx: CanvasRenderingContext2D, t: number) {
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`;
    ctx.fillRect(Math.random() * CW, Math.random() * CH, 2, 2);
  }
  if (Math.random() < 0.06) {
    const x = Math.random() * CW;
    ctx.fillStyle = "rgba(226,226,210,0.12)";
    ctx.fillRect(x, 0, 1, CH);
  }
  if (Math.floor(t * 8) % 37 === 0) {
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(0, 0, CW, CH);
  }
}

/** 片头：战史标题卡 */
const paintTitle: Painter = (ctx, t) => {
  ctx.fillStyle = "#05070a";
  ctx.fillRect(0, 0, CW, CH);
  // 缓慢上浮的余烬
  for (let i = 0; i < 40; i++) {
    const fy = (i * 37 + t * 16) % (CH + 40);
    ctx.fillStyle = i % 5 === 0
      ? `rgba(194,161,74,${0.18 + sr(i) * 0.3})`
      : `rgba(120,130,150,${0.06 + sr(i) * 0.1})`;
    ctx.fillRect((i * 97) % CW, CH - fy, 2, 2);
  }
  const spot = ctx.createRadialGradient(CW / 2, 120, 10, CW / 2, 120, 230);
  spot.addColorStop(0, "rgba(194,161,74,0.16)");
  spot.addColorStop(1, "rgba(194,161,74,0)");
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, CW, CH);

  if (t > 0.5) {
    ctx.globalAlpha = Math.min((t - 0.5) * 0.9, 1);
    drawPixelText(ctx, "八 五 班 战 史", CW / 2, 86, { size: 22, color: "#f0e0a8", scale: 3, center: true });
    ctx.globalAlpha = 1;
  }
  if (t > 2.0) {
    ctx.globalAlpha = Math.min((t - 2.0) * 0.9, 1);
    ctx.fillStyle = "#8d2a21";
    ctx.fillRect(CW / 2 - 90, 126, 180, 3);
    drawPixelText(ctx, "2026 年 10 月 · 全记录", CW / 2, 142, { size: 11, color: "#c2a14a", scale: 2, center: true });
    ctx.globalAlpha = 1;
  }
  if (t > 3.6) {
    ctx.globalAlpha = Math.min((t - 3.6) * 0.8, 1);
    drawPixelText(ctx, "昆虫组武装大队  VS  七班治安队", CW / 2, 186, { size: 10, color: "#8fa3c8", scale: 2, center: true });
    ctx.globalAlpha = 1;
  }
  // 三人剪影渐入
  if (t > 4.6) {
    ctx.globalAlpha = Math.min((t - 4.6) * 0.7, 0.85);
    drawSpr(ctx, "medA", 196, 262, { scale: 2.2 });
    drawSpr(ctx, "elecA", 240, 266, { scale: 2.5 });
    drawSpr(ctx, "assA", 284, 262, { scale: 2.2 });
    ctx.globalAlpha = 1;
  }
  filmGrain(ctx, t);
};

/** 第一战役：门线激战蒙太奇 */
const paintGateBattle: Painter = (ctx, t) => {
  // 走廊
  const g = ctx.createLinearGradient(0, 0, 0, CH);
  g.addColorStop(0, "#д".length ? "#4a4433" : "#4a4433");
  g.addColorStop(0.72, "#5a5240");
  g.addColorStop(0.73, "#3b565c");
  g.addColorStop(1, "#2e4449");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CW, 196);
  ctx.fillStyle = "#6b6353";
  ctx.fillRect(0, 190, CW, CH - 190);
  for (let x = 0; x < CW; x += 34) {
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(x, 190, 2, CH - 190);
  }
  // 八五班大门（左）
  ctx.fillStyle = "#2c2f36";
  ctx.fillRect(0, 70, 64, 190);
  ctx.fillStyle = "#42556f";
  ctx.fillRect(6, 78, 52, 176);
  ctx.fillStyle = "#31415a";
  ctx.fillRect(30, 80, 3, 172);
  ctx.fillStyle = "#ece7d8";
  ctx.fillRect(10, 54, 44, 16);
  drawPixelText(ctx, "八五班", 32, 55, { size: 10, color: "#28407c", scale: 1, center: true });
  // 门体受创裂纹（随时间加深）
  if (t > 3) {
    ctx.strokeStyle = "rgba(16,18,24,0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(14, 96); ctx.lineTo(26, 140); ctx.lineTo(16, 182);
    if (t > 8) { ctx.moveTo(44, 90); ctx.lineTo(36, 150); ctx.lineTo(50, 210); }
    ctx.stroke();
  }

  // 敌军人海自右向左压上
  for (let row = 0; row < 3; row++) {
    const n = 9 - row * 2;
    const y = 212 + row * 16;
    const sc = 1.7 + row * 0.45;
    for (let i = 0; i < n; i++) {
      const base = 120 + i * 42 + row * 20;
      const x = base - ((t * (9 + row * 4)) % 60);
      if (x < 70 || x > CW + 20) continue;
      drawSpr(ctx, Math.floor(t * 6 + i + row) % 2 === 0 ? "soldA" : "soldB", x, y, { flip: true, scale: sc });
      drawSpr(ctx, "mopV", x - 10 * sc * 0.4, y - 22 * sc * 0.45, { anchor: "c", scale: sc * 0.75 });
    }
  }

  // 守门干员（左侧，持枪喷火）
  const hero = 96;
  const bob = Math.sin(t * 7) * 1.4;
  drawSpr(ctx, Math.floor(t * 6) % 2 === 0 ? "elecA" : "elecB", hero, 250 + bob, { scale: 3 });
  drawSpr(ctx, "gunGas", hero + 22, 216 + bob, { anchor: "c", scale: 2.4 });

  // 喷射火焰（周期性开火）
  const firing = Math.sin(t * 1.6) > -0.1;
  if (firing) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 46; i++) {
      const p = (i / 46);
      const fx = hero + 34 + p * 150 + Math.sin(t * 20 + i) * 3;
      const fy = 214 + bob + Math.sin(t * 14 + i * 0.7) * (3 + p * 16);
      const s = 2 + p * 7;
      const cols = ["#fff2a8", "#ffd23e", "#ff9426", "#ff5c1f"];
      ctx.fillStyle = cols[i % 4];
      ctx.globalAlpha = 0.85 - p * 0.65;
      ctx.fillRect(fx, fy, s, s);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
    // 火光映照
    const fg = ctx.createRadialGradient(hero + 80, 220, 10, hero + 80, 220, 150);
    fg.addColorStop(0, "rgba(255,150,60,0.18)");
    fg.addColorStop(1, "rgba(255,150,60,0)");
    ctx.fillStyle = fg;
    ctx.fillRect(0, 120, CW, 150);
  }

  // 激光笔扫射（间歇）
  if (Math.sin(t * 1.6 + 2) > 0.55) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const ly = 212 + Math.sin(t * 3) * 14;
    ctx.strokeStyle = "rgba(255,70,50,0.75)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(hero + 28, 216); ctx.lineTo(CW - 20, ly); ctx.stroke();
    ctx.strokeStyle = "rgba(255,220,200,0.9)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(hero + 28, 216); ctx.lineTo(CW - 20, ly); ctx.stroke();
    ctx.restore();
  }

  // 飞溅粒子
  for (let i = 0; i < 24; i++) {
    const px = (sr(i) * CW + t * 40) % CW;
    const py = 180 + sr(i * 3) * 80 - ((t * 24 + i * 5) % 40);
    ctx.fillStyle = i % 3 === 0 ? "rgba(255,170,80,0.5)" : "rgba(190,186,170,0.22)";
    ctx.fillRect(px, py, 2, 2);
  }
  vignette(ctx, 0.5);
  filmGrain(ctx, t);
};

/** 第二战役：边三轮摩托突围 */
const paintMotoEscape: Painter = (ctx, t) => {
  // 暮色天空
  const sky = ctx.createLinearGradient(0, 0, 0, 150);
  sky.addColorStop(0, "#131627");
  sky.addColorStop(0.55, "#38283c");
  sky.addColorStop(1, "#8a4a39");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CW, 150);
  for (let i = 0; i < 50; i++) {
    ctx.fillStyle = `rgba(226,222,200,${0.1 + sr(i) * 0.3})`;
    ctx.fillRect(sr(i * 2.7) * CW, sr(i * 5.3) * 100, 2, 2);
  }
  // 远景建筑（视差滚动）
  for (let i = 0; i < 10; i++) {
    const bx = (((i * 72 - t * 42) % (CW + 150)) + CW + 150) % (CW + 150) - 75;
    const h = 42 + ((i % 4) * 16);
    ctx.fillStyle = "#0f1220";
    ctx.fillRect(bx, 150 - h, 62, h);
    for (let c = 0; c < 3; c++) {
      ctx.fillStyle = (i + c) % 3 === 0 ? "#c99a52" : "#0b0e18";
      ctx.fillRect(bx + 10 + c * 18, 150 - h + 12, 10, 9);
    }
  }
  // 行道树（更快视差）
  for (let i = 0; i < 6; i++) {
    const tx = (((i * 110 - t * 150) % (CW + 160)) + CW + 160) % (CW + 160) - 80;
    ctx.fillStyle = "#0c0f18";
    ctx.fillRect(tx, 112, 6, 48);
    ctx.fillRect(tx - 14, 92, 34, 22);
  }
  // 路面
  const road = ctx.createLinearGradient(0, 150, 0, CH);
  road.addColorStop(0, "#2b2d35");
  road.addColorStop(1, "#1b1d23");
  ctx.fillStyle = road;
  ctx.fillRect(0, 150, CW, CH - 150);
  ctx.fillStyle = "#454a52";
  ctx.fillRect(0, 150, CW, 5);
  // 中线飞驰
  for (let i = 0; i < 12; i++) {
    const lx = (((i * 72 - t * 420) % (CW + 80)) + CW + 80) % (CW + 80) - 40;
    ctx.fillStyle = "rgba(230,218,160,0.55)";
    ctx.fillRect(lx, 214, 38, 4);
  }

  // 追兵（后方）
  for (let i = 0; i < 4; i++) {
    const ex = CW + 40 - ((t * 36 + i * 70) % (CW + 160));
    if (ex > CW + 20) continue;
    drawSpr(ctx, Math.floor(t * 8 + i) % 2 === 0 ? "soldA" : "soldB", ex, 236 + (i % 2) * 10, { flip: true, scale: 1.9, alpha: 0.9 });
  }

  // 我方边三轮（主角，侧视）
  const mx = 150 + Math.sin(t * 2.2) * 8;
  const my = 242 + Math.sin(t * 18) * 1.6;
  drawSpr(ctx, Math.floor(t * 20) % 2 === 0 ? "motoA" : "motoB", mx, my, { anchor: "bc", scale: 2.3 });
  // 车上三人
  drawSpr(ctx, "elecA", mx + 6, my - 26, { scale: 1.9 });
  drawSpr(ctx, "medA", mx - 26, my - 20, { scale: 1.6 });
  drawSpr(ctx, "assA", mx + 32, my - 24, { scale: 1.6 });

  // 尾气与火星
  ctx.save();
  for (let i = 0; i < 20; i++) {
    const px = mx - 40 - ((t * 200 + i * 23) % 160);
    const py = my - 10 + Math.sin(t * 9 + i) * 5;
    ctx.fillStyle = i % 4 === 0 ? "rgba(255,160,70,0.4)" : "rgba(110,116,124,0.3)";
    ctx.fillRect(px, py, 3, 3);
  }
  ctx.restore();

  // 速度线
  ctx.save();
  ctx.globalAlpha = 0.25;
  for (let i = 0; i < 14; i++) {
    const sy = 160 + sr(i) * 100;
    const sx = ((i * 60 - t * 520) % (CW + 120) + CW + 120) % (CW + 120) - 60;
    ctx.fillStyle = "#dfe6f2";
    ctx.fillRect(sx, sy, 26, 1);
  }
  ctx.restore();
  vignette(ctx, 0.45);
  filmGrain(ctx, t);
};

/** 第二战役：厕所隔间发报 */
const paintStallMorse: Painter = (ctx, t) => {
  ctx.fillStyle = "#070a09";
  ctx.fillRect(0, 0, CW, CH);
  // 瓷砖墙
  for (let y = 0; y < 200; y += 24) {
    for (let x = (y / 24) % 2 === 0 ? 0 : -16; x < CW; x += 32) {
      ctx.fillStyle = `rgba(86,102,94,${0.1 + sr(x + y) * 0.06})`;
      ctx.fillRect(x + 1, y + 1, 30, 22);
    }
  }
  // 隔间门（前景右侧）与门闩
  ctx.fillStyle = "#1a2426";
  ctx.fillRect(286, 36, 170, 206);
  ctx.fillStyle = "#121a1c";
  ctx.fillRect(294, 44, 154, 190);
  ctx.fillStyle = "#8c94a3";
  ctx.fillRect(292, 128, 18, 7);
  // 门外砸门的影子（抖动）
  const bang = Math.sin(t * 6) > 0.7;
  if (bang) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(300, 60, 140, 170);
    drawPixelText(ctx, "开门！！", 370, 86, { size: 11, color: "#ff8f7a", scale: 2, center: true });
  }
  // 地面
  ctx.fillStyle = "#0e1311";
  ctx.fillRect(0, 206, CW, CH - 206);

  // 三人与电报机
  drawSpr(ctx, "telegraph", 150, 232, { anchor: "bc", scale: 2.4 });
  drawSpr(ctx, "elecA", 96, 244, { scale: 2.4 });
  drawSpr(ctx, "medA", 206, 240, { scale: 2.0, flip: true });
  drawSpr(ctx, "assA", 240, 238, { scale: 2.0, flip: true });

  // 电键火花 + 电波
  if (Math.floor(t * 6) % 2 === 0) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(255,230,150,0.9)";
    ctx.fillRect(146 + Math.random() * 5, 204, 3, 3);
    ctx.restore();
  }
  for (let r = 0; r < 3; r++) {
    const rad = ((t * 64 + r * 42) % 130);
    ctx.strokeStyle = `rgba(110,220,150,${0.32 * (1 - rad / 130)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(150, 206, rad, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();
  }
  // 摩斯电文逐个点亮
  const seq = "... --- ...";
  const lit = Math.floor(t * 2.4) % (seq.replace(/ /g, "").length + 3);
  let dx = 142;
  let idx = 0;
  for (const ch of seq) {
    if (ch === " ") { dx += 10; continue; }
    const w = ch === "-" ? 16 : 7;
    ctx.fillStyle = idx < lit ? "#8ef7a8" : "#2b4a38";
    ctx.fillRect(dx, 64, w, 8);
    dx += w + 5;
    idx++;
  }
  drawPixelText(ctx, "S O S", 184, 40, { size: 11, color: "#5de08a", scale: 2, center: true });

  // 手电微光
  const grd = ctx.createRadialGradient(150, 200, 20, 150, 200, 210);
  grd.addColorStop(0, "rgba(255,240,200,0.1)");
  grd.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, CW, CH);
  filmGrain(ctx, t);
};

/** 片尾：落幕卡 */
const paintOutro: Painter = (ctx, t) => {
  ctx.fillStyle = "#05070a";
  ctx.fillRect(0, 0, CW, CH);
  const spot = ctx.createRadialGradient(CW / 2, 150, 10, CW / 2, 150, 250);
  spot.addColorStop(0, "rgba(194,161,74,0.12)");
  spot.addColorStop(1, "rgba(194,161,74,0)");
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, CW, CH);
  // 旗帜缓缓飘动
  ctx.fillStyle = "#15181f";
  ctx.fillRect(238, 88, 4, 110);
  drawSpr(ctx, Math.floor(t * 4) % 2 === 0 ? "flagA" : "flagB", 242, 92, { anchor: "tl", scale: 1.9 });
  // 三人列队
  drawSpr(ctx, "medA", 196, 236, { scale: 2.1 });
  drawSpr(ctx, "elecA", 238, 240, { scale: 2.4 });
  drawSpr(ctx, "assA", 280, 236, { scale: 2.1 });
  if (t > 1.0) {
    ctx.globalAlpha = Math.min((t - 1.0) * 0.8, 1);
    drawPixelText(ctx, "门 · 守 住 了", CW / 2, 44, { size: 18, color: "#f0e0a8", scale: 3, center: true });
    ctx.globalAlpha = 1;
  }
  if (t > 3.0) {
    ctx.globalAlpha = Math.min((t - 3.0) * 0.8, 1);
    drawPixelText(ctx, "献给所有守住过那扇门的人", CW / 2, 92, { size: 10, color: "#c2a14a", scale: 2, center: true });
    ctx.globalAlpha = 1;
  }
  for (let i = 0; i < 30; i++) {
    const fy = (i * 41 + t * 14) % (CH + 30);
    ctx.fillStyle = `rgba(194,161,74,${0.1 + sr(i) * 0.2})`;
    ctx.fillRect((i * 83) % CW, CH - fy, 2, 2);
  }
  filmGrain(ctx, t);
};

/** 干员档案卡：三人逐一亮相（序章后） */
const paintDossier: Painter = (ctx, t) => {
  ctx.fillStyle = "#0a0d12";
  ctx.fillRect(0, 0, CW, CH);
  // 档案室背景：文件柜
  for (let i = 0; i < 5; i++) {
    const x = 12 + i * 94;
    ctx.fillStyle = "#141a24";
    ctx.fillRect(x, 40, 80, 190);
    ctx.fillStyle = "#1b2330";
    ctx.fillRect(x + 4, 44, 72, 182);
    for (let d = 0; d < 4; d++) {
      ctx.fillStyle = "#0f141d";
      ctx.fillRect(x + 10, 54 + d * 44, 60, 34);
      ctx.fillStyle = "#39414f";
      ctx.fillRect(x + 32, 68 + d * 44, 16, 4);
    }
  }
  ctx.fillStyle = "rgba(5,7,10,0.74)";
  ctx.fillRect(0, 0, CW, CH);

  const roster: { spr: "elecA" | "assA" | "medA"; name: string; role: string; color: string; note: string }[] = [
    { spr: "elecA", name: "牢 电 工", role: "工程 / 重装", color: "#c2a14a", note: "电动车电池 · 地板通电" },
    { spr: "assA", name: "樊 某 某", role: "突击 / 疾风", color: "#d4544a", note: "射速加成 · 哮喘隐患" },
    { spr: "medA", name: "李 听 远", role: "医疗 / 圣手", color: "#57d6e6", note: "急救包 · 夸张回血" },
  ];
  // 每 3.6 秒换一人
  const idx = Math.min(Math.floor(t / 3.6), 2);
  const local = t - idx * 3.6;
  const who = roster[idx];
  const slide = Math.min(local / 0.5, 1);
  const ease = slide * slide * (3 - 2 * slide);

  ctx.globalAlpha = ease;
  // 左侧立绘聚光
  const sp = ctx.createRadialGradient(118, 150, 10, 118, 150, 150);
  sp.addColorStop(0, "rgba(220,200,150,0.18)");
  sp.addColorStop(1, "rgba(220,200,150,0)");
  ctx.fillStyle = sp;
  ctx.fillRect(0, 0, CW, CH);
  const breathe = Math.sin(t * 2.4) * 1.4;
  drawSpr(ctx, who.spr, 110 - (1 - ease) * 24, 236 + breathe, { scale: 4.4 });

  // 右侧档案卡
  const cx = 212 + (1 - ease) * 26;
  ctx.fillStyle = "rgba(222,210,176,0.95)";
  ctx.fillRect(cx, 56, 236, 162);
  ctx.fillStyle = "#14171f";
  ctx.fillRect(cx, 56, 236, 4);
  ctx.fillRect(cx, 214, 236, 4);
  ctx.fillStyle = "#8d2a21";
  ctx.fillRect(cx + 12, 72, 60, 3);
  drawPixelText(ctx, "干 员 档 案", cx + 12, 80, { size: 10, color: "#7a7461", scale: 2 });
  drawPixelText(ctx, who.name, cx + 12, 104, { size: 18, color: who.color, scale: 2 });
  drawPixelText(ctx, who.role, cx + 12, 142, { size: 11, color: "#4a4636", scale: 2 });
  drawPixelText(ctx, who.note, cx + 12, 168, { size: 10, color: "#5c5747", scale: 2 });
  // 编号与印章
  drawPixelText(ctx, `NO.${idx + 1}/3`, cx + 180, 80, { size: 10, color: "#7a7461", scale: 2 });
  ctx.save();
  ctx.translate(cx + 190, 186);
  ctx.rotate(-0.16);
  ctx.strokeStyle = "#8d2a21";
  ctx.lineWidth = 3;
  ctx.strokeRect(-36, -13, 72, 26);
  drawPixelText(ctx, "在 编", 0, -8, { size: 11, color: "#8d2a21", scale: 2, center: true });
  ctx.restore();
  ctx.globalAlpha = 1;

  filmGrain(ctx, t);
};

/** 电报后勤：空投补给 */
const paintSupply: Painter = (ctx, t) => {
  // 走廊内景
  const g = ctx.createLinearGradient(0, 0, 0, CH);
  g.addColorStop(0, "#453f30");
  g.addColorStop(0.7, "#534b39");
  g.addColorStop(0.71, "#36504f");
  g.addColorStop(1, "#2a3e3f");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CW, 196);
  ctx.fillStyle = "#645c4c";
  ctx.fillRect(0, 190, CW, CH - 190);

  // 电报机特写（左）
  drawSpr(ctx, "telegraph", 86, 244, { anchor: "bc", scale: 3.2 });
  ctx.fillStyle = "#2a2318";
  ctx.fillRect(28, 244, 116, 8);
  // 电键火花
  if (Math.floor(t * 7) % 2 === 0) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(255,230,150,0.9)";
    ctx.fillRect(66 + Math.random() * 6, 198, 3, 3);
    ctx.restore();
  }
  // 电波
  for (let r = 0; r < 3; r++) {
    const rad = ((t * 58 + r * 40) % 120);
    ctx.strokeStyle = `rgba(194,161,74,${0.34 * (1 - rad / 120)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(86, 200, rad, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }
  drawPixelText(ctx, "· — ·  呼叫总部", 86, 54, { size: 10, color: "#c2a14a", scale: 2, center: true });

  // 空投箱（带降落伞）缓缓落下
  const drop = Math.min(t / 6.5, 1);
  const by = -40 + drop * 250;
  const sway = Math.sin(t * 1.8) * 10;
  drawSpr(ctx, "parachute", 318 + sway, by, { anchor: "bc", scale: 2.4 });
  drawSpr(ctx, "crate", 318 + sway, by + 46, { anchor: "bc", scale: 2.4 });
  // 落地粉尘
  if (drop > 0.94) {
    for (let i = 0; i < 16; i++) {
      const a = sr(i) * Math.PI * 2;
      const rr = (t % 1) * 40;
      ctx.fillStyle = `rgba(226,222,200,${0.3 - (t % 1) * 0.3})`;
      ctx.fillRect(318 + Math.cos(a) * rr, 240 + Math.sin(a) * rr * 0.3, 3, 2);
    }
  }
  // 接应的干员
  drawSpr(ctx, Math.floor(t * 5) % 2 === 0 ? "medA" : "medB", 240, 250, { scale: 2.6 });
  // 价签
  drawPixelText(ctx, "空投已就位", 318, 92, { size: 10, color: "#8fd6a0", scale: 2, center: true });
  vignette(ctx, 0.45);
  filmGrain(ctx, t);
};

/** 臭水弹：超级武器的豪赌 */
const paintStinkGamble: Painter = (ctx, t) => {
  ctx.fillStyle = "#0e1014";
  ctx.fillRect(0, 0, CW, CH);
  const sp = ctx.createRadialGradient(CW / 2, 140, 10, CW / 2, 140, 220);
  sp.addColorStop(0, "rgba(127,174,63,0.18)");
  sp.addColorStop(1, "rgba(127,174,63,0)");
  ctx.fillStyle = sp;
  ctx.fillRect(0, 0, CW, CH);
  ctx.fillStyle = "#171c16";
  ctx.fillRect(0, 206, CW, CH - 206);

  // 中央：高举的臭水弹特写
  const lift = Math.min(t / 1.6, 1);
  const by = 190 - lift * 60 + Math.sin(t * 2) * 3;
  drawSpr(ctx, "bomb", CW / 2, by, { anchor: "c", scale: 5.5 });
  // 引信火花
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 10; i++) {
    const a = sr(i + Math.floor(t * 8)) * Math.PI * 2;
    const rr = 8 + sr(i * 3) * 18;
    ctx.fillStyle = i % 2 === 0 ? "rgba(255,210,62,0.9)" : "rgba(255,148,38,0.75)";
    ctx.fillRect(CW / 2 + Math.cos(a) * rr, by - 30 + Math.sin(a) * rr * 0.6, 3, 3);
  }
  ctx.restore();
  // 毒液气泡
  for (let i = 0; i < 18; i++) {
    const px = CW / 2 + Math.sin(t * 1.4 + i) * 46;
    const py = 230 - ((t * 22 + i * 14) % 110);
    ctx.fillStyle = `rgba(127,174,63,${0.1 + sr(i) * 0.2})`;
    ctx.fillRect(px, py, 4, 4);
  }
  // 硬币式的 50/50 提示
  const flip = Math.floor(t * 2.2) % 2 === 0;
  ctx.fillStyle = "rgba(5,7,10,0.78)";
  ctx.fillRect(CW / 2 - 108, 44, 216, 42);
  ctx.strokeStyle = flip ? "#8fd6a0" : "#ff7a63";
  ctx.lineWidth = 2;
  ctx.strokeRect(CW / 2 - 108, 44, 216, 42);
  drawPixelText(ctx, flip ? "发 射 成 功 · 直接胜利" : "原 地 自 爆 · 直接失败", CW / 2, 56, {
    size: 11, color: flip ? "#8fd6a0" : "#ff7a63", scale: 2, center: true,
  });
  drawPixelText(ctx, "5 0 %        5 0 %", CW / 2, 100, { size: 11, color: "#c2a14a", scale: 2, center: true });

  // 持弹干员
  drawSpr(ctx, "assA", 92, 256, { scale: 3.2 });
  drawSpr(ctx, "elecA", 392, 258, { scale: 3.0, flip: true });
  vignette(ctx, 0.5);
  filmGrain(ctx, t);
};

/** 复仇：潜入拉闸 */
const paintBlackout: Painter = (ctx, t) => {
  const flipped = t > 4.6;      // 拉闸瞬间
  // 夜间走廊
  ctx.fillStyle = flipped ? "#05080a" : "#13181a";
  ctx.fillRect(0, 0, CW, CH);
  if (!flipped) {
    for (let y = 0; y < 196; y += 22) {
      for (let x = (y / 22) % 2 === 0 ? 0 : -15; x < CW; x += 30) {
        ctx.fillStyle = `rgba(104,122,112,${0.1 + sr(x + y) * 0.07})`;
        ctx.fillRect(x + 1, y + 1, 28, 20);
      }
    }
    // 顶灯
    for (let i = 0; i < 3; i++) {
      const lx = 90 + i * 150;
      ctx.fillStyle = "#d8d2b8";
      ctx.fillRect(lx - 22, 18, 44, 7);
      const gl = ctx.createRadialGradient(lx, 40, 6, lx, 40, 130);
      gl.addColorStop(0, "rgba(255,240,200,0.2)");
      gl.addColorStop(1, "rgba(255,240,200,0)");
      ctx.fillStyle = gl;
      ctx.fillRect(lx - 140, 0, 280, 240);
    }
  }
  ctx.fillStyle = flipped ? "#080b0a" : "#4e4738";
  ctx.fillRect(0, 196, CW, CH - 196);

  // 配电箱
  drawSpr(ctx, flipped ? "breakerOff" : "breakerOn", 372, 132, { anchor: "c", scale: 3.6 });
  // 潜行的干员
  const reach = Math.min(t / 4.4, 1);
  const hx = 120 + reach * 200;
  drawSpr(ctx, Math.floor(t * 4) % 2 === 0 ? "assA" : "assB", hx, 236, { scale: 2.8, alpha: flipped ? 1 : 0.9 });

  if (!flipped) {
    drawPixelText(ctx, "▼ 配电箱", 372, 72 + Math.sin(t * 4) * 3, { size: 11, color: "#c2a14a", scale: 2, center: true });
  } else {
    // 拉闸：电弧 + 黑暗
    const since = t - 4.6;
    if (since < 0.45) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = `rgba(190,226,255,${0.85 - since * 1.8})`;
      ctx.fillRect(0, 0, CW, CH);
      ctx.restore();
      for (let i = 0; i < 12; i++) {
        ctx.strokeStyle = "rgba(200,240,255,0.85)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        const ax = 372, ay = 132;
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax + (sr(i) - 0.5) * 120, ay + (sr(i * 3) - 0.5) * 120);
        ctx.stroke();
      }
    }
    // 应急灯红闪
    if (Math.floor(t * 4) % 2 === 0) {
      for (let i = 0; i < 3; i++) {
        const ex = 70 + i * 160;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const rg = ctx.createRadialGradient(ex, 48, 3, ex, 48, 80);
        rg.addColorStop(0, "rgba(220,60,40,0.4)");
        rg.addColorStop(1, "rgba(220,60,40,0)");
        ctx.fillStyle = rg;
        ctx.fillRect(ex - 80, 0, 160, 160);
        ctx.restore();
        ctx.fillStyle = "rgba(220,60,40,0.8)";
        ctx.fillRect(ex - 10, 44, 20, 8);
      }
    }
    // 远处骚动的治安队剪影
    for (let i = 0; i < 7; i++) {
      const ex = 40 + i * 64 + Math.sin(t * 5 + i) * 6;
      ctx.globalAlpha = 0.5;
      drawSpr(ctx, Math.floor(t * 9 + i) % 2 === 0 ? "soldA" : "soldB", ex, 248, { scale: 2.0 });
      ctx.globalAlpha = 1;
    }
    drawPixelText(ctx, "全 场 黑 暗", CW / 2, 70, { size: 15, color: "#9fd6ff", scale: 3, center: true });
  }
  filmGrain(ctx, t);
};

/** 复仇：B85 临空投弹 */
const paintBombRun: Painter = (ctx, t) => {
  // 高空夜景
  const sky = ctx.createLinearGradient(0, 0, 0, CH);
  sky.addColorStop(0, "#05080f");
  sky.addColorStop(0.6, "#0d1620");
  sky.addColorStop(1, "#16211c");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CW, CH);
  // 下方校区（俯视，向下滚动）
  const scroll = (t * 46) % 120;
  for (let r = 0; r < 4; r++) {
    for (let cI = 0; cI < 4; cI++) {
      const bx = 24 + cI * 116;
      const by = -60 + r * 120 + scroll;
      ctx.fillStyle = "#1c2128";
      ctx.fillRect(bx, by, 84, 56);
      ctx.fillStyle = "#262c35";
      ctx.fillRect(bx + 4, by + 4, 76, 48);
      for (let w = 0; w < 3; w++) {
        ctx.fillStyle = (r + cI + w) % 4 === 0 ? "#c99a52" : "#12161c";
        ctx.fillRect(bx + 12 + w * 24, by + 14, 14, 26);
      }
    }
  }
  // 道路
  ctx.fillStyle = "#101512";
  ctx.fillRect(0, 0, CW, CH);
  ctx.globalCompositeOperation = "destination-out";
  ctx.globalCompositeOperation = "source-over";

  // 重绘（上面那层只是暗化，简化处理）
  ctx.fillStyle = "rgba(10,14,16,0.55)";
  ctx.fillRect(0, 0, CW, CH);

  // 探照灯自下而上扫
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 2; i++) {
    const bx = 120 + i * 220 + Math.sin(t * 0.8 + i) * 50;
    const lg = ctx.createLinearGradient(bx, CH, bx, 0);
    lg.addColorStop(0, "rgba(220,230,255,0.16)");
    lg.addColorStop(1, "rgba(220,230,255,0)");
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(bx - 10, CH); ctx.lineTo(bx + 10, CH);
    ctx.lineTo(bx + 60, 0); ctx.lineTo(bx - 60, 0);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();

  // 轰炸机（俯视，机头朝上）
  const px = CW / 2 + Math.sin(t * 0.7) * 50;
  drawSpr(ctx, "bomber", px, 96, { anchor: "c", scale: 2.6 });

  // 投弹：每 2 秒一发
  for (let k = 0; k < 4; k++) {
    const bt = t - 1.2 - k * 1.9;
    if (bt < 0) continue;
    const prog = bt / 1.5;
    if (prog > 1.7) continue;
    const bxx = px - Math.sin((t - bt) * 0.7) * 20 + k * 6 - 9;
    if (prog <= 1) {
      drawSpr(ctx, "airbomb", bxx, 120 + prog * prog * 170, { anchor: "c", scale: 1.6 + prog * 1.6 });
    } else {
      // 爆开的绿云
      const e = (prog - 1) / 0.7;
      ctx.fillStyle = `rgba(127,174,63,${0.6 * (1 - e)})`;
      ctx.beginPath(); ctx.arc(bxx, 292, 10 + e * 70, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(196,227,104,${0.5 * (1 - e)})`;
      ctx.beginPath(); ctx.arc(bxx, 292, 6 + e * 42, 0, Math.PI * 2); ctx.fill();
    }
  }
  // 瞄准环
  ctx.strokeStyle = "rgba(200,230,140,0.5)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(px, 240, 24, (i * Math.PI) / 2 + 0.25, (i * Math.PI) / 2 + Math.PI / 2 - 0.25);
    ctx.stroke();
  }
  drawPixelText(ctx, "B85 · 投 弹 航 线", CW / 2, 38, { size: 11, color: "#c4e368", scale: 2, center: true });
  vignette(ctx, 0.5);
  filmGrain(ctx, t);
};

// ============================================================
// 震撼镜头组
// ============================================================

/** 冲击闪白：用于爆点 */
function impactFlash(ctx: CanvasRenderingContext2D, a: number, color = "255,240,210") {
  if (a <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = `rgba(${color},${Math.min(1, a)})`;
  ctx.fillRect(0, 0, CW, CH);
  ctx.restore();
}

/** 速度线（放射状），强化冲击感 */
function speedLines(ctx: CanvasRenderingContext2D, t: number, cx: number, cy: number, n = 26, a = 0.3) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = "#dfe6f2";
  ctx.lineWidth = 1;
  for (let i = 0; i < n; i++) {
    const ang = sr(i) * Math.PI * 2;
    const r0 = 90 + ((t * 260 + i * 40) % 220);
    const r1 = r0 + 60;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0);
    ctx.lineTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
    ctx.stroke();
  }
  ctx.restore();
}

/** 震撼①：化学拖把战车正面冲锋（由远及近，压迫放大） */
const paintChariotCharge: Painter = (ctx, t) => {
  const g = ctx.createLinearGradient(0, 0, 0, CH);
  g.addColorStop(0, "#3a3326");
  g.addColorStop(0.7, "#4a4234");
  g.addColorStop(0.71, "#32484a");
  g.addColorStop(1, "#263a3c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CW, 190);
  ctx.fillStyle = "#5c5445";
  ctx.fillRect(0, 186, CW, CH - 186);
  // 地砖透视快速后掠
  for (let i = 0; i < 9; i++) {
    const ly = 190 + Math.pow(i / 9, 2) * 90 + ((t * 70) % 14);
    ctx.fillStyle = "rgba(0,0,0,0.16)";
    ctx.fillRect(0, ly, CW, 2);
  }
  const zoom = 1.1 + Math.min(t / 6.5, 1) * 3.4;
  const shake = Math.sin(t * 26) * (1 + zoom * 0.5);
  const cx = CW / 2 + shake;
  const cy = 250;

  speedLines(ctx, t, cx, 170, 30, 0.22 + Math.min(t / 8, 0.18));

  // 轮子与桶身
  drawSpr(ctx, Math.floor(t * 14) % 2 === 0 ? "wheelA" : "wheelB", cx - 30 * zoom, cy, { anchor: "bc", scale: zoom });
  drawSpr(ctx, Math.floor(t * 14) % 2 === 0 ? "wheelA" : "wheelB", cx + 30 * zoom, cy, { anchor: "bc", scale: zoom });
  drawSpr(ctx, "bucket", cx, cy - 8 * zoom, { anchor: "bc", scale: zoom });
  // 双拖把长枪前指
  drawSpr(ctx, "mopLance", cx - 46 * zoom, cy - 54 * zoom, { anchor: "tl", scale: zoom * 0.9 });
  drawSpr(ctx, "mopLance", cx + 16 * zoom, cy - 48 * zoom, { anchor: "tl", scale: zoom * 0.8 });
  // 推车与挥击手
  drawSpr(ctx, Math.floor(t * 10) % 2 === 0 ? "soldA" : "soldB", cx + 54 * zoom * 0.6, cy - 4 * zoom, { scale: zoom * 0.85 });
  drawSpr(ctx, Math.floor(t * 9) % 2 === 0 ? "soldA" : "soldB", cx + 12 * zoom * 0.6, cy - 38 * zoom, { scale: zoom * 0.9 });

  // 恶臭绿雾翻涌
  ctx.save();
  for (let i = 0; i < 26; i++) {
    const a = sr(i) * Math.PI * 2;
    const rr = (20 + ((t * 40 + i * 12) % 110)) * zoom * 0.35;
    ctx.fillStyle = `rgba(127,174,63,${0.22 - (rr / (120 * zoom * 0.35)) * 0.2})`;
    ctx.fillRect(cx + Math.cos(a) * rr, cy - 60 * zoom * 0.4 + Math.sin(a) * rr * 0.5, 7, 5);
  }
  ctx.restore();

  // 地面震动裂纹
  if (t > 3.2) {
    ctx.strokeStyle = "rgba(10,12,16,0.55)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + (sr(i) - 0.5) * 300, cy + 20 + sr(i * 3) * 26);
      ctx.stroke();
    }
  }
  if (t > 5.6) impactFlash(ctx, (t - 5.6) * 1.1, "200,220,160");
  vignette(ctx, 0.5 + Math.min(t / 14, 0.2));
  filmGrain(ctx, t);
};

/** 震撼②：喷枪火墙吞没整排簸箕盾（子弹时间） */
const paintFlameWall: Painter = (ctx, t) => {
  ctx.fillStyle = "#17120e";
  ctx.fillRect(0, 0, CW, CH);
  const g = ctx.createLinearGradient(0, 0, 0, CH);
  g.addColorStop(0, "#2a2018");
  g.addColorStop(1, "#140f0b");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CW, CH);

  const slow = t * 0.42;                 // 子弹时间
  // 盾墙（从右侧压来，被逐块融化）
  const meltFrom = slow * 120;
  for (let i = 0; i < 7; i++) {
    const sx = 150 + i * 52;
    const melted = sx < 150 + meltFrom;
    ctx.globalAlpha = melted ? Math.max(0, 1 - (meltFrom - (sx - 150)) / 90) : 1;
    drawSpr(ctx, melted ? "shieldBroken" : "shield", sx, 220 + Math.sin(slow * 4 + i) * 2, { anchor: "c", scale: 3.2 });
    if (!melted) {
      drawSpr(ctx, Math.floor(slow * 5 + i) % 2 === 0 ? "soldA" : "soldB", sx + 18, 252, { flip: true, scale: 2.6 });
    }
    ctx.globalAlpha = 1;
    // 融化滴落
    if (melted) {
      for (let d = 0; d < 4; d++) {
        const dy = ((slow * 90 + d * 20 + i * 11) % 60);
        ctx.fillStyle = `rgba(190,170,140,${0.5 - dy / 120})`;
        ctx.fillRect(sx - 8 + d * 5, 232 + dy, 3, 6);
      }
    }
  }

  // 巨大火舌从左侧喷出
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 180; i++) {
    const p = i / 180;
    const fx = 70 + p * (90 + meltFrom * 1.2) + Math.sin(t * 9 + i) * 4;
    const spread = 6 + p * 46;
    const fy = 214 + Math.sin(t * 5 + i * 0.9) * spread;
    const sz = 2 + p * 9;
    const cols = ["#fff6c8", "#ffd23e", "#ff9426", "#ff5c1f", "#c22e12"];
    ctx.fillStyle = cols[i % 5];
    ctx.globalAlpha = (0.9 - p * 0.7) * (0.6 + Math.sin(t * 12 + i) * 0.4);
    ctx.fillRect(fx, fy, sz, sz);
  }
  ctx.restore();
  ctx.globalAlpha = 1;

  // 火光笼罩
  const fg = ctx.createRadialGradient(140, 215, 20, 140, 215, 320);
  fg.addColorStop(0, "rgba(255,160,60,0.34)");
  fg.addColorStop(1, "rgba(255,120,40,0)");
  ctx.fillStyle = fg;
  ctx.fillRect(0, 0, CW, CH);

  // 持枪者剪影（前景大）
  drawSpr(ctx, Math.floor(t * 7) % 2 === 0 ? "elecA" : "elecB", 48, 276, { scale: 4.2 });
  drawSpr(ctx, "gunGas", 86, 212, { anchor: "c", scale: 3.2 });

  drawPixelText(ctx, "簸 箕 盾 · 融 穿", CW / 2 + 40, 44, { size: 13, color: "#ffb347", scale: 2, center: true });
  vignette(ctx, 0.55);
  filmGrain(ctx, t);
};

/** 震撼③：治安队长登场，人海分列 */
const paintBossEntry: Painter = (ctx, t) => {
  ctx.fillStyle = "#0c1014";
  ctx.fillRect(0, 0, CW, CH);
  const g = ctx.createLinearGradient(0, 0, 0, 200);
  g.addColorStop(0, "#1a2026");
  g.addColorStop(1, "#38302a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CW, 200);
  ctx.fillStyle = "#231f1a";
  ctx.fillRect(0, 196, CW, CH - 196);

  // 背后红光
  const rg = ctx.createRadialGradient(CW / 2, 170, 10, CW / 2, 170, 240);
  rg.addColorStop(0, `rgba(168,51,42,${0.26 + Math.sin(t * 2) * 0.06})`);
  rg.addColorStop(1, "rgba(168,51,42,0)");
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, CW, CH);

  // 两侧让开的人海
  const part = Math.min(t / 3.2, 1);
  const ease = part * part * (3 - 2 * part);
  for (let side = 0; side < 2; side++) {
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 6; i++) {
        const dir = side === 0 ? -1 : 1;
        const base = CW / 2 + dir * (30 + i * 34);
        const x = base + dir * ease * 70;
        const y = 232 + row * 14;
        const sc = 2.0 + row * 0.35;
        if (x < -20 || x > CW + 20) continue;
        ctx.globalAlpha = 0.5 + row * 0.2;
        drawSpr(ctx, Math.floor(t * 5 + i + row) % 2 === 0 ? "soldA" : "soldB", x, y, { flip: dir < 0, scale: sc });
        ctx.globalAlpha = 1;
      }
    }
  }

  // 队长自远及近
  const walk = Math.min(t / 5.5, 1);
  const bz = 2.0 + walk * 2.6;
  const by = 200 + walk * 70;
  drawSpr(ctx, Math.floor(t * 4) % 2 === 0 ? "bossA" : "bossB", CW / 2, by, { scale: bz });
  // 对讲机红灯
  if (Math.floor(t * 5) % 2 === 0) {
    ctx.fillStyle = "#ff5140";
    ctx.fillRect(CW / 2 + 18 * bz * 0.35, by - 52 * bz * 0.35, 3, 3);
  }

  if (t > 2.4) {
    drawPixelText(ctx, "「全员压上。」", CW / 2, 56, {
      size: 13, color: "#ff8f7a", scale: 2, center: true, bg: "rgba(5,7,10,0.85)",
    });
  }
  if (t > 5.2) {
    ctx.globalAlpha = Math.min((t - 5.2) * 0.9, 1);
    drawPixelText(ctx, "治 安 队 长", CW / 2, 212, { size: 15, color: "#f0e0a8", scale: 2, center: true });
    ctx.globalAlpha = 1;
  }
  vignette(ctx, 0.58);
  filmGrain(ctx, t);
};

/** 震撼④：大门承受撞击（特写慢镜） */
const paintDoorBreach: Painter = (ctx, t) => {
  const hit = Math.sin(t * 2.6) > 0.82;
  const sx = hit ? (Math.random() - 0.5) * 8 : 0;
  const sy = hit ? (Math.random() - 0.5) * 6 : 0;
  ctx.save();
  ctx.translate(sx, sy);

  ctx.fillStyle = "#171a20";
  ctx.fillRect(-10, -10, CW + 20, CH + 20);
  // 门板大特写
  const dg = ctx.createLinearGradient(0, 0, 0, CH);
  dg.addColorStop(0, "#52688a");
  dg.addColorStop(1, "#374a66");
  ctx.fillStyle = dg;
  ctx.fillRect(40, 0, 400, CH);
  ctx.fillStyle = "#2c3a52";
  ctx.fillRect(236, 0, 10, CH);
  for (const px of [90, 270]) {
    ctx.fillStyle = "#44587a";
    ctx.fillRect(px, 40, 120, 90);
    ctx.fillRect(px, 160, 120, 90);
    ctx.fillStyle = "#2f405c";
    ctx.fillRect(px + 8, 48, 104, 74);
    ctx.fillRect(px + 8, 168, 104, 74);
  }
  // 班牌
  ctx.fillStyle = "#ece7d8";
  ctx.fillRect(170, 8, 140, 30);
  drawPixelText(ctx, "八五班", 240, 12, { size: 14, color: "#28407c", scale: 2, center: true });

  // 累积裂纹
  const dmg = Math.min(t / 7, 1);
  ctx.strokeStyle = "rgba(10,12,18,0.9)";
  ctx.lineWidth = 3;
  const cracks = Math.floor(dmg * 7);
  for (let i = 0; i < cracks; i++) {
    ctx.beginPath();
    const ox = 80 + sr(i) * 300;
    ctx.moveTo(ox, 0 + sr(i * 2) * 60);
    ctx.lineTo(ox + (sr(i * 3) - 0.5) * 70, 110 + sr(i * 5) * 60);
    ctx.lineTo(ox + (sr(i * 7) - 0.5) * 100, 230 + sr(i * 11) * 50);
    ctx.stroke();
  }

  // 撞击瞬间：木屑与冲击环
  if (hit) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const ix = 160 + sr(Math.floor(t * 3)) * 160;
    const ig = ctx.createRadialGradient(ix, 150, 4, ix, 150, 90);
    ig.addColorStop(0, "rgba(255,230,180,0.5)");
    ig.addColorStop(1, "rgba(255,200,140,0)");
    ctx.fillStyle = ig;
    ctx.fillRect(ix - 100, 50, 200, 200);
    ctx.restore();
    for (let i = 0; i < 24; i++) {
      const a = sr(i) * Math.PI * 2;
      const rr = 10 + sr(i * 3) * 60;
      ctx.fillStyle = i % 3 === 0 ? "#8fa3c8" : "#2c3a52";
      ctx.fillRect(ix + Math.cos(a) * rr, 150 + Math.sin(a) * rr, 4, 4);
    }
  }
  // 门缝里透出的敌影
  ctx.fillStyle = "rgba(6,8,12,0.9)";
  ctx.fillRect(0, 0, 40, CH);
  ctx.fillRect(440, 0, 40, CH);
  ctx.restore();

  drawPixelText(ctx, hit ? "咚————！！" : "门 · 还 在", CW / 2, 250, {
    size: 14, color: hit ? "#ff8f7a" : "#c2a14a", scale: 2, center: true, bg: "rgba(5,7,10,0.8)",
  });
  vignette(ctx, 0.5);
  filmGrain(ctx, t);
};

/** 震撼⑤：遮天蔽日的机群（仰视） */
const paintSkyArmada: Painter = (ctx, t) => {
  const sky = ctx.createLinearGradient(0, 0, 0, CH);
  sky.addColorStop(0, "#101a2e");
  sky.addColorStop(0.55, "#2a2f48");
  sky.addColorStop(1, "#6b4a3c");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CW, CH);
  // 云海
  ctx.save();
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 8; i++) {
    const cx2 = ((i * 86 - t * 24) % (CW + 180) + CW + 180) % (CW + 180) - 90;
    const cy2 = 150 + (i % 3) * 36;
    ctx.fillStyle = "#cfd8e4";
    ctx.fillRect(cx2, cy2, 180, 20);
    ctx.fillRect(cx2 + 30, cy2 - 12, 120, 16);
  }
  ctx.restore();

  // 四个梯队，近大远小，遮天蔽日
  for (let row = 0; row < 4; row++) {
    const n = 7 - row;
    const sc = 0.34 + row * 0.34;
    const y = 36 + row * 56;
    const spd = 20 + row * 26;
    for (let i = 0; i < n; i++) {
      const x = (((i * (CW / n) + row * 40 + t * spd) % (CW + 220)) + CW + 220) % (CW + 220) - 110;
      const prop = Math.floor(t * 20 + i + row) % 2 === 0 ? "bomberSideA" : "bomberSideB";
      // 机身阴影增加层次
      ctx.globalAlpha = 0.25;
      drawSpr(ctx, prop, x + 4, y + 5, { anchor: "c", scale: sc });
      ctx.globalAlpha = 1;
      drawSpr(ctx, prop, x, y + Math.sin(t * 1.6 + i) * 2, { anchor: "c", scale: sc });
    }
  }
  // 阴影掠过地面般的压暗
  ctx.fillStyle = `rgba(6,10,18,${0.12 + Math.sin(t * 1.4) * 0.06})`;
  ctx.fillRect(0, 0, CW, CH);

  if (t > 1.6) {
    drawPixelText(ctx, "遮 天 蔽 日", CW / 2, 232, {
      size: 16, color: "#f0e0a8", scale: 3, center: true, bg: "rgba(5,7,10,0.6)",
    });
  }
  vignette(ctx, 0.45);
  filmGrain(ctx, t);
};

/** 震撼⑥：臭水弹核爆级蘑菇云 */
const paintStinkNuke: Painter = (ctx, t) => {
  ctx.fillStyle = "#07100a";
  ctx.fillRect(0, 0, CW, CH);
  // 地平线上的校区剪影
  ctx.fillStyle = "#0d160f";
  ctx.fillRect(0, 196, CW, CH - 196);
  for (let i = 0; i < 7; i++) {
    const bx = 10 + i * 68;
    ctx.fillStyle = "#121d14";
    ctx.fillRect(bx, 150 - (i % 3) * 16, 54, 50 + (i % 3) * 16);
  }

  const k = Math.min(t / 5.2, 1);
  const ease = 1 - Math.pow(1 - k, 2.4);
  const cx = CW / 2;
  const base = 200;

  // 初爆闪光
  if (t < 0.9) impactFlash(ctx, (0.9 - t) * 1.1, "210,255,150");

  // 冲击波环
  const ring = ease * 320;
  ctx.strokeStyle = `rgba(196,227,104,${0.5 * (1 - ease)})`;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(cx, base + 10, ring, ring * 0.22, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 蘑菇柄
  const stemH = ease * 120;
  const stemW = 16 + ease * 26;
  ctx.fillStyle = "rgba(90,140,40,0.78)";
  ctx.fillRect(cx - stemW / 2, base - stemH, stemW, stemH);
  ctx.fillStyle = "rgba(140,190,70,0.5)";
  ctx.fillRect(cx - stemW / 4, base - stemH, stemW / 2, stemH);

  // 蘑菇云顶（多团翻滚）
  const capY = base - stemH - 10;
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2 + t * 0.6;
    const rr = (30 + ease * 62) * (0.55 + sr(i) * 0.6);
    const px = cx + Math.cos(a) * rr * 1.25;
    const py = capY + Math.sin(a) * rr * 0.5;
    const sz = 14 + sr(i * 3) * 24 * ease;
    ctx.fillStyle = i % 3 === 0 ? "rgba(150,200,80,0.62)" : "rgba(90,140,40,0.6)";
    ctx.beginPath();
    ctx.arc(px, py, sz, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(196,227,104,0.42)";
  ctx.beginPath();
  ctx.arc(cx, capY, 26 + ease * 40, 0, Math.PI * 2);
  ctx.fill();

  // 翻滚的毒雾向外扩散
  for (let i = 0; i < 60; i++) {
    const a = sr(i) * Math.PI * 2;
    const rr = ((t * 70 + i * 14) % 300) * (0.4 + sr(i * 2) * 0.6);
    ctx.fillStyle = `rgba(127,174,63,${0.3 - rr / 900})`;
    ctx.fillRect(cx + Math.cos(a) * rr, base + 14 + Math.sin(a) * rr * 0.2, 7, 5);
  }

  // 绿色天光
  const gl = ctx.createRadialGradient(cx, capY, 20, cx, capY, 300);
  gl.addColorStop(0, `rgba(170,220,90,${0.22 * (1 - ease * 0.4)})`);
  gl.addColorStop(1, "rgba(120,180,60,0)");
  ctx.fillStyle = gl;
  ctx.fillRect(0, 0, CW, CH);

  speedLines(ctx, t, cx, base, 18, 0.12);
  if (t > 3.2) {
    drawPixelText(ctx, "臭 水 空 爆 弹", cx, 40, {
      size: 15, color: "#c4e368", scale: 3, center: true, bg: "rgba(5,12,6,0.7)",
    });
  }
  vignette(ctx, 0.52);
  filmGrain(ctx, t);
};

/** 震撼：信号弹升空 —— 总攻的命令 */
const paintFlare: Painter = (ctx, t) => {
  // 夜空
  const sky = ctx.createLinearGradient(0, 0, 0, 212);
  sky.addColorStop(0, "#060a14");
  sky.addColorStop(0.55, "#171a30");
  sky.addColorStop(1, "#43292c");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CW, 212);
  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = `rgba(210,220,236,${0.08 + sr(i) * 0.3})`;
    ctx.fillRect(sr(i * 2.1) * CW, sr(i * 6.3) * 170, 2, 2);
  }
  ctx.fillStyle = "#0b100d";
  ctx.fillRect(0, 206, CW, CH - 206);

  // 待命的队列剪影（静止、压低）
  for (let row = 0; row < 3; row++) {
    const n = 26 - row * 5;
    const y = 220 + row * 14;
    const sc = 0.7 + row * 0.3;
    for (let i = 0; i < n; i++) {
      const x = 10 + i * (CW / n) + sr(row * 20 + i) * 6;
      SCENE.marchMan(ctx, x, y, sc, 0.2, i, row < 2 ? 0.95 : 0.6);
    }
  }

  // 信号弹：升空 → 炸开 → 缓降
  const launch = Math.min(t / 1.5, 1);
  const ease = 1 - Math.pow(1 - launch, 2.2);
  const fx = 332;
  const fy = 214 - ease * 150;
  const burst = t > 1.5;
  const bt = Math.max(0, t - 1.5);

  // 升空尾迹
  if (!burst) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 16; i++) {
      const p = i / 16;
      ctx.fillStyle = `rgba(255,${150 - p * 60},${80 - p * 60},${0.5 * (1 - p)})`;
      ctx.fillRect(fx - 1 + (Math.random() - 0.5) * 3, fy + p * 50, 3, 5);
    }
    ctx.restore();
  }

  // 弹体 / 爆开的强光
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const fade = burst ? Math.max(0, 1 - bt / 5.5) : 1;
  const radius = burst ? 150 + Math.sin(bt * 3) * 16 : 70;
  const fg = ctx.createRadialGradient(fx, fy, 2, fx, fy, radius);
  fg.addColorStop(0, `rgba(255,170,130,${0.9 * fade})`);
  fg.addColorStop(0.35, `rgba(255,100,70,${0.42 * fade})`);
  fg.addColorStop(1, "rgba(255,70,50,0)");
  ctx.fillStyle = fg;
  ctx.fillRect(fx - radius - 20, fy - radius - 20, radius * 2 + 40, radius * 2 + 40);
  ctx.fillStyle = `rgba(255,248,220,${fade})`;
  ctx.fillRect(fx - 2, fy - 2, 5, 5);
  ctx.restore();

  // 爆开瞬间的放射光芒
  if (burst && bt < 1.4) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(255,180,140,${0.55 * (1 - bt / 1.4)})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const r0 = 14 + bt * 90;
      const r1 = r0 + 40;
      ctx.beginPath();
      ctx.moveTo(fx + Math.cos(a) * r0, fy + Math.sin(a) * r0);
      ctx.lineTo(fx + Math.cos(a) * r1, fy + Math.sin(a) * r1);
      ctx.stroke();
    }
    ctx.restore();
    impactFlash(ctx, (1.4 - bt) * 0.22, "255,190,150");
  }

  // 飘落的火星
  if (burst) {
    for (let i = 0; i < 26; i++) {
      const p = ((bt * 26 + i * 9) % 120) / 120;
      const a = sr(i) * Math.PI * 2;
      ctx.fillStyle = `rgba(255,${130 + sr(i) * 80},90,${0.55 * (1 - p)})`;
      ctx.fillRect(fx + Math.cos(a) * p * 130, fy + Math.sin(a) * p * 60 + p * p * 90, 2, 3);
    }
  }

  // 红光笼罩整个战场
  ctx.fillStyle = `rgba(190,60,44,${0.06 + (burst ? 0.14 * Math.max(0, 1 - bt / 5) : 0.04 * ease)})`;
  ctx.fillRect(0, 0, CW, CH);

  // 前景：举枪发射的士兵
  drawSpr(ctx, "assA", 86, 268, { scale: 3.4 });
  ctx.strokeStyle = "#15181f";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(96, 214);
  ctx.lineTo(126, 190);
  ctx.stroke();

  if (t > 2.2) {
    drawPixelText(ctx, "信 号 弹 升 空 · 总 攻 开 始", CW / 2, 44, {
      size: 14, color: "#ffb79a", scale: 2, center: true, bg: "rgba(5,7,10,0.78)",
    });
  }
  vignette(ctx, 0.5);
  filmGrain(ctx, t);
};

/** 震撼⑦：万人冲锋广角（极密集人海） */
const paintHordeWide: Painter = (ctx, t) => {
  const sky = ctx.createLinearGradient(0, 0, 0, 170);
  sky.addColorStop(0, "#080c18");
  sky.addColorStop(0.55, "#1f1b34");
  sky.addColorStop(1, "#5a3330");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CW, 172);
  ctx.fillStyle = "#0d110e";
  ctx.fillRect(0, 168, CW, CH - 168);

  // 远山火光
  ctx.fillStyle = "#121524";
  for (let x = -20; x < CW + 20; x += 64) {
    const h = 20 + sr(x) * 26;
    ctx.beginPath();
    ctx.moveTo(x, 172); ctx.lineTo(x + 32, 172 - h); ctx.lineTo(x + 64, 172);
    ctx.closePath(); ctx.fill();
  }
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const fg = ctx.createLinearGradient(0, 100, 0, 180);
  fg.addColorStop(0, "rgba(255,140,60,0)");
  fg.addColorStop(1, "rgba(255,150,70,0.22)");
  ctx.fillStyle = fg;
  ctx.fillRect(0, 100, CW, 80);
  ctx.restore();

  // 九排人海：越近越大，总数数百
  for (let row = 0; row < 9; row++) {
    const n = 60 - row * 5;
    const y = 174 + row * 11;
    const sc = 0.3 + row * 0.17;
    const spd = 6 + row * 6;
    for (let i = 0; i < n; i++) {
      const x = (((i * (CW / n) + sr(row * 30 + i) * 14 + t * spd) % (CW + 50)) + CW + 50) % (CW + 50) - 25;
      const step = Math.floor(t * 8 + i + row) % 2 === 0;
      const dark = row < 4 ? 0.9 : row < 7 ? 0.5 : 0.1;
      SCENE.marchMan(ctx, x, y, sc, t, i, dark);
      // 旗帜点缀
      if (sr(row * 9 + i * 5) > 0.95) {
        ctx.fillStyle = row > 5 ? "#8d2a21" : "#2a1418";
        ctx.fillRect(x, y - 20 * sc, 1.6 * sc, 11 * sc);
        ctx.fillRect(x + 1.6 * sc, y - 20 * sc, (step ? 8 : 7) * sc, 5 * sc);
      }
    }
  }
  // 载具穿插
  for (let i = 0; i < 9; i++) {
    const x = (((i * 62 + t * 40) % (CW + 140)) + CW + 140) % (CW + 140) - 70;
    SCENE.marchVehicle(ctx, x, 252 + (i % 3) * 6, 1.3 + (i % 3) * 0.2, i, true);
  }

  // 扬尘
  for (let i = 0; i < 70; i++) {
    const px = (sr(i) * CW + t * (14 + sr(i * 2) * 40)) % CW;
    const py = 170 + sr(i * 4) * 90 - ((t * 12 + i * 3) % 36);
    ctx.fillStyle = i % 6 === 0
      ? `rgba(255,170,80,${0.22 + sr(i) * 0.3})`
      : `rgba(170,170,160,${0.05 + sr(i) * 0.1})`;
    ctx.fillRect(px, py, 2, 2);
  }
  if (t > 1.4) {
    drawPixelText(ctx, "百 万 雄 兵", CW / 2, 44, {
      size: 17, color: "#f0e0a8", scale: 3, center: true, bg: "rgba(5,7,10,0.62)",
    });
  }
  vignette(ctx, 0.5);
  filmGrain(ctx, t);
};

/** 震撼⑧：樊某某怒吼大特写 */
const paintFanRoar: Painter = (ctx, t) => {
  ctx.fillStyle = "#0a0a0e";
  ctx.fillRect(0, 0, CW, CH);
  const rg = ctx.createRadialGradient(CW / 2, 140, 20, CW / 2, 140, 250);
  rg.addColorStop(0, `rgba(168,51,42,${0.3 + Math.sin(t * 6) * 0.08})`);
  rg.addColorStop(1, "rgba(168,51,42,0)");
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, CW, CH);

  // 超大特写（抖动）
  const sh = Math.sin(t * 34) * 2.4;
  const zoom = 10 + Math.min(t / 4, 1) * 3.4;
  drawSpr(ctx, Math.floor(t * 12) % 2 === 0 ? "assA" : "assB", CW / 2 + sh, CH + 150, { scale: zoom });

  // 放射速度线
  speedLines(ctx, t, CW / 2, 130, 34, 0.3);

  // 怒吼冲击环
  for (let r = 0; r < 3; r++) {
    const rad = ((t * 150 + r * 70) % 210);
    ctx.strokeStyle = `rgba(255,140,110,${0.34 * (1 - rad / 210)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(CW / 2, 120, rad, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (t > 1.0) {
    drawPixelText(ctx, "「一 个 都 别 留 ！」", CW / 2, 40, {
      size: 16, color: "#ff8f7a", scale: 3, center: true, bg: "rgba(5,7,10,0.85)",
    });
  }
  // 血色闪烁
  if (Math.floor(t * 5) % 2 === 0) {
    ctx.fillStyle = "rgba(168,51,42,0.08)";
    ctx.fillRect(0, 0, CW, CH);
  }
  vignette(ctx, 0.62);
  filmGrain(ctx, t);
};

/** 震撼⑨：俯视全景 —— 整个校区被绿雾吞没 */
const paintEngulfed: Painter = (ctx, t) => {
  ctx.fillStyle = "#0a1410";
  ctx.fillRect(0, 0, CW, CH);
  // 俯视校区
  const blds: [number, number, number, number][] = [
    [40, 30, 180, 40], [40, 90, 80, 46], [150, 90, 70, 46],
    [250, 30, 180, 40], [250, 90, 180, 46],
    [60, 160, 150, 44], [250, 160, 170, 44],
  ];
  for (const [x, y, w, h] of blds) {
    ctx.fillStyle = "#0b100c";
    ctx.fillRect(x + 4, y + 4, w, h);
    ctx.fillStyle = "#222a26";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#2d3730";
    ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
  }
  // 跑道
  ctx.strokeStyle = "#4a3a28";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.ellipse(240, 232, 120, 32, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 绿雾由中心向外吞没
  const k = Math.min(t / 7, 1);
  const R = k * 420;
  for (let i = 0; i < 90; i++) {
    const a = sr(i) * Math.PI * 2;
    const rr = R * (0.3 + sr(i * 3) * 0.75);
    const px = 240 + Math.cos(a) * rr;
    const py = 150 + Math.sin(a) * rr * 0.62;
    const sz = 16 + sr(i * 5) * 30;
    ctx.fillStyle = `rgba(110,160,52,${0.3 - (rr / 460) * 0.22})`;
    ctx.beginPath();
    ctx.arc(px, py, sz, 0, Math.PI * 2);
    ctx.fill();
  }
  // 核心浓雾
  const cg = ctx.createRadialGradient(240, 150, 10, 240, 150, Math.max(20, R * 0.8));
  cg.addColorStop(0, `rgba(170,220,90,${0.5 * k})`);
  cg.addColorStop(0.55, `rgba(110,170,50,${0.4 * k})`);
  cg.addColorStop(1, "rgba(90,140,40,0)");
  ctx.fillStyle = cg;
  ctx.fillRect(0, 0, CW, CH);

  // 残存的爆点闪烁
  for (let i = 0; i < 5; i++) {
    if (Math.floor(t * 3 + i) % 4 !== 0) continue;
    const px = 90 + i * 70;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const eg = ctx.createRadialGradient(px, 140, 2, px, 140, 50);
    eg.addColorStop(0, "rgba(220,255,160,0.5)");
    eg.addColorStop(1, "rgba(180,230,120,0)");
    ctx.fillStyle = eg;
    ctx.fillRect(px - 60, 80, 120, 120);
    ctx.restore();
  }
  if (t > 2.4) {
    drawPixelText(ctx, "全 区 覆 盖", 240, 40, {
      size: 15, color: "#c4e368", scale: 3, center: true, bg: "rgba(5,12,6,0.72)",
    });
  }
  vignette(ctx, 0.5);
  filmGrain(ctx, t);
};

/** 震撼⑩：战旗特写（尾声前的一记重音） */
const paintFlagMacro: Painter = (ctx, t) => {
  const sky = ctx.createLinearGradient(0, 0, 0, CH);
  sky.addColorStop(0, "#131a2a");
  sky.addColorStop(0.6, "#3a2a2e");
  sky.addColorStop(1, "#7a4a32");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CW, CH);
  // 逆光的太阳
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const sg = ctx.createRadialGradient(330, 190, 10, 330, 190, 220);
  sg.addColorStop(0, "rgba(255,216,140,0.5)");
  sg.addColorStop(1, "rgba(255,180,90,0)");
  ctx.fillStyle = sg;
  ctx.fillRect(0, 0, CW, CH);
  ctx.restore();

  // 巨大的旗（慢速飘动）
  ctx.fillStyle = "#15181f";
  ctx.fillRect(84, 20, 9, CH - 20);
  const frame = Math.floor(t * 3.2) % 2 === 0 ? "flagA" : "flagB";
  drawSpr(ctx, frame, 93, 34, { anchor: "tl", scale: 9 });

  // 旗下仰望的队列剪影
  for (let i = 0; i < 16; i++) {
    const x = 20 + i * 30 + Math.sin(t + i) * 1.5;
    ctx.globalAlpha = 0.85;
    SCENE.marchMan(ctx, x, CH - 6, 1.5, t * 0.3, i, 0.95);
    ctx.globalAlpha = 1;
  }
  // 余烬上扬
  for (let i = 0; i < 40; i++) {
    const fy = (i * 29 + t * 22) % (CH + 40);
    ctx.fillStyle = `rgba(255,190,110,${0.14 + sr(i) * 0.3})`;
    ctx.fillRect((i * 71) % CW, CH - fy, 2, 2);
  }
  vignette(ctx, 0.46);
  filmGrain(ctx, t);
};

// ============================================================
// 影片时间轴（快节奏剪辑）
// ============================================================
const FILM: Shot[] = [
  { dur: 7, caption: "", bgm: "prep", paint: paintTitle },

  // ---------- 序章：快速铺陈 ----------
  {
    dur: 8, chapter: "序章 · 2026年10月中旬", bgm: "prep",
    caption: "深秋的周三傍晚，距离放学还有四分钟",
    paint: (c, t, a) => { SCENE.school(c, t, a.school); filmGrain(c, t); },
  },
  {
    dur: 8, caption: "实验隐翅虫「小赤」撞破纱窗，闯入七班领空",
    paint: (c, t, a) => { SCENE.beetle(c, t, a.school); filmGrain(c, t); },
  },
  {
    dur: 8, caption: "一人坠凳。谈判破裂——「放学前，踏平八五班」",
    paint: (c, t) => { SCENE.standoff(c, t); filmGrain(c, t); },
  },
  {
    dur: 9, caption: "三名干员，三种打法。这是全部的家底",
    paint: paintDossier,
  },
  {
    dur: 7, caption: "守住大门，直到铃响",
    paint: (c, t) => { SCENE.squad(c, t + 2.2); filmGrain(c, t); },
  },

  // ---------- 第一战役：高密度战斗剪辑 ----------
  {
    dur: 10, chapter: "第一战役 · 门线保卫战", bgm: "battle",
    caption: "拖把人海压上来了",
    paint: paintGateBattle,
  },
  {
    dur: 8, caption: "GAS喷枪长按——一整排簸箕盾在火里融成铁水",
    paint: paintFlameWall,          // 震撼：火墙融盾
  },
  {
    dur: 8, caption: "化学拖把战车碾过走廊，两把几个月没洗的拖把当枪使",
    paint: paintChariotCharge,      // 震撼：战车冲锋
  },
  {
    dur: 8, caption: "敌方对讲机秒调增援，我方只有一台老式电报机",
    paint: paintSupply,
  },
  {
    dur: 8, caption: "人海分开。治安队长亲自督战",
    paint: paintBossEntry,          // 震撼：BOSS 登场
  },
  {
    dur: 8, caption: "咚。咚。咚。门在响，但没有倒",
    paint: paintDoorBreach,         // 震撼：撞门特写
  },
  {
    dur: 8, caption: "三百班费的超级武器：一半概率全胜，一半概率自爆",
    paint: paintStinkGamble,
  },
  {
    dur: 10, bgm: "flag",
    caption: "放学铃响。废墟之上，昆虫组的战旗升了起来",
    paint: (c, t, a) => { SCENE.victory(c, t + 3.6, a.ruins, () => undefined); filmGrain(c, t); },
  },

  // ---------- 第二战役：追逐节奏 ----------
  {
    dur: 8, chapter: "第二战役 · 放学后撤离", bgm: "prep",
    caption: "车棚里那辆边三轮，是回家的唯一指望",
    paint: (c, t) => { SCENE.m2Ambush(c, t); filmGrain(c, t); },
  },
  {
    dur: 10, bgm: "battle",
    caption: "夺车，突围。甩开追兵，一路冲向公共厕所",
    paint: paintMotoEscape,
  },
  {
    dur: 9, bgm: "prep",
    caption: "门闩落下。黑暗里只剩电键的滴答：· · · — — — · · ·",
    paint: paintStallMorse,
  },
  {
    dur: 10, bgm: "epic",
    caption: "十分钟后，总队的车灯撕开了暮色",
    paint: (c, t) => { SCENE.finale(c, t + 7.4, () => undefined); filmGrain(c, t); },
  },

  // ---------- 终章：全程高能 ----------
  {
    dur: 8, chapter: "终章 · 复仇", bgm: "prep",
    caption: "组长樊某某砸碎了第三个杯子",
    paint: (c, t) => { SCENE.revRage(c, t); filmGrain(c, t); },
  },
  {
    dur: 7, bgm: "epic",
    caption: "「集结。海陆空，一个都别留。」",
    paint: paintFanRoar,            // 震撼：怒吼特写
  },
  {
    dur: 8, caption: "海陆空三军，一夜成形",
    paint: (c, t) => { SCENE.revMuster(c, t); filmGrain(c, t); },
  },
  {
    dur: 8, caption: "机群压境，连月亮都被挡住了",
    paint: paintSkyArmada,          // 震撼：遮天蔽日机群
  },
  {
    dur: 8, bgm: "prep",
    caption: "但大军之前，先有一支侦察支队单刀赴会",
    paint: (c, t) => { SCENE.revRecon(c, t * 0.9); filmGrain(c, t); },
  },
  {
    dur: 9, caption: "闸刀落下。整栋楼陷入黑暗，治安队倾巢而出",
    paint: paintBlackout,
  },
  {
    dur: 8, bgm: "epic",
    caption: "B85 临空。李鑫隆特调的臭水空爆弹，装满了弹舱",
    paint: paintBombRun,
  },
  {
    dur: 9, caption: "起爆。绿色的云柱顶穿了夜空",
    paint: paintStinkNuke,          // 震撼：核爆级蘑菇云
  },
  {
    dur: 8, caption: "整个校区，被一层绿雾彻底吞没",
    paint: paintEngulfed,           // 震撼：俯视全区覆盖
  },
  {
    dur: 9, caption: "信号弹升空。那是总攻的命令",
    paint: paintFlare,              // 震撼：信号弹
  },
  {
    dur: 10, caption: "百万雄兵跨过围墙，踏平治安队阵地",
    paint: paintHordeWide,          // 震撼：万人冲锋广角
  },
  {
    dur: 8, caption: "拖把折断，簸箕碾碎，对讲机里只剩忙音",
    paint: (c, t) => { SCENE.avenge(c, 10.4 + t * 0.55, () => undefined); filmGrain(c, t); },
  },

  // ---------- 尾声 ----------
  {
    dur: 9, chapter: "尾声", bgm: "flag",
    caption: "2026年10月下旬 · 七班治安队，番号撤销",
    paint: paintFlagMacro,          // 震撼：战旗特写
  },
  {
    dur: 10,
    caption: "献给所有守住过那扇门的人",
    paint: paintOutro,
  },
];

const TOTAL = FILM.reduce((s, x) => s + x.dur, 0);

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ============================================================
export default function CinemaMode({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const assets = useRef<Assets>({ school: null, ruins: null });
  const timeRef = useRef(0);
  const rafRef = useRef(0);
  const playRef = useRef(true);
  const bgmRef = useRef<BgmMode | "none">("none");

  const [playing, setPlaying] = useState(true);
  const [time, setTime] = useState(0);
  const [shotIdx, setShotIdx] = useState(0);
  const [uiVisible, setUiVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { playRef.current = playing; }, [playing]);

  // 资源
  useEffect(() => {
    assets.current.school = buildSchoolExterior();
    assets.current.ruins = buildRuins();
    sfx.ensure();
    return () => { sfx.stopBgm(); };
  }, []);

  /** 由全局时间定位当前镜头 */
  const locate = useCallback((gt: number) => {
    let acc = 0;
    for (let i = 0; i < FILM.length; i++) {
      if (gt < acc + FILM[i].dur) return { i, local: gt - acc, start: acc };
      acc += FILM[i].dur;
    }
    return { i: FILM.length - 1, local: FILM[FILM.length - 1].dur, start: acc - FILM[FILM.length - 1].dur };
  }, []);

  // 主循环
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    let last = performance.now();

    const loop = (ts: number) => {
      const dt = Math.min((ts - last) / 1000, 0.05);
      last = ts;
      if (playRef.current) {
        timeRef.current = Math.min(timeRef.current + dt, TOTAL);
      }
      const gt = timeRef.current;
      const { i, local, start } = locate(gt);
      const shot = FILM[i];

      // 配乐切换
      if (shot.bgm && bgmRef.current !== shot.bgm) {
        bgmRef.current = shot.bgm;
        sfx.startBgm(shot.bgm);
      }

      ctx.clearRect(0, 0, CW, CH);
      shot.paint(ctx, local, assets.current);

      // 镜头首尾淡入淡出
      const fade = 0.6;
      if (local < fade) {
        ctx.fillStyle = `rgba(0,0,0,${1 - local / fade})`;
        ctx.fillRect(0, 0, CW, CH);
      } else if (shot.dur - local < fade) {
        ctx.fillStyle = `rgba(0,0,0,${1 - (shot.dur - local) / fade})`;
        ctx.fillRect(0, 0, CW, CH);
      }

      // 章节卡
      if (shot.chapter && local < 3.4) {
        const a = local < 0.5 ? local / 0.5 : local > 2.9 ? (3.4 - local) / 0.5 : 1;
        ctx.globalAlpha = Math.max(0, Math.min(1, a));
        ctx.fillStyle = "rgba(5,7,10,0.78)";
        ctx.fillRect(0, 96, CW, 56);
        ctx.fillStyle = "#8d2a21";
        ctx.fillRect(0, 96, CW, 3);
        ctx.fillRect(0, 149, CW, 3);
        drawPixelText(ctx, shot.chapter, CW / 2, 112, { size: 14, color: "#f0e0a8", scale: 2, center: true });
        ctx.globalAlpha = 1;
      }

      // 片头/片尾黑边
      SCENE.bars(ctx);

      // 结束
      if (gt >= TOTAL && playRef.current) {
        playRef.current = false;
        setPlaying(false);
      }

      setTime(gt);
      setShotIdx(i);
      void start;
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [locate]);

  // 控制条自动隐藏
  const poke = useCallback(() => {
    setUiVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setUiVisible(false), 2600);
  }, []);
  useEffect(() => {
    poke();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [poke]);

  const seek = useCallback((gt: number) => {
    timeRef.current = Math.max(0, Math.min(gt, TOTAL));
    bgmRef.current = "none";            // 强制按新位置重设配乐
    setTime(timeRef.current);
    poke();
  }, [poke]);

  const jumpShot = useCallback((dir: -1 | 1) => {
    let acc = 0;
    const marks: number[] = [];
    for (const s of FILM) { marks.push(acc); acc += s.dur; }
    const cur = timeRef.current;
    if (dir === 1) {
      const next = marks.find((m) => m > cur + 0.35);
      seek(next ?? TOTAL);
    } else {
      const prev = [...marks].reverse().find((m) => m < cur - 1.2);
      seek(prev ?? 0);
    }
  }, [seek]);

  // 键盘控制
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onExit(); return; }
      if (e.key === " ") { e.preventDefault(); setPlaying((p) => !p); poke(); return; }
      if (e.key === "ArrowRight") { seek(timeRef.current + 5); return; }
      if (e.key === "ArrowLeft") { seek(timeRef.current - 5); return; }
      if (e.key === "." ) { jumpShot(1); return; }
      if (e.key === ",") { jumpShot(-1); return; }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onExit, seek, jumpShot, poke]);

  const shot = FILM[shotIdx];
  const ended = time >= TOTAL;

  return (
    <div
      className="fixed inset-0 z-[88] flex flex-col items-center justify-center bg-black"
      onMouseMove={poke}
      onMouseDown={poke}
    >
      {/* 画面 */}
      <div className="relative w-full max-w-[1100px]" style={{ aspectRatio: "16/9" }}>
        <canvas
          ref={canvasRef}
          width={CW}
          height={CH}
          className="h-full w-full [image-rendering:pixelated]"
          onClick={() => { setPlaying((p) => !p); poke(); }}
        />

        {/* 字幕 */}
        {shot.caption && !ended && (
          <div className="pointer-events-none absolute inset-x-0 bottom-[13%] flex justify-center px-20">
            <span
              className="text-center text-[13px] leading-6 tracking-[0.08em] text-[#f2ece0] md:text-base"
              style={{ textShadow: "2px 2px 0 #000, 0 0 10px rgba(0,0,0,0.9)" }}
            >
              {shot.caption}
            </span>
          </div>
        )}

        {/* 暂停标记 */}
        {!playing && !ended && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="px-box-dark px-6 py-3 text-2xl tracking-[0.4em] text-[#c2a14a]">▍▍ 暂 停</div>
          </div>
        )}

        {/* 片尾操作 */}
        {ended && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70">
            <div className="text-3xl tracking-[0.4em] text-[#f0e0a8]" style={{ textShadow: "3px 3px 0 #000" }}>
              全 片 终
            </div>
            <div className="flex gap-3">
              <button
                className="px-btn px-btn-amber px-6 py-2.5 text-base tracking-[0.3em]"
                onClick={() => { seek(0); setPlaying(true); }}
              >
                ↻ 重新放映
              </button>
              <button className="px-btn px-btn-dark px-6 py-2.5 text-base tracking-[0.3em]" onClick={onExit}>
                返回菜单
              </button>
            </div>
          </div>
        )}

        {/* 右上角标识 */}
        <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#a8332a]" />
          <span className="font-num text-[11px] tracking-[0.3em] text-[#8a8370]">REC · 战史影片</span>
        </div>
      </div>

      {/* 控制条 */}
      <div
        className={`w-full max-w-[1100px] px-2 transition-opacity duration-300 ${uiVisible || !playing || ended ? "opacity-100" : "opacity-0"}`}
      >
        {/* 进度条（带镜头分段） */}
        <div
          className="relative mt-3 h-3 w-full cursor-pointer border-2 border-black bg-[#12161d]"
          onClick={(e) => {
            const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            seek(((e.clientX - r.left) / r.width) * TOTAL);
          }}
        >
          <div className="h-full bg-[#c2a14a]" style={{ width: `${(time / TOTAL) * 100}%` }} />
          {FILM.reduce<{ acc: number; nodes: React.ReactNode[] }>((st, s, i) => {
            st.acc += s.dur;
            if (i < FILM.length - 1) {
              st.nodes.push(
                <span
                  key={i}
                  className="absolute top-0 h-full w-[2px] bg-[#05070a]"
                  style={{ left: `${(st.acc / TOTAL) * 100}%` }}
                />
              );
            }
            return st;
          }, { acc: 0, nodes: [] }).nodes}
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 pb-3">
          <div className="flex items-center gap-2">
            <button className="px-btn px-btn-dark px-3 py-1.5 text-sm" onClick={() => jumpShot(-1)}>◀◀</button>
            <button
              className="px-btn px-btn-amber px-5 py-1.5 text-sm tracking-[0.2em]"
              onClick={() => { setPlaying((p) => !p); poke(); }}
            >
              {playing ? "暂停" : "播放"}
            </button>
            <button className="px-btn px-btn-dark px-3 py-1.5 text-sm" onClick={() => jumpShot(1)}>▶▶</button>
            <span className="font-num ml-2 text-sm text-[#8a8370]">
              {fmt(time)} / {fmt(TOTAL)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-[10px] tracking-[0.2em] text-[#5b6377] md:inline">
              空格 播放/暂停 · ←→ 快进退 · , . 切镜头 · Esc 退出
            </span>
            <button className="px-btn px-btn-dark px-4 py-1.5 text-sm tracking-[0.25em]" onClick={onExit}>
              退出
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
