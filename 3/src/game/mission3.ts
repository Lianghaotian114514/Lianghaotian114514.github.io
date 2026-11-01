// ============================================================
// 第三战役「复仇」
//   sneak    潜入校园 · 避开探照灯与巡逻，摸到配电箱
//   blackout 拉闸 → 黑暗湿滑的厕所走廊逃生
//   crowd    人挤人的教学楼走廊，挤出重围
//   steal    院中抢夺厕所所长的三轮战车
//   bomb     驾驶 B85 轰炸机投下臭水空爆弹
// ============================================================
import {
  drawSpr, drawPixelText,
  buildNightSchool, buildDarkCorridor, buildCrowdHall, buildAerialSchool,
  W, H,
} from "./sprites";
import type { SFX } from "./audio";
import type { OperatorId, Tone } from "./engine";

export type M3Phase = "sneak" | "blackout" | "crowd" | "steal" | "bomb" | "done";

export interface M3Hud {
  phase: M3Phase;
  title: string;
  objective: string;
  progress: number;
  hp: number; hpMax: number;
  alert: number;          // 警戒度 0..1（潜入）
  stamina: number;        // 体力（逃生/挤人）
  bombsLeft: number;
  targetsHit: number; targetsTotal: number;
  kills: number;
  timer: number;
}
export interface M3End { win: boolean; reason: string; kills: number; time: number; targets: number }

interface Opts {
  operator: OperatorId;
  sfx: SFX;
  onHud: (h: M3Hud) => void;
  onEvent: (m: string, t?: Tone) => void;
  onBanner: (t: string, s: string, tone?: Tone) => void;
  onEnd: (e: M3End) => void;
  onTogglePause: () => void;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const SPRITE_OF: Record<OperatorId, [string, string]> = {
  elec: ["elecA", "elecB"], ass: ["assA", "assB"], med: ["medA", "medB"],
};

interface Guard { x: number; y: number; dir: 1 | -1; t: number; range: [number, number]; see: number }
interface Runner { x: number; y: number; vx: number; vy: number; t: number; kind: "chaser" | "crowd" | "slip" | "puddle"; hp: number; push: number; flash: number; dead: boolean }
interface P3 { x: number; y: number; vx: number; vy: number; l: number; m: number; s: number; c: string; g: number; add: boolean }
interface Target { x: number; y: number; r: number; hit: boolean; name: string }
interface FallBomb { x: number; y: number; t: number; tx: number; ty: number }

export class Mission3 {
  private cv: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private o: Opts;
  private sfx: SFX;
  private bgNight: HTMLCanvasElement;
  private bgDark: HTMLCanvasElement;
  private bgHall: HTMLCanvasElement;
  private bgAir: HTMLCanvasElement;
  private raf = 0; private last = 0; private dead = false;

  phase: M3Phase = "sneak";
  paused = false;
  private over = false;
  private elapsed = 0; private phaseT = 0;
  private cineT = -1; private cineKind = "";

  // 玩家
  private px = 80; private py = 470;
  private hp = 150; private hpMax = 150;
  private face: 1 | -1 = 1;
  private anim = 0; private immune = 0;
  private sprA: string; private sprB: string;
  private stamina = 100;

  // 输入
  private keys = new Set<string>();
  private mx = W * 0.6; private my = H * 0.6;
  private mouse = false;
  private vmx = 0; private vmy = 0;
  private vax = 1; private vay = 0; private vaOn = false;
  private vfire = false; private prevFire = false;
  private actEdge = false;

  // 阶段数据
  private alert = 0;
  private guards: Guard[] = [];
  private breakerX = 860; private breakerY = 300;
  private scrollX = 0;
  private runners: Runner[] = [];
  private spawnT = 1;
  private corridorLen = 2600;
  private hallLen = 2400;
  private trikeX = 760; private trikeGot = 0;
  private bombsLeft = 8;
  private targets: Target[] = [];
  private falling: FallBomb[] = [];
  private airY = 1400 - H + 190;
  private parts: P3[] = [];
  private floats: { x: number; y: number; t: string; c: string; l: number }[] = [];
  private kills = 0;
  private shake = 0; private shakeMag = 0;
  private flash = 0; private flashC = "#fff";
  private hudT = 0;
  private slipVX = 0;

  constructor(cv: HTMLCanvasElement, o: Opts) {
    this.cv = cv; this.o = o; this.sfx = o.sfx;
    cv.width = W; cv.height = H;
    this.ctx = cv.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
    this.bgNight = buildNightSchool();
    this.bgDark = buildDarkCorridor();
    this.bgHall = buildCrowdHall();
    this.bgAir = buildAerialSchool();
    const [a, b] = SPRITE_OF[o.operator];
    this.sprA = a; this.sprB = b;
    if (o.operator === "elec") this.hp = this.hpMax = 200;
    if (o.operator === "ass") this.hp = this.hpMax = 125;
    // 巡逻哨
    this.guards = [
      { x: 300, y: 430, dir: 1, t: 0, range: [200, 460], see: 0 },
      { x: 600, y: 480, dir: -1, t: 0, range: [480, 760], see: 0 },
      { x: 500, y: 385, dir: 1, t: 0, range: [380, 720], see: 0 },
    ];
    // 轰炸目标
    this.targets = [
      { x: 480, y: 330, r: 92, hit: false, name: "治安队指挥部" },
      { x: 262, y: 520, r: 80, hit: false, name: "拖把军械库" },
      { x: 698, y: 520, r: 80, hit: false, name: "簸箕盾工坊" },
      { x: 480, y: 730, r: 92, hit: false, name: "治安队大礼堂" },
      { x: 250, y: 925, r: 78, hit: false, name: "对讲机通信站" },
      { x: 730, y: 925, r: 78, hit: false, name: "战车停车场" },
      { x: 480, y: 1120, r: 100, hit: false, name: "集结操场" },
    ];
    this.bind();
  }

