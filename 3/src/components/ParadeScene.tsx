import { useEffect, useRef } from "react";

/**
 * 鸣谢背景：昆虫组武装大队 · 三军阅兵
 * 海（水兵方阵 + 舰艇）· 陆（步兵方阵 + 装甲纵队）· 空（机群编队）
 * 逻辑分辨率 480x270，与战场同为像素风但密度更高、层次更多。
 */

const CW = 480;
const CH = 270;

type Ctx = CanvasRenderingContext2D;
const mk = (c: Ctx) => (x: number, y: number, w: number, h: number, col: string) => {
  c.fillStyle = col;
  c.fillRect(x, y, w, h);
};

/** 稳定伪随机 */
function sr(i: number) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const PAL = {
  skyTop: "#0f1830",
  skyMid: "#3b2f4e",
  skyLow: "#8a4a3c",
  skyHot: "#d9814a",
  sea: "#243a52",
  seaLit: "#35566f",
  ground: "#2a2a26",
  groundLit: "#3d3a2f",
  stand: "#4a3a2c",
  standLit: "#6b5340",
  olive: "#49543a",
  oliveD: "#2f3626",
  oliveL: "#626e4a",
  navy: "#2b3a52",
  steel: "#8c94a3",
  steelD: "#4d5564",
  gold: "#c2a14a",
  red: "#8d2a21",
  redL: "#b53a2e",
  white: "#e8e4d4",
};

// ============================================================
// 天空 / 观礼台 / 地面
// ============================================================
function drawSky(c: Ctx, t: number) {
  const P = mk(c);
  const g = c.createLinearGradient(0, 0, 0, 150);
  g.addColorStop(0, PAL.skyTop);
  g.addColorStop(0.45, PAL.skyMid);
  g.addColorStop(0.78, PAL.skyLow);
  g.addColorStop(1, PAL.skyHot);
  c.fillStyle = g;
  c.fillRect(0, 0, CW, 150);

  // 星
  for (let i = 0; i < 60; i++) {
    const a = 0.1 + sr(i) * 0.35;
    c.fillStyle = `rgba(226,232,246,${a})`;
    c.fillRect(sr(i * 3.1) * CW, sr(i * 7.7) * 70, 1, 1);
  }
  // 云带
  for (let i = 0; i < 5; i++) {
    const cy = 40 + i * 16;
    const cx = ((i * 140 + t * (5 + i * 2)) % (CW + 220)) - 110;
    c.fillStyle = `rgba(60,48,70,${0.3 - i * 0.04})`;
    c.fillRect(cx, cy, 150, 7);
    c.fillRect(cx + 26, cy - 5, 96, 6);
  }
  // 夕阳
  c.fillStyle = "#ffd9a0";
  c.beginPath(); c.arc(386, 128, 22, 0, Math.PI * 2); c.fill();
  c.save();
  c.globalCompositeOperation = "lighter";
  const sg = c.createRadialGradient(386, 128, 6, 386, 128, 110);
  sg.addColorStop(0, "rgba(255,200,130,0.32)");
  sg.addColorStop(1, "rgba(255,170,90,0)");
  c.fillStyle = sg;
  c.fillRect(276, 18, 220, 220);
  c.restore();

  // 探照灯柱（缓慢扫动）
  c.save();
  c.globalCompositeOperation = "lighter";
  for (let i = 0; i < 4; i++) {
    const bx = 60 + i * 110 + Math.sin(t * 0.35 + i * 1.3) * 42;
    const lg = c.createLinearGradient(bx, 150, bx, 0);
    lg.addColorStop(0, "rgba(210,226,255,0.16)");
    lg.addColorStop(1, "rgba(210,226,255,0)");
    c.fillStyle = lg;
    c.beginPath();
    c.moveTo(bx - 7, 150); c.lineTo(bx + 7, 150);
    c.lineTo(bx + 44, 0); c.lineTo(bx - 44, 0);
    c.closePath(); c.fill();
  }
  c.restore();
  void P;
}

