// ============================================================
// 第二战役「放学后」：夺车 → 骑乘突围 → 厕所隔间固守发报
// ============================================================
import {
  drawSpr, drawPixelText, buildYard, buildLavatory, buildRoadStrip,
  W, H,
} from "./sprites";
import type { SFX } from "./audio";
import type { OperatorId, Tone } from "./engine";

export type M2Phase = "seize" | "ride" | "stall" | "done";

export interface M2Hud {
  phase: M2Phase;
  objective: string;
  progress: number;      // 0..1 当前阶段目标进度
  hp: number; hpMax: number;
  ammo: number; ammoMax: number;
  doorHp: number; doorMax: number;   // stall 阶段
  locked: boolean;
  morse: { pattern: string; idx: number; window: boolean };
  dist: number; distMax: number;     // ride 阶段
  kills: number;
  enemies: number;
  timer: number;
}

export interface M2End { win: boolean; reason: string; kills: number; time: number; }

interface Opts {
  operator: OperatorId;
  sfx: SFX;
  onHud: (h: M2Hud) => void;
  onEvent: (m: string, t?: Tone) => void;
  onBanner: (t: string, s: string, tone?: Tone) => void;
  onEnd: (e: M2End) => void;
  onTogglePause: () => void;
}

interface Foe {
  x: number; y: number; hp: number; max: number; spd: number;
  t: number; atk: number; face: 1 | -1; flash: number; dead: boolean;
  kind: "guard" | "shield" | "chaser" | "basher";
  shield: number; lane?: number; bubble: string; bubbleT: number;
}
interface Part { x: number; y: number; vx: number; vy: number; l: number; m: number; s: number; c: string; g: number; add: boolean; }
interface Shot { x: number; y: number; vx: number; vy: number; l: number; mine: boolean; }

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

const SPRITE_OF: Record<OperatorId, [string, string]> = {
  elec: ["elecA", "elecB"], ass: ["assA", "assB"], med: ["medA", "medB"],
};

// 摩斯电码：S O S  / "支援" 电文
const MORSE_SEQ = "... --- ...";

export class Mission2 {
  private cv: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private o: Opts;
  private sfx: SFX;
  private bgYard: HTMLCanvasElement;
  private bgLav: HTMLCanvasElement;
  private bgRoad: HTMLCanvasElement;
  private raf = 0; private last = 0; private destroyed = false;

  phase: M2Phase = "seize";
  paused = false;
  private over = false;
  private elapsed = 0;
  private phaseT = 0;
  private cineT = -1;        // >=0 表示阶段过渡演出中
  private cineKind = "";

  // 玩家
  private px = 300; private py = 430;
  private hp = 150; private hpMax = 150;
  private ammo = 100; private ammoMax = 100;
  private face: 1 | -1 = 1;
  private anim = 0; private immune = 0; private fireCd = 0;
  private sprA: string; private sprB: string;

  // 输入
  private keys = new Set<string>();
  private mx = W * 0.6; private my = H * 0.6;
  private mouse = false;
  private vmx = 0; private vmy = 0;
  private vax = 1; private vay = 0; private vaOn = false;
  private vfire = false; private prevFire = false;
  private actionEdge = false;

  // 阶段数据
  private bikeX = 790; private bikeY = 402;
  private capture = 0;          // 夺车进度
  private dist = 0; private distMax = 2400;   // 骑乘里程
  private lane = 1;             // 0/1/2
  private laneY = [330, 400, 470];
  private roadOff = 0;
  private throttle = 0;
  private doorHp = 340; private doorMax = 340;
  private locked = false;
  private morseIdx = 0; private morseWin = false; private morseT = 0;
  private morseFails = 0;

  private foes: Foe[] = [];
  private parts: Part[] = [];
  private shots: Shot[] = [];
  private floats: { x: number; y: number; t: string; c: string; l: number }[] = [];
  private spawnT = 1.4;
  private garrison = 10;       // 车棚守军总额（打完即可夺车）
  private kills = 0;
  private shake = 0; private shakeMag = 0;
  private flash = 0; private flashC = "#fff";
  private hudT = 0;

  constructor(cv: HTMLCanvasElement, o: Opts) {
    this.cv = cv; this.o = o; this.sfx = o.sfx;
    cv.width = W; cv.height = H;
    this.ctx = cv.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
    this.bgYard = buildYard();
    this.bgLav = buildLavatory();
    this.bgRoad = buildRoadStrip();
    const [a, b] = SPRITE_OF[o.operator];
    this.sprA = a; this.sprB = b;
    if (o.operator === "elec") { this.hp = this.hpMax = 200; }
    if (o.operator === "ass") { this.hp = this.hpMax = 120; }
    this.bind();
  }