  private kd = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
    if (e.repeat) return;
    this.keys.add(k);
    if (k === "escape") { this.o.onTogglePause(); return; }
    if (k === "f" || k === " " || k === "e") this.actEdge = true;
  };
  private ku = (e: KeyboardEvent) => this.keys.delete(e.key.toLowerCase());
  private mmv = (e: MouseEvent) => {
    const r = this.cv.getBoundingClientRect();
    this.mx = clamp(((e.clientX - r.left) / r.width) * W, 0, W);
    this.my = clamp(((e.clientY - r.top) / r.height) * H, 0, H);
  };
  private mdn = (e: MouseEvent) => { if (e.button === 0) this.mouse = true; };
  private mup = (e: MouseEvent) => { if (e.button === 0) this.mouse = false; };
  private blr = () => { if (!this.paused && !this.over) this.o.onTogglePause(); };

  private bind() {
    window.addEventListener("keydown", this.kd);
    window.addEventListener("keyup", this.ku);
    window.addEventListener("mousemove", this.mmv);
    this.cv.addEventListener("mousedown", this.mdn);
    window.addEventListener("mouseup", this.mup);
    window.addEventListener("blur", this.blr);
  }
  destroy() {
    this.dead = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.kd);
    window.removeEventListener("keyup", this.ku);
    window.removeEventListener("mousemove", this.mmv);
    this.cv.removeEventListener("mousedown", this.mdn);
    window.removeEventListener("mouseup", this.mup);
    window.removeEventListener("blur", this.blr);
    this.sfx.engineStop();
  }

  setVirtualMove(x: number, y: number) { this.vmx = x; this.vmy = y; }
  setVirtualAim(x: number, y: number) {
    const l = Math.hypot(x, y);
    if (l > 0.15) { this.vax = x / l; this.vay = y / l; this.vaOn = true; } else this.vaOn = false;
  }
  setVirtualFire(f: boolean) { this.vfire = f; }
  action() { this.actEdge = true; }

  start() {
    this.o.onBanner("复仇行动 · 第一阶段", "单刀赴会：潜入校园，摸到配电箱", "warn");
    this.o.onEvent("机动大队侦察支队已就位。保持隐蔽，避开探照灯", "info");
    this.sfx.startBgm("prep");
    this.last = performance.now();
    const loop = (ts: number) => {
      if (this.dead) return;
      const dt = Math.min((ts - this.last) / 1000, 0.05);
      this.last = ts;
      if (!this.paused && !this.over) this.update(dt);
      this.render();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  // ---------- 工具 ----------
  private burst(x: number, y: number, c: string, n: number, sp: number, add = false) {
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2), s = rnd(sp * 0.3, sp);
      this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, l: rnd(0.25, 0.7), m: 0.7, s: rnd(2, 6), c, g: add ? -60 : 240, add });
    }
    if (this.parts.length > 800) this.parts.splice(0, this.parts.length - 800);
  }
  private float(x: number, y: number, t: string, c: string) { this.floats.push({ x, y, t, c, l: 1.2 }); }
  private doShake(t: number, m: number) { this.shake = Math.max(this.shake, t); this.shakeMag = m; }
  private doFlash(t: number, c: string) { this.flash = Math.max(this.flash, t); this.flashC = c; }
  private hurt(v: number) {
    if (this.immune > 0 || this.over) return;
    this.hp -= v; this.immune = 0.55;
    this.sfx.hurt(); this.doShake(0.2, 5);
    this.float(this.px, this.py - 70, `-${Math.round(v)}`, "#ff5140");
    if (this.hp <= 0) { this.hp = 0; this.end(false, "侦察支队在校内失联"); }
  }
  private end(win: boolean, reason: string) {
    if (this.over) return;
    this.over = true;
    this.sfx.stopAllLoops();
    if (!win) { this.sfx.stopBgm(); this.sfx.lose(); }
    this.o.onEnd({ win, reason, kills: this.kills, time: this.elapsed, targets: this.targets.filter(t => t.hit).length });
  }

  // ---------- 主循环 ----------
  private update(dt: number) {
    this.elapsed += dt; this.phaseT += dt;
    this.shake = Math.max(0, this.shake - dt);
    this.flash = Math.max(0, this.flash - dt);
    this.immune = Math.max(0, this.immune - dt);
    const firing = this.mouse || this.vfire;
    const fireEdge = firing && !this.prevFire;
    this.prevFire = firing;

    if (this.cineT >= 0) { this.updCine(dt); this.pushHud(dt); return; }
    if (this.phase === "sneak") this.updSneak(dt);
    else if (this.phase === "blackout") this.updRun(dt, "blackout");
    else if (this.phase === "crowd") this.updRun(dt, "crowd");
    else if (this.phase === "steal") this.updSteal(dt);
    else if (this.phase === "bomb") this.updBomb(dt, fireEdge || firing);

    this.updParts(dt);
    this.actEdge = false;
    this.pushHud(dt);
  }

  private updCine(dt: number) {
    this.cineT += dt;
    this.updParts(dt);
    const go = (p: M3Phase, title: string, sub: string, ev: string) => {
      this.cineT = -1; this.phase = p; this.phaseT = 0;
      this.runners = []; this.scrollX = 0; this.spawnT = 0.6; this.lastPct = 0; this.slipVX = 0; this.stagger = 0;
      this.o.onBanner(title, sub, "warn");
      this.o.onEvent(ev, "info");
    };
    if (this.cineKind === "toBlackout" && this.cineT > 2.6) {
      this.px = 150; this.py = 450; this.stamina = 100;
      this.sfx.startBgm("prep");
      go("blackout", "全场陷入黑暗！", "治安队倾巢追击——穿过湿滑走廊", "地面湿滑，高速转向会打滑；躲开水洼与追兵");
    }
    if (this.cineKind === "toCrowd" && this.cineT > 2.2) {
      this.px = 140; this.py = 450;
      this.sfx.startBgm("battle");
      go("crowd", "教学楼 · 人山人海", "从人缝里挤过去，冲向院子", "撞到人会被卡住，寻找缝隙前进");
    }
    if (this.cineKind === "toSteal" && this.cineT > 2.0) {
      this.px = 120; this.py = 440;
      go("steal", "院中夺车", "抢下厕所所长的三轮战车", "清除护卫，然后靠近三轮战车发动");
    }
    if (this.cineKind === "toBomb" && this.cineT > 3.0) {
      this.cineT = -1; this.phase = "bomb"; this.phaseT = 0;
      this.px = W / 2; this.planeX = W / 2; this.aimX = W / 2; this.aimY = 380; this.airY = 1400 - H + 190;
      this.sfx.engineStart(); this.sfx.engineThrottle(0.8);
      this.sfx.startBgm("epic");
      this.o.onBanner("B85 轰炸机 · 临空", "投下李鑫隆特调臭水空爆弹", "bad");
      this.o.onEvent("左右移动瞄准，按开火键投弹。弹药 8 发，目标 7 处", "info");
    }
  }

  // ======================= 阶段一：潜入 =======================
  private updSneak(dt: number) {
    const sneaking = this.keys.has("shift") || this.keys.has("control");
    const base = sneaking ? 62 : 128;
    this.move(dt, base, 360, 510);

    // 探照灯扫动
    const beamX = W / 2 + Math.sin(this.phaseT * 0.55) * 380;
    const inBeam = Math.abs(this.px - beamX) < 86 && this.py > 352;

    // 巡逻哨视野
    let spotted = inBeam;
    for (const g of this.guards) {
      g.t += dt;
      g.x += g.dir * 34 * dt;
      if (g.x < g.range[0]) { g.x = g.range[0]; g.dir = 1; }
      if (g.x > g.range[1]) { g.x = g.range[1]; g.dir = -1; }
      const dx = (this.px - g.x) * g.dir;
      const dy = Math.abs(this.py - g.y);
      const see = dx > 0 && dx < 190 && dy < 54;
      g.see = see ? Math.min(1, g.see + dt * 2) : Math.max(0, g.see - dt);
      if (see) spotted = true;
    }
    const rate = sneaking ? 0.26 : 0.52;
    this.alert = clamp(this.alert + (spotted ? rate : -0.22) * dt, 0, 1);
    if (this.alert > 0.99) { this.end(false, "潜入暴露，侦察支队被包围"); return; }
    if (spotted && Math.random() < dt * 1.2) this.o.onEvent("被发现了！躲进阴影（按住 Shift 潜行）", "bad");

    // 到达配电箱
    const atBreaker = Math.abs(this.px - this.breakerX) < 70 && this.py < 430;
    if (atBreaker) {
      if (Math.random() < dt * 1.0) this.o.onEvent("配电箱就在眼前——按 F / 行动键拉闸", "good");
      if (this.actEdge) {
        this.cineT = 0; this.cineKind = "toBlackout";
        this.sfx.zap(); this.sfx.explosion(false);
        this.doFlash(0.6, "#9fd6ff");
        this.doShake(0.6, 8);
        this.sfx.stopBgm();
        this.o.onBanner("拉闸！", "整栋楼的灯一齐熄灭", "warn");
        // 黑暗中的死寂 → 骤然响起的紧张乐
        setTimeout(() => { this.sfx.walkie(); }, 700);
        setTimeout(() => { if (!this.over) this.sfx.startBgm("prep"); }, 1200);
      }
    }
  }

  // ======================= 阶段二/三：逃生 & 挤人 =======================
  private updRun(dt: number, mode: "blackout" | "crowd") {
    const dark = mode === "blackout";
    const total = dark ? this.corridorLen : this.hallLen;

    // ---- 体力 / 冲刺 ----
    const sprint = (this.keys.has("shift") || this.vfire || this.mouse) && this.stamina > 0;
    if (sprint) this.stamina = Math.max(0, this.stamina - 22 * dt);
    else this.stamina = Math.min(100, this.stamina + 18 * dt);

    // ---- 输入 ----
    let vx = 0, vy = 0;
    if (this.keys.has("d") || this.keys.has("arrowright")) vx += 1;
    if (this.keys.has("a") || this.keys.has("arrowleft")) vx -= 1;
    if (this.keys.has("w") || this.keys.has("arrowup")) vy -= 1;
    if (this.keys.has("s") || this.keys.has("arrowdown")) vy += 1;
    vx += this.vmx; vy += this.vmy;
    vx = clamp(vx, -1, 1); vy = clamp(vy, -1, 1);

    // ---- 前进速度：基础自动前进 + 输入调节（保证永远能到终点） ----
    this.stagger = Math.max(0, this.stagger - dt);
    const baseFwd = dark ? 185 : 150;                 // 自动奔跑
    const inputBoost = vx * (dark ? 95 : 85);         // 前后微调
    const sprintMul = sprint ? 1.5 : 1;
    const staggerMul = this.stagger > 0 ? 0.3 : 1;    // 被撞后短暂减速（而非倒退）
    const fwd = Math.max(dark ? 38 : 30, (baseFwd + inputBoost) * sprintMul * staggerMul);
    this.scrollX += fwd * dt;

    // ---- 横向（屏幕内站位）与纵向走位 ----
    if (dark) {
      // 湿滑：横向有惯性
      this.slipVX += (vx * 150 - this.slipVX) * Math.min(1, dt * 3.2);
      this.px = clamp(this.px + this.slipVX * dt, 90, 520);
    } else {
      this.px = clamp(this.px + vx * 120 * dt, 90, 520);
    }
    this.py = clamp(this.py + vy * (dark ? 185 : 205) * dt, 398, 514);
    this.anim += dt * 1.6;
    this.face = 1;

    // ---- 生成障碍（按里程而非时间，密度可控） ----
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = dark ? rnd(0.75, 1.25) : rnd(0.5, 0.8);
      const lanes = [408, 442, 476, 508];
      const y = lanes[Math.floor(Math.random() * lanes.length)];
      if (dark) {
        const kind: Runner["kind"] = Math.random() < 0.5 ? "puddle" : "chaser";
        this.runners.push({ x: 1040, y, vx: kind === "chaser" ? -rnd(6, 26) : 0, vy: 0, t: 0, kind, hp: 20, push: 0, flash: 0, dead: false });
      } else {
        // 人群：成簇出现但总会留出至少一条缝
        const blocked = new Set<number>();
        const nBlock = 1 + Math.floor(Math.random() * 2);     // 最多堵 2 条，留 2 条可走
        while (blocked.size < nBlock) blocked.add(Math.floor(Math.random() * lanes.length));
        for (const li of blocked) {
          this.runners.push({ x: 1040 + Math.random() * 60, y: lanes[li], vx: -rnd(2, 14), vy: 0, t: 0, kind: "crowd", hp: 30, push: 0, flash: 0, dead: false });
        }
      }
    }

    // ---- 障碍物相对运动 ----
    for (const r of this.runners) {
      r.t += dt;
      r.flash = Math.max(0, r.flash - dt);
      r.x += (r.vx - fwd) * dt;                 // 随前进速度向后掠过
      if (r.push > 0) { r.push -= dt; r.x += 150 * dt; }

      const dx = Math.abs(r.x - this.px), dy = Math.abs(r.y - this.py);
      if (dx < 28 && dy < 26 && !r.dead && this.immune <= 0) {
        if (r.kind === "puddle") {
          this.slipVX = rnd(-1, 1) > 0 ? 210 : -210;        // 打滑甩向一侧
          this.stagger = 0.45;
          this.sfx.skid();
          this.hurt(5);
          this.float(this.px, this.py - 80, "打滑！", "#9fd6ff");
          this.burst(r.x, r.y, "#7fb0c4", 14, 130);
          r.dead = true;
        } else if (r.kind === "chaser") {
          this.stagger = 0.4;
          this.hurt(8);
          r.push = 0.35; r.flash = 0.1;
          this.burst(r.x, r.y - 30, "#3f7a58", 8, 90);
        } else {
          // 人群：撞上 → 短暂减速 + 掉体力（但不倒退）
          this.stagger = 0.5;
          this.stamina = Math.max(0, this.stamina - 12);
          r.push = 0.3; r.flash = 0.08;
          this.sfx.hit();
          this.float(r.x, r.y - 70, "借过！", "#e8e4d4");
          this.immune = 0.25;
        }
      }
      if (r.x < -90) r.dead = true;
    }
    this.runners = this.runners.filter((r) => !r.dead);

    // ---- 里程播报 ----
    const pct = Math.floor((this.scrollX / total) * 100);
    if (pct >= this.lastPct + 25 && pct < 100) {
      this.lastPct = Math.floor(pct / 25) * 25;
      this.o.onEvent(`${dark ? "走廊" : "教学楼"}进度 ${this.lastPct}%`, "info");
    }

    // ---- 抵达终点 ----
    if (this.scrollX >= total) {
      this.lastPct = 0;
      if (dark) {
        this.cineT = 0; this.cineKind = "toCrowd";
        this.o.onBanner("冲出厕所走廊！", "前方是人山人海的教学楼", "good");
      } else {
        this.cineT = 0; this.cineKind = "toSteal";
        this.o.onBanner("冲到院子了！", "目标：厕所所长的三轮战车", "good");
      }
    }
  }
  private stagger = 0;
  private lastPct = 0;

  // ======================= 阶段四：抢车 =======================
  private updSteal(dt: number) {
    this.move(dt, 150, 360, 512);
    const firing = this.mouse || this.vfire;
    // 护卫
    this.spawnT -= dt;
    const alive = this.runners.filter((r) => !r.dead).length;
    if (this.spawnT <= 0 && alive < 6 && this.guardLeft > 0) {
      this.spawnT = rnd(1.0, 1.8);
      this.guardLeft--;
      this.runners.push({ x: Math.random() > 0.5 ? 1000 : -40, y: rnd(380, 500), vx: 0, vy: 0, t: 0, kind: "chaser", hp: 34, push: 0, flash: 0, dead: false });
    }
    for (const r of this.runners) {
      r.t += dt; r.flash = Math.max(0, r.flash - dt);
      const dx = this.px - r.x, dy = this.py - r.y, d = Math.hypot(dx, dy) || 1;
      if (d > 38) { r.x += (dx / d) * 58 * dt; r.y += (dy / d) * 42 * dt; }
      else if (r.t % 1.1 < dt) this.hurt(8);
    }
    // 射击
    this.fireCd -= dt;
    if (firing && this.fireCd <= 0) {
      this.fireCd = 0.18;
      const a = this.aim();
      this.sfx.burst();
      this.burst(this.px + a.x * 26, this.py - 36 + a.y * 10, "#ffb347", 7, 150, true);
      for (const r of this.runners) {
        if (r.dead) continue;
        const rx = r.x - this.px, ry = (r.y - 30) - (this.py - 36);
        const proj = rx * a.x + ry * a.y;
        const perp = Math.abs(rx * a.y - ry * a.x);
        if (proj > 0 && proj < 330 && perp < 26) {
          r.hp -= 20; r.flash = 0.1;
          if (r.hp <= 0) { r.dead = true; this.kills++; this.sfx.kill(); this.burst(r.x, r.y - 30, "#3f7a58", 14, 120); }
          break;
        }
      }
    }
    this.runners = this.runners.filter((r) => !r.dead);

    const rem = this.guardLeft + this.runners.length;
    if (rem <= 0 && Math.abs(this.px - this.trikeX) < 110) {
      this.trikeGot = Math.min(1, this.trikeGot + dt / 2.0);
      if (Math.random() < dt * 20) this.burst(this.trikeX + rnd(-30, 30), 460, "#c2a14a", 1, 50, true);
      if (this.trikeGot >= 1) {
        this.cineT = 0; this.cineKind = "toBomb";
        this.sfx.engineStart(); this.sfx.engineThrottle(0.6);
        this.o.onBanner("战车到手！返回总部", "换乘 B85 轰炸机", "good");
      }
    } else if (rem > 0 && Math.random() < dt * 0.7) {
      this.o.onEvent(`护卫剩余 ${rem} 人`, "warn");
    }
  }
  private guardLeft = 8;
  private fireCd = 0;

  // ======================= 阶段五：轰炸 =======================
  // 操作：鼠标（或右摇杆）自由移动投弹瞄准镜 → 点击/开火即在准星处投弹
  //       飞机自动沿航线巡航，玩家只需专心瞄准
  private updBomb(dt: number, firing: boolean) {
    this.sfx.engineThrottle(0.75);
    this.airY -= 46 * dt;              // 向北推进：地形自上而下迎面掠过（低速投弹航线）

    // --- 飞机自动巡航（缓慢横向游走，不需玩家操心） ---
    this.planeX += Math.sin(this.phaseT * 0.5) * 26 * dt;
    this.planeX = clamp(this.planeX, 150, W - 150);

    // --- 瞄准镜：鼠标直接控制；触屏用右摇杆推动 ---
    if (this.vaOn) {
      this.aimX = clamp(this.aimX + this.vax * 330 * dt, 40, W - 40);
      this.aimY = clamp(this.aimY + this.vay * 300 * dt, 180, H - 60);
    } else {
      this.aimX = clamp(this.mx, 40, W - 40);
      this.aimY = clamp(this.my, 180, H - 60);
    }

    // --- 投弹 ---
    this.fireCd -= dt;
    if (firing && this.fireCd <= 0 && this.bombsLeft > 0) {
      this.fireCd = 0.45;
      this.bombsLeft--;
      // 从机腹投出，飞向准星指定的落点
      this.falling.push({
        x: this.planeX, y: 150, t: 0,
        tx: this.aimX, ty: this.aimY,
      });
      this.sfx.throwIt();
      this.o.onEvent(`投弹！剩余 ${this.bombsLeft} 发`, "info");
    }

    // --- 炸弹飞行：从机腹抛向准星 ---
    for (let i = this.falling.length - 1; i >= 0; i--) {
      const b = this.falling[i];
      b.t += dt;
      const k = Math.min(b.t / 0.85, 1);
      const ease = k * k;                                  // 加速下坠
      b.x = b.x + (b.tx - b.x) * Math.min(1, dt * 6);      // 横向修正（制导）
      b.y = 150 + (b.ty - 150) * ease;
      if (Math.random() < 0.7) {
        this.parts.push({
          x: b.x + rnd(-3, 3), y: b.y - 12, vx: rnd(-10, 10), vy: -50,
          l: 0.3, m: 0.3, s: 3, c: "#8fc44a", g: 0, add: false,
        });
      }
      if (k >= 1) {
        this.falling.splice(i, 1);
        const wx = b.tx, wy = this.airY + b.ty;            // 世界坐标
        this.sfx.explosion(true);
        this.doShake(0.5, 10);
        this.doFlash(0.28, "#c4e368");
        this.burst(b.tx, b.ty, "#7fae3f", 40, 260);
        this.burst(b.tx, b.ty, "#c4e368", 26, 200);
        let hitAny = false;
        for (const tg of this.targets) {
          if (tg.hit) continue;
          if (Math.hypot(tg.x - wx, tg.y - wy) < tg.r + 26) {   // 判定略放宽
            tg.hit = true; hitAny = true;
            this.kills += 12;
            this.o.onEvent(`命中：${tg.name}！`, "good");
            this.float(tg.x, b.ty - 30, "直接命中", "#c4e368");
          }
        }
        if (!hitAny) {
          this.o.onEvent("脱靶——臭水洒在了空地上", "warn");
          this.float(b.tx, b.ty - 20, "脱靶", "#ff9a86");
        }
        if (this.targets.every((t) => t.hit)) {
          this.sfx.engineStop();
          this.end(true, "全部目标被臭水空爆弹覆盖，治安队阵地化为废墟");
          return;
        }
      }
    }

    const remain = this.targets.filter((t) => !t.hit).length;
    if (this.bombsLeft === 0 && this.falling.length === 0) {
      if (remain <= 2) this.end(true, `弹药耗尽，但主要目标已被摧毁（剩 ${remain} 处未命中）`);
      else this.end(false, `弹药耗尽，仍有 ${remain} 处目标完好，轰炸失败`);
      return;
    }
    if (this.airY <= 0) {
      if (remain <= 2) this.end(true, "飞越目标区，主要设施已摧毁");
      else this.end(false, "飞越目标区，轰炸未达成");
    }
  }
  private planeX = W / 2;
  private aimX = W / 2;
  private aimY = 380;

  // ---------- 公共 ----------
  private aim() {
    if (this.vaOn) return { x: this.vax, y: this.vay };
    const dx = this.mx - this.px, dy = this.my - (this.py - 36);
    const l = Math.hypot(dx, dy) || 1;
    return { x: dx / l, y: dy / l };
  }
  private move(dt: number, base: number, top: number, bot: number) {
    let vx = 0, vy = 0;
    if (this.keys.has("w") || this.keys.has("arrowup")) vy -= 1;
    if (this.keys.has("s") || this.keys.has("arrowdown")) vy += 1;
    if (this.keys.has("a") || this.keys.has("arrowleft")) vx -= 1;
    if (this.keys.has("d") || this.keys.has("arrowright")) vx += 1;
    vx += this.vmx; vy += this.vmy;
    const m = Math.hypot(vx, vy), l = m || 1;
    const spd = base * Math.min(1, m) * (this.o.operator === "ass" ? 1.2 : this.o.operator === "elec" ? 0.86 : 1);
    this.px = clamp(this.px + (vx / l) * spd * dt, 40, W - 40);
    this.py = clamp(this.py + (vy / l) * spd * dt, top, bot);
    this.anim += dt * (m > 0.05 ? 1 : 0.35);
    if (this.vaOn) this.face = this.vax >= 0 ? 1 : -1;
    else this.face = this.mx >= this.px ? 1 : -1;
  }
  private updParts(dt: number) {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.l -= dt;
      if (p.l <= 0) { this.parts.splice(i, 1); continue; }
      p.vx *= 0.94; p.vy = p.vy * 0.94 + p.g * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
    for (let i = this.floats.length - 1; i >= 0; i--) {
      const f = this.floats[i];
      f.l -= dt; f.y -= 36 * dt;
      if (f.l <= 0) this.floats.splice(i, 1);
    }
  }

  private pushHud(dt: number) {
    this.hudT += dt;
    if (this.hudT < 0.1) return;
    this.hudT = 0;
    const hitN = this.targets.filter((t) => t.hit).length;
    const titles: Record<M3Phase, string> = {
      sneak: "阶段 I · 潜 入", blackout: "阶段 II · 黑 暗 走 廊",
      crowd: "阶段 III · 人 海 教 学 楼", steal: "阶段 IV · 夺 车",
      bomb: "阶段 V · 临 空 轰 炸", done: "完 成",
    };
    const rem = this.guardLeft + this.runners.length;
    const obj =
      this.phase === "sneak" ? "避开探照灯与巡逻，抵达配电箱拉闸"
        : this.phase === "blackout" ? "穿过湿滑的黑暗走廊"
          : this.phase === "crowd" ? "从人缝中挤出教学楼"
            : this.phase === "steal" ? (rem > 0 ? `清除护卫（剩 ${rem} 人）` : "靠近三轮战车发动")
              : `投弹摧毁目标（${hitN}/${this.targets.length}）`;
    const prog =
      this.phase === "sneak" ? clamp(this.px / this.breakerX, 0, 1)
        : this.phase === "blackout" ? clamp(this.scrollX / this.corridorLen, 0, 1)
          : this.phase === "crowd" ? clamp(this.scrollX / this.hallLen, 0, 1)
            : this.phase === "steal" ? (rem > 0 ? 1 - rem / 8 : this.trikeGot)
              : hitN / this.targets.length;
    this.o.onHud({
      phase: this.phase, title: titles[this.phase], objective: obj, progress: prog,
      hp: Math.ceil(this.hp), hpMax: this.hpMax,
      alert: this.alert, stamina: this.stamina,
      bombsLeft: this.bombsLeft, targetsHit: hitN, targetsTotal: this.targets.length,
      kills: this.kills, timer: this.elapsed,
    });
  }

  // ============================================================
  // 渲染
  // ============================================================
  private render() {
    const c = this.ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, W, H);
    let ox = 0, oy = 0;
    if (this.shake > 0) { ox = rnd(-this.shakeMag, this.shakeMag); oy = rnd(-this.shakeMag, this.shakeMag); }
    c.save();
    c.translate(Math.round(ox), Math.round(oy));

    if (this.phase === "sneak" || (this.cineT >= 0 && this.cineKind === "toBlackout")) this.drawSneak();
    else if (this.phase === "blackout" || (this.cineT >= 0 && this.cineKind === "toCrowd")) this.drawRun(true);
    else if (this.phase === "crowd" || (this.cineT >= 0 && this.cineKind === "toSteal")) this.drawRun(false);
    else if (this.phase === "steal" || (this.cineT >= 0 && this.cineKind === "toBomb")) this.drawSteal();
    else this.drawBomb();

    for (const p of this.parts) {
      if (p.add) c.globalCompositeOperation = "lighter";
      c.globalAlpha = clamp(p.l / p.m, 0, 1);
      c.fillStyle = p.c;
      c.fillRect(Math.round(p.x - p.s / 2), Math.round(p.y - p.s / 2), Math.max(1, p.s), Math.max(1, p.s));
      c.globalCompositeOperation = "source-over";
    }
    c.globalAlpha = 1;
    for (const f of this.floats) {
      c.globalAlpha = clamp(f.l, 0, 1);
      drawPixelText(c, f.t, f.x, f.y, { size: 12, color: f.c, scale: 3, center: true });
      c.globalAlpha = 1;
    }
    c.restore();

    // 后期
    const vg = c.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.95);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.66)");
    c.fillStyle = vg; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 36; i++) {
      c.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`;
      c.fillRect(Math.random() * W, Math.random() * H, 2, 2);
    }
    if (this.flash > 0) {
      c.globalAlpha = clamp(this.flash * 1.8, 0, 0.9);
      c.fillStyle = this.flashC; c.fillRect(0, 0, W, H);
      c.globalAlpha = 1;
    }
    if (this.cineT >= 0) {
      const h = clamp(this.cineT * 100, 0, 56);
      c.fillStyle = "#05070a"; c.fillRect(0, 0, W, h); c.fillRect(0, H - h, W, h);
    }
  }

  private drawHero(scale = 3) {
    const c = this.ctx;
    c.fillStyle = "rgba(0,0,0,0.4)";
    c.fillRect(this.px - 17, this.py - 4, 34, 8);
    if (this.immune > 0 && Math.floor(this.immune * 14) % 2 === 0) c.globalAlpha = 0.5;
    const n = (Math.floor(this.anim * 6) % 2 === 0 ? this.sprA : this.sprB) as "elecA";
    drawSpr(c, n, this.px, this.py, { flip: this.face === -1, scale });
    c.globalAlpha = 1;
  }

  // ---- 潜入 ----
  private drawSneak() {
    const c = this.ctx;
    c.drawImage(this.bgNight, 0, 0);
    // 配电箱
    drawSpr(c, this.phase === "sneak" ? "breakerOn" : "breakerOff", this.breakerX, this.breakerY, { anchor: "c", scale: 3.4 });
    const bob = Math.sin(this.phaseT * 4) * 3;
    drawPixelText(c, "▼ 配电箱", this.breakerX, this.breakerY - 68 + bob, { size: 11, color: "#c2a14a", scale: 2, center: true });
    // 探照灯
    const beamX = W / 2 + Math.sin(this.phaseT * 0.55) * 380;
    c.save();
    c.globalCompositeOperation = "lighter";
    const bg = c.createLinearGradient(beamX, 120, beamX, H);
    bg.addColorStop(0, "rgba(255,244,200,0.22)");
    bg.addColorStop(1, "rgba(255,244,200,0.05)");
    c.fillStyle = bg;
    c.beginPath();
    c.moveTo(beamX - 28, 120); c.lineTo(beamX + 28, 120);
    c.lineTo(beamX + 110, H); c.lineTo(beamX - 110, H);
    c.closePath(); c.fill();
    c.restore();
    // 巡逻哨 + 视野锥
    for (const g of this.guards) {
      c.save();
      c.globalCompositeOperation = "lighter";
      c.fillStyle = g.see > 0.3 ? "rgba(255,90,70,0.14)" : "rgba(200,220,255,0.07)";
      c.beginPath();
      c.moveTo(g.x, g.y - 34);
      c.lineTo(g.x + g.dir * 190, g.y - 70);
      c.lineTo(g.x + g.dir * 190, g.y + 24);
      c.closePath(); c.fill();
      c.restore();
      drawSpr(c, Math.floor(g.t * 5) % 2 === 0 ? "soldA" : "soldB", g.x, g.y, { flip: g.dir === 1, scale: 2.8, alpha: 0.95 });
      if (g.see > 0.3) drawPixelText(c, "?", g.x, g.y - 92, { size: 14, color: "#ff5140", scale: 2, center: true });
    }
    this.drawHero();
    // 潜行提示
    if (this.phaseT < 6) {
      drawPixelText(c, "按住 Shift 潜行（更慢但更难被发现）", W / 2, 100, { size: 11, color: "#c9d1dc", scale: 2, center: true, bg: "rgba(5,7,10,0.8)" });
    }
    if (this.cineT >= 0) {
      drawPixelText(c, "咔——！！", W / 2, 180, { size: 18, color: "#9fd6ff", scale: 3, center: true, bg: "rgba(5,7,10,0.85)" });
    }
  }

  // ---- 逃生 / 挤人 ----
  private drawRun(dark: boolean) {
    const c = this.ctx;
    const bg = dark ? this.bgDark : this.bgHall;
    const off = this.scrollX % 1920;   // 与前进里程严格同步
    c.drawImage(bg, -off, 0);
    c.drawImage(bg, 1920 - off, 0);

    // 实体
    const list = [...this.runners].sort((a, b) => a.y - b.y);
    for (const r of list) {
      if (r.kind === "puddle") {
        c.fillStyle = "rgba(120,180,190,0.3)";
        c.beginPath(); c.ellipse(r.x, r.y + 6, 42, 12, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = "rgba(190,230,235,0.25)";
        c.beginPath(); c.ellipse(r.x - 8, r.y + 3, 16, 5, 0, 0, Math.PI * 2); c.fill();
        continue;
      }
      const fr = Math.floor(r.t * 7) % 2 === 0 ? "soldA" : "soldB";
      c.fillStyle = "rgba(0,0,0,0.35)";
      c.fillRect(r.x - 14, r.y - 3, 28, 7);
      drawSpr(c, fr, r.x, r.y, { flip: true, scale: dark ? 2.8 : 2.7, white: r.flash > 0.03, alpha: dark ? 0.95 : 1 });
      if (!dark) drawSpr(c, "mopV", r.x - 12, r.y - 34, { anchor: "c", scale: 2.2 });
    }
    this.drawHero(dark ? 3 : 3);

    if (dark) {
      // 黑暗遮罩 + 手电光圈
      c.save();
      c.globalCompositeOperation = "multiply";
      const grd = c.createRadialGradient(this.px, this.py - 30, 20, this.px, this.py - 30, 260);
      grd.addColorStop(0, "#ffffff");
      grd.addColorStop(0.42, "#6a6f74");
      grd.addColorStop(1, "#0a0d10");
      c.fillStyle = grd; c.fillRect(0, 0, W, H);
      c.restore();
      // 应急指示灯
      for (let i = 0; i < 4; i++) {
        const ex = ((i * 480 - this.scrollX) % 1920 + 1920) % 1920 - 100;
        c.save(); c.globalCompositeOperation = "lighter";
        c.fillStyle = Math.floor(this.phaseT * 3) % 2 === 0 ? "rgba(200,40,30,0.5)" : "rgba(200,40,30,0.2)";
        c.fillRect(ex, 120, 22, 10);
        const g2 = c.createRadialGradient(ex + 11, 126, 4, ex + 11, 126, 90);
        g2.addColorStop(0, "rgba(220,60,40,0.25)"); g2.addColorStop(1, "rgba(220,60,40,0)");
        c.fillStyle = g2; c.fillRect(ex - 80, 60, 180, 180);
        c.restore();
      }
    }

    // 进度与体力
    const total = dark ? this.corridorLen : this.hallLen;
    const p = clamp(this.scrollX / total, 0, 1);
    c.fillStyle = "rgba(5,7,10,0.8)"; c.fillRect(W / 2 - 180, 46, 360, 22);
    c.strokeStyle = "#c2a14a"; c.lineWidth = 2; c.strokeRect(W / 2 - 180, 46, 360, 22);
    c.fillStyle = dark ? "#9fd6ff" : "#c2a14a"; c.fillRect(W / 2 - 176, 50, 352 * p, 14);
    drawPixelText(c, dark ? "逃离进度" : "挤出进度", W / 2, 22, { size: 11, color: "#e8e4d4", scale: 2, center: true });
    // 体力条
    c.fillStyle = "rgba(5,7,10,0.8)"; c.fillRect(24, H - 44, 180, 18);
    c.fillStyle = this.stamina > 25 ? "#8fd6a0" : "#ff7a63";
    c.fillRect(27, H - 41, 174 * (this.stamina / 100), 12);
    drawPixelText(c, "体力(Shift冲刺)", 24, H - 64, { size: 9, color: "#8fa3c8", scale: 2 });
  }

  // ---- 夺车 ----
  private drawSteal() {
    const c = this.ctx;
    c.drawImage(this.bgNight, 0, 0);
    c.fillStyle = "rgba(5,8,14,0.45)"; c.fillRect(0, 0, W, H);
    // 三轮战车
    const fr = this.trikeGot > 0 && this.trikeGot < 1 && Math.floor(this.phaseT * 10) % 2 === 0 ? "trikeB" : "trikeA";
    drawSpr(c, fr, this.trikeX, 492, { anchor: "bc", scale: 3.4 });
    if (this.trikeGot < 1) {
      const bob = Math.sin(this.phaseT * 4) * 4;
      drawPixelText(c, "▼ 三轮战车", this.trikeX, 356 + bob, { size: 11, color: "#c2a14a", scale: 2, center: true });
      if (this.trikeGot > 0) {
        c.fillStyle = "#0e1014"; c.fillRect(this.trikeX - 60, 382, 120, 12);
        c.fillStyle = "#c2a14a"; c.fillRect(this.trikeX - 58, 384, 116 * this.trikeGot, 8);
      }
    }
    const list = [...this.runners].sort((a, b) => a.y - b.y);
    for (const r of list) {
      c.fillStyle = "rgba(0,0,0,0.35)"; c.fillRect(r.x - 14, r.y - 3, 28, 7);
      drawSpr(c, Math.floor(r.t * 6) % 2 === 0 ? "soldA" : "soldB", r.x, r.y, { flip: r.x > this.px, scale: 2.9, white: r.flash > 0.03 });
      if (r.hp < 34) {
        c.fillStyle = "#0e1014"; c.fillRect(r.x - 16, r.y - 76, 32, 5);
        c.fillStyle = "#b5362a"; c.fillRect(r.x - 15, r.y - 75, 30 * (r.hp / 34), 3);
      }
    }
    this.drawHero();
    if (this.cineT >= 0) drawPixelText(c, "上车！回总部！", W / 2, 170, { size: 16, color: "#c2a14a", scale: 3, center: true, bg: "rgba(5,7,10,0.85)" });
  }

  // ---- 轰炸 ----
  private drawBomb() {
    const c = this.ctx;
    c.drawImage(this.bgAir, 0, -this.airY);

    // 目标标记
    for (const t of this.targets) {
      const sy = t.y - this.airY;
      if (sy < -140 || sy > H + 140) continue;
      if (t.hit) {
        c.fillStyle = "rgba(40,54,26,0.65)";
        c.beginPath(); c.ellipse(t.x, sy, t.r, t.r * 0.7, 0, 0, Math.PI * 2); c.fill();
        for (let i = 0; i < 5; i++) {
          c.fillStyle = `rgba(127,174,63,${0.18 - i * 0.03})`;
          c.beginPath(); c.ellipse(t.x + Math.sin(this.phaseT * 2 + i) * 14, sy - i * 22, 30 - i * 3, 14, 0, 0, Math.PI * 2); c.fill();
        }
        drawPixelText(c, "已摧毁", t.x, sy - 10, { size: 10, color: "#8fd6a0", scale: 2, center: true });
      } else {
        const pulse = 0.4 + Math.sin(this.phaseT * 4) * 0.25;
        c.strokeStyle = `rgba(220,70,50,${pulse})`;
        c.lineWidth = 3;
        c.beginPath(); c.arc(t.x, sy, t.r, 0, Math.PI * 2); c.stroke();
        c.beginPath(); c.arc(t.x, sy, t.r * 0.55, 0, Math.PI * 2); c.stroke();
        c.fillStyle = `rgba(220,70,50,${pulse})`;
        c.fillRect(t.x - 1, sy - t.r - 14, 2, 12);
        c.fillRect(t.x - 1, sy + t.r + 2, 2, 12);
        c.fillRect(t.x - t.r - 14, sy - 1, 12, 2);
        c.fillRect(t.x + t.r + 2, sy - 1, 12, 2);
        drawPixelText(c, t.name, t.x, sy - t.r - 34, { size: 10, color: "#ff9a86", scale: 2, center: true, bg: "rgba(5,7,10,0.65)" });
      }
    }

    // 下落中的弹 + 地面投影
    for (const b of this.falling) {
      const k = Math.min(b.t / 0.85, 1);
      c.fillStyle = `rgba(0,0,0,${0.12 + k * 0.28})`;
      c.beginPath(); c.ellipse(b.tx, b.ty, 8 + k * 18, 4 + k * 8, 0, 0, Math.PI * 2); c.fill();
      drawSpr(c, "airbomb", b.x, b.y, { anchor: "c", scale: 1.8 + k * 1.8 });
    }

    // ===== 投弹瞄准镜（鼠标自由控制）=====
    const ax = this.aimX, ay = this.aimY;
    // 命中预判高亮
    const wy = this.airY + ay;
    const onTarget = this.targets.some((t) => !t.hit && Math.hypot(t.x - ax, t.y - wy) < t.r + 26);
    const col = onTarget ? "200,230,140" : "220,220,220";
    c.save();
    c.strokeStyle = `rgba(${col},0.95)`;
    c.lineWidth = 2;
    // 外环（带缺口）
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.arc(ax, ay, 26, (i * Math.PI) / 2 + 0.22, (i * Math.PI) / 2 + Math.PI / 2 - 0.22);
      c.stroke();
    }
    c.beginPath(); c.arc(ax, ay, 11, 0, Math.PI * 2); c.stroke();
    // 十字
    c.beginPath();
    c.moveTo(ax - 38, ay); c.lineTo(ax - 16, ay);
    c.moveTo(ax + 16, ay); c.lineTo(ax + 38, ay);
    c.moveTo(ax, ay - 38); c.lineTo(ax, ay - 16);
    c.moveTo(ax, ay + 16); c.lineTo(ax, ay + 38);
    c.stroke();
    c.fillStyle = `rgba(${col},0.9)`;
    c.fillRect(ax - 1.5, ay - 1.5, 3, 3);
    if (onTarget) {
      c.fillStyle = "rgba(200,230,140,0.14)";
      c.beginPath(); c.arc(ax, ay, 26, 0, Math.PI * 2); c.fill();
      drawPixelText(c, "锁定", ax, ay - 56, { size: 10, color: "#c4e368", scale: 2, center: true });
    }
    c.restore();

    // ===== 投弹轨迹指引（机腹 → 准星）=====
    c.save();
    c.setLineDash([5, 9]);
    c.strokeStyle = onTarget ? "rgba(200,230,140,0.45)" : "rgba(180,190,200,0.25)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(this.planeX, 166);
    c.quadraticCurveTo((this.planeX + ax) / 2, (166 + ay) / 2 - 24, ax, ay);
    c.stroke();
    c.restore();

    // ===== 轰炸机（自动巡航）=====
    const sway = Math.sin(this.phaseT * 2.4) * 3;
    drawSpr(c, "bomber", this.planeX, 150 + sway, { anchor: "c", scale: 3 });

    // 云层（自上而下掠过）
    c.save();
    c.globalAlpha = 0.13;
    for (let i = 0; i < 5; i++) {
      const cy = (((i * 170 - this.airY * 1.5) % (H + 300)) + (H + 300)) % (H + 300) - 120;
      c.fillStyle = "#cfd8e4";
      c.fillRect((i * 230) % W - 60, cy, 220, 26);
      c.fillRect((i * 230) % W, cy - 14, 150, 22);
    }
    c.restore();

    // 弹药架
    for (let i = 0; i < this.bombsLeft; i++) {
      drawSpr(c, "airbomb", 36 + i * 22, H - 40, { anchor: "c", scale: 1.8 });
    }
    drawPixelText(c, `弹药 ${this.bombsLeft}`, 30, H - 74, { size: 10, color: "#c4e368", scale: 2 });
    // 操作提示
    if (this.phaseT < 7) {
      drawPixelText(c, "移动鼠标选择落点 · 点击投弹", W / 2, 96, {
        size: 11, color: "#e8e4d4", scale: 2, center: true, bg: "rgba(5,7,10,0.8)",
      });
    }
  }
}