/** 远景：海面与舰队（海军） */
function drawSea(c: Ctx, t: number) {
  const P = mk(c);
  // 海平线
  P(0, 150, CW, 34, PAL.sea);
  // 波光
  for (let i = 0; i < 46; i++) {
    const wx = (sr(i) * CW + Math.sin(t * 0.6 + i) * 6) % CW;
    const wy = 152 + sr(i * 2.3) * 30;
    c.fillStyle = `rgba(150,196,226,${0.08 + sr(i * 5) * 0.14})`;
    c.fillRect(wx, wy, 3 + sr(i * 7) * 5, 1);
  }
  // 夕阳在海面的倒影
  c.save();
  c.globalCompositeOperation = "lighter";
  for (let i = 0; i < 12; i++) {
    const ry = 152 + i * 2.6;
    const rw = 26 - i * 1.4 + Math.sin(t * 3 + i) * 3;
    c.fillStyle = `rgba(255,190,120,${0.16 - i * 0.012})`;
    c.fillRect(386 - rw / 2, ry, rw, 1);
  }
  c.restore();

  // 舰队剪影（缓慢横移）
  for (let i = 0; i < 4; i++) {
    const sx = ((i * 132 + t * 6) % (CW + 180)) - 90;
    const sy = 158 + (i % 2) * 7;
    const sc = 0.8 + (i % 2) * 0.35;
    drawShip(c, sx, sy, sc, t, i);
  }
}

function drawShip(c: Ctx, x: number, y: number, s: number, t: number, i: number) {
  const P = mk(c);
  const W2 = 54 * s, H2 = 7 * s;
  // 舰体
  P(x, y, W2, H2, "#1b2430");
  P(x + 2, y, W2 - 4, 2 * s, "#2c3a4c");
  // 舰桥
  P(x + W2 * 0.4, y - 8 * s, 12 * s, 8 * s, "#22303e");
  P(x + W2 * 0.44, y - 13 * s, 4 * s, 6 * s, "#2c3a4c");
  // 桅杆
  P(x + W2 * 0.46, y - 20 * s, 1.4 * s, 8 * s, "#39414f");
  // 主炮
  P(x + W2 * 0.16, y - 5 * s, 9 * s, 5 * s, "#22303e");
  P(x + W2 * 0.2, y - 7 * s, 10 * s, 1.6 * s, "#39414f");
  // 航行灯
  if (Math.floor(t * 2 + i) % 2 === 0) {
    P(x + W2 * 0.46, y - 21 * s, 1.5 * s, 1.5 * s, "#ff6a5a");
  }
  // 舰艏白浪
  c.fillStyle = "rgba(190,220,236,0.4)";
  c.fillRect(x - 4 * s, y + H2 - 1, 8 * s, 1.4 * s);
  c.fillRect(x + W2 - 3 * s, y + H2 - 1, 10 * s, 1.4 * s);
}

/** 空军：多梯队机群 */
function drawAirForce(c: Ctx, t: number) {
  // 护航战机梯队：高空在前，低空在后
  const squads = [
    { n: 7, y: 24, sc: 0.45, spd: 26, gap: 28 },
    { n: 5, y: 50, sc: 0.62, spd: 34, gap: 34 },
  ];
  squads.forEach((sq, si) => {
    const headX = ((t * sq.spd + si * 160) % (CW + 320)) - 160;
    for (let i = 0; i < sq.n; i++) {
      // V 字编队
      const side = i % 2 === 0 ? 1 : -1;
      const rank = Math.ceil(i / 2);
      const x = headX - rank * sq.gap;
      const y = sq.y + rank * 7 * side + Math.sin(t * 1.4 + i) * 1.5;
      if (x < -70 || x > CW + 70) continue;
      drawPlane(c, x, y, sq.sc, t, i + si * 10);
    }
  });

  // ---- 压轴：B85 重型轰炸机梯队（低空、巨大、缓慢）----
  const bSpd = 20;
  const bHead = ((t * bSpd) % (CW + 460)) - 230;
  for (let i = 0; i < 3; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const rank = Math.ceil(i / 2);
    const x = bHead - rank * 104;
    const y = 92 + rank * 15 * side + Math.sin(t * 0.9 + i) * 1.6;
    if (x < -140 || x > CW + 140) continue;
    drawB85(c, x, y, 1.15 - rank * 0.08, t, i);
  }
}