  // ---------------- 输入 ----------------
  private kd = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
    if (e.repeat) return;
    this.keys.add(k);
    if (k === "escape") { this.o.onTogglePause(); return; }
    if (k === "f" || k === " " || k === "e") this.actionEdge = true;
  };
  private ku = (e: KeyboardEvent) => this.keys.delete(e.key.toLowerCase());
  private mm = (e: MouseEvent) => {
    const r = this.cv.getBoundingClientRect();
    this.mx = clamp(((e.clientX - r.left) / r.width) * W, 0, W);
    this.my = clamp(((e.clientY - r.top) / r.height) * H, 0, H);
  };
  private md = (e: MouseEvent) => { if (e.button === 0) { this.mouse = true; } };
  private mu = (e: MouseEvent) => { if (e.button === 0) this.mouse = false; };
  private blur = () => { if (!this.paused && !this.over) this.o.onTogglePause(); };

  private bind() {
    window.addEventListener("keydown", this.kd);
    window.addEventListener("keyup", this.ku);
    window.addEventListener("mousemove", this.mm);
    this.cv.addEventListener("mousedown", this.md);
    window.addEventListener("mouseup", this.mu);
    window.addEventListener("blur", this.blur);
  }
  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.kd);
    window.removeEventListener("keyup", this.ku);
    window.removeEventListener("mousemove", this.mm);
    this.cv.removeEventListener("mousedown", this.md);
    window.removeEventListener("mouseup", this.mu);
    window.removeEventListener("blur", this.blur);
    this.sfx.engineStop();
  }

  // 触屏 API（与第一战役一致）
  setVirtualMove(x: number, y: number) { this.vmx = x; this.vmy = y; }
  setVirtualAim(x: number, y: number) {
    const l = Math.hypot(x, y);
    if (l > 0.15) { this.vax = x / l; this.vay = y / l; this.vaOn = true; } else this.vaOn = false;
  }
  setVirtualFire(f: boolean) { this.vfire = f; }
  /** 触屏「行动键」：锁门 / 发报（点一下） */
  action() { this.actionEdge = true; }
  /** 触屏电键：按住 / 松开（发报用） */
  setKeyDown(down: boolean) {
    this.touchKey = down;
    if (down) this.actionEdge = true;
  }
  private touchKey = false;

  start() {
    this.o.onBanner("第二战役 · 放学后", "夺回边三轮摩托，杀出重围", "warn");
    this.o.onEvent("目标：清除车棚守卫，占领边三轮摩托", "info");
    this.last = performance.now();
    const loop = (ts: number) => {
      if (this.destroyed) return;
      const dt = Math.min((ts - this.last) / 1000, 0.05);
      this.last = ts;
      if (!this.paused && !this.over) this.update(dt);
      this.render();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  // ---------------- 工具 ----------------
  private burst(x: number, y: number, c: string, n: number, sp: number, add = false) {
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2), s = rnd(sp * 0.3, sp);
      this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, l: rnd(0.25, 0.6), m: 0.6, s: rnd(2, 5), c, g: add ? -60 : 220, add });
    }
    if (this.parts.length > 700) this.parts.splice(0, this.parts.length - 700);
  }
  private float(x: number, y: number, t: string, c: string) { this.floats.push({ x, y, t, c, l: 1 }); }
  private doShake(t: number, m: number) { this.shake = Math.max(this.shake, t); this.shakeMag = m; }
  private doFlash(t: number, c: string) { this.flash = Math.max(this.flash, t); this.flashC = c; }

  private hurt(v: number) {
    if (this.immune > 0 || this.over) return;
    this.hp -= v; this.immune = 0.5;
    this.sfx.hurt(); this.doShake(0.2, 5);
    this.float(this.px, this.py - 70, `-${Math.round(v)}`, "#ff5140");
    if (this.hp <= 0) { this.hp = 0; this.end(false, "干员在撤离途中倒下了"); }
  }

  private end(win: boolean, reason: string) {
    if (this.over) return;
    this.over = true;
    this.sfx.stopAllLoops();
    if (win) this.sfx.win(); else this.sfx.lose();
    this.o.onEnd({ win, reason, kills: this.kills, time: this.elapsed });
  }

  private killFoe(f: Foe) {
    if (f.dead) return;
    f.dead = true; this.kills++;
    this.sfx.kill();
    this.burst(f.x, f.y - 30, "#3f7a58", 14, 120);
    this.burst(f.x, f.y - 26, "#c9cfbe", 6, 80);
  }

  private hitFoe(f: Foe, dmg: number, fromX: number) {
    if (f.dead) return;
    if (f.shield > 0 && fromX < f.x) {
      f.shield -= dmg * 1.6;
      if (f.shield <= 0) { f.shield = -1; this.sfx.melt(); this.float(f.x, f.y - 70, "盾毁", "#ff9426"); }
      else { this.sfx.shieldBlock(); return; }
    }
    f.hp -= dmg; f.flash = 0.08;
    if (Math.random() < 0.5) this.sfx.hit();
    if (f.hp <= 0) this.killFoe(f);
  }

  // ---------------- 开火 ----------------
  private aimVec() {
    if (this.vaOn) return { x: this.vax, y: this.vay };
    const dx = this.mx - this.px, dy = this.my - (this.py - 36);
    const l = Math.hypot(dx, dy) || 1;
    return { x: dx / l, y: dy / l };
  }
  private shoot() {
    if (this.fireCd > 0 || this.ammo <= 0) return;
    this.fireCd = this.o.operator === "ass" ? 0.11 : 0.17;
    this.ammo = Math.max(0, this.ammo - 1);
    const a = this.aimVec();
    const sx = this.px + a.x * 26, sy = this.py - 36 + a.y * 10;
    this.shots.push({ x: sx, y: sy, vx: a.x * 620, vy: a.y * 620, l: 1.1, mine: true });
    this.sfx.burst();
    this.doShake(0.07, 2.5);
    this.burst(sx, sy, "#ffb347", 5, 120, true);
    this.face = a.x >= 0 ? 1 : -1;
    if (this.ammo === 0) this.o.onEvent("燃料见底！靠近补给箱拾取", "warn");
  }

  // ---------------- 主循环 ----------------
  private update(dt: number) {
    this.elapsed += dt; this.phaseT += dt;
    this.shake = Math.max(0, this.shake - dt);
    this.flash = Math.max(0, this.flash - dt);
    this.immune = Math.max(0, this.immune - dt);
    this.fireCd = Math.max(0, this.fireCd - dt);

    const firing = this.mouse || this.vfire;
    const fireEdge = firing && !this.prevFire;
    this.prevFire = firing;

    if (this.cineT >= 0) { this.updateCine(dt); this.pushHud(dt); return; }

    if (this.phase === "seize") this.updSeize(dt, firing);
    else if (this.phase === "ride") this.updRide(dt, firing);
    else if (this.phase === "stall") this.updStall(dt, fireEdge);

    this.updParts(dt);
    this.actionEdge = false;
    this.pushHud(dt);
  }

  private updateCine(dt: number) {
    this.cineT += dt;
    this.updParts(dt);
    if (this.cineKind === "toRide" && this.cineT > 2.6) {
      this.cineT = -1; this.phase = "ride"; this.phaseT = 0;
      this.foes = []; this.shots = [];
      this.sfx.engineStart();
      this.sfx.startBgm("battle");
      this.o.onBanner("突围！", "甩开追兵，开到公共厕所", "warn");
      this.o.onEvent("操作：W/S 或左摇杆切换车道，开火压制追兵", "info");
    }
    if (this.cineKind === "toStall" && this.cineT > 2.4) {
      this.cineT = -1; this.phase = "stall"; this.phaseT = 0;
      this.foes = []; this.shots = [];
      this.sfx.engineStop();
      this.sfx.startBgm("prep");
      this.px = 470; this.py = 470;
      this.o.onBanner("进隔间！", "先锁门，再用电报机呼叫总队", "warn");
      this.o.onEvent("操作：按 F / 行动键 闩上门闩", "info");
    }
  }

  // ======================= 阶段一：夺车 =======================
  private updSeize(dt: number, firing: boolean) {
    this.moveFree(dt, 150);
    if (firing) this.shoot();

    // 守卫刷新：总额有限（garrison），打光即可夺车
    this.spawnT -= dt;
    const alive = this.foes.filter((f) => !f.dead).length;
    if (this.spawnT <= 0 && alive < 5 && this.garrison > 0) {
      this.spawnT = rnd(1.1, 2.0);
      const shield = Math.random() < 0.3;
      this.garrison--;
      this.foes.push({
        // 远离摩托生成，避免一出生就压制夺车点
        x: Math.random() > 0.5 ? rnd(930, 980) : rnd(-50, 10), y: rnd(340, 500),
        hp: shield ? 44 : 32, max: shield ? 44 : 32, spd: shield ? 36 : 54,
        t: 0, atk: rnd(0, 1), face: -1, flash: 0, dead: false,
        kind: shield ? "shield" : "guard", shield: shield ? 36 : -1, bubble: "", bubbleT: 0,
      });
    }

    // 守卫 AI：守住摩托
    for (const f of this.foes) {
      if (f.dead) continue;
      f.t += dt; f.flash = Math.max(0, f.flash - dt); f.atk -= dt;
      if (f.bubbleT > 0) f.bubbleT -= dt;
      const distToBike = Math.hypot(f.x - this.bikeX, f.y - this.bikeY);
      let tx = this.px, ty = this.py;
      if (distToBike > 190) { tx = this.bikeX - 60; ty = this.bikeY; }  // 回防
      const dx = tx - f.x, dy = ty - f.y, d = Math.hypot(dx, dy) || 1;
      if (d > 40) { f.x += (dx / d) * f.spd * dt; f.y = clamp(f.y + (dy / d) * f.spd * dt * 0.7, 326, 510); }
      f.face = dx < 0 ? -1 : 1;
      if (d < 46 && f.atk <= 0) { f.atk = 1.1; this.hurt(f.kind === "shield" ? 10 : 8); }
    }
    this.foes = this.foes.filter((f) => !f.dead);
    this.updShots(dt);

    // 掉落补给
    // 夺车进度：守军清空 + 靠近摩托
    const remaining = this.garrison + this.foes.filter((f) => !f.dead).length;
    if (remaining !== this.lastRemaining) {
      this.lastRemaining = remaining;
      if (remaining > 0 && remaining % 3 === 0) this.o.onEvent(`车棚守军剩余 ${remaining} 人`, "info");
      if (remaining === 0) {
        this.o.onBanner("守军已清空！", "冲到摩托旁发动引擎", "good");
        this.o.onEvent("目标：靠近边三轮摩托，按住阵位发动", "good");
      }
    }
    const near = Math.hypot(this.px - this.bikeX, this.py - this.bikeY) < 110;
    if (remaining <= 0 && near) {
      this.capture = Math.min(1, this.capture + dt / 2.2);
      if (Math.random() < dt * 24) this.burst(this.bikeX + rnd(-34, 34), this.bikeY - rnd(0, 30), "#c2a14a", 1, 46, true);
      if (this.capture >= 1) {
        this.capture = 1;
        this.cineT = 0; this.cineKind = "toRide";
        this.sfx.engineStart();
        this.sfx.engineThrottle(0.3);
        this.o.onBanner("摩托到手！", "三人上车——撤！", "good");
        this.doFlash(0.3, "#c2a14a");
      }
    } else if (remaining > 0 && near && Math.random() < dt * 0.9) {
      this.o.onEvent(`仍有 ${remaining} 名守卫，先清场！`, "warn");
    }
  }
  private lastRemaining = -1;

  // ======================= 阶段二：骑乘突围 =======================
  private updRide(dt: number, firing: boolean) {
    this.throttle = Math.min(1, this.throttle + dt * 0.4);
    this.sfx.engineThrottle(0.55 + this.throttle * 0.45);
    const speed = 150 + this.throttle * 110;
    this.dist += speed * dt * 0.75;
    this.roadOff = (this.roadOff + speed * dt * 1.5) % 1920;

    // 换道
    const up = this.keys.has("w") || this.keys.has("arrowup") || this.vmy < -0.5;
    const dn = this.keys.has("s") || this.keys.has("arrowdown") || this.vmy > 0.5;
    this.laneCd -= dt;
    if (this.laneCd <= 0) {
      if (up && this.lane > 0) { this.lane--; this.laneCd = 0.26; this.sfx.skid(); }
      else if (dn && this.lane < 2) { this.lane++; this.laneCd = 0.26; this.sfx.skid(); }
    }
    this.py += (this.laneY[this.lane] - this.py) * Math.min(1, dt * 9);
    this.px = 280;

    if (firing) this.shoot();

    // 追兵（骑扫把的治安队 + 路障）
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = rnd(0.9, 1.7);
      const lane = Math.floor(rnd(0, 3));
      const isBarrier = Math.random() < 0.3;
      this.foes.push({
        x: 1010, y: this.laneY[lane],
        hp: isBarrier ? 30 : 26, max: 30, spd: isBarrier ? 0 : rnd(10, 40),
        t: 0, atk: 1, face: -1, flash: 0, dead: false,
        kind: isBarrier ? "basher" : "chaser", shield: -1, lane, bubble: "", bubbleT: 0,
      });
    }
    for (const f of this.foes) {
      if (f.dead) continue;
      f.t += dt; f.flash = Math.max(0, f.flash - dt);
      // 相对速度：路障静止（被迅速甩来），追兵略慢于我方
      f.x -= (speed - f.spd) * dt;
      if (f.kind === "chaser") f.y += Math.sin(f.t * 3) * 10 * dt;
      // 碰撞
      if (Math.abs(f.x - this.px) < 42 && Math.abs(f.y - this.py) < 34) {
        if (f.kind === "basher") {
          this.hurt(11); this.burst(f.x, f.y - 20, "#a06a3c", 16, 160);
          f.dead = true; this.doShake(0.3, 7);
        } else if (f.atk <= 0) { f.atk = 0.95; this.hurt(6); }
        f.atk -= dt;
      } else f.atk -= dt;
      if (f.x < -80) f.dead = true;
    }
    this.foes = this.foes.filter((f) => !f.dead);
    this.updShots(dt);

    // 尾气与路面飞石
    if (Math.random() < dt * 40) {
      this.parts.push({
        x: this.px - 60, y: this.py - 6 + rnd(-6, 6), vx: rnd(-200, -90), vy: rnd(-24, 6),
        l: rnd(0.3, 0.7), m: 0.7, s: rnd(3, 7), c: Math.random() < 0.3 ? "#6b6f78" : "#3c4049", g: -20, add: false,
      });
    }

    if (this.dist >= this.distMax) {
      this.cineT = 0; this.cineKind = "toStall";
      this.sfx.skid(); this.sfx.engineThrottle(0.1);
      this.o.onBanner("公共厕所到了！", "弃车，冲进隔间", "good");
    }
  }
  private laneCd = 0;

  // ======================= 阶段三：隔间固守 + 发报 =======================
  private updStall(dt: number, fireEdge: boolean) {
    void fireEdge;
    // 砸门敌兵
    this.spawnT -= dt;
    const bashers = this.foes.filter((f) => !f.dead).length;
    if (this.spawnT <= 0 && bashers < 3) {
      this.spawnT = rnd(4.5, 7.5);
      this.foes.push({
        x: rnd(240, 700), y: 300, hp: 999, max: 999, spd: 0, t: 0, atk: rnd(1.2, 2.4),
        face: -1, flash: 0, dead: false, kind: "basher", shield: -1, bubble: "开门！！", bubbleT: 2.4,
      });
      this.sfx.walkie();
    }
    for (const f of this.foes) {
      f.t += dt; f.atk -= dt;
      if (f.bubbleT > 0) f.bubbleT -= dt;
      if (f.atk <= 0) {
        f.atk = rnd(1.6, 2.6);
        if (this.locked) {
          this.doorHp -= this.sent ? 5 : 7;
          this.sfx.bang();
          this.doShake(0.22, 6);
          this.burst(480, 300, "#9fadc0", 8, 90);
          if (this.doorHp <= 0) { this.doorHp = 0; this.end(false, "隔间门被砸开，武装大队被俘"); return; }
        } else {
          this.hurt(14);
          this.sfx.bang();
          if (Math.random() < 0.5) this.o.onEvent("快锁门！（按 F / 空格 / 行动键）", "bad");
        }
      }
    }

    // ---- 锁门 ----
    if (!this.locked) {
      if (this.actionEdge) {
        this.locked = true;
        this.sfx.lockDoor();
        this.doFlash(0.18, "#9fe0b0");
        this.o.onBanner("门闩已锁死", "现在：用电报机呼叫总队支援", "good");
        this.o.onEvent("敲击电键：短符轻点一下，长符按住约半秒", "info");
      }
      return;
    }

    // ---- 等待回电（发报完成后的坚守） ----
    if (this.sent) {
      this.replyT -= dt;
      if (Math.random() < dt * 2.2) this.sfx.key(Math.random() < 0.4, 0.5);
      if (this.replyT <= 0) {
        this.sfx.relay();
        this.end(true, "电文送达，总队十分钟内驰援——撤离成功");
      }
      return;
    }

    // ---- 发报：按提示敲击 ··· ——— ··· ----
    this.morseT += dt;
    if (this.morseIdx >= MORSE_SEQ.length) return;
    const sym = MORSE_SEQ[this.morseIdx];
    if (sym === " ") { this.morseIdx++; this.morseT = 0; return; }

    // 电键输入：鼠标左键 / 触屏开火 / 空格 / F
    const pressed = this.mouse || this.vfire || this.touchKey || this.keys.has(" ") || this.keys.has("f");
    this.morseWin = true;
    if (pressed) {
      this.holdT += dt;
      // 长符达标即时反馈（无需等待松手）
      if (sym === "-" && this.holdT >= 0.42) {
        this.commitSymbol(true);
        this.holdT = 0;
        this.ignoreRelease = true;
      }
    } else if (this.holdT > 0 || this.ignoreRelease) {
      if (this.ignoreRelease) { this.ignoreRelease = false; this.holdT = 0; return; }
      // 判定（宽容）：短符 < 0.34s 均算；长符需 >= 0.3s
      const ok = sym === "-" ? this.holdT >= 0.3 : this.holdT < 0.34;
      if (ok) this.commitSymbol(sym === "-");
      else {
        this.morseFails++;
        this.sfx.deny();
        this.float(470, 196, sym === "-" ? "太短了！长符需按住" : "按太久了！短符轻点", "#ff5140");
        if (this.morseFails % 2 === 0) this.o.onEvent("电键节奏错误，重新敲这一符", "warn");
      }
      this.holdT = 0;
    }
  }
  private holdT = 0;
  private ignoreRelease = false;
  private sent = false;
  private replyT = 4.5;

  private commitSymbol(long: boolean) {
    this.sfx.key(long);
    this.morseIdx++;
    this.morseT = 0;
    this.float(470, 196, long ? "—" : "·", "#c2a14a");
    this.burst(650, 470, "#ffe9a8", 4, 60, true);
    if (this.morseIdx >= MORSE_SEQ.length && !this.sent) {
      this.sent = true;
      this.replyT = 4.5;
      this.sfx.relay();
      this.o.onBanner("电文已发出！", "总队回电中——顶住最后几秒！", "good");
      this.o.onEvent("SOS 已送出，坚守待援", "good");
    }
  }

  // ---------------- 公共子系统 ----------------
  private moveFree(dt: number, base: number) {
    let vx = 0, vy = 0;
    if (this.keys.has("w") || this.keys.has("arrowup")) vy -= 1;
    if (this.keys.has("s") || this.keys.has("arrowdown")) vy += 1;
    if (this.keys.has("a") || this.keys.has("arrowleft")) vx -= 1;
    if (this.keys.has("d") || this.keys.has("arrowright")) vx += 1;
    vx += this.vmx; vy += this.vmy;
    const m = Math.hypot(vx, vy), l = m || 1;
    const spd = base * Math.min(1, m) * (this.o.operator === "ass" ? 1.25 : this.o.operator === "elec" ? 0.82 : 1);
    this.px = clamp(this.px + (vx / l) * spd * dt, 40, 920);
    this.py = clamp(this.py + (vy / l) * spd * dt, 326, 510);
    this.anim += dt * (m > 0.05 ? 1 : 0.35);
    if (this.vaOn) this.face = this.vax >= 0 ? 1 : -1;
    else this.face = this.mx >= this.px ? 1 : -1;
  }

  private updShots(dt: number) {
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const s = this.shots[i];
      s.x += s.vx * dt; s.y += s.vy * dt; s.l -= dt;
      if (Math.random() < 0.6) this.parts.push({ x: s.x, y: s.y, vx: 0, vy: 0, l: 0.14, m: 0.14, s: 4, c: "#ffb347", g: 0, add: true });
      let hit = false;
      for (const f of this.foes) {
        if (f.dead) continue;
        if (Math.abs(f.x - s.x) < 20 && Math.abs(f.y - 32 - s.y) < 32) {
          this.hitFoe(f, this.o.operator === "ass" ? 15 : 19, s.x);
          this.burst(s.x, s.y, "#ff9426", 7, 110, true);
          hit = true; break;
        }
      }
      if (hit || s.l <= 0 || s.x < -20 || s.x > W + 20 || s.y < 0 || s.y > H) this.shots.splice(i, 1);
    }
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
      f.l -= dt; f.y -= 40 * dt;
      if (f.l <= 0) this.floats.splice(i, 1);
    }
  }

  private pushHud(dt: number) {
    this.hudT += dt;
    if (this.hudT < 0.1) return;
    this.hudT = 0;
    const rem = this.garrison + this.foes.filter((f) => !f.dead).length;
    const obj =
      this.phase === "seize"
        ? (rem > 0 ? `清除车棚守军（剩 ${rem} 人）` : "冲向摩托 · 发动引擎")
        : this.phase === "ride" ? "骑乘突围 · 抵达公共厕所"
          : !this.locked ? "闩上隔间门闩（F / 空格 / 行动键）"
            : this.sent ? "电文已发出 · 坚守待援" : "按电键发送摩斯电文 S O S";
    const prog =
      this.phase === "seize"
        ? (rem > 0 ? 1 - rem / 10 : 0.999 * 0 + this.capture)
        : this.phase === "ride" ? clamp(this.dist / this.distMax, 0, 1)
          : this.sent ? clamp(1 - this.replyT / 4.5, 0, 1)
            : this.locked ? this.morseIdx / MORSE_SEQ.length : 0;
    this.o.onHud({
      phase: this.phase, objective: obj, progress: prog,
      hp: Math.ceil(this.hp), hpMax: this.hpMax,
      ammo: this.ammo, ammoMax: this.ammoMax,
      doorHp: Math.ceil(this.doorHp), doorMax: this.doorMax,
      locked: this.locked,
      morse: { pattern: MORSE_SEQ, idx: this.morseIdx, window: this.morseWin },
      dist: Math.floor(this.dist), distMax: this.distMax,
      kills: this.kills, enemies: this.foes.filter((f) => !f.dead).length,
      timer: this.elapsed,
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

    if (this.phase === "seize" || (this.cineT >= 0 && this.cineKind === "toRide")) this.drawSeize();
    else if (this.phase === "ride" || (this.cineT >= 0 && this.cineKind === "toStall")) this.drawRide();
    else this.drawStall();

    // 粒子
    for (const p of this.parts) {
      if (p.add) c.globalCompositeOperation = "lighter";
      c.globalAlpha = clamp(p.l / p.m, 0, 1);
      c.fillStyle = p.c;
      const s = Math.max(1, p.s);
      c.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s);
      c.globalCompositeOperation = "source-over";
    }
    c.globalAlpha = 1;
    // 浮字
    for (const f of this.floats) {
      c.globalAlpha = clamp(f.l * 1.5, 0, 1);
      drawPixelText(c, f.t, f.x, f.y, { size: 12, color: f.c, scale: 3, center: true });
      c.globalAlpha = 1;
    }
    c.restore();

    // 硬核后期：暗角 + 颗粒
    const vg = c.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.92);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.62)");
    c.fillStyle = vg; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) {
      c.fillStyle = `rgba(255,255,255,${Math.random() * 0.035})`;
      c.fillRect(Math.random() * W, Math.random() * H, 2, 2);
    }
    if (this.flash > 0) {
      c.globalAlpha = clamp(this.flash * 1.8, 0, 0.85);
      c.fillStyle = this.flashC; c.fillRect(0, 0, W, H);
      c.globalAlpha = 1;
    }
    if (this.immune > 0.2 && Math.floor(this.immune * 12) % 2 === 0) {
      c.fillStyle = "rgba(170,20,16,0.14)"; c.fillRect(0, 0, W, H);
    }
  }

  private drawPlayer(scale = 3) {
    const c = this.ctx;
    c.fillStyle = "rgba(0,0,0,0.4)";
    c.fillRect(this.px - 17, this.py - 4, 34, 8);
    const blink = this.immune > 0 && Math.floor(this.immune * 14) % 2 === 0;
    if (blink) c.globalAlpha = 0.5;
    const name = (Math.floor(this.anim * 6) % 2 === 0 ? this.sprA : this.sprB) as "elecA";
    // 手中喷枪
    drawSpr(c, "gunGas", this.px + this.face * 22, this.py - 34, { anchor: "c", flip: this.face === -1, scale: 2.6 });
    drawSpr(c, name, this.px, this.py, { flip: this.face === -1, scale });
    c.globalAlpha = 1;
  }

  private drawFoe(f: Foe, scale = 2.9) {
    const c = this.ctx;
    c.fillStyle = "rgba(0,0,0,0.38)";
    c.fillRect(f.x - 15, f.y - 3, 30, 7);
    const fr = Math.floor(f.t * 6) % 2 === 0 ? "soldA" : "soldB";
    drawSpr(c, "mopV", f.x + f.face * 12, f.y - 34, { anchor: "c", flip: f.face === 1, scale: 2.4, white: f.flash > 0.03 });
    drawSpr(c, fr, f.x, f.y, { flip: f.face === 1, scale, white: f.flash > 0.03 });
    if (f.shield > 0) drawSpr(c, "shield", f.x + f.face * 18, f.y - 26, { anchor: "c", scale: 2.8, white: f.flash > 0.03 });
    if (f.hp < f.max) {
      c.fillStyle = "#0e1014"; c.fillRect(f.x - 16, f.y - 76, 32, 5);
      c.fillStyle = "#b5362a"; c.fillRect(f.x - 15, f.y - 75, 30 * clamp(f.hp / f.max, 0, 1), 3);
    }
    if (f.bubbleT > 0 && f.bubble) {
      drawPixelText(c, f.bubble, f.x, f.y - 104, { size: 10, color: "#e8e4d4", scale: 2, center: true, bg: "rgba(10,12,16,0.85)" });
    }
  }

  // ---- 阶段一画面 ----
  private drawSeize() {
    const c = this.ctx;
    c.drawImage(this.bgYard, 0, 0);
    // 其它自行车（装饰）
    for (let i = 0; i < 5; i++) {
      const bx = 130 + i * 118;
      c.fillStyle = "#1c1f27";
      c.fillRect(bx, 372, 46, 5);
      c.fillRect(bx + 4, 352, 4, 22);
      c.fillRect(bx + 36, 350, 4, 24);
      c.strokeStyle = "#2b303a"; c.lineWidth = 3;
      c.beginPath(); c.arc(bx + 6, 382, 10, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.arc(bx + 40, 382, 10, 0, Math.PI * 2); c.stroke();
    }
    // 边三轮摩托（目标）
    const frame = this.capture > 0 && this.capture < 1 && Math.floor(this.phaseT * 10) % 2 === 0 ? "motoB" : "motoA";
    drawSpr(c, frame, this.bikeX, this.bikeY + 26, { anchor: "bc", scale: 3.2 });
    // 目标标识
    if (this.capture < 1) {
      const bob = Math.sin(this.phaseT * 4) * 4;
      drawPixelText(c, "▼ 目标载具", this.bikeX, this.bikeY - 86 + bob, { size: 11, color: "#f2b53d", scale: 2, center: true });
      if (this.capture > 0) {
        c.fillStyle = "#0e1014"; c.fillRect(this.bikeX - 60, this.bikeY - 62, 120, 12);
        c.fillStyle = "#f2b53d"; c.fillRect(this.bikeX - 58, this.bikeY - 60, 116 * this.capture, 8);
        drawPixelText(c, "发动中…", this.bikeX, this.bikeY - 84, { size: 10, color: "#ffe9a8", scale: 2, center: true });
      }
    }
    // 实体排序
    const list: { y: number; fn: () => void }[] = this.foes.map((f) => ({ y: f.y, fn: () => this.drawFoe(f) }));
    list.push({ y: this.py, fn: () => this.drawPlayer() });
    list.sort((a, b) => a.y - b.y).forEach((e) => e.fn());
    // 弹丸
    this.drawShots();
    // 过场：三人上车
    if (this.cineT >= 0 && this.cineKind === "toRide") {
      const k = Math.min(this.cineT / 1.2, 1);
      drawSpr(c, "medA", this.bikeX - 40 + k * 10, this.bikeY + 10, { scale: 2.6, alpha: 1 - k * 0.2 });
      drawSpr(c, "assA", this.bikeX + 40 - k * 10, this.bikeY + 14, { scale: 2.6, alpha: 1 - k * 0.2 });
      if (this.cineT > 1.2) {
        for (let i = 0; i < 2; i++) this.burst(this.bikeX - 70, this.bikeY + 8, "#4a4f58", 1, 60);
      }
      drawPixelText(c, "全体上车！！", W / 2, 150, { size: 16, color: "#f2b53d", scale: 3, center: true, bg: "rgba(10,12,16,0.8)" });
    }
  }

  private drawShots() {
    const c = this.ctx;
    for (const s of this.shots) {
      c.save();
      c.globalCompositeOperation = "lighter";
      c.fillStyle = "#ff8a2b";
      c.fillRect(s.x - 7, s.y - 3, 14, 6);
      c.fillStyle = "#ffe9a8";
      c.fillRect(s.x - 3, s.y - 2, 7, 4);
      c.restore();
    }
  }

  // ---- 阶段二画面 ----
  private drawRide() {
    const c = this.ctx;
    const off = this.roadOff;
    c.drawImage(this.bgRoad, -off, 0);
    c.drawImage(this.bgRoad, 1920 - off, 0);
    // 车道虚线强调
    for (const ly of this.laneY) {
      c.fillStyle = "rgba(0,0,0,0.18)";
      c.fillRect(0, ly + 26, W, 3);
    }
    // 敌人与障碍
    for (const f of this.foes) {
      if (f.kind === "basher") {
        // 路障：垃圾桶/课桌
        drawSpr(c, "desk", f.x, f.y + 20, { anchor: "bc", scale: 2.4 });
        drawPixelText(c, "!", f.x, f.y - 72, { size: 14, color: "#ff5140", scale: 2, center: true });
      } else {
        this.drawFoe(f, 2.7);
      }
    }
    // 我方摩托（侧视，三人同乘）
    const bob = Math.sin(this.elapsed * 22) * 2;
    const mx = this.px, my = this.py + bob;
    drawSpr(c, Math.floor(this.elapsed * 22) % 2 === 0 ? "motoA" : "motoB", mx, my + 28, { anchor: "bc", scale: 3 });
    // 驾驶者 & 乘员
    drawSpr(c, (Math.floor(this.anim * 6) % 2 === 0 ? this.sprA : this.sprB) as "elecA", mx + 6, my - 2, { scale: 2.6 });
    drawSpr(c, "medA", mx - 44, my + 6, { scale: 2.2, alpha: 0.96 });
    drawSpr(c, "assA", mx + 46, my - 4, { scale: 2.2, alpha: 0.96 });
    drawSpr(c, "gunGas", mx + 34 + this.face * 10, my - 36, { anchor: "c", flip: this.face === -1, scale: 2.4 });
    this.drawShots();

    // 里程 HUD（画布内硬核仪表）
    const prog = clamp(this.dist / this.distMax, 0, 1);
    c.fillStyle = "rgba(10,12,16,0.8)";
    c.fillRect(W / 2 - 180, 52, 360, 26);
    c.fillStyle = "#2c3242"; c.fillRect(W / 2 - 174, 58, 348, 14);
    c.fillStyle = "#c2a14a"; c.fillRect(W / 2 - 174, 58, 348 * prog, 14);
    drawPixelText(c, `撤离进度 ${Math.floor(prog * 100)}%`, W / 2, 28, { size: 11, color: "#e8e4d4", scale: 2, center: true });
    // 终点厕所出现
    if (prog > 0.84) {
      const tx = W + 200 - (prog - 0.84) / 0.16 * 540;
      c.fillStyle = "#4a4f45"; c.fillRect(tx, 210, 190, 170);
      c.fillStyle = "#333830"; c.fillRect(tx + 12, 250, 60, 130);
      c.fillStyle = "#6b7260"; c.fillRect(tx, 196, 190, 18);
      drawPixelText(c, "公共厕所", tx + 95, 220, { size: 12, color: "#dfe3d2", scale: 2, center: true });
    }
    if (this.cineT >= 0 && this.cineKind === "toStall") {
      drawPixelText(c, "弃车！进隔间！", W / 2, 150, { size: 16, color: "#f2b53d", scale: 3, center: true, bg: "rgba(10,12,16,0.8)" });
    }
  }

  // ---- 阶段三画面 ----
  private drawStall() {
    const c = this.ctx;
    c.drawImage(this.bgLav, 0, 0);
    // 门外砸门者剪影
    for (const f of this.foes) {
      const sway = Math.sin(f.t * 6) * 4;
      c.globalAlpha = 0.5;
      drawSpr(c, Math.floor(f.t * 5) % 2 === 0 ? "soldA" : "soldB", f.x + sway, 420, { scale: 3.4, alpha: 0.5 });
      c.globalAlpha = 1;
      if (f.bubbleT > 0) {
        drawPixelText(c, f.bubble, f.x, 250, { size: 11, color: "#ff8f7a", scale: 2, center: true, bg: "rgba(10,12,16,0.8)" });
      }
    }
    // 隔间门（前景）
    const shakeX = this.doorHp < this.doorMax && Math.random() < 0.2 ? rnd(-2, 2) : 0;
    drawSpr(c, "stallDoor", 480 + shakeX, 460, { anchor: "bc", scale: 15 });
    // 门损伤裂纹
    const dmg = 1 - this.doorHp / this.doorMax;
    if (dmg > 0.2) {
      c.strokeStyle = "rgba(10,12,16,0.9)"; c.lineWidth = 3;
      c.beginPath(); c.moveTo(390, 200); c.lineTo(430, 280); c.lineTo(400, 350); c.stroke();
      if (dmg > 0.5) { c.beginPath(); c.moveTo(560, 180); c.lineTo(520, 270); c.lineTo(566, 360); c.stroke(); }
      if (dmg > 0.75) { c.beginPath(); c.moveTo(360, 400); c.lineTo(600, 430); c.stroke(); }
    }
    // 门闩
    drawSpr(c, this.locked ? "latchLocked" : "latchOpen", 638, 300, { anchor: "c", scale: 4 });
    drawPixelText(c, this.locked ? "已闩死" : "门闩未锁！", 638, 248, {
      size: 11, color: this.locked ? "#8fd6a0" : "#ff5140", scale: 2, center: true, bg: "rgba(10,12,16,0.75)",
    });

    // 玩家（背对，蹲在隔间内）
    drawSpr(c, (Math.floor(this.anim * 3) % 2 === 0 ? this.sprA : this.sprB) as "elecA", 330, 510, { scale: 3.2 });
    // 电报机
    drawSpr(c, "telegraph", 650, 512, { anchor: "bc", scale: 4 });
    // 队友
    drawSpr(c, "medA", 250, 520, { scale: 2.8, alpha: 0.95 });
    drawSpr(c, "assA", 760, 516, { scale: 2.8, flip: true, alpha: 0.95 });

    if (!this.locked) {
      const pulse = Math.sin(this.phaseT * 8) * 0.5 + 0.5;
      c.globalAlpha = 0.4 + pulse * 0.5;
      drawPixelText(c, "按 F / 行动键 锁门！", W / 2, 120, { size: 15, color: "#ff5140", scale: 3, center: true, bg: "rgba(10,12,16,0.85)" });
      c.globalAlpha = 1;
    } else if (this.morseIdx < MORSE_SEQ.length) {
      // 摩斯提示条
      const bx = W / 2 - 170;
      c.fillStyle = "rgba(10,12,16,0.85)";
      c.fillRect(bx - 14, 92, 368, 72);
      c.strokeStyle = "#c2a14a"; c.lineWidth = 3;
      c.strokeRect(bx - 14, 92, 368, 72);
      drawPixelText(c, "发 报 中 · S O S", W / 2, 100, { size: 11, color: "#c2a14a", scale: 2, center: true });
      let dx = bx;
      for (let i = 0; i < MORSE_SEQ.length; i++) {
        const ch = MORSE_SEQ[i];
        if (ch === " ") { dx += 16; continue; }
        const done = i < this.morseIdx;
        const cur = i === this.morseIdx;
        const wdt = ch === "-" ? 26 : 12;
        c.fillStyle = done ? "#8fd6a0" : cur ? (Math.floor(this.phaseT * 6) % 2 === 0 ? "#ffe9a8" : "#c2a14a") : "#4a5160";
        c.fillRect(dx, 130, wdt, 14);
        if (cur) { c.strokeStyle = "#fff"; c.lineWidth = 2; c.strokeRect(dx - 3, 127, wdt + 6, 20); }
        dx += wdt + 8;
      }
      const sym = MORSE_SEQ[this.morseIdx];
      drawPixelText(c, sym === "-" ? "长按电键（—）" : "轻点电键（·）", W / 2, 166, {
        size: 11, color: "#e8e4d4", scale: 2, center: true, bg: "rgba(10,12,16,0.8)",
      });
      // 按压指示
      if (this.holdT > 0) {
        c.fillStyle = "#c2a14a";
        c.fillRect(W / 2 - 60, 192, Math.min(120, this.holdT * 300), 8);
      }
    } else {
      drawPixelText(c, "电文已发出 · 等待回电…", W / 2, 110, { size: 14, color: "#8fd6a0", scale: 3, center: true, bg: "rgba(10,12,16,0.85)" });
      // 回电倒计时条
      const k = clamp(1 - this.replyT / 4.5, 0, 1);
      c.fillStyle = "rgba(10,12,16,0.85)"; c.fillRect(W / 2 - 150, 158, 300, 22);
      c.strokeStyle = "#8fd6a0"; c.lineWidth = 2; c.strokeRect(W / 2 - 150, 158, 300, 22);
      c.fillStyle = "#8fd6a0"; c.fillRect(W / 2 - 146, 162, 292 * k, 14);
      drawPixelText(c, "坚守", W / 2, 188, { size: 10, color: "#c2a14a", scale: 2, center: true });
    }

    // 门耐久条
    c.fillStyle = "rgba(10,12,16,0.8)";
    c.fillRect(W / 2 - 150, H - 46, 300, 24);
    drawPixelText(c, "隔间门", W / 2 - 134, H - 44, { size: 10, color: "#8fa3c8", scale: 2 });
    c.fillStyle = "#2c3242"; c.fillRect(W / 2 - 60, H - 40, 196, 12);
    c.fillStyle = this.doorHp / this.doorMax > 0.35 ? "#9fadc0" : "#b5362a";
    c.fillRect(W / 2 - 60, H - 40, 196 * clamp(this.doorHp / this.doorMax, 0, 1), 12);
  }
}