/** B85 重型轰炸机（侧视，四发螺旋桨，机腹弹舱） */
function drawB85(c: Ctx, x: number, y: number, s: number, t: number, id: number) {
  const P = mk(c);
  const OL = PAL.olive, OLD = PAL.oliveD, OLL = PAL.oliveL;

  // 机身阴影
  P(x - 46 * s, y + 1 * s, 92 * s, 2 * s, "rgba(10,12,18,0.35)");

  // ---- 机身（细长） ----
  P(x - 46 * s, y - 4 * s, 92 * s, 8 * s, OLD);
  P(x - 44 * s, y - 3.4 * s, 88 * s, 4 * s, OL);
  P(x - 40 * s, y - 3.4 * s, 54 * s, 1.6 * s, OLL);     // 机背高光

  // ---- 机鼻（圆锥 + 领航玻璃） ----
  P(x + 46 * s, y - 2.6 * s, 6 * s, 5 * s, OL);
  P(x + 51 * s, y - 1.6 * s, 3 * s, 3 * s, OLL);
  P(x + 42 * s, y - 2.2 * s, 8 * s, 4 * s, "#9fc4d6");  // 领航舱
  P(x + 44 * s, y - 1.6 * s, 4 * s, 1.6 * s, "#d6ecf5");

  // ---- 驾驶舱 ----
  P(x + 26 * s, y - 8 * s, 13 * s, 4.4 * s, OLD);
  P(x + 27 * s, y - 7.2 * s, 11 * s, 3 * s, "#8fb6cb");
  P(x + 29 * s, y - 6.6 * s, 5 * s, 1.4 * s, "#d6ecf5");

  // ---- 主翼（厚实后掠） ----
  P(x - 24 * s, y - 1 * s, 52 * s, 5 * s, OLD);
  P(x - 20 * s, y - 0.4 * s, 44 * s, 2.4 * s, OL);
  P(x - 14 * s, y - 1 * s, 30 * s, 1 * s, OLL);
  // 翼根整流
  P(x - 6 * s, y - 3 * s, 20 * s, 7 * s, OL);

  // ---- 四台发动机 + 旋转桨盘 ----
  const nacelles = [-18, -4, 10, 24];
  nacelles.forEach((nx, k) => {
    const ex = x + nx * s;
    P(ex - 5 * s, y - 2.6 * s, 12 * s, 6 * s, OLD);
    P(ex - 4 * s, y - 2 * s, 10 * s, 3.2 * s, "#394130");
    P(ex - 4 * s, y + 1.4 * s, 10 * s, 1.2 * s, "#1b1f18");
    // 桨毂
    P(ex + 7 * s, y - 1.4 * s, 2.4 * s, 3.4 * s, "#1b1f18");
    // 桨盘虚影（逐帧闪烁模拟高速旋转）
    const spin = (Math.floor(t * 22 + k + id) % 2) === 0;
    c.fillStyle = `rgba(205,215,195,${spin ? 0.3 : 0.16})`;
    c.fillRect(ex + 8 * s, y - 9 * s, 2 * s, 18 * s);
    c.fillStyle = `rgba(235,242,225,${spin ? 0.5 : 0.24})`;
    c.fillRect(ex + 8 * s, y - (spin ? 5 : 7) * s, 2 * s, (spin ? 10 : 14) * s);
  });

  // ---- 尾翼 ----
  P(x - 52 * s, y - 14 * s, 4 * s, 11 * s, OLD);        // 垂尾
  P(x - 51 * s, y - 13 * s, 2.4 * s, 9 * s, OL);
  P(x - 51 * s, y - 12 * s, 1.6 * s, 4 * s, OLL);
  P(x - 56 * s, y - 2 * s, 16 * s, 3.4 * s, OLD);       // 平尾
  P(x - 55 * s, y - 1.4 * s, 14 * s, 1.8 * s, OL);

  // ---- 机腹弹舱（打开，露出空爆弹） ----
  P(x - 10 * s, y + 3.6 * s, 22 * s, 2.6 * s, "#171b14");
  P(x - 8 * s, y + 4 * s, 18 * s, 1.4 * s, "#0f1310");
  for (let b = 0; b < 3; b++) {
    P(x - 6 * s + b * 7 * s, y + 4 * s, 4 * s, 2 * s, "#6f9e36");
    P(x - 5.4 * s + b * 7 * s, y + 4.4 * s, 2.6 * s, 1 * s, "#8fc44a");
  }

  // ---- 涂装：识别带 + 编号 + 星徽 ----
  P(x - 30 * s, y - 4 * s, 3 * s, 8 * s, PAL.red);
  P(x - 25 * s, y - 4 * s, 1.6 * s, 8 * s, PAL.gold);
  P(x + 6 * s, y - 2.6 * s, 5 * s, 5 * s, PAL.gold);     // 星徽
  P(x + 7.4 * s, y - 4 * s, 2.2 * s, 8 * s, PAL.gold);
  // 机首编号 B85
  P(x + 34 * s, y - 1.6 * s, 1.4 * s, 3 * s, PAL.white);
  P(x + 36.4 * s, y - 1.6 * s, 1.4 * s, 3 * s, PAL.white);
  P(x + 38.8 * s, y - 1.6 * s, 1.4 * s, 3 * s, PAL.white);

  // ---- 翼尖航行灯 ----
  if (Math.floor(t * 2.4 + id) % 2 === 0) {
    P(x - 25 * s, y - 1.6 * s, 2 * s, 2 * s, "#ff6a5a");
    P(x + 27 * s, y - 1.6 * s, 2 * s, 2 * s, "#8fd6a0");
  }

  // ---- 四条发动机尾迹 ----
  c.save();
  c.globalCompositeOperation = "lighter";
  nacelles.forEach((nx, k) => {
    const ex = x + nx * s;
    for (let i = 1; i < 12; i++) {
      c.fillStyle = `rgba(226,230,236,${0.1 - i * 0.008})`;
      c.fillRect(ex - 6 * s - i * 9 * s, y + Math.sin(t * 2 + i * 0.3 + k) * 0.8, 9 * s, 1.6 * s);
    }
  });
  c.restore();
}

function drawPlane(c: Ctx, x: number, y: number, s: number, t: number, id: number) {
  const P = mk(c);
  // 机身
  P(x - 16 * s, y - 1.6 * s, 32 * s, 3.4 * s, PAL.oliveD);
  P(x - 14 * s, y - 1.2 * s, 28 * s, 1.6 * s, PAL.olive);
  // 机头
  P(x + 15 * s, y - 1 * s, 4 * s, 2.2 * s, PAL.oliveL);
  // 座舱
  P(x + 6 * s, y - 3 * s, 5 * s, 2 * s, "#9fc4d6");
  // 主翼（后掠）
  for (let i = 0; i < 12; i++) {
    const wy = y + i * 0.3 * s;
    P(x - 2 * s - i * s, wy, 1.2 * s, 2.2 * s, i % 4 === 0 ? PAL.oliveD : PAL.olive);
    P(x + 1 * s + i * s, wy, 1.2 * s, 2.2 * s, i % 4 === 0 ? PAL.oliveD : PAL.olive);
  }
  // 尾翼
  P(x - 16 * s, y - 6 * s, 2 * s, 5 * s, PAL.oliveD);
  P(x - 17 * s, y + 1 * s, 7 * s, 1.6 * s, PAL.oliveD);
  // 螺旋桨虚影
  c.fillStyle = `rgba(210,220,200,${0.2 + (Math.floor(t * 20 + id) % 2) * 0.12})`;
  c.fillRect(x + 18 * s, y - 5 * s, 1.4 * s, 10 * s);
  // 编队彩烟
  c.save();
  c.globalCompositeOperation = "lighter";
  const colors = ["rgba(230,90,70,", "rgba(240,200,110,", "rgba(150,200,240,"];
  const col = colors[id % 3];
  for (let i = 1; i < 9; i++) {
    c.fillStyle = `${col}${0.16 - i * 0.017})`;
    c.fillRect(x - 18 * s - i * 7 * s, y + Math.sin(t * 2 + i * 0.4 + id) * 1.2, 7 * s, 1.8 * s);
  }
  c.restore();
}

/** 观礼台 + 大幅战旗 */
function drawStand(c: Ctx, t: number) {
  const P = mk(c);
  // 主席台
  P(176, 150, 128, 26, PAL.stand);
  P(176, 150, 128, 3, PAL.standLit);
  P(180, 155, 120, 18, "#3a2d22");
  // 台前徽章
  P(228, 158, 24, 12, PAL.red);
  P(230, 160, 20, 8, PAL.redL);
  c.fillStyle = PAL.gold;
  c.fillRect(238, 161, 4, 6);
  c.fillRect(236, 163, 8, 2);
  // 台上将官剪影
  for (let i = 0; i < 5; i++) {
    const gx = 190 + i * 25;
    const sway = Math.sin(t * 1.2 + i) * 0.5;
    P(gx, 136 + sway, 7, 15, "#1b2026");
    P(gx + 1, 130 + sway, 5, 6, "#1b2026");
    P(gx, 129 + sway, 7, 2, PAL.oliveD);    // 军帽
  }
  // 旗杆与大旗
  for (const fx of [150, 310]) {
    P(fx, 92, 2, 60, "#1b2026");
    const wave = Math.sin(t * 2.2 + fx) * 2;
    for (let r = 0; r < 14; r++) {
      const w = 22 - Math.abs(r - 7) * 0.4;
      const off = Math.sin(t * 2.4 + r * 0.5 + fx) * 2;
      c.fillStyle = r < 2 || r > 11 ? PAL.red : PAL.redL;
      c.fillRect(fx + 2 + off, 94 + r * 1.6 + wave * 0.2, w, 1.8);
    }
    // 旗上徽记
    c.fillStyle = PAL.gold;
    c.fillRect(fx + 9 + Math.sin(t * 2.4 + 3 + fx) * 2, 101 + wave * 0.2, 4, 4);
  }
}

/** 陆军：步兵方阵 + 装甲纵队 */
function drawArmy(c: Ctx, t: number) {
  const P = mk(c);
  // 阅兵场地面
  const g = c.createLinearGradient(0, 176, 0, CH);
  g.addColorStop(0, PAL.groundLit);
  g.addColorStop(1, PAL.ground);
  c.fillStyle = g;
  c.fillRect(0, 176, CW, CH - 176);
  // 地面分道线
  for (let i = 0; i < 4; i++) {
    const y = 192 + i * 20;
    c.fillStyle = "rgba(226,214,160,0.08)";
    c.fillRect(0, y, CW, 1);
  }

  // ---- 步兵方阵（4 排，由远及近）----
  for (let row = 0; row < 4; row++) {
    const n = 16 - row * 2;
    const y = 190 + row * 20;
    const sc = 0.55 + row * 0.22;
    const spd = 7 + row * 4;
    for (let i = 0; i < n; i++) {
      const x = (((i * (CW / n) + t * spd) % (CW + 40)) + CW + 40) % (CW + 40) - 20;
      drawSoldier(c, x, y, sc, t, i + row * 7, row);
    }
  }

  // ---- 装甲纵队（最前景）----
  for (let i = 0; i < 4; i++) {
    const x = (((i * 150 + t * 18) % (CW + 230)) + CW + 230) % (CW + 230) - 115;
    drawVehicle(c, x, 258, 1, t, i);
  }
  void P;
}

function drawSoldier(c: Ctx, x: number, y: number, s: number, t: number, id: number, row: number) {
  const P = mk(c);
  const step = Math.floor(t * 7 + id * 0.5) % 2 === 0;
  const dark = row < 2 ? 0.55 : 1;
  const body = row < 2 ? "#1e2a1c" : PAL.olive;
  const bodyD = row < 2 ? "#172116" : PAL.oliveD;
  const skin = row < 2 ? "#4a4038" : "#d9a884";
  c.globalAlpha = 0.65 + dark * 0.35;
  // 军帽
  P(x - 2 * s, y - 13 * s, 5 * s, 2 * s, bodyD);
  // 头
  P(x - 1.6 * s, y - 11 * s, 4 * s, 3 * s, skin);
  // 身体
  P(x - 2.6 * s, y - 8 * s, 6 * s, 6 * s, body);
  P(x - 2.6 * s, y - 8 * s, 6 * s, 1.2 * s, PAL.oliveL);
  // 腰带
  P(x - 2.6 * s, y - 3.4 * s, 6 * s, 1 * s, bodyD);
  // 腿（正步）
  P(x - 2 * s, y - 2 * s, 1.8 * s, 3 * s, bodyD);
  P(x + 0.6 * s, y - 2 * s, 1.8 * s, 3 * s, bodyD);
  P(x + (step ? -3.2 : 1.8) * s, y + 0.6 * s, 2.4 * s, 1.2 * s, "#15181f");
  // 扛枪
  c.strokeStyle = bodyD;
  c.lineWidth = Math.max(1, 1.1 * s);
  c.beginPath();
  c.moveTo(x + 3.4 * s, y - 14 * s);
  c.lineTo(x - 0.5 * s, y - 4 * s);
  c.stroke();
  c.globalAlpha = 1;
}

function drawVehicle(c: Ctx, x: number, y: number, s: number, t: number, id: number) {
  const P = mk(c);
  const kind = id % 3;
  const disc = (cx: number, cy: number, r: number, col: string) => {
    c.fillStyle = col;
    for (let yy = -r; yy <= r; yy++) {
      const w = Math.floor(Math.sqrt(Math.max(0, r * r - yy * yy)));
      c.fillRect(cx - w, cy + yy, w * 2 + 1, 1);
    }
  };
  if (kind === 0) {
    // 主战坦克
    P(x - 34 * s, y - 14 * s, 68 * s, 9 * s, PAL.oliveD);
    P(x - 32 * s, y - 13 * s, 64 * s, 4 * s, PAL.olive);
    P(x - 14 * s, y - 23 * s, 30 * s, 9 * s, PAL.oliveD);   // 炮塔
    P(x - 12 * s, y - 22 * s, 26 * s, 4 * s, PAL.olive);
    P(x + 14 * s, y - 20 * s, 28 * s, 2.6 * s, PAL.steelD); // 炮管
    P(x + 40 * s, y - 20.5 * s, 4 * s, 3.6 * s, PAL.steel);
    // 履带
    P(x - 36 * s, y - 6 * s, 72 * s, 6 * s, "#15181f");
    for (let i = 0; i < 10; i++) {
      P(x - 34 * s + i * 7 * s - ((t * 36 * s) % (7 * s)), y - 6 * s, 3 * s, 6 * s, "#262b33");
    }
    for (let i = 0; i < 5; i++) disc(x - 27 * s + i * 13 * s, y - 3 * s, 4 * s, "#39414f");
  } else if (kind === 1) {
    // 导弹发射车
    P(x - 36 * s, y - 12 * s, 72 * s, 8 * s, PAL.oliveD);
    P(x - 34 * s, y - 11 * s, 30 * s, 4 * s, PAL.olive);
    P(x - 30 * s, y - 20 * s, 18 * s, 9 * s, PAL.olive);    // 驾驶室
    P(x - 27 * s, y - 18 * s, 11 * s, 4 * s, "#9fc4d6");
    // 倾斜发射箱
    c.save();
    c.translate(x + 8 * s, y - 14 * s);
    c.rotate(-0.26);
    P(-22 * s, -7 * s, 46 * s, 10 * s, "#3d4a32");
    P(-20 * s, -6 * s, 42 * s, 3 * s, PAL.oliveL);
    P(20 * s, -5 * s, 5 * s, 6 * s, PAL.red);
    c.restore();
    P(x - 38 * s, y - 5 * s, 76 * s, 3 * s, "#15181f");
    for (let i = 0; i < 6; i++) disc(x - 30 * s + i * 13 * s, y - 2 * s, 4.5 * s, "#2b3038");
  } else {
    // 装甲运兵车（载旗）
    P(x - 30 * s, y - 15 * s, 60 * s, 11 * s, PAL.oliveD);
    P(x - 28 * s, y - 14 * s, 56 * s, 5 * s, PAL.olive);
    P(x + 14 * s, y - 21 * s, 14 * s, 7 * s, PAL.olive);
    P(x + 17 * s, y - 19.5 * s, 8 * s, 3.4 * s, "#9fc4d6");
    // 车顶旗
    P(x - 10 * s, y - 32 * s, 1.6 * s, 17 * s, "#15181f");
    const wv = Math.sin(t * 3 + id) * 1.5;
    for (let r = 0; r < 6; r++) {
      c.fillStyle = r < 1 || r > 4 ? PAL.red : PAL.redL;
      c.fillRect(x - 8.4 * s + wv, y - 31 * s + r * 1.6 * s, 13 * s, 1.6 * s);
    }
    // 车上士兵
    for (let i = 0; i < 3; i++) {
      P(x - 20 * s + i * 12 * s, y - 23 * s, 4 * s, 8 * s, "#1e2a1c");
      P(x - 19.6 * s + i * 12 * s, y - 26 * s, 3.4 * s, 3 * s, "#d9a884");
    }
    P(x - 32 * s, y - 5 * s, 64 * s, 3 * s, "#15181f");
    for (let i = 0; i < 5; i++) disc(x - 24 * s + i * 13 * s, y - 2 * s, 4.5 * s, "#2b3038");
  }
  // 车灯光晕
  c.save();
  c.globalCompositeOperation = "lighter";
  const hg = c.createRadialGradient(x + 36 * s, y - 10 * s, 1, x + 36 * s, y - 10 * s, 30 * s);
  hg.addColorStop(0, "rgba(255,230,160,0.3)");
  hg.addColorStop(1, "rgba(255,230,160,0)");
  c.fillStyle = hg;
  c.fillRect(x + 6 * s, y - 40 * s, 60 * s, 60 * s);
  c.restore();
}

/** 礼花与尘土 */
function drawFx(c: Ctx, t: number) {
  // 空中礼花
  for (let i = 0; i < 4; i++) {
    const cycle = 3.2;
    const localT = (t + i * 0.9) % cycle;
    if (localT > 1.5) continue;
    const k = localT / 1.5;
    const fx = 70 + i * 110;
    const fy = 48 + (i % 2) * 22;
    c.save();
    c.globalCompositeOperation = "lighter";
    const cols = ["255,120,90", "255,210,110", "160,220,255", "200,160,255"];
    for (let p = 0; p < 22; p++) {
      const a = (p / 22) * Math.PI * 2;
      const r = k * 34;
      c.fillStyle = `rgba(${cols[i % 4]},${0.7 * (1 - k)})`;
      c.fillRect(fx + Math.cos(a) * r, fy + Math.sin(a) * r * 0.75, 1.6, 1.6);
    }
    c.restore();
  }
  // 地面扬尘
  for (let i = 0; i < 34; i++) {
    const dx = (sr(i) * CW + t * (10 + sr(i * 2) * 26)) % CW;
    const dy = 196 + sr(i * 4) * 70 - ((t * 9 + i * 3) % 26);
    c.fillStyle = i % 5 === 0
      ? `rgba(255,190,110,${0.14 + sr(i) * 0.2})`
      : `rgba(180,172,150,${0.05 + sr(i) * 0.08})`;
    c.fillRect(dx, dy, 1.6, 1.6);
  }
}

export default function ParadeScene({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!;
    cv.width = CW;
    cv.height = CH;
    const c = cv.getContext("2d")!;
    c.imageSmoothingEnabled = false;
    let raf = 0;
    let t = 0;

    const loop = () => {
      t += 1 / 60;
      c.clearRect(0, 0, CW, CH);

      drawSky(c, t);        // 天
      drawSea(c, t);        // 海军
      drawAirForce(c, t);   // 空军
      drawStand(c, t);      // 观礼台
      drawArmy(c, t);       // 陆军
      drawFx(c, t);         // 礼花与扬尘

      // 暖调与暗角
      c.save();
      c.globalCompositeOperation = "soft-light";
      c.fillStyle = "rgba(255,170,100,0.14)";
      c.fillRect(0, 0, CW, CH);
      c.restore();
      const vg = c.createRadialGradient(CW / 2, CH / 2, CH * 0.32, CW / 2, CH / 2, CH * 1.0);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(8,8,14,0.55)");
      c.fillStyle = vg;
      c.fillRect(0, 0, CW, CH);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={ref}
      width={CW}
      height={CH}
      className={`[image-rendering:pixelated] ${className}`}
    />
  );
}
