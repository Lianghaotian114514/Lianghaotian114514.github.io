// ============================================================
// 八五班门线保卫战 —— 核心引擎
// ============================================================
import {
  SPR, drawSpr, drawPixelText, buildBackground,
  W, H, FLOOR_TOP, FLOOR_BOT, DOOR_FRONT, PIX,
} from "./sprites";
import type { SFX } from "./audio";
import {
  loadMods, computeStats, addBank, loadLoadout, weaponStats,
  THROWABLE_BY_ID,
} from "./mods";
import type { ModStats, ModWeapon, Loadout, ThrowableDef } from "./mods";

export type OperatorId = "elec" | "ass" | "med";
export type WeaponId = "gas" | "laser" | "melee" | "hydro" | "stapler" | "rifle" | "eraser" | "lamp" | "bomb";
export type Tone = "info" | "good" | "bad" | "warn";

export interface OperatorMeta {
  id: OperatorId;
  name: string;
  title: string;
  desc: string;
  ability: string;
  abilityDesc: string;
  hp: number;
  spd: number;
  sprA: keyof typeof SPR;
  sprB: keyof typeof SPR;
  color: string;
  traits: string[];
}

export const OPERATORS: OperatorMeta[] = [
  {
    id: "elec",
    name: "牢电工",
    title: "工程类 · 重装",
    desc: "班里的电路权威，据说能徒手修好坏掉的投影仪。皮糙肉厚，步履沉稳。",
    ability: "电动车电池",
    abilityDesc: "投掷一块改装电瓶，给地板通电：范围内敌人持续触电、麻痹减速（无视簸箕盾）",
    hp: 230, spd: 0.75,
    sprA: "elecA", sprB: "elecB",
    color: "#f2b53d",
    traits: ["血量 极高", "移速 缓慢", "技能 范围控场"],
  },
  {
    id: "ass",
    name: "樊某某",
    title: "突击类 · 疾风",
    desc: "整层楼跑最快的人，冲食堂从无败绩。火力凶猛，但肺不太好。",
    ability: "哮喘隐患（被动）",
    abilityDesc: "射速大幅加成，但持续开火会积累喘息值，满值必须停下使用抗哮喘药",
    hp: 115, spd: 1.32,
    sprA: "assA", sprB: "assB",
    color: "#d53a26",
    traits: ["血量 偏低", "移速 极快", "射速 +45%"],
  },
  {
    id: "med",
    name: "李听远",
    title: "医疗类 · 圣手",
    desc: "医务室常驻嘉宾，包扎手法出神入化，创可贴储备量全年级第一。",
    ability: "极速急救包",
    abilityDesc: "以极其夸张的速度为自己回血：原地引导 1 秒，血量飞速回满（移动会打断）",
    hp: 135, spd: 1.0,
    sprA: "medA", sprB: "medB",
    color: "#57d6e6",
    traits: ["血量 中等", "移速 标准", "脱战缓慢回血"],
  },
];

export interface SupplyItem {
  id: string; name: string; price: number; delay: number;
  desc: string; icon: keyof typeof SPR; once?: boolean;
}

export const SUPPLIES: SupplyItem[] = [
  { id: "mag_gas", name: "燃气罐", price: 30, delay: 4, desc: "GAS喷枪备用罐 ×1", icon: "gunGas" },
  { id: "mag_laser", name: "激光电池", price: 25, delay: 4, desc: "激光笔备用电池 ×1", icon: "gunLaser" },
  { id: "mag_hydro", name: "压缩水囊", price: 28, delay: 4, desc: "高压水枪备用水囊 ×1", icon: "gunHydro" },
  { id: "mag_stapler", name: "订书钉盒", price: 34, delay: 4, desc: "钉书机机枪弹匣 ×1", icon: "gunStapler" },
  { id: "mag_rifle", name: "粉笔弹夹", price: 42, delay: 5, desc: "粉笔狙击枪弹夹 ×1", icon: "gunChalkRifle" },
  { id: "mag_eraser", name: "擦头弹带", price: 38, delay: 5, desc: "黑板擦霰弹枪弹带 ×1", icon: "gunEraser" },
  { id: "mag_lamp", name: "蓄电池组", price: 40, delay: 5, desc: "台灯激光炮电池组 ×1", icon: "gunLampCannon" },
  { id: "med", name: "急救包", price: 45, delay: 5, desc: "立即恢复 90 HP", icon: "medkit" },
  { id: "desk", name: "课桌路障", price: 60, delay: 7, desc: "空投课桌堵路（180HP）", icon: "desk" },
  { id: "upg", name: "武器强化", price: 100, delay: 6, desc: "全武器伤害 +20%（至多3次）", icon: "gunCompass" },
  { id: "bomb", name: "臭水弹", price: 300, delay: 10, desc: "超级武器：发射即胜利——除非它自爆（50%）", icon: "bomb", once: true },
];

export interface HudState {
  hp: number; hpMax: number; door: number; doorMax: number;
  fuel: number; fuelMax: number; bat: number; batMax: number;
  water: number; waterMax: number;
  slots: { id: WeaponId; ammo: number; ammoMax: number; mags: number; magMax: number }[];
  reloading: number;   // 换弹进度 0..1，<0 表示未在换弹
  throwName: string; throwLeft: number; throwCd: number;
  weapon: WeaponId; funds: number; timeLeft: number;
  abilityCd: number; abilityMax: number; asthma: number; // asthma <0 表示无此机制
  stink: "none" | "incoming" | "ready" | "used";
  pending: { id: string; name: string; t: number; total: number }[];
  upgrades: number; wave: number; bossHp: number; bossMax: number;
  kills: number; enemyCount: number;
}

export interface EndStats {
  win: boolean; reason: "survive" | "bomb" | "down" | "door" | "boom";
  kills: number; dmg: number; funds: number; time: number;
}

interface Opts {
  operator: OperatorId;
  sfx: SFX;
  onHud: (h: HudState) => void;
  onEvent: (msg: string, tone?: Tone) => void;
  onBanner: (title: string, sub: string, tone?: Tone) => void;
  onEnd: (s: EndStats) => void;
  onToggleTelegraph: () => void;
  onTogglePause: () => void;
}

// ---------- 内部类型 ----------
interface Enemy {
  id: number; type: "soldier" | "shield" | "chariot" | "boss";
  x: number; y: number; hp: number; maxHp: number;
  shield: number; // -1 = 无盾
  spd: number; atkT: number; windT: number;
  blindT: number; burnT: number; burnAcc: number; slowT: number;
  animT: number; face: -1 | 1; hitFlash: number;
  wanderX: number; wanderY: number;
  heatT: number; headT: number; laserId: number;
  lobT: number; walkieT: number;
  dmgAcc: number; dmgAccT: number;
  bubble: string; bubbleT: number;
  flee: boolean; dead: boolean;
  swingAnim: number;
  targetX: number; targetY: number; targetKind: "player" | "door" | "desk"; targetDesk: Desk | null;
  ranged: boolean; // 粉笔投手变体
}

interface Desk { x: number; y: number; hp: number; maxHp: number; }
interface Particle {
  x: number; y: number; vx: number; vy: number; life: number; max: number;
  size: number; color: string; grav: number; add: boolean; drag: number;
}
interface FloatText { x: number; y: number; vy: number; life: number; text: string; color: string; big: boolean; }
interface Proj {
  kind: "stinkball" | "battery" | "bomb" | "crate" | "chalk";
  x: number; y: number; sx: number; sy: number; tx: number; ty: number;
  t: number; dur: number; payload?: string;
}
interface Zone { kind: "electric" | "pool"; x: number; y: number; r: number; t: number; tick: number; }

const HAND = { x: 15, y: -36 };
const DURATION = 240;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

const WAVE_FLAVOR = [
  "治安队完成集结，第一轮冲锋开始！",
  "对讲机：『拖把连，压上去！』装备秒到账，真便宜……",
  "簸箕盾队加入战场！喷枪可以融化它们",
  "敌方人海规模扩大！注意大门血量",
  "化学拖把战车驶出车库——小心恶臭抛物",
  "治安队长的对讲机又响了：『全员压上！』",
  "放学前总攻！顶住这最后的人海！",
  "最后一分钟！胜利就在眼前！",
];

// ============================================================
export class Game {
  /** 激光笔射程：判定与渲染共用 */
  static readonly LASER_RANGE = 620;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private bg: HTMLCanvasElement;
  private o: Opts;
  private sfx: SFX;
  private meta: OperatorMeta;

  private raf = 0;
  private last = 0;
  private destroyed = false;

  phase: "play" | "cine" | "over" = "play";
  paused = false;
  telegraphOpen = false;

  private elapsed = 0;
  private shakeT = 0; private shakeMag = 0;
  private flashT = 0; private flashColor = "#ffffff";
  private cineT = 0; private cineKind = "";
  private bombRoll = false; private bombFuse = 0;

  // 输入
  private keys = new Set<string>();
  private mx = W * 0.6; private my = H * 0.6;
  private mouseDown = false;
  // 触屏虚拟摇杆
  private vMoveX = 0; private vMoveY = 0;
  private vAimX = 1; private vAimY = 0; private vAimOn = false;
  private vFire = false;
  private prevFire = false;
  private gasHoldT = 0; private gasStreaming = false;
  private meleeCd = 0; private meleeAnim = 0; private meleeHitDone = true;
  private laserOn = false;
  private burstCd = 0;
  private flameTick = 0;

  // 玩家
  private px = 200; private py = 440;
  private hp: number; private hpMax: number;
  private doorHp = 300; private doorMax = 300;
  private face: 1 | -1 = 1;
  private fuel = 100; private fuelMax = 100;
  private bat = 100; private batMax = 100;
  private water = 100; private waterMax = 100;
  private hydroOn = false; private hydroTick = 0;
  private loadout: Loadout = loadLoadout();
  private slotAmmo = new Map<WeaponId, number>();
  private slotMax = new Map<WeaponId, number>();
  private shotCd = 0;
  /** 武装带：每款武器最多 3 个备用弹匣 */
  private mags = new Map<WeaponId, number>();
  static readonly MAG_CAP = 3;
  private autoReloadT = 0;
  private reloadT = 0; private reloadDur = 0; private reloadWeapon: WeaponId | null = null;
  /** 狙击开镜 */
  private ads = 0;              // 0..1 开镜程度
  private adsHold = false;
  private breath = 0;
  private thrDef: ThrowableDef | null = null;
  private thrLeft = 0; private thrCd = 0;
  private bullets: {
    x: number; y: number; vx: number; vy: number; life: number; maxLife: number;
    dmg: number; pierce: boolean; hit: Set<number>; kind: WeaponId; bounce: number;
    spin: number; seed: number; sub: number;   // spin=翻滚角, seed=随机种, sub=子类型
  }[] = [];
  private nades: {
    x: number; y: number; sx: number; sy: number; tx: number; ty: number;
    t: number; dur: number; kind: string;
  }[] = [];
  private zonesFx: { x: number; y: number; r: number; t: number; max: number; kind: string; tick: number }[] = [];
  private mod: ModStats = computeStats(loadMods());
  private weapon: WeaponId = "gas";
  private funds = 70;
  private upgrades = 0;
  private stink: HudState["stink"] = "none";
  private abilityCd = 0;
  private abilityMax = 0;
  private asthma = 0; private asthmaLock = 0;
  private healChannel = 0;
  private regenT = 0;
  private immuneT = 0;
  private hurtVign = 0;
  private animT = 0; private moving = false;

  private enemies: Enemy[] = [];
  private desks: Desk[] = [];
  private parts: Particle[] = [];
  private floats: FloatText[] = [];
  private projs: Proj[] = [];
  private zones: Zone[] = [];
  private pending: HudState["pending"] = [];

  private spawnT = 2.0;
  private chariotT = 30;
  private walkieT = 20;
  private waveIdx = 0;
  private bossSpawned = false;
  private bossRespawnT = 70;
  private enemySeq = 1;

  private kills = 0; private dmgDealt = 0; private fundsEarned = 70;

  private hudT = 0;

  constructor(canvas: HTMLCanvasElement, o: Opts) {
    this.canvas = canvas;
    this.o = o;
    this.sfx = o.sfx;
    this.meta = OPERATORS.find((m) => m.id === o.operator)!;
    this.hp = this.meta.hp; this.hpMax = this.meta.hp;
    this.mod = computeStats(loadMods());
    this.fuelMax = this.mod.fuelMax; this.fuel = this.fuelMax;
    this.batMax = this.mod.batMax; this.bat = this.batMax;
    this.waterMax = this.mod.waterMax; this.water = this.waterMax;
    // 出战编成
    this.loadout = loadLoadout();
    const mset = loadMods();
    for (const w of this.loadout.weapons) {
      if (w === "gas" || w === "laser" || w === "hydro") continue;
      const ws = weaponStats(w as ModWeapon, mset);
      this.slotMax.set(w as WeaponId, ws.ammoMax);
      this.slotAmmo.set(w as WeaponId, ws.ammoMax);
      this.mags.set(w as WeaponId, 1);
    }
    // 三条主武器线（燃气/电池/水）同样采用弹匣制
    for (const w of ["gas", "laser", "hydro"] as WeaponId[]) {
      if (this.loadout.weapons.includes(w as never)) this.mags.set(w, 1);
    }
    this.weapon = (this.loadout.weapons[0] as WeaponId) ?? "gas";
    this.thrDef = THROWABLE_BY_ID.get(this.loadout.throwable) ?? null;
    this.thrLeft = this.thrDef?.count ?? 0;
    this.abilityMax = o.operator === "elec" ? 13 : o.operator === "med" ? 8 : 0;
    canvas.width = W; canvas.height = H;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
    this.bg = buildBackground();
    this.bind();
  }

  // ---------------- 输入绑定 ----------------
  private onKeyDown = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
    if (e.repeat) return;
    this.keys.add(k);
    if (k === "escape") { this.o.onTogglePause(); return; }
    if (this.phase !== "play" || this.paused) return;
    if (k === "e") { this.o.onToggleTelegraph(); return; }
    const slots = this.weaponSlots();
    if (k >= "1" && k <= "5") {
      const i = parseInt(k, 10) - 1;
      if (i < slots.length) this.switchWeapon(slots[i]);
    }
    if (k === "g") this.throwNade();
    if (k === "r") this.reload();
    if (k === "q" || k === " ") this.useAbility();
  };
  private onKeyUp = (e: KeyboardEvent) => { this.keys.delete(e.key.toLowerCase()); };
  private onMouseMove = (e: MouseEvent) => {
    const r = this.canvas.getBoundingClientRect();
    this.mx = clamp(((e.clientX - r.left) / r.width) * W, 0, W);
    this.my = clamp(((e.clientY - r.top) / r.height) * H, 0, H);
  };
  private onMouseDown = (e: MouseEvent) => {
    if (e.button === 2) { this.adsHold = true; return; }   // 右键开镜
    if (e.button !== 0) return;
    // 画布上进行时才生效（DOM 按钮点击不受影响）
    this.mouseDown = true;
  };
  private onMouseUp = (e: MouseEvent) => {
    if (e.button === 2) { this.adsHold = false; return; }
    if (e.button !== 0) return;
    this.mouseDown = false;
  };
  private onCtx = (e: Event) => e.preventDefault();
  private onBlur = () => { if (this.phase === "play" && !this.paused) this.o.onTogglePause(); };

  private bind() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("mousemove", this.onMouseMove);
    this.canvas.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mouseup", this.onMouseUp);
    this.canvas.addEventListener("contextmenu", this.onCtx);
    window.addEventListener("blur", this.onBlur);
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("mousemove", this.onMouseMove);
    this.canvas.removeEventListener("mousedown", this.onMouseDown);
    window.removeEventListener("mouseup", this.onMouseUp);
    this.canvas.removeEventListener("contextmenu", this.onCtx);
    window.removeEventListener("blur", this.onBlur);
    this.sfx.stopAllLoops();
  }

  start() {
    this.o.onBanner("守住八五班大门！", "坚持到放学铃声响起", "warn");
    this.o.onEvent("昆虫组武装大队进入阵地", "info");
    this.o.onEvent("电报机已接通总部（按 E 呼叫支援）", "good");
    this.last = performance.now();
    const loop = (ts: number) => {
      if (this.destroyed) return;
      const dt = Math.min((ts - this.last) / 1000, 0.05);
      this.last = ts;
      if (!this.paused && this.phase !== "over") {
        this.update(dt);
      }
      this.render();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  /** 当前可用武器槽：编成武器 + 圆规 + （就绪的）臭水弹 */
  weaponSlots(): WeaponId[] {
    const arr = this.loadout.weapons.slice() as WeaponId[];
    arr.push("melee");
    if (this.stink === "ready") arr.push("bomb");
    return arr;
  }

  // ---------------- 对外接口 ----------------
  /** 触屏：左摇杆移动向量（-1..1） */
  setVirtualMove(x: number, y: number) { this.vMoveX = x; this.vMoveY = y; }
  /** 触屏：右摇杆瞄准方向（世界方向，松手传 0,0 保持当前朝向） */
  setVirtualAim(x: number, y: number) {
    const l = Math.hypot(x, y);
    if (l > 0.15) { this.vAimX = x / l; this.vAimY = y / l; this.vAimOn = true; }
    else this.vAimOn = false;
  }
  /** 触屏：开火按下/松开 */
  setVirtualFire(f: boolean) { this.vFire = f; }
  /** 当前是否触屏瞄准模式 */
  get touchAiming() { return this.vAimOn; }

  switchWeapon(w: WeaponId) {
    if (w === "bomb" && this.stink !== "ready") {
      this.sfx.deny();
      this.o.onEvent("臭水弹尚未就绪——先用电报机订购（300 班费）", "warn");
      return;
    }
    if (this.weapon !== w) {
      this.weapon = w;
      this.sfx.click();
      this.stopStreams();
    }
  }

  buy(id: string) {
    const s = SUPPLIES.find((x) => x.id === id);
    if (!s || this.phase !== "play" || this.paused) return;
    if (this.pending.length >= 3) { this.sfx.deny(); this.o.onEvent("电报线路繁忙：已有 3 批物资在途", "warn"); return; }
    if (s.once && (this.stink !== "none")) { this.sfx.deny(); this.o.onEvent("臭水弹仅此一枚，无法重复订购", "warn"); return; }
    if (s.id === "upg" && this.upgrades >= 3) { this.sfx.deny(); this.o.onEvent("武器已强化至极限", "warn"); return; }
    if (s.id.startsWith("mag_")) {
      const w = s.id.slice(4) as WeaponId;
      if (!this.weaponSlots().includes(w)) {
        this.sfx.deny();
        this.o.onEvent(`本次未携带${s.name.replace(/罐|电池|水囊|盒|弹夹|弹带|组/, "")}对应武器`, "warn");
        return;
      }
      const inTransit = this.pending.filter((x) => x.id === s.id).length;
      if ((this.mags.get(w) ?? 0) + inTransit >= Game.MAG_CAP) {
        this.sfx.deny();
        this.o.onEvent(`武装带已满：${s.name} 最多 ${Game.MAG_CAP} 个`, "warn");
        return;
      }
    }
    if (this.funds < s.price) { this.sfx.deny(); this.o.onEvent("班费不足！击退敌人可获得班费", "bad"); return; }
    this.funds -= s.price;
    this.pending.push({ id: s.id, name: s.name, t: s.delay, total: s.delay });
    if (s.id === "bomb") this.stink = "incoming";
    this.sfx.morse();
    this.o.onEvent(`滴滴滴……电报已发往总部：「${s.name}」调配中（${s.delay}s）`, "info");
  }

  // ---------------- 武器 ----------------
  private dmgMul() { return 1 + this.upgrades * 0.2; }
  private rateMul() { return this.meta.id === "ass" ? 0.62 : 1; } // 樊某某射速加成

  private aimAngle() {
    if (this.vAimOn) {
      return clamp(Math.atan2(this.vAimY, this.vAimX * this.face), -0.62, 0.62);
    }
    const dx = this.mx - (this.px + this.face * HAND.x);
    const dy = this.my - (this.py + HAND.y);
    return clamp(Math.atan2(dy, dx), -0.62, 0.62);
  }
  /** 有效瞄准点（触屏模式下由摇杆方向推导） */
  private aimPoint() {
    if (this.vAimOn) {
      const m = this.muzzle();
      const ang = this.aimAngle();
      return { x: m.x + Math.cos(ang) * this.face * 480, y: m.y + Math.sin(ang) * 480 };
    }
    return { x: this.mx, y: this.my };
  }
  private muzzle() {
    const a = this.aimAngle();
    const hx = this.px + this.face * HAND.x;
    const hy = this.py + HAND.y;
    return { x: hx + Math.cos(a) * this.face * 26, y: hy + Math.sin(a) * 26 };
  }

  private stopStreams() {
    if (this.gasStreaming) { this.gasStreaming = false; this.sfx.flameStop(); }
    if (this.laserOn) { this.laserOn = false; this.sfx.laserStop(); }
    if (this.hydroOn) { this.hydroOn = false; this.sfx.flameStop(); }
  }

  private addAsthma(v: number) {
    if (this.meta.id !== "ass") return;
    this.asthma = clamp(this.asthma + v + 0, 0, 100);
    if (this.asthma >= 100 && this.asthmaLock <= 0) {
      this.asthmaLock = 2.4;
      this.stopStreams();
      this.sfx.asthma();
      this.o.onEvent("樊某某哮喘发作！必须使用抗哮喘药……", "bad");
    }
  }

  private fireBurst() {
    const cost = 9 * this.mod.gasDrain;
    if (this.asthmaLock > 0 || this.fuel < cost || this.burstCd > 0 || this.healChannel > 0) return;
    this.fuel -= cost;
    this.burstCd = 0.5 * this.rateMul() * this.mod.burstCd;
    const m = this.muzzle();
    const a = this.aimAngle();
    this.sfx.burst();
    this.shake(0.16, 5 * (this.mod.burstCount > 1 ? 1.5 : 1));
    this.flash(0.09, "#ff9426");
    // 三枪管并联：沿瞄准线三连爆
    const shots = this.mod.burstCount;
    const radius = 70 * this.mod.burstRadius;
    for (let k = 0; k < shots; k++) {
      const dist = 64 * this.mod.flameRange + k * 52;
      const cx = m.x + Math.cos(a) * this.face * dist;
      const cy = m.y + Math.sin(a) * dist;
      // 粒子扩散半径 = 判定半径（匀速 × 寿命）
      const PLIFE = 0.32;
      for (let i = 0; i < 30; i++) {
        const ang = rnd(0, Math.PI * 2);
        const rr = Math.sqrt(Math.random());             // 面积均匀分布
        const sp = (radius * rr) / PLIFE;
        this.parts.push({
          x: cx, y: cy, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp * 0.55,
          life: PLIFE * rnd(0.75, 1), max: PLIFE, size: rnd(3, 8),
          color: ["#fff2a8", "#ffd23e", "#ff9426", "#ff5c1f"][i % 4],
          grav: 0, add: true, drag: 1,
        });
      }
      this.areaDamage(cx, cy, radius, 26 * this.dmgMul() * this.mod.flameDmg, 170, 2 * this.mod.igniteSpeed);
    }
    this.addAsthma(9);
  }

  private tryMelee() {
    if (this.meleeCd > 0 || this.asthmaLock > 0 || this.healChannel > 0) return;
    this.meleeCd = 0.36 * this.rateMul() * this.mod.meleeRate;
    this.meleeAnim = 0.2;
    this.meleeHitDone = false;
    this.sfx.melee();
    this.addAsthma(5);
    // 判定在动画 0.1s 处（update 中处理）
  }

  private tryBomb() {
    if (this.stink !== "ready" || this.phase !== "play") return;
    this.stink = "used";
    this.phase = "cine";
    this.cineKind = "bombFuse";
    this.cineT = 0;
    this.bombFuse = 0;
    this.bombRoll = Math.random() < 0.5;
    this.stopStreams();
    this.o.onBanner("臭水弹引信已拉开……", "命运掌握在 50% 手中", "warn");
  }

  /** 当前武器的弹匣容量 */
  private magCapOf(w: WeaponId): number {
    if (w === "gas") return this.fuelMax;
    if (w === "laser") return this.batMax;
    if (w === "hydro") return this.waterMax;
    return this.slotMax.get(w) ?? 0;
  }
  private ammoOf(w: WeaponId): number {
    if (w === "gas") return this.fuel;
    if (w === "laser") return this.bat;
    if (w === "hydro") return this.water;
    return this.slotAmmo.get(w) ?? 0;
  }
  private setAmmo(w: WeaponId, v: number) {
    if (w === "gas") this.fuel = v;
    else if (w === "laser") this.bat = v;
    else if (w === "hydro") this.water = v;
    else this.slotAmmo.set(w, v);
  }

  /** 自动换弹：打空后短暂延迟自动触发 */
  private autoReloadCheck(dt: number) {
    if (this.phase !== "play" || this.reloadT > 0) { this.autoReloadT = 0; return; }
    const w = this.weapon;
    if (w === "melee" || w === "bomb") { this.autoReloadT = 0; return; }
    if (this.ammoOf(w) > 0) { this.autoReloadT = 0; return; }
    if ((this.mags.get(w) ?? 0) <= 0) { this.autoReloadT = 0; return; }
    // 空仓后 0.25 秒自动换弹
    this.autoReloadT += dt;
    if (this.autoReloadT >= 0.25) {
      this.autoReloadT = 0;
      this.reload(true);
    }
  }

  /** 手动/自动换弹 */
  reload(auto = false) {
    if (this.phase !== "play" || this.paused) return;
    const w = this.weapon;
    if (w === "melee" || w === "bomb") return;
    if (this.reloadT > 0) return;
    const cap = this.magCapOf(w);
    if (this.ammoOf(w) >= cap) { if (!auto) this.o.onEvent("弹匣已满", "info"); return; }
    const spare = this.mags.get(w) ?? 0;
    if (spare <= 0) {
      if (!auto) { this.sfx.deny(); this.o.onEvent("没有备用弹匣了！用电报机订购", "bad"); }
      return;
    }
    this.mags.set(w, spare - 1);
    this.reloadWeapon = w;
    this.reloadDur = w === "rifle" ? 1.5 : w === "eraser" ? 1.3 : 1.1;
    this.reloadT = this.reloadDur;
    this.stopStreams();
    this.sfx.click();
    this.o.onEvent(`${auto ? "自动" : ""}换弹中…（剩余弹匣 ${spare - 1}）`, "info");
  }

  private updateReload(dt: number) {
    if (this.reloadT <= 0) return;
    this.reloadT -= dt;
    // 换弹途中切枪则中断并退还弹匣
    if (this.reloadWeapon && this.weapon !== this.reloadWeapon) {
      this.mags.set(this.reloadWeapon, (this.mags.get(this.reloadWeapon) ?? 0) + 1);
      this.reloadT = 0; this.reloadWeapon = null;
      return;
    }
    if (this.reloadT <= 0 && this.reloadWeapon) {
      const w = this.reloadWeapon;
      this.setAmmo(w, this.magCapOf(w));
      this.reloadWeapon = null;
      this.sfx.pickup();
      this.o.onEvent("换弹完成", "good");
    }
  }

  /** 投掷消耗品 */
  throwNade() {
    if (this.phase !== "play" || this.paused) return;
    if (!this.thrDef || this.thrLeft <= 0 || this.thrCd > 0) { this.sfx.deny(); return; }
    this.thrLeft--;
    this.thrCd = this.thrDef.cooldown;
    const ap = this.aimPoint();
    const tx = clamp(ap.x, DOOR_FRONT + 20, 900);
    const ty = clamp(ap.y, FLOOR_TOP + 12, FLOOR_BOT - 6);
    this.nades.push({
      x: this.px, y: this.py - 46, sx: this.px, sy: this.py - 46,
      tx, ty, t: 0, dur: 0.6, kind: this.thrDef.id,
    });
    this.sfx.throwIt();
    this.o.onEvent(`投出${this.thrDef.name}（剩 ${this.thrLeft}）`, "info");
  }

  /** 干员技能（键盘 Q / 触屏按钮共用） */
  useAbility() {
    if (this.phase !== "play" || this.paused) return;
    if (this.meta.id === "elec") {
      if (this.abilityCd > 0) { this.sfx.deny(); return; }
      this.abilityCd = this.abilityMax;
      const ap = this.aimPoint();
      const tx = clamp(ap.x, 150, 880);
      const ty = clamp(ap.y, FLOOR_TOP + 12, FLOOR_BOT - 8);
      this.projs.push({ kind: "battery", x: this.px, y: this.py - 50, sx: this.px, sy: this.py - 50, tx, ty, t: 0, dur: 0.55 });
      this.sfx.throwIt();
    } else if (this.meta.id === "med") {
      if (this.abilityCd > 0 || this.hp >= this.hpMax) { if (this.hp >= this.hpMax) this.o.onEvent("血量已满", "info"); else this.sfx.deny(); return; }
      this.healChannel = 1.1;
      this.abilityCd = this.abilityMax;
      this.stopStreams();
    }
  }

  // ---------------- 伤害 ----------------
  private areaDamage(cx: number, cy: number, r: number, dmg: number, kb: number, burnT: number) {
    for (const e of this.enemies) {
      if (e.dead) continue;
      const ey = e.y - 30;
      const d = Math.hypot(e.x - cx, ey - cy);
      if (d < r + 16) {
        this.hitEnemy(e, dmg, kb, cx);
        e.burnT = Math.max(e.burnT, burnT);
      }
    }
  }

  private hitEnemy(e: Enemy, dmg: number, kb: number, fromX: number, ignoreShield = false) {
    if (e.dead) return;
    const dir: 1 | -1 = e.x >= fromX ? 1 : -1;
    let remaining = dmg;
    if (e.shield > 0 && !ignoreShield) {
      // 正面可视作持盾方向：敌面朝左，攻击来自其左侧即为正面
      const frontal = fromX < e.x;
      if (frontal) {
        e.shield -= dmg;
        if (e.shield <= 0) {
          remaining = -e.shield * 0.6;
          e.shield = -1;
          this.sfx.melt();
          this.addFloat(e.x, e.y - 78, "盾破！", "#ff9426", true);
          this.burstParts(e.x - 10, e.y - 40, "#9fadc0", 14, 90);
        } else {
          remaining = 0;
          if (Math.random() < 0.3) this.sfx.shieldBlock();
          this.burstParts(e.x - 14, e.y - 40, "#c9d1dc", 3, 60);
        }
      }
    }
    if (remaining > 0) {
      e.hp -= remaining;
      this.dmgDealt += remaining;
      e.dmgAcc += remaining; e.dmgAccT = 0.35;
      e.hitFlash = 0.08;
      if (e.type !== "chariot" && e.type !== "boss") e.x += dir * kb * 0.06;
      if (Math.random() < 0.4) this.sfx.hit();
    }
    if (e.hp <= 0) this.killEnemy(e);
  }

  private killEnemy(e: Enemy) {
    if (e.dead) return;
    e.dead = true;
    this.kills++;
    const reward = e.type === "soldier" ? 8 : e.type === "shield" ? 14 : e.type === "chariot" ? 35 : 120;
    this.funds += reward;
    this.fundsEarned += reward;
    this.addFloat(e.x, e.y - 70, `+${reward}`, "#f2b53d", true);
    this.sfx.kill();
    const col = e.type === "chariot" ? "#7fae3f" : "#3f7a58";
    this.burstParts(e.x, e.y - 34, col, 16, 120);
    this.burstParts(e.x, e.y - 30, "#ece7d8", 8, 90);
    if (e.type === "chariot") {
      this.zones.push({ kind: "pool", x: e.x, y: e.y, r: 55, t: 3, tick: 0 });
      this.sfx.explosion(false);
      this.shake(0.25, 6);
    }
    // 击杀不再掉落弹药：补给完全依赖电报机订购的弹匣
  }

  private playerDamage(v: number) {
    if (this.immuneT > 0 || this.phase !== "play") return;
    this.hp -= v;
    this.immuneT = 0.4;
    this.regenT = 0;
    this.hurtVign = 0.5;
    this.healChannel = 0; // 打断治疗
    this.sfx.hurt();
    this.shake(0.2, 5);
    this.addFloat(this.px, this.py - 80, `-${Math.round(v)}`, "#ff5140", true);
    if (this.hp <= 0) {
      this.hp = 0;
      this.stopStreams();
      this.phase = "cine";
      this.cineKind = "lose_down";
      this.cineT = 0;
      this.sfx.lose();
    }
  }

  private doorDamage(v: number) {
    if (this.phase !== "play") return;
    this.doorHp -= v;
    this.sfx.doorHit();
    this.shake(0.12, 3);
    this.burstParts(DOOR_FRONT + 4, 400 + rnd(-80, 80), "#4e6584", 8, 100);
    if (this.doorHp <= 0) {
      this.doorHp = 0;
      this.phase = "cine";
      this.cineKind = "lose_door";
      this.cineT = 0;
      this.sfx.explosion(true);
      this.sfx.lose();
      this.o.onBanner("大门被攻破了……", "治安队涌入了八五班", "bad");
    }
  }

  // ---------------- 特效工具 ----------------
  private shake(t: number, mag: number) { this.shakeT = Math.max(this.shakeT, t); this.shakeMag = mag; }
  private flash(t: number, color: string) { this.flashT = Math.max(this.flashT, t); this.flashColor = color; }
  private addFloat(x: number, y: number, text: string, color: string, big = false) {
    this.floats.push({ x, y, vy: -46, life: 1, text, color, big });
  }
  private burstParts(x: number, y: number, color: string, n: number, sp: number) {
    for (let i = 0; i < n; i++) {
      const ang = rnd(0, Math.PI * 2);
      const s = rnd(sp * 0.3, sp);
      this.parts.push({
        x, y, vx: Math.cos(ang) * s, vy: Math.sin(ang) * s - 30,
        life: rnd(0.25, 0.6), max: 0.6, size: rnd(2, 5),
        color, grav: 220, add: false, drag: 0.94,
      });
    }
  }

  // ---------------- 敌兵生成 ----------------
  private spawnEnemy(type: Enemy["type"], offsetX = 0) {
    const scale = 1 + (this.elapsed / DURATION) * 0.5;
    const y = rnd(FLOOR_TOP + 24, FLOOR_BOT - 14);
    const e: Enemy = {
      id: this.enemySeq++, type,
      x: 940 + offsetX + rnd(0, 30), y,
      hp: 1, maxHp: 1, shield: -1,
      spd: 0, atkT: rnd(0, 0.4), windT: 0,
      blindT: 0, burnT: 0, burnAcc: 0, slowT: 0,
      animT: rnd(0, 1), face: -1, hitFlash: 0,
      wanderX: 0, wanderY: 0,
      heatT: 0, headT: 0, laserId: -1,
      lobT: rnd(4, 7), walkieT: 0,
      dmgAcc: 0, dmgAccT: 0,
      bubble: "", bubbleT: 0,
      flee: false, dead: false, swingAnim: 0,
      targetX: 0, targetY: 0, targetKind: "player", targetDesk: null,
      ranged: false,
    };
    if (type === "soldier") {
      e.hp = e.maxHp = 34 * scale; e.spd = rnd(46, 62);
      if (this.elapsed > 25 && Math.random() < 0.3) { e.ranged = true; e.spd = rnd(40, 50); }
    }
    if (type === "shield") { e.hp = e.maxHp = 44 * scale; e.shield = 52; e.spd = 33; }
    if (type === "chariot") { e.hp = e.maxHp = 190 * scale; e.spd = 23; e.x = 970 + offsetX; }
    if (type === "boss") { e.hp = e.maxHp = 540; e.shield = 90; e.spd = 30; e.x = 950; e.walkieT = 6; }
    this.enemies.push(e);
    this.burstParts(e.x, e.y - 30, "#10141f", 10, 70);
  }

  private director(dt: number) {
    if (this.phase !== "play") return;
    const prog = this.elapsed / DURATION;
    const cap = 24;
    const activeCount = this.enemies.filter((e) => !e.dead).reduce((n, e) => n + (e.type === "chariot" ? 3 : e.type === "boss" ? 4 : 1), 0);

    this.spawnT -= dt;
    if (this.spawnT <= 0 && activeCount < cap) {
      const frenzy = this.elapsed > DURATION - 30;
      const base = 2.3 - prog * 1.35;
      this.spawnT = Math.max(0.8, base) * (frenzy ? 0.55 : 1) * rnd(0.75, 1.25);
      const roll = Math.random();
      const shieldP = Math.min(0.1 + prog * 0.38, 0.45);
      if (roll < shieldP && this.elapsed > 18) this.spawnEnemy("shield");
      else this.spawnEnemy("soldier");
      if (frenzy && Math.random() < 0.4) this.spawnEnemy("soldier", 30);
    }

    // 战车
    if (this.elapsed > 45) {
      this.chariotT -= dt;
      if (this.chariotT <= 0 && activeCount < cap - 3) {
        this.chariotT = Math.max(20, 36 - prog * 14);
        this.spawnEnemy("chariot");
        this.o.onBanner("化学拖把战车 出现！", "恶臭双刃拖把正在逼近", "bad");
        this.sfx.walkie();
        this.shake(0.4, 3);
      }
    }

    // 敌方对讲机增援
    this.walkieT -= dt;
    if (this.walkieT <= 0) {
      this.walkieT = rnd(19, 28);
      const n = Math.min(4, cap - activeCount);
      for (let i = 0; i < n; i++) this.spawnEnemy("soldier", i * 26);
      if (n > 0) {
        this.sfx.walkie();
        this.o.onEvent("敌方对讲机：『扫把枪队，立刻增援！』（秒送达）", "bad");
        const s = this.enemies[this.enemies.length - 1];
        if (s) { s.bubble = "收到！马上到！"; s.bubbleT = 2; }
      }
    }

    // BOSS：治安队长（95s 首次登场，被击退后 70s 卷土重来）
    if (!this.bossSpawned && this.elapsed > 95) {
      this.bossSpawned = true;
      this.spawnEnemy("boss");
      this.o.onBanner("治安队长 亲自督战！", "打碎他的簸箕盾再攻击本体", "bad");
      this.o.onEvent("警报：治安队长已进入走廊", "bad");
      this.sfx.walkie();
      this.shake(0.5, 6);
      this.flash(0.2, "#a8332a");
    }
    // 队长被击退后会再度返场
    if (this.bossSpawned && !this.enemies.some((e) => e.type === "boss" && !e.dead)) {
      this.bossRespawnT -= dt;
      if (this.bossRespawnT <= 0 && this.elapsed < DURATION - 25) {
        this.bossRespawnT = 70;
        this.spawnEnemy("boss");
        this.o.onBanner("治安队长 卷土重来！", "这次他带了更厚的盾", "bad");
        this.sfx.walkie();
        this.shake(0.5, 6);
      }
    }

    // 波次广播 + 班委拨款
    const w = Math.floor(this.elapsed / 30);
    if (w > this.waveIdx && w < WAVE_FLAVOR.length) {
      this.waveIdx = w;
      this.o.onBanner(`第 ${w + 1} 波攻势`, WAVE_FLAVOR[w] ?? "", "warn");
      this.funds += 35;
      this.fundsEarned += 35;
      this.o.onEvent("班委紧急拨款 +35 班费", "good");
      this.sfx.arrive();
    }
  }

  // ---------------- 主更新 ----------------
  private update(dt: number) {
    this.elapsed += dt;
    this.shakeT = Math.max(0, this.shakeT - dt);
    this.flashT = Math.max(0, this.flashT - dt);
    this.hurtVign = Math.max(0, this.hurtVign - dt);
    const timeLeft = Math.max(0, DURATION - this.elapsed);

    // ===== 剧情阶段 =====
    if (this.phase === "cine") {
      this.cineT += dt;
      this.updateParts(dt);
      this.updateProjs(dt);
      this.updateZones(dt);
      if (this.cineKind === "bombFuse") {
        this.bombFuse += dt;
        if (Math.floor(this.bombFuse * 5) !== Math.floor((this.bombFuse - dt) * 5)) this.sfx.click();
        if (this.bombFuse >= 1.1) {
          if (this.bombRoll) {
            this.cineKind = "bombFly";
            const m = this.muzzle();
            this.projs.push({
              kind: "bomb", x: m.x, y: m.y, sx: m.x, sy: m.y,
              tx: 890, ty: FLOOR_TOP + 110, t: 0, dur: 1.0,
            });
            this.sfx.throwIt();
            this.o.onBanner("发射成功！！", "臭水弹正在飞向七班方向……", "good");
          } else {
            this.cineKind = "bombFail";
            this.cineT = 0;
            this.flash(0.5, "#7fae3f");
            this.shake(1, 14);
            this.sfx.explosion(true);
            this.sfx.stink();
            this.burstParts(this.px, this.py - 40, "#7fae3f", 60, 260);
            this.burstParts(this.px, this.py - 40, "#c4e368", 30, 200);
            this.hp = 0;
            this.o.onBanner("臭水弹自爆了！！！", "知情人士：药液配方抄错了行", "bad");
          }
        }
      } else if (this.cineKind === "bombFly") {
        // 等待炸弹落地（在 projs 中触发 bombLand）
      } else if (this.cineKind === "bombFail" && this.cineT > 1.6) {
        this.endGame(false, "boom");
      } else if (this.cineKind === "winTime") {
        for (const e of this.enemies) if (!e.dead) { e.flee = true; }
        this.updateEnemies(dt);
        if (this.cineT > 1.8) this.endGame(true, "survive");
      } else if (this.cineKind === "winBomb" && this.cineT > 2.0) {
        this.endGame(true, "bomb");
      } else if (this.cineKind === "lose_down" && this.cineT > 1.8) {
        this.endGame(false, "down");
      } else if (this.cineKind === "lose_door") {
        this.updateEnemies(dt);
        if (this.cineT > 2.0) this.endGame(false, "door");
      }
      this.pushHud(dt, timeLeft);
      return;
    }

    // ===== 放学判定 =====
    if (timeLeft <= 0) {
      this.phase = "cine";
      this.cineKind = "winTime";
      this.cineT = 0;
      this.stopStreams();
      this.sfx.bell();
      this.sfx.win();
      this.o.onBanner("放学铃响了！！！", "八五班大门 固若金汤", "good");
      return;
    }

    // ===== 玩家移动（键盘 + 虚拟左摇杆） =====
    let vx = 0, vy = 0;
    if (this.keys.has("w") || this.keys.has("arrowup")) vy -= 1;
    if (this.keys.has("s") || this.keys.has("arrowdown")) vy += 1;
    if (this.keys.has("a") || this.keys.has("arrowleft")) vx -= 1;
    if (this.keys.has("d") || this.keys.has("arrowright")) vx += 1;
    vx += this.vMoveX; vy += this.vMoveY;
    const mag = Math.hypot(vx, vy);
    const len = mag || 1;
    let spd = 155 * this.meta.spd * this.mod.moveMul * Math.min(1, mag);
    if (this.asthmaLock > 0) spd *= 0.45;
    if (this.ads > 0.05) spd *= 1 - this.ads * 0.62;   // 开镜大幅减速
    if (this.healChannel > 0) spd = 0;
    this.moving = mag > 0.01 && spd > 0;
    this.px = clamp(this.px + (vx / len) * spd * dt, DOOR_FRONT + 26, 880);
    this.py = clamp(this.py + (vy / len) * spd * dt, FLOOR_TOP + 22, FLOOR_BOT - 10);
    if (this.vAimOn) this.face = this.vAimX >= 0 ? 1 : -1;
    else this.face = this.mx >= this.px ? 1 : -1;
    this.animT += dt * (this.moving ? 1 : 0.4);
    this.immuneT = Math.max(0, this.immuneT - dt);
    this.burstCd = Math.max(0, this.burstCd - dt);
    this.meleeCd = Math.max(0, this.meleeCd - dt);
    this.abilityCd = Math.max(0, this.abilityCd - dt);

    // ===== 哮喘机制 =====
    if (this.meta.id === "ass") {
      if (this.asthmaLock > 0) {
        this.asthmaLock -= dt;
        if (this.asthmaLock <= 0) {
          this.asthma = 18;
          this.sfx.inhale();
          this.o.onEvent("吸入抗哮喘药，呼吸顺畅了", "good");
        }
      } else {
        this.asthma = Math.max(0, this.asthma - 11 * dt);
      }
    }

    // ===== 医疗引导 =====
    if (this.healChannel > 0) {
      this.healChannel -= dt;
      // 极其夸张的回血速度：每秒约 170 HP
      this.hp = Math.min(this.hpMax, this.hp + 170 * dt);
      if (Math.random() < dt * 22) {
        this.parts.push({
          x: this.px + rnd(-16, 16), y: this.py - rnd(20, 64), vx: 0, vy: -40,
          life: 0.7, max: 0.7, size: rnd(2, 4), color: ["#7fe08a", "#c9ffd0", "#57d6e6"][Math.floor(rnd(0, 3))],
          grav: 0, add: false, drag: 1,
        });
        if (Math.random() < 0.2) this.sfx.heal();
      }
    }

    // 医疗被动回血
    if (this.meta.id === "med") {
      this.regenT += dt;
      if (this.regenT > 5 && this.hp > 0) this.hp = Math.min(this.hpMax, this.hp + 3 * dt);
    }

    // ===== 统一开火沿（鼠标 / 触屏开火钮） =====
    const firing = this.mouseDown || this.vFire;
    if (firing && !this.prevFire) {
      this.gasHoldT = 0;
      if (this.asthmaLock <= 0 && this.healChannel <= 0) {
        if (this.weapon === "melee") this.tryMelee();
        else if (this.weapon === "bomb") this.tryBomb();
      }
    }
    if (!firing && this.prevFire && this.weapon === "gas" && this.asthmaLock <= 0) {
      this.fireBurst();
    }
    this.prevFire = firing;
    // 按住近战连续挥击
    if (firing && this.weapon === "melee" && this.meleeCd <= 0 && this.asthmaLock <= 0 && this.healChannel <= 0) this.tryMelee();

    // ===== 武器使用 =====
    if (this.asthmaLock <= 0 && this.healChannel <= 0 && this.reloadT <= 0) {
      if (this.weapon === "gas") {
        if (firing) {
          this.gasHoldT += dt;
          if (this.gasHoldT > 0.18 && this.fuel > 0) {
            if (!this.gasStreaming) { this.gasStreaming = true; this.sfx.flameStart(); }
            this.fuel = Math.max(0, this.fuel - 13 * this.mod.gasDrain * dt);
            this.flameTick -= dt;
            if (this.flameTick <= 0) { this.flameTick = 0.05; this.flameDamage(); }
            this.spawnFlameParts();
            this.addAsthma(20 * dt);
          } else if (this.gasStreaming && (this.fuel <= 0)) {
            this.stopStreams();
            this.o.onEvent("燃气耗尽！按 E 呼叫燃气罐空投", "warn");
          }
        } else if (this.gasStreaming) this.stopStreams();
      } else if (this.gasStreaming) this.stopStreams();

      // ---- 高压水枪 ----
      if (this.weapon === "hydro") {
        if (firing && this.water > 0) {
          if (!this.hydroOn) { this.hydroOn = true; this.sfx.flameStart(); }
          this.water = Math.max(0, this.water - 15 * dt);
          this.hydroTick -= dt;
          if (this.hydroTick <= 0) { this.hydroTick = 0.06; this.hydroDamage(); }
          this.spawnWaterParts();
          this.addAsthma(8 * dt);
          if (this.water <= 0) { this.stopStreams(); this.o.onEvent("水压不足！等待回压", "warn"); }
        } else if (this.hydroOn) this.stopStreams();
      } else if (this.hydroOn) this.stopStreams();

      if (this.weapon === "laser") {
        if (firing && this.bat > 0) {
          if (!this.laserOn) { this.laserOn = true; this.sfx.laserStart(); }
          this.bat = Math.max(0, this.bat - 8.5 * this.mod.batDrain * dt);
          this.laserDamage(dt);
          this.addAsthma(13 * dt);
          if (this.bat <= 0) { this.stopStreams(); this.o.onEvent("激光笔没电了！按 E 呼叫电池空投", "warn"); }
        } else if (this.laserOn) this.stopStreams();
      } else if (this.laserOn) this.stopStreams();
    } else this.stopStreams();

    // 消防栓接管：持续回水
    if (!this.hydroOn && this.water < this.waterMax) {
      const base = this.mod.waterRegen > 0 ? this.mod.waterRegen : 3.2;
      this.water = Math.min(this.waterMax, this.water + base * dt);
    }

    // 散热鳍片：未照射时缓慢回电
    if (!this.laserOn && this.bat < this.batMax && this.mod.batRegen > 1) {
      this.bat = Math.min(this.batMax, this.bat + 2.2 * this.mod.batRegen * dt);
    }

    // 开镜（仅粉笔狙击枪；换弹时强制退镜）
    const canAds = this.weapon === "rifle" && this.reloadT <= 0;
    const wantAds = canAds && this.adsHold;
    this.ads = clamp(this.ads + (wantAds ? dt * 5.5 : -dt * 7), 0, 1);
    this.breath += dt * (1.6 + (1 - this.ads) * 2);

    // 换弹（含自动换弹）
    this.autoReloadCheck(dt);
    this.updateReload(dt);

    // 弹道武器
    this.shotCd = Math.max(0, this.shotCd - dt);
    if (this.asthmaLock <= 0 && this.healChannel <= 0 && this.reloadT <= 0) this.fireBallistic(dt, firing);
    this.updateBullets(dt);
    this.updateNades(dt);

    // 近战挥击帧
    if (this.meleeAnim > 0) {
      this.meleeAnim -= dt;
      if (!this.meleeHitDone && this.meleeAnim < 0.12) {
        this.meleeHitDone = true;
        const dirX = this.face;
        for (const e of this.enemies) {
          if (e.dead) continue;
          const dx = (e.x - this.px) * dirX;
          const reach = (e.type === "chariot" ? 66 : 58) * this.mod.meleeReach;
          // 配重铅块：横扫，正反两侧与更宽纵深都能打到
          const sweep = this.mod.meleeSweep;
          const inX = sweep ? Math.abs(e.x - this.px) < reach : (dx > -10 && dx < reach);
          const inY = Math.abs(e.y - this.py) < 32 * this.mod.meleeReach * (sweep ? 1.6 : 1);
          if (inX && inY) {
            this.hitEnemy(
              e, 16 * this.dmgMul() * this.mod.meleeDmg,
              150 * this.mod.meleeKnock, this.px, this.mod.meleePierce,
            );
            // 电火花针头：触电麻痹
            if (this.mod.meleeShock) {
              e.slowT = Math.max(e.slowT, 1.4);
              this.sfx.zap();
              for (let k = 0; k < 4; k++) {
                this.parts.push({
                  x: e.x + rnd(-8, 8), y: e.y - rnd(20, 48), vx: 0, vy: 0,
                  life: 0.14, max: 0.14, size: 3,
                  color: k % 2 ? "#c9f4ff" : "#57d6e6", grav: 0, add: true, drag: 1,
                });
              }
            }
          }
        }
      }
    }

    // ===== 汽油枪短按未触发放开时 gasHoldT 归零 =====
    if (!firing) this.gasHoldT = 0;

    // ===== 电报配送 =====
    for (let i = this.pending.length - 1; i >= 0; i--) {
      const p = this.pending[i];
      p.t -= dt;
      if (p.t <= 0) {
        this.pending.splice(i, 1);
        const cx = clamp(this.px + rnd(-50, 90), 160, 860);
        this.projs.push({
          kind: "crate", x: cx, y: -30, sx: cx, sy: -30,
          tx: cx, ty: this.py, t: 0, dur: 2.4, payload: p.id,
        });
        this.o.onEvent(`空投已就位：「${p.name}」正在降落`, "good");
      }
    }

    this.director(dt);
    this.updateEnemies(dt);
    this.updateProjs(dt);
    this.updateZones(dt);
    this.updateParts(dt);

    // 浮动文字
    for (let i = this.floats.length - 1; i >= 0; i--) {
      const f = this.floats[i];
      f.y += f.vy * dt;
      f.vy += 60 * dt;
      f.life -= dt;
      if (f.life <= 0) this.floats.splice(i, 1);
    }

    this.pushHud(dt, timeLeft);
  }

  private pushHud(dt: number, timeLeft: number) {
    this.hudT += dt;
    if (this.hudT < 0.1) return;
    this.hudT = 0;
    const boss = this.enemies.find((e) => e.type === "boss" && !e.dead);
    this.o.onHud({
      hp: Math.ceil(this.hp), hpMax: this.hpMax,
      door: Math.ceil(this.doorHp), doorMax: this.doorMax,
      fuel: Math.ceil(this.fuel), fuelMax: this.fuelMax,
      bat: Math.ceil(this.bat), batMax: this.batMax,
      water: Math.ceil(this.water), waterMax: this.waterMax,
      slots: this.weaponSlots().map((id) => {
        const noAmmo = id === "melee" || id === "bomb";
        return {
          id,
          ammo: noAmmo ? -1 : Math.ceil(this.ammoOf(id)),
          ammoMax: noAmmo ? -1 : this.magCapOf(id),
          mags: noAmmo ? -1 : (this.mags.get(id) ?? 0),
          magMax: Game.MAG_CAP,
        };
      }),
      reloading: this.reloadT > 0 && this.reloadDur > 0 ? 1 - this.reloadT / this.reloadDur : -1,
      throwName: this.thrDef?.name ?? "无",
      throwLeft: this.thrLeft,
      throwCd: this.thrCd,
      weapon: this.weapon, funds: this.funds, timeLeft,
      abilityCd: this.abilityCd, abilityMax: this.abilityMax,
      asthma: this.meta.id === "ass" ? Math.round(this.asthma) : -1,
      stink: this.stink,
      pending: this.pending.map((p) => ({ ...p })),
      upgrades: this.upgrades, wave: this.waveIdx + 1,
      bossHp: boss ? boss.hp : -1, bossMax: 540,
      kills: this.kills,
      enemyCount: this.enemies.filter((e) => !e.dead).length,
    });
  }

  // ---------------- 弹道武器（钉书机/狙击/霰弹/台灯） ----------------
  private fireBallistic(dt: number, firing: boolean) {
    void dt;
    const w = this.weapon;
    if (w !== "stapler" && w !== "rifle" && w !== "eraser" && w !== "lamp") return;
    if (!firing || this.shotCd > 0 || this.reloadT > 0) return;
    const ammo = this.slotAmmo.get(w) ?? 0;
    if (ammo <= 0) {
      if ((this.mags.get(w) ?? 0) <= 0 && Math.random() < 0.03) {
        this.o.onEvent("弹匣打空！用电报机订购补给", "warn");
      }
      return;   // 自动换弹由 autoReloadCheck 统一处理
    }

    const ws = weaponStats(w as ModWeapon, loadMods());
    // 开镜：射速略降，但精度与伤害提升
    this.shotCd = ws.rate * this.rateMul() * (w === "rifle" && this.ads > 0.6 ? 1.15 : 1);
    this.slotAmmo.set(w, ammo - 1);

    const m = this.muzzle();
    const base = this.aimAngle();
    // 两脚架：静止加伤
    const still = !this.moving;
    let dmgMul = this.dmgMul() * (ws.special.includes("bipod") && still ? 1.5 : 1);
    if (w === "rifle" && this.ads > 0.6) dmgMul *= 1.45;        // 开镜精准射击加伤

    // 发数：霰弹多弹丸 / 双管
    let pellets = 1;
    if (w === "eraser") pellets = ws.special.includes("slug") ? 1 : 9;
    if (w === "eraser" && ws.special.includes("double")) pellets *= 2;
    if (w === "stapler") pellets = 1;

    for (let i = 0; i < pellets; i++) {
      // 开镜时散布几乎归零
      const spreadMul = w === "rifle" ? 1 - this.ads * 0.92 : 1;
      const a = base + rnd(-ws.spread, ws.spread) * spreadMul;
      const sp = w === "rifle" ? 900 : w === "lamp" ? 1100 : 620;
      // 霰弹：每颗粉笔头速度/射程略有差异，形成自然弹幕
      const vJit = w === "eraser" ? rnd(0.82, 1.12) : 1;
      const life = (ws.range / sp) * (w === "eraser" ? rnd(0.75, 1.05) : 1);
      this.bullets.push({
        x: m.x + rnd(-2, 2), y: m.y + rnd(-2, 2),
        vx: Math.cos(a) * this.face * sp * vJit, vy: Math.sin(a) * sp * vJit,
        life, maxLife: life,
        dmg: ws.dmg * dmgMul,
        pierce: ws.pierce, hit: new Set<number>(), kind: w,
        bounce: ws.special.includes("ricochet") ? 1 : ws.special.includes("bounce") ? 2 : 0,
        spin: rnd(0, Math.PI * 2), seed: Math.floor(rnd(0, 999)),
        sub: w === "eraser" ? (ws.special.includes("slug") ? 3 : Math.floor(rnd(0, 3))) : 0,
      });
    }
    // ---- 差异化枪口表现 ----
    this.sfx.burst();
    const mz = { x: m.x + Math.cos(base) * this.face * 10, y: m.y + Math.sin(base) * 10 };
    if (w === "rifle") {
      // 狙击：强烈后坐 + 锥形焰 + 白烟
      this.shake(this.ads > 0.6 ? 0.1 : 0.22, this.ads > 0.6 ? 4 : 8);
      this.flash(0.05, "#fff6e0");
      for (let i = 0; i < 14; i++) {
        const a2 = base + rnd(-0.26, 0.26);
        this.parts.push({
          x: mz.x, y: mz.y,
          vx: Math.cos(a2) * this.face * rnd(260, 620), vy: Math.sin(a2) * rnd(260, 620),
          life: rnd(0.06, 0.14), max: 0.14, size: rnd(4, 9),
          color: ["#fffaf0", "#ffe9a8", "#ffd23e"][i % 3], grav: 0, add: true, drag: 0.86,
        });
      }
      for (let i = 0; i < 8; i++) {
        this.parts.push({
          x: mz.x, y: mz.y, vx: rnd(-40, 40) + this.face * 60, vy: rnd(-50, -10),
          life: rnd(0.4, 0.9), max: 0.9, size: rnd(4, 8),
          color: "rgba(226,226,214,1)", grav: -20, add: false, drag: 0.95,
        });
      }
    } else if (w === "eraser") {
      // 霰弹：宽大的扇形粉尘喷发
      this.shake(0.2, 7);
      for (let i = 0; i < 24; i++) {
        const a2 = base + rnd(-0.5, 0.5);
        this.parts.push({
          x: mz.x, y: mz.y,
          vx: Math.cos(a2) * this.face * rnd(120, 420), vy: Math.sin(a2) * rnd(120, 420) - 30,
          life: rnd(0.2, 0.5), max: 0.5, size: rnd(3, 8),
          color: ["#f2efe4", "#d8d2b8", "#b5ad94"][i % 3], grav: 90, add: false, drag: 0.9,
        });
      }
      this.flash(0.04, "#efe6d2");
    } else if (w === "stapler") {
      // 机枪：短促火星 + 抛壳
      this.shake(0.05, 2.2);
      for (let i = 0; i < 5; i++) {
        const a2 = base + rnd(-0.18, 0.18);
        this.parts.push({
          x: mz.x, y: mz.y,
          vx: Math.cos(a2) * this.face * rnd(200, 380), vy: Math.sin(a2) * rnd(200, 380),
          life: rnd(0.05, 0.1), max: 0.1, size: rnd(3, 6),
          color: i % 2 ? "#ffd23e" : "#fff6c8", grav: 0, add: true, drag: 0.85,
        });
      }
      // 抛壳
      this.parts.push({
        x: m.x, y: m.y - 2, vx: -this.face * rnd(50, 110), vy: rnd(-150, -90),
        life: 0.55, max: 0.55, size: 2.5, color: "#c9a56a", grav: 420, add: false, drag: 0.99,
      });
    } else {
      // 台灯炮：充能光环
      this.shake(0.08, 3);
      this.flash(0.05, "#ffe9a8");
      for (let i = 0; i < 12; i++) {
        const a2 = (i / 12) * Math.PI * 2;
        this.parts.push({
          x: mz.x, y: mz.y,
          vx: Math.cos(a2) * 150, vy: Math.sin(a2) * 150 * 0.5,
          life: 0.16, max: 0.16, size: 4,
          color: "#ffd23e", grav: 0, add: true, drag: 0.8,
        });
      }
    }
    this.addAsthma(w === "stapler" ? 3 : 6);
  }

  private updateBullets(dt: number) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.life -= dt;
      // 粉笔头会翻滚并轻微下坠
      if (b.kind === "eraser") { b.spin += dt * 18; b.vy += 150 * dt; }
      if (b.kind === "stapler") b.spin += dt * 26;
      b.x += b.vx * dt; b.y += b.vy * dt;
      // 拖尾（按武器差异化）
      if (b.kind === "rifle") {
        // 狙击：细长白色弹道残影
        this.parts.push({
          x: b.x, y: b.y, vx: 0, vy: 0, life: 0.18, max: 0.18,
          size: 2, color: "#fffaf0", grav: 0, add: true, drag: 1,
        });
      } else if (b.kind === "lamp") {
        // 光束：炽热余辉
        this.parts.push({
          x: b.x, y: b.y, vx: rnd(-14, 14), vy: rnd(-14, 14), life: 0.22, max: 0.22,
          size: rnd(3, 6), color: Math.random() < 0.5 ? "#ffd23e" : "#fff6c8",
          grav: 0, add: true, drag: 0.9,
        });
      } else if (b.kind === "eraser" && Math.random() < 0.5) {
        // 粉笔头：不断掉粉末
        this.parts.push({
          x: b.x, y: b.y, vx: rnd(-20, 20), vy: rnd(-6, 24), life: 0.3, max: 0.3,
          size: rnd(1.5, 3), color: "#f2efe4", grav: 120, add: false, drag: 0.96,
        });
      }
      let consumed = false;
      for (const e of this.enemies) {
        if (e.dead || b.hit.has(e.id)) continue;
        if (Math.abs(e.x - b.x) < 18 && Math.abs((e.y - 34) - b.y) < 30) {
          b.hit.add(e.id);
          this.hitEnemy(e, b.dmg, 90, b.x, b.pierce);
          // 粉尘弹
          if (b.kind === "rifle") {
            const ws = weaponStats("rifle", loadMods());
            if (ws.special.includes("dust")) {
              this.zonesFx.push({ x: e.x, y: e.y, r: 62, t: 3, max: 3, kind: "dust", tick: 0 });
            }
          }
          // 黑板擦致盲
          if (b.kind === "eraser") {
            const ws = weaponStats("eraser", loadMods());
            if (ws.special.includes("blind")) e.blindT = Math.max(e.blindT, 1.8);
            if (ws.special.includes("slug")) e.x += (e.x >= this.px ? 1 : -1) * 16;
          }
          // 命中特效按武器区分
          if (b.kind === "eraser") {
            // 粉笔碎裂成粉末
            for (let q = 0; q < 7; q++) {
              this.parts.push({
                x: b.x, y: b.y, vx: rnd(-90, 90), vy: rnd(-90, 30),
                life: rnd(0.25, 0.5), max: 0.5, size: rnd(2, 5),
                color: q % 2 ? "#f2efe4" : "#d8d2b8", grav: 260, add: false, drag: 0.92,
              });
            }
          } else if (b.kind === "rifle") {
            // 狙击：强力冲击星芒
            this.burstParts(b.x, b.y, "#fffaf0", 10, 220);
            this.shake(0.08, 3);
          } else if (b.kind === "lamp") {
            // 光弹：灼烧闪光
            for (let q = 0; q < 8; q++) {
              this.parts.push({
                x: b.x, y: b.y, vx: rnd(-120, 120), vy: rnd(-120, 120),
                life: 0.2, max: 0.2, size: rnd(3, 7),
                color: q % 2 ? "#ffd23e" : "#fff6c8", grav: 0, add: true, drag: 0.85,
              });
            }
          } else {
            // 订书钉：金属火星
            this.burstParts(b.x, b.y, "#ffd9a0", 4, 110);
          }
          if (!b.pierce) {
            if (b.bounce > 0) {
              b.bounce--;
              b.vx = -b.vx * 0.7; b.vy += rnd(-120, 120);
              b.dmg *= 0.7; b.life = Math.max(b.life, 0.25);
            } else { consumed = true; }
          }
          if (consumed) break;
        }
      }
      if (consumed || b.life <= 0 || b.x < 0 || b.x > W || b.y < 0 || b.y > H) {
        this.bullets.splice(i, 1);
      }
    }
  }

  // ---------------- 投掷物更新 ----------------
  private updateNades(dt: number) {
    this.thrCd = Math.max(0, this.thrCd - dt);
    for (let i = this.nades.length - 1; i >= 0; i--) {
      const n = this.nades[i];
      n.t += dt;
      const k = clamp(n.t / n.dur, 0, 1);
      n.x = n.sx + (n.tx - n.sx) * k;
      n.y = n.sy + (n.ty - n.sy) * k - Math.sin(k * Math.PI) * 110;
      if (k >= 1) {
        this.nades.splice(i, 1);
        this.detonate(n.kind, n.tx, n.ty);
      }
    }
    // 区域效果
    for (let i = this.zonesFx.length - 1; i >= 0; i--) {
      const z = this.zonesFx[i];
      z.t -= dt; z.tick -= dt;
      if (z.tick <= 0) {
        z.tick = 0.4;
        for (const e of this.enemies) {
          if (e.dead) continue;
          if (Math.hypot(e.x - z.x, (e.y - z.y) * 1.5) > z.r) continue;
          if (z.kind === "smoke" || z.kind === "dust") e.blindT = Math.max(e.blindT, 1.2);
          if (z.kind === "glue") e.slowT = Math.max(e.slowT, 1.0);
          if (z.kind === "sock") { this.hitEnemy(e, 6, 0, z.x, true); e.slowT = Math.max(e.slowT, 0.8); }
          if (z.kind === "firecracker") this.hitEnemy(e, 11, 70, z.x, true);
        }
        if (z.kind === "firecracker") {
          this.sfx.hit();
          this.burstParts(z.x + rnd(-30, 30), z.y - rnd(0, 30), "#ffd23e", 8, 160);
        }
      }
      // 粒子
      if (Math.random() < dt * 18) {
        const cmap: Record<string, string> = {
          smoke: "#e8ead8", dust: "#d8d2b8", glue: "#e8c95a",
          sock: "#7e8a63", firecracker: "#ff9426",
        };
        this.parts.push({
          x: z.x + rnd(-z.r, z.r) * 0.8, y: z.y + rnd(-14, 6),
          vx: 0, vy: z.kind === "glue" ? 0 : rnd(-22, -6),
          life: rnd(0.5, 1), max: 1, size: rnd(3, 7),
          color: cmap[z.kind] ?? "#ffffff", grav: 0, add: false, drag: 0.98,
        });
      }
      if (z.t <= 0) this.zonesFx.splice(i, 1);
    }
  }

  private detonate(kind: string, x: number, y: number) {
    const dur: Record<string, number> = { smoke: 5, glue: 7, firecracker: 2.5, sock: 5, bottle: 0 };
    if (kind === "bottle") {
      // 直击：单体高伤 + 击退
      this.sfx.melee();
      this.burstParts(x, y - 10, "#9fe0f5", 18, 180);
      for (const e of this.enemies) {
        if (e.dead) continue;
        if (Math.hypot(e.x - x, (e.y - y) * 1.4) < 46) {
          this.hitEnemy(e, 42 * this.dmgMul(), 220, x, true);
          e.windT = 0; e.atkT = Math.max(e.atkT, 0.8);
        }
      }
      this.shake(0.2, 5);
      return;
    }
    const r = kind === "firecracker" ? 76 : kind === "glue" ? 62 : 84;
    this.zonesFx.push({ x, y, r, t: dur[kind] ?? 4, max: dur[kind] ?? 4, kind, tick: 0 });
    if (kind === "firecracker") { this.sfx.explosion(false); this.shake(0.25, 5); }
    else this.sfx.stink();
    const col = kind === "smoke" ? "#e8ead8" : kind === "glue" ? "#e8c95a" : kind === "sock" ? "#7e8a63" : "#ffd23e";
    this.burstParts(x, y - 8, col, 26, 170);
  }

  // ---------------- 高压水枪 ----------------
  private hydroDamage() {
    const m = this.muzzle();
    const ang = this.aimAngle();
    const LEN = 230;
    const dmg = 5.2 * this.dmgMul() * this.mod.hydroDmg;
    const angles = this.mod.hydroCone ? [ang - 0.3, ang - 0.15, ang, ang + 0.15, ang + 0.3] : [ang];
    for (const e of this.enemies) {
      if (e.dead) continue;
      const ex = e.x, ey = e.y - 32;
      let hit = false;
      for (const a of angles) {
        const dirX = Math.cos(a) * this.face, dirY = Math.sin(a);
        const rx = ex - m.x, ry = ey - m.y;
        const t = clamp(rx * dirX + ry * dirY, 0, LEN);
        const cx = m.x + dirX * t, cy = m.y + dirY * t;
        if (Math.hypot(ex - cx, ey - cy) < 22 + (t / LEN) * 20) { hit = true; break; }
      }
      if (!hit) continue;
      // 高压水柱：无视簸箕盾（直接冲翻）
      e.hp -= dmg;
      this.dmgDealt += dmg;
      e.dmgAcc += dmg; e.dmgAccT = 0.35;
      e.hitFlash = 0.05;
      // 冲击击退
      e.x += (e.x >= this.px ? 1 : -1) * 2.2 * this.mod.hydroKnock;
      // 浇灭燃烧
      if (e.burnT > 0) e.burnT = 0;
      // 泡沫 / 冻结 → 减速
      if (this.mod.hydroFoam) e.slowT = Math.max(e.slowT, 1.2);
      if (this.mod.hydroFreeze) {
        e.slowT = Math.max(e.slowT, 1.6);
        if (Math.random() < 0.25) {
          this.parts.push({
            x: e.x + rnd(-8, 8), y: e.y - rnd(16, 46), vx: 0, vy: -14,
            life: 0.4, max: 0.4, size: 3, color: "#c9f4ff", grav: 0, add: true, drag: 1,
          });
        }
      }
      if (e.hp <= 0) this.killEnemy(e);
    }
  }

  private spawnWaterParts() {
    const m = this.muzzle();
    const ang = this.aimAngle();
    const cone = this.mod.hydroCone;
    const n = cone ? 8 : 5;
    const LEN = 230;                      // 与 hydroDamage 判定一致
    const SPEED = 700;
    const FULL_LIFE = LEN / SPEED;
    for (let i = 0; i < n; i++) {
      // 扇喷嘴的张角与判定 angles 对应（±0.3）
      const spread = cone ? rnd(-0.3, 0.3) : rnd(-0.07, 0.07);
      const sp = SPEED;
      const dirX = Math.cos(ang + spread) * this.face;
      const dirY = Math.sin(ang + spread);
      const cols = this.mod.hydroFreeze
        ? ["#dff6ff", "#9fe0f5", "#6fc8e8", "#ffffff"]
        : this.mod.hydroFoam
          ? ["#ffffff", "#dff6ff", "#bfe6f2", "#9fe0f5"]
          : ["#9fe0f5", "#6fc8e8", "#49a0c4", "#dff6ff"];
      this.parts.push({
        x: m.x + rnd(-3, 3), y: m.y + rnd(-3, 3),
        vx: dirX * sp, vy: dirY * sp,
        life: FULL_LIFE * rnd(0.6, 1), max: FULL_LIFE, size: rnd(3, 7),
        color: cols[Math.floor(rnd(0, cols.length))],
        grav: 60, add: false, drag: 1,       // 轻微重力下坠，但长度仍对齐判定
      });
    }
  }

  // ---------------- 火焰 ----------------
  /** 三枪管并联时的三条火舌夹角（弧度） */
  private flameAngles(): number[] {
    const base = this.aimAngle();
    if (this.mod.burstCount < 3) return [base];
    const spread = 0.26;
    return [base - spread, base, base + spread];
  }

  private flameDamage() {
    const m = this.muzzle();
    const LEN = 250 * this.mod.flameRange;
    let dmg = 4.8 * this.dmgMul() * this.mod.flameDmg * (this.meta.id === "ass" ? 1.3 : 1);
    if (this.mod.railMounted) dmg *= 1.35;   // 导轨：喷火同时激光灼烧
    const angles = this.flameAngles();
    // 三管并联：每管单独结算，但单管伤害略降，避免叠加过载
    if (angles.length > 1) dmg *= 0.72;
    const hitSet = new Set<number>();
    for (const e of this.enemies) {
      if (e.dead) continue;
      const ex = e.x, ey = e.y - 32;
      let inFlame = false;
      for (const a of angles) {
        const dirX = Math.cos(a) * this.face;
        const dirY = Math.sin(a);
        const rx = ex - m.x, ry = ey - m.y;
        const t = clamp(rx * dirX + ry * dirY, 0, LEN);
        const cx = m.x + dirX * t, cy = m.y + dirY * t;
        const d = Math.hypot(ex - cx, ey - cy);
        const width = (20 + (t / LEN) * 26) * this.mod.flameWidth;
        if (d < width) { inFlame = true; break; }
      }
      if (inFlame) {
        hitSet.add(e.id);
        // 火焰对盾 3 倍（融化）
        if (e.shield > 0 && m.x < e.x) {
          e.shield -= dmg * 3;
          if (Math.random() < 0.2) this.burstParts(e.x - 14, e.y - 44, "#ff9426", 2, 40);
          if (e.shield <= 0) {
            e.shield = -1;
            this.sfx.melt();
            this.addFloat(e.x, e.y - 78, "簸箕盾融化！", "#ff9426", true);
            this.burstParts(e.x - 10, e.y - 40, "#ff9426", 12, 80);
          }
        } else {
          e.hp -= dmg;
          this.dmgDealt += dmg;
          e.dmgAcc += dmg; e.dmgAccT = 0.35;
          e.hitFlash = 0.05;
        }
        e.burnT = Math.max(e.burnT, 1.4 * this.mod.igniteSpeed);
        if (e.hp <= 0) this.killEnemy(e);
      }
      void hitSet;
    }
  }

  private spawnFlameParts() {
    const m = this.muzzle();
    const angles = this.flameAngles();
    const tri = angles.length > 1;
    // 判定射程（与 flameDamage 中的 LEN 完全一致）
    const LEN = 250 * this.mod.flameRange;
    const SPEED = 620;                     // 匀速飞行
    const FULL_LIFE = LEN / SPEED;         // 恰好飞满射程所需寿命
    angles.forEach((ang, k) => {
      const perp = tri ? (k - 1) * 7 : 0;               // 枪口间距
      const ox = -Math.sin(ang) * perp * this.face;
      const oy = Math.cos(ang) * perp;
      const n = tri ? 4 : 5;
      for (let i = 0; i < n; i++) {
        // 展开角按判定锥度（flameDamage 的 width 随距离线性增长）
        const spread = rnd(-0.085, 0.085) * (tri ? 0.6 : 1) * this.mod.flameWidth;
        const dirX = Math.cos(ang + spread) * this.face;
        const dirY = Math.sin(ang + spread);
        // 寿命在 55%~100% 射程间随机，形成自然的火舌渐变末端
        const lifeRatio = rnd(0.55, 1);
        this.parts.push({
          x: m.x + ox + rnd(-3, 3), y: m.y + oy + rnd(-3, 3),
          vx: dirX * SPEED, vy: dirY * SPEED,
          life: FULL_LIFE * lifeRatio, max: FULL_LIFE,
          size: rnd(4, 9) * (tri ? 0.9 : 1) * this.mod.flameWidth,
          color: ["#fff2a8", "#ffd23e", "#ff9426", "#ff5c1f", "#c22e12"][Math.floor(rnd(0, 5))],
          grav: 0, add: true, drag: 1,           // 匀速：画面长度 = 判定长度
        });
      }
      if (tri) {
        this.parts.push({
          x: m.x + ox, y: m.y + oy, vx: 0, vy: 0,
          life: 0.09, max: 0.09, size: 7, color: "#fff6c8",
          grav: 0, add: true, drag: 1,
        });
      }
    });
    if (this.parts.length > 1400) this.parts.splice(0, this.parts.length - 1400);
  }

  // ---------------- 激光 ----------------
  private laserDamage(dt: number) {
    const m = this.muzzle();
    const RANGE = Game.LASER_RANGE;
    const ap = this.aimPoint();
    let endX = ap.x, endY = ap.y;
    const dAim = Math.hypot(this.mx - m.x, this.my - m.y);
    if (dAim > RANGE) {
      endX = m.x + ((this.mx - m.x) / dAim) * RANGE;
      endY = m.y + ((this.my - m.y) / dAim) * RANGE;
    }
    // 找最近命中敌人
    let best: Enemy | null = null;
    let bestT = Infinity;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const ex = e.x, ey = e.y - 34;
      const rx = ex - m.x, ry = ey - m.y;
      const bx = endX - m.x, by = endY - m.y;
      const bLen = Math.hypot(bx, by) || 1;
      const nx = bx / bLen, ny = by / bLen;
      const t = rx * nx + ry * ny;
      if (t < 10 || t > bLen) continue;
      const d = Math.abs(rx * ny - ry * nx);
      const hitW = e.type === "chariot" ? 24 : 14;
      if (d < hitW && t < bestT) { bestT = t; best = e; }
    }
    // 分光棱镜：收集额外目标
    const extra: Enemy[] = [];
    if (best && this.mod.laserTargets > 1) {
      const bx = endX - m.x, by = endY - m.y;
      const bLen = Math.hypot(bx, by) || 1;
      const nx = bx / bLen, ny = by / bLen;
      for (const e of this.enemies) {
        if (e.dead || e === best || extra.length >= this.mod.laserTargets - 1) continue;
        const rx = e.x - m.x, ry = (e.y - 34) - m.y;
        const tt = rx * nx + ry * ny;
        if (tt < 10 || tt > bLen) continue;
        if (Math.abs(rx * ny - ry * nx) < 54) extra.push(e);
      }
      for (const e of extra) {
        const d2 = 15 * this.dmgMul() * this.mod.laserDmg * 0.55 * dt;
        if (e.shield > 0 && m.x < e.x) continue;
        e.hp -= d2; this.dmgDealt += d2;
        e.dmgAcc += d2; e.dmgAccT = 0.35; e.hitFlash = 0.04;
        e.burnT = Math.max(e.burnT, 0.6);
        if (e.hp <= 0) this.killEnemy(e);
        if (Math.random() < dt * 20) {
          this.parts.push({
            x: e.x, y: e.y - 34, vx: 0, vy: -20, life: 0.2, max: 0.2,
            size: 3, color: "#ff8a6a", grav: 0, add: true, drag: 1,
          });
        }
      }
    }
    if (best) {
      const frontal = m.x < best.x;
      if (best.shield > 0 && frontal) {
        // 簸箕盾完全抵挡激光
        if (Math.random() < dt * 8) {
          this.sfx.shieldBlock();
          this.burstParts(best.x - 16, best.y - 44, "#ffe084", 2, 60);
        }
        if (Math.random() < dt * 3) this.addFloat(best.x, best.y - 76, "格挡", "#9fadc0", false);
      } else {
        const dmg = 15 * this.dmgMul() * this.mod.laserDmg * (this.meta.id === "ass" ? 1.45 : 1) * dt;
        best.hp -= dmg;
        this.dmgDealt += dmg;
        best.dmgAcc += dmg; best.dmgAccT = 0.35;
        best.hitFlash = 0.04;
        // 同一目标持续照射 → 点燃
        if (best.laserId !== best.id) { best.laserId = best.id; best.heatT = 0; best.headT = Math.max(0, best.headT - dt * 2); }
        best.heatT += dt * this.mod.laserFocus;
        if (best.heatT > 0.7 && best.burnT <= 0) {
          best.burnT = 3;
          this.sfx.ignite();
          this.addFloat(best.x, best.y - 76, "引燃！", "#ff9426", false);
        }
        // 照射眼睛致盲
        const headY = best.y - (best.type === "chariot" ? 96 : 58);
        if (Math.abs(ap.y - headY) < 22 && Math.abs(ap.x - best.x) < 26) {
          best.headT += dt * this.mod.laserFocus;
          if (best.headT > 0.45 && best.blindT <= 0) {
            best.blindT = 2.6;
            this.sfx.blind();
            this.addFloat(best.x, best.y - 84, "致盲！", "#ffe084", true);
          }
        } else {
          best.headT = Math.max(0, best.headT - dt);
        }
        if (Math.random() < dt * 30) {
          this.parts.push({
            x: best.x + rnd(-8, 8), y: best.y - rnd(20, 50), vx: rnd(-30, 30), vy: -40,
            life: 0.3, max: 0.3, size: 2, color: "#ff5140", grav: 0, add: true, drag: 1,
          });
        }
        if (best.hp <= 0) this.killEnemy(best);
      }
    }
  }

  // ---------------- 敌人更新 ----------------
  private updateEnemies(dt: number) {
    const list = this.enemies;
    // 目标选择
    for (const e of list) {
      if (e.dead) continue;
      e.animT += dt;
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      e.atkT = Math.max(0, e.atkT - dt);
      e.swingAnim = Math.max(0, e.swingAnim - dt);
      if (e.bubbleT > 0) e.bubbleT -= dt;
      if (e.dmgAccT > 0) {
        e.dmgAccT -= dt;
        if (e.dmgAccT <= 0 && e.dmgAcc > 1) {
          this.addFloat(e.x + rnd(-8, 8), e.y - 66, `${Math.round(e.dmgAcc)}`, "#ffffff", false);
          e.dmgAcc = 0;
        }
      }
      // 燃烧
      if (e.burnT > 0) {
        e.burnT -= dt;
        e.burnAcc += dt;
        if (e.burnAcc >= 0.5) {
          e.burnAcc -= 0.5;
          const bd = 5;
          if (e.shield > 0) { /* 火焰穿盾燃烧本体 */ }
          e.hp -= bd;
          this.dmgDealt += bd;
          if (e.hp <= 0) { this.killEnemy(e); continue; }
        }
        this.parts.push({
          x: e.x + rnd(-10, 10), y: e.y - rnd(10, 56), vx: rnd(-10, 10), vy: rnd(-70, -30),
          life: rnd(0.2, 0.4), max: 0.4, size: rnd(3, 6),
          color: ["#ffd23e", "#ff9426", "#ff5c1f"][Math.floor(rnd(0, 3))],
          grav: -40, add: true, drag: 0.92,
        });
      }
      if (e.blindT > 0) {
        e.blindT -= dt;
        // 盲目游荡
        e.x += e.wanderX * 24 * dt;
        e.y = clamp(e.y + e.wanderY * 20 * dt, FLOOR_TOP + 20, FLOOR_BOT - 8);
        if (Math.random() < dt * 2) { e.wanderX = rnd(-1, 1); e.wanderY = rnd(-0.5, 0.5); }
        if (Math.random() < dt * 6) {
          this.parts.push({
            x: e.x + rnd(-10, 10), y: e.y - 66, vx: 0, vy: -12,
            life: 0.5, max: 0.5, size: 2.5, color: "#ffe084", grav: 0, add: false, drag: 1,
          });
        }
        continue;
      }

      if (e.flee) {
        e.x += 190 * dt;
        e.face = 1;
        if (e.x > 1000) e.dead = true;
        continue;
      }

      // ---- 破门而入（门破后） ----
      if (this.cineKind === "lose_door") {
        e.x -= 120 * dt;
        if (e.x < 60) e.dead = true;
        continue;
      }

      const slow = e.slowT > 0 ? 0.45 : 1;
      e.slowT = Math.max(0, e.slowT - dt);

      // ---- 目标选择 ----
      let tx = this.px, ty = this.py, kind: Enemy["targetKind"] = "player";
      let bestScore = Math.hypot(e.x - this.px, (e.y - this.py) * 1.6);
      if (e.type === "chariot") { bestScore = Math.hypot(e.x - DOOR_FRONT, 0) * 0.55; tx = DOOR_FRONT + 16; ty = e.y; kind = "door"; }
      e.targetDesk = null;
      for (const d of this.desks) {
        const sc = Math.hypot(e.x - d.x, (e.y - d.y) * 1.6) - 60;
        if (sc < bestScore) { bestScore = sc; tx = d.x; ty = d.y; kind = "desk"; e.targetDesk = d; }
      }
      if (kind === "player" && !e.ranged) {
        const doorScore = Math.hypot(e.x - DOOR_FRONT, 0) * (e.type === "soldier" ? 1.15 : 1); // 士兵略显好战
        if (doorScore < bestScore) { bestScore = doorScore; tx = DOOR_FRONT + 16; ty = e.y; kind = "door"; }
      }
      e.targetX = tx; e.targetY = ty; e.targetKind = kind;

      // ---- 粉笔投手：远程压制 ----
      if (e.ranged && kind === "player" && e.windT <= 0) {
        const distP = Math.hypot(e.x - this.px, (e.y - this.py) * 1.4);
        e.face = this.px < e.x ? -1 : 1;
        if (distP < 300 && this.phase === "play") {
          if (e.atkT <= 0) e.windT = 0.32;
          if (distP > 245) {
            // 还未就位：继续接近
            e.x += (this.px - e.x > 0 ? 1 : -1) * e.spd * slow * dt;
            e.y = clamp(e.y + clamp((this.py - e.y) * 0.03, -42 * dt, 42 * dt), FLOOR_TOP + 20, FLOOR_BOT - 8);
          }
          continue;
        }
      }

      // ---- 攻击判定 ----
      const inRangeX = kind === "door" ? e.x < DOOR_FRONT + 46 : Math.abs(e.x - tx) < (e.type === "chariot" ? 72 : e.type === "boss" ? 66 : 42);
      const inRangeY = Math.abs(e.y - ty) < 36;
      if (e.windT > 0) {
        e.windT -= dt;
        if (e.windT <= 0) {
          // 出手！
          e.swingAnim = 0.22;
          if (e.ranged && kind === "player" && this.phase === "play") {
            // 掷出粉笔头
            e.atkT = rnd(1.5, 2.2);
            const shx = e.x + e.face * 10, shy = e.y - 44;
            const dist = Math.hypot(this.px - shx, this.py - 30 - shy);
            this.projs.push({
              kind: "chalk", x: shx, y: shy, sx: shx, sy: shy,
              tx: this.px + rnd(-12, 12), ty: this.py - 26, t: 0,
              dur: Math.max(0.25, dist / 340),
            });
            this.sfx.throwIt();
          } else if (kind === "player" && inRangeX && inRangeY && this.phase === "play") {
            this.playerDamage(e.type === "chariot" ? 22 : e.type === "boss" ? 26 : e.type === "shield" ? 11 : 9);
          } else if (kind === "door" && e.x < DOOR_FRONT + 60) {
            this.doorDamage(e.type === "chariot" ? 13 : e.type === "boss" ? 16 : e.type === "shield" ? 8 : 6);
          } else if (kind === "desk" && e.targetDesk) {
            e.targetDesk.hp -= e.type === "boss" ? 30 : e.type === "chariot" ? 24 : 12;
            this.burstParts(e.targetDesk.x, e.targetDesk.y - 20, "#a06a3c", 6, 90);
            this.sfx.hit();
            if (e.targetDesk.hp <= 0) {
              this.desks.splice(this.desks.indexOf(e.targetDesk), 1);
              this.burstParts(tx, ty - 20, "#a06a3c", 22, 160);
              this.o.onEvent("课桌路障被拆毁了！", "warn");
            }
          }
        }
      } else if (inRangeX && inRangeY && e.atkT <= 0) {
        e.windT = e.type === "chariot" ? 0.5 : 0.38;
        e.atkT = e.type === "chariot" ? 1.9 : e.type === "boss" ? 1.4 : 1.05;
      }

      // ---- 战车抛恶臭罐 ----
      if (e.type === "chariot") {
        e.lobT -= dt;
        if (e.lobT <= 0 && this.phase === "play" && e.x < 860) {
          e.lobT = rnd(5.5, 8);
          this.projs.push({
            kind: "stinkball", x: e.x - 20, y: e.y - 90, sx: e.x - 20, sy: e.y - 90,
            tx: clamp(this.px + rnd(-30, 30), 140, 870), ty: this.py, t: 0, dur: 1.05,
          });
          e.bubble = "接招吧！"; e.bubbleT = 1.4;
          this.sfx.throwIt();
        }
      }

      // ---- BOSS 对讲机叫人 ----
      if (e.type === "boss") {
        e.walkieT -= dt;
        if (e.walkieT <= 0 && this.phase === "play") {
          e.walkieT = 12;
          e.bubble = "喂？拖把连，压上去！"; e.bubbleT = 2.2;
          this.sfx.walkie();
          for (let i = 0; i < 3; i++) this.spawnEnemy(Math.random() < 0.4 ? "shield" : "soldier", i * 30);
          this.o.onEvent("治安队长用对讲机叫来了增援（又免费又秒到）", "bad");
        }
      }

      // ---- 移动 ----
      if (e.windT <= 0 && !(inRangeX && inRangeY)) {
        const dx = tx - e.x, dy = ty - e.y;
        const dl = Math.hypot(dx, dy * 1.4) || 1;
        e.x += (dx / dl) * e.spd * slow * dt;
        e.y += clamp((dy / dl) * e.spd * slow * dt * 0.8, -40 * dt, 40 * dt);
        e.y = clamp(e.y, FLOOR_TOP + 20, FLOOR_BOT - 8);
        e.face = dx < 0 ? -1 : 1;
      }
      // 近战相互推开
      for (const o of list) {
        if (o === e || o.dead || o.type === "chariot" || e.type === "chariot") continue;
        const dx = e.x - o.x, dy = e.y - o.y;
        const d = Math.hypot(dx, dy);
        if (d > 0 && d < 22) {
          e.x += (dx / d) * 14 * dt;
          e.y += (dy / d) * 10 * dt;
        }
      }
      // 桌障碍阻挡敌人
      for (const d of this.desks) {
        if (Math.abs(e.y - d.y) < 24 && Math.abs(e.x - d.x) < 34 && e.type !== "chariot") {
          if (e.x > d.x) e.x = d.x + 34; else e.x = d.x - 34;
        }
      }
    }
    // 清理尸体
    for (let i = list.length - 1; i >= 0; i--) if (list[i].dead) list.splice(i, 1);
  }

  // ---------------- 投射物 ----------------
  private updateProjs(dt: number) {
    for (let i = this.projs.length - 1; i >= 0; i--) {
      const p = this.projs[i];
      p.t += dt;
      const k = clamp(p.t / p.dur, 0, 1);
      if (p.kind === "crate") {
        p.x = p.tx + Math.sin(p.t * 3) * 8;
        p.y = p.sy + (p.ty - p.sy) * k;
        if (k >= 1) {
          this.projs.splice(i, 1);
          this.landCrate(p);
        }
        continue;
      }
      if (p.kind === "chalk") {
        p.x = p.sx + (p.tx - p.sx) * k;
        p.y = p.sy + (p.ty - p.sy) * k;
        if (Math.random() < 0.4) {
          this.parts.push({
            x: p.x, y: p.y, vx: 0, vy: 0, life: 0.18, max: 0.18, size: 2,
            color: "#f2efe4", grav: 0, add: false, drag: 1,
          });
        }
        if (this.phase === "play" && Math.abs(p.x - this.px) < 14 && Math.abs(p.y - (this.py - 28)) < 32) {
          this.projs.splice(i, 1);
          this.playerDamage(5);
          this.burstParts(p.x, p.y, "#f2efe4", 5, 70);
          continue;
        }
        if (k >= 1) {
          this.projs.splice(i, 1);
          this.burstParts(p.x, p.y, "#f2efe4", 4, 40);
        }
        continue;
      }
      // 抛物线
      p.x = p.sx + (p.tx - p.sx) * k;
      const arc = p.kind === "battery" ? 90 : p.kind === "bomb" ? 190 : 110;
      p.y = p.sy + (p.ty - p.sy) * k - Math.sin(k * Math.PI) * arc;
      if (Math.random() < 0.5) {
        this.parts.push({
          x: p.x, y: p.y, vx: 0, vy: 10, life: 0.25, max: 0.25, size: 2.5,
          color: p.kind === "battery" ? "#57d6e6" : "#7fae3f", grav: 0, add: false, drag: 1,
        });
      }
      if (k >= 1) {
        this.projs.splice(i, 1);
        if (p.kind === "battery") {
          this.zones.push({ kind: "electric", x: p.tx, y: p.ty, r: 62, t: 5, tick: 0 });
          this.sfx.zap();
          this.o.onEvent("电池落地——地板通电了！", "good");
        } else if (p.kind === "stinkball") {
          this.zones.push({ kind: "pool", x: p.tx, y: p.ty, r: 48, t: 3.2, tick: 0 });
          this.sfx.stink();
          this.burstParts(p.tx, p.ty - 8, "#7fae3f", 16, 110);
        } else if (p.kind === "bomb") {
          this.landBomb(p);
        }
      }
    }
  }

  private landCrate(p: Proj) {
    this.sfx.arrive();
    this.burstParts(p.tx, p.ty - 10, "#ece7d8", 14, 90);
    const id = p.payload;
    // 弹匣类补给：入库到武装带（可叠加，每款上限 3）
    if (id && id.startsWith("mag_")) {
      const w = id.slice(4) as WeaponId;
      const cur = this.mags.get(w) ?? 0;
      if (cur >= Game.MAG_CAP) {
        this.addFloat(p.tx, p.ty - 50, "武装带已满", "#ff9a86", true);
        this.o.onEvent("武装带已满（每款武器至多 3 个弹匣）", "warn");
      } else {
        this.mags.set(w, cur + 1);
        this.addFloat(p.tx, p.ty - 50, `弹匣 +1（${cur + 1}/${Game.MAG_CAP}）`, "#c2a14a", true);
        // 若当前为空仓则自动换上
        if (this.ammoOf(w) <= 0 && this.weapon === w) this.reload();
      }
    }
    if (id === "med") { this.hp = Math.min(this.hpMax, this.hp + 90); this.addFloat(p.tx, p.ty - 50, "HP +90", "#7fe08a", true); }
    if (id === "upg") { this.upgrades = Math.min(3, this.upgrades + 1); this.addFloat(p.tx, p.ty - 50, `伤害+20% (${this.upgrades}/3)`, "#f2b53d", true); }
    if (id === "desk") {
      const dx = clamp(p.tx + 30, DOOR_FRONT + 70, 850);
      this.desks.push({ x: dx, y: clamp(p.ty, FLOOR_TOP + 26, FLOOR_BOT - 14), hp: 180, maxHp: 180 });
      this.addFloat(dx, p.ty - 50, "路障就位", "#f2b53d", true);
    }
    if (id === "bomb") {
      this.stink = "ready";
      this.addFloat(p.tx, p.ty - 50, "臭水弹已就位！", "#7fae3f", true);
      this.o.onBanner("臭水弹到货！", "按 4 号键发射：50% 直接胜利 · 50% 当场自爆", "warn");
    }
  }

  private landBomb(p: Proj) {
    this.flash(0.7, "#c4e368");
    this.shake(1.2, 16);
    this.sfx.explosion(true);
    this.sfx.stink();
    this.burstParts(p.tx, p.ty - 30, "#7fae3f", 80, 340);
    this.burstParts(p.tx, p.ty - 30, "#c4e368", 50, 260);
    this.burstParts(p.tx, p.ty - 30, "#4f7226", 40, 200);
    for (const e of this.enemies) {
      if (!e.dead) {
        e.burnT = 0; // 直接毒死
        this.killEnemy(e);
        this.burstParts(e.x, e.y - 30, "#7fae3f", 10, 120);
      }
    }
    if (this.cineKind === "bombFly") {
      this.cineKind = "winBomb";
      this.cineT = 0;
      this.o.onBanner("全歼治安队！！！", "七班方向已被臭气笼罩，无人敢再战", "good");
      this.sfx.win();
    }
  }

  // ---------------- 区域效果 ----------------
  private updateZones(dt: number) {
    for (let i = this.zones.length - 1; i >= 0; i--) {
      const z = this.zones[i];
      z.t -= dt;
      z.tick -= dt;
      if (z.kind === "electric") {
        if (z.tick <= 0) {
          z.tick = 0.38;
          this.sfx.zap();
          for (const e of this.enemies) {
            if (e.dead) continue;
            if (Math.hypot(e.x - z.x, (e.y - z.y) * 1.4) < z.r) {
              this.hitEnemy(e, 10 * this.dmgMul(), 0, z.x, true); // 触电无视盾
              e.slowT = Math.max(e.slowT, 0.5);
            }
          }
        }
        if (Math.random() < dt * 14) {
          // 闪电折线粒子
          const a = rnd(0, Math.PI * 2);
          this.parts.push({
            x: z.x + Math.cos(a) * z.r * rnd(0.2, 0.9), y: z.y + Math.sin(a) * z.r * 0.5 * rnd(0.2, 0.9) - 6,
            vx: 0, vy: 0, life: 0.12, max: 0.12, size: rnd(2, 4),
            color: ["#ffffff", "#57d6e6", "#c9f4ff"][Math.floor(rnd(0, 3))], grav: 0, add: true, drag: 1,
          });
        }
      } else {
        // 恶臭毒池
        if (z.tick <= 0) {
          z.tick = 0.5;
          if (Math.hypot(this.px - z.x, (this.py - z.y) * 1.4) < z.r && this.phase === "play") {
            this.playerDamage(6);
          }
          for (const e of this.enemies) {
            if (!e.dead && Math.hypot(e.x - z.x, (e.y - z.y) * 1.4) < z.r) {
              this.hitEnemy(e, 4, 0, z.x, true); // 敌我不分的毒气
            }
          }
        }
        if (Math.random() < dt * 10) {
          this.parts.push({
            x: z.x + rnd(-z.r * 0.8, z.r * 0.8), y: z.y + rnd(-8, 4), vx: 0, vy: rnd(-26, -10),
            life: rnd(0.5, 1), max: 1, size: rnd(3, 6), color: "#7fae3f", grav: 0, add: false, drag: 0.98,
          });
        }
      }
      if (z.t <= 0) this.zones.splice(i, 1);
    }
  }

  private updateParts(dt: number) {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.life -= dt;
      if (p.life <= 0) { this.parts.splice(i, 1); continue; }
      p.vx *= p.drag; p.vy = p.vy * p.drag + p.grav * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  private endGame(win: boolean, reason: EndStats["reason"]) {
    if (this.phase === "over") return;
    this.phase = "over";
    this.stopStreams();
    // 战役结算：剩余班费 + 战功奖金 存入军械库，可用于武器改装
    const bonus = Math.round(this.funds + this.kills * 4 + (win ? 260 : 60));
    addBank(bonus);
    this.o.onEvent(`战后清点：${bonus} 班费已存入军械库`, "good");
    this.o.onEnd({
      win, reason,
      kills: this.kills,
      dmg: Math.round(this.dmgDealt),
      funds: this.fundsEarned,
      time: Math.min(this.elapsed, DURATION),
    });
  }

  // ============================================================
  // 渲染
  // ============================================================
  private render() {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, W, H);

    // 震动
    let ox = 0, oy = 0;
    if (this.shakeT > 0) {
      ox = rnd(-this.shakeMag, this.shakeMag) * (this.shakeT > 0.3 ? 1 : this.shakeT / 0.3);
      oy = rnd(-this.shakeMag, this.shakeMag) * (this.shakeT > 0.3 ? 1 : this.shakeT / 0.3);
    }
    ctx.save();
    ctx.translate(Math.round(ox), Math.round(oy));

    ctx.drawImage(this.bg, 0, 0);

    // 门破损表现
    if (this.doorHp < this.doorMax * 0.66) {
      ctx.strokeStyle = "rgba(20,24,32,0.85)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(24, 260); ctx.lineTo(46, 320); ctx.lineTo(30, 380);
      if (this.doorHp < this.doorMax * 0.33) {
        ctx.moveTo(70, 240); ctx.lineTo(58, 330); ctx.lineTo(84, 420);
        ctx.moveTo(20, 430); ctx.lineTo(90, 470);
      }
      ctx.stroke();
    }
    if (this.cineKind === "lose_door" || (this.phase === "over" && this.doorHp <= 0)) {
      ctx.fillStyle = "#0c0f16";
      ctx.fillRect(10, 212, DOOR_FRONT - 14, 316);
      ctx.fillStyle = "#22304a";
      for (let i = 0; i < 8; i++) ctx.fillRect(16 + i * 12, 500 - (i % 3) * 10, 10, 8);
    }

    // 电报机（门口小桌上）
    drawSpr(ctx, "telegraph", 68, FLOOR_TOP + 128, { anchor: "bc", scale: PIX });
    ctx.fillStyle = "#14171f";
    ctx.fillRect(38, FLOOR_TOP + 128, 60, 4);

    // 区域效果（底层）
    for (const z of this.zones) this.renderZone(z);

    // 空投
    for (const p of this.projs) if (p.kind === "crate") this.renderCrate(p);

    // 课桌
    for (const d of this.desks) {
      this.shadow(d.x, d.y, 56, 12);
      drawSpr(ctx, "desk", d.x, d.y, { anchor: "bc" });
      if (d.hp < d.maxHp * 0.5) {
        ctx.fillStyle = "rgba(20,16,10,0.6)";
        ctx.fillRect(d.x - 20, d.y - 24, 16, 3);
        ctx.fillRect(d.x + 6, d.y - 32, 12, 3);
      }
      // 血条
      ctx.fillStyle = "#14171f";
      ctx.fillRect(d.x - 30, d.y - 46, 60, 5);
      ctx.fillStyle = "#a06a3c";
      ctx.fillRect(d.x - 29, d.y - 45, 58 * clamp(d.hp / d.maxHp, 0, 1), 3);
    }

    // 实体排序
    const renderList: { y: number; fn: () => void }[] = [];
    for (const e of this.enemies) renderList.push({ y: e.y, fn: () => this.renderEnemy(e) });
    renderList.push({ y: this.py, fn: () => this.renderPlayer() });
    renderList.sort((a, b) => a.y - b.y);
    for (const r of renderList) r.fn();

    // 投射物
    for (const p of this.projs) {
      if (p.kind === "crate") continue;
      if (p.kind === "battery") drawSpr(ctx, "battery", p.x, p.y, { anchor: "c", scale: 3 });
      if (p.kind === "stinkball") {
        ctx.fillStyle = "#4f7226";
        ctx.fillRect(p.x - 5, p.y - 5, 10, 10);
        ctx.fillStyle = "#7fae3f";
        ctx.fillRect(p.x - 3, p.y - 7, 7, 7);
      }
      if (p.kind === "chalk") {
        ctx.fillStyle = "#f2efe4";
        ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
        ctx.fillStyle = "#c9d1dc";
        ctx.fillRect(p.x - 1, p.y - 1, 3, 3);
      }
      if (p.kind === "bomb") drawSpr(ctx, "bomb", p.x, p.y, { anchor: "c", scale: 5 });
    }

    // 粒子
    ctx.save();
    for (const p of this.parts) {
      if (p.add) ctx.globalCompositeOperation = "lighter";
      const lr = p.life / p.max;
      ctx.globalAlpha = clamp(lr * 1.4, 0, 1);
      ctx.fillStyle = p.color;
      const s = Math.max(1, p.size * (p.add ? lr : 1));
      ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), Math.round(s), Math.round(s));
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    // 弹丸
    for (const b of this.bullets) {
      const ang = Math.atan2(b.vy, b.vx);
      ctx.save();
      ctx.translate(Math.round(b.x), Math.round(b.y));

      if (b.kind === "eraser") {
        // ——— 粉笔头：翻滚的小方块，带缺角 ———
        ctx.rotate(b.spin);
        const sz = [5, 4, 6, 11][b.sub];   // sub=3 为独头弹（整块黑板擦）
        ctx.fillStyle = "#8a8574";                 // 阴影面
        ctx.fillRect(-sz / 2 + 1, -sz / 2 + 1, sz, sz);
        ctx.fillStyle = "#f2efe4";                 // 粉笔本体
        ctx.fillRect(-sz / 2, -sz / 2, sz, sz);
        ctx.fillStyle = "#ffffff";                 // 高光
        ctx.fillRect(-sz / 2, -sz / 2, sz - 2, 1);
        ctx.fillStyle = "#d8d2b8";                 // 磨损缺角
        ctx.fillRect(sz / 2 - 2, sz / 2 - 2, 2, 2);

      } else if (b.kind === "stapler") {
        // ——— 订书钉：翻滚的 ∏ 形金属 ———
        ctx.rotate(b.spin);
        ctx.fillStyle = "#b9c1cd";
        ctx.fillRect(-4, -2, 8, 1.6);              // 横梁
        ctx.fillRect(-4, -2, 1.6, 4);              // 左腿
        ctx.fillRect(2.4, -2, 1.6, 4);             // 右腿
        ctx.fillStyle = "#e8edf4";
        ctx.fillRect(-4, -2, 8, 0.8);

      } else if (b.kind === "rifle") {
        // ——— 狙击弹：细长锥形 + 速度残像 ———
        ctx.rotate(ang);
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = "rgba(255,250,240,0.28)";  // 拖影
        ctx.fillRect(-26, -1, 26, 2);
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "#d8d2b8";
        ctx.fillRect(-7, -1.6, 12, 3.2);           // 弹身
        ctx.fillStyle = "#fffaf0";
        ctx.fillRect(-7, -1.6, 12, 1.2);           // 高光
        ctx.beginPath();                            // 锥形弹头
        ctx.moveTo(5, -1.6); ctx.lineTo(10, 0); ctx.lineTo(5, 1.6);
        ctx.closePath();
        ctx.fillStyle = "#ffffff"; ctx.fill();

      } else if (b.kind === "lamp") {
        // ——— 光弹：核心 + 光晕 + 脉动环 ———
        ctx.globalCompositeOperation = "lighter";
        const pulse = 0.8 + Math.sin(this.elapsed * 26 + b.seed) * 0.2;
        const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 16 * pulse);
        g.addColorStop(0, "rgba(255,246,200,0.95)");
        g.addColorStop(0.4, "rgba(255,210,62,0.5)");
        g.addColorStop(1, "rgba(255,170,40,0)");
        ctx.fillStyle = g;
        ctx.fillRect(-18, -18, 36, 36);
        ctx.rotate(ang);
        ctx.fillStyle = "#fff6c8";
        ctx.fillRect(-9, -2, 18, 4);               // 光柱
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-4, -1, 10, 2);               // 炽核
      }
      ctx.restore();
    }
    // 空中的投掷物
    for (const n of this.nades) {
      const sprMap: Record<string, string> = {
        smoke: "nadeSmoke", glue: "nadeGlue", firecracker: "nadeFirecracker",
        sock: "nadeSock", bottle: "nadeBottle",
      };
      drawSpr(ctx, (sprMap[n.kind] ?? "nadeBottle") as "nadeSmoke", n.x, n.y, {
        anchor: "c", scale: 2.4,
      });
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.ellipse(n.tx, n.ty, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // 投掷物区域
    for (const z of this.zonesFx) {
      const a = clamp(z.t / z.max, 0, 1);
      const col: Record<string, string> = {
        smoke: `rgba(220,226,210,${0.3 * a})`,
        dust: `rgba(216,210,184,${0.3 * a})`,
        glue: `rgba(232,201,90,${0.42 * a})`,
        sock: `rgba(126,138,99,${0.36 * a})`,
        firecracker: `rgba(255,150,60,${0.22 * a})`,
      };
      ctx.fillStyle = col[z.kind] ?? "rgba(255,255,255,0.2)";
      ctx.beginPath();
      ctx.ellipse(z.x, z.y, z.r, z.r * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 激光束
    if (this.laserOn && this.phase === "play") {
      const m = this.muzzle();
      const RANGE = Game.LASER_RANGE;
      let ex = this.mx, ey = this.my;
      const d = Math.hypot(ex - m.x, ey - m.y);
      if (d > RANGE) { ex = m.x + (ex - m.x) / d * RANGE; ey = m.y + (ey - m.y) / d * RANGE; }
      const flick = Math.random() * 0.3 + 0.7;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = `rgba(255,40,40,${0.35 * flick})`;
      ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.strokeStyle = `rgba(255,120,90,${0.8 * flick})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(ex, ey); ctx.stroke();
      // 落点光斑
      ctx.fillStyle = "#ff5140";
      ctx.fillRect(ex - 4, ey - 4, 8, 8);
      ctx.fillStyle = "#fff";
      ctx.fillRect(ex - 2, ey - 2, 4, 4);
      ctx.restore();
    }

    // 浮动文字
    for (const f of this.floats) {
      ctx.globalAlpha = clamp(f.life * 1.6, 0, 1);
      drawPixelText(ctx, f.text, f.x, f.y, {
        size: f.big ? 13 : 10, color: f.color, scale: f.big ? 3 : 2, center: true,
      });
      ctx.globalAlpha = 1;
    }

    // 引信阶段特效
    if (this.phase === "cine" && this.cineKind === "bombFuse") {
      const m = this.muzzle();
      drawSpr(ctx, "bomb", m.x + this.face * 8, m.y - 14, { anchor: "c", scale: 4 });
      if (Math.random() < 0.6) {
        this.parts.push({
          x: m.x + this.face * 8 + rnd(-4, 4), y: m.y - 26, vx: rnd(-20, 20), vy: -40,
          life: 0.3, max: 0.3, size: 2.5, color: "#ffd23e", grav: 0, add: true, drag: 1,
        });
      }
    }

    // 狙击镜
    if (this.ads > 0.01) this.renderScope();

    // 准星
    if (this.phase === "play" && !this.paused) this.renderCrosshair();

    ctx.restore();

    // 受伤红晕
    if (this.hurtVign > 0) {
      ctx.fillStyle = `rgba(213,58,38,${this.hurtVign * 0.28})`;
      ctx.fillRect(0, 0, W, 26);
      ctx.fillRect(0, H - 26, W, 26);
      ctx.fillRect(0, 0, 26, H);
      ctx.fillRect(W - 26, 0, 26, H);
    }
    // 全屏闪光
    if (this.flashT > 0) {
      ctx.globalAlpha = clamp(this.flashT * 1.6, 0, 0.9);
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    // 剧情黑边
    if (this.phase === "cine") {
      const h = clamp(this.cineT * 90, 0, 46);
      ctx.fillStyle = "#0a0c12";
      ctx.fillRect(0, 0, W, h);
      ctx.fillRect(0, H - h, W, h);
    }
    // 尘埃及灯光闪烁
    if (Math.random() < 0.12) {
      ctx.fillStyle = "rgba(255,240,200,0.25)";
      ctx.fillRect(rnd(100, 900), rnd(80, 300), 2, 2);
    }
  }

  private shadow(x: number, y: number, w: number, h: number) {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(15,14,18,0.35)";
    ctx.fillRect(Math.round(x - w / 2), Math.round(y - h / 2), w, h);
  }

  private renderZone(z: Zone) {
    const ctx = this.ctx;
    if (z.kind === "electric") {
      const pulse = 0.5 + Math.sin(z.t * 10) * 0.15;
      ctx.fillStyle = `rgba(87,214,230,${0.14 * pulse})`;
      ctx.beginPath();
      ctx.ellipse(z.x, z.y, z.r, z.r * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      // 电池本体
      drawSpr(ctx, "battery", z.x, z.y + 4, { anchor: "c", scale: 3 });
      // 随机电弧
      for (let i = 0; i < 2; i++) {
        if (Math.random() < 0.7) {
          const x1 = z.x + rnd(-z.r * 0.8, z.r * 0.8);
          const y1 = z.y + rnd(-z.r * 0.3, z.r * 0.3);
          const x2 = z.x + rnd(-z.r * 0.8, z.r * 0.8);
          const y2 = z.y + rnd(-z.r * 0.3, z.r * 0.3);
          ctx.strokeStyle = Math.random() < 0.5 ? "#c9f4ff" : "#57d6e6";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo((x1 + x2) / 2 + rnd(-8, 8), (y1 + y2) / 2 + rnd(-6, 6));
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
    } else {
      ctx.fillStyle = "rgba(79,114,38,0.5)";
      ctx.beginPath();
      ctx.ellipse(z.x, z.y, z.r, z.r * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(127,174,63,0.55)";
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(z.x + rnd(-z.r * 0.8, z.r * 0.8), z.y + rnd(-z.r * 0.3, z.r * 0.3), 6, 4);
      }
    }
  }

  private renderCrate(p: Proj) {
    const ctx = this.ctx;
    drawSpr(ctx, "parachute", p.x, p.y - 34, { anchor: "bc" });
    drawSpr(ctx, "crate", p.x, p.y, { anchor: "bc" });
    this.shadow(p.tx, p.ty, 34, 8);
  }

  private renderPlayer() {
    const ctx = this.ctx;
    this.shadow(this.px, this.py + 2, 34, 8);
    const frame = Math.floor(this.animT * 6) % 2 === 0 ? this.meta.sprA : this.meta.sprB;
    const flip = this.face === -1;
    const blink = this.immuneT > 0 && Math.floor(this.immuneT * 14) % 2 === 0;
    if (blink) ctx.globalAlpha = 0.45;

    // 武器（身体后/前）
    const hx = this.px + this.face * HAND.x;
    const hy = this.py + HAND.y;
    if (this.weapon === "gas") {
      drawSpr(ctx, "gunGas", hx + this.face * 14, hy + 3, { anchor: "c", flip, scale: 3 });
      // 导轨：枪身上挂着激光笔
      if (this.mod.railMounted) {
        drawSpr(ctx, "gunLaser", hx + this.face * 12, hy - 9, { anchor: "c", flip, scale: 1.7 });
        if (this.gasStreaming) {
          const m = this.muzzle();
          const ang = this.aimAngle();
          const ex = m.x + Math.cos(ang) * this.face * 250 * this.mod.flameRange;
          const ey = m.y + Math.sin(ang) * 250 * this.mod.flameRange;
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.strokeStyle = "rgba(255,80,60,0.75)";
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(m.x, m.y - 8); ctx.lineTo(ex, ey); ctx.stroke();
          ctx.restore();
        }
      }
    }
    if (this.weapon === "laser") drawSpr(ctx, "gunLaser", hx + this.face * 10, hy, { anchor: "c", flip, scale: 3 });
    const gunSpr: Partial<Record<WeaponId, string>> = {
      stapler: "gunStapler", rifle: "gunChalkRifle",
      eraser: "gunEraser", lamp: "gunLampCannon",
    };
    const gs = gunSpr[this.weapon];
    if (gs) {
      drawSpr(ctx, gs as "gunStapler", hx + this.face * 14, hy + 2, {
        anchor: "c", flip, scale: this.weapon === "rifle" ? 2.4 : 2.6,
      });
    }
    if (this.weapon === "hydro") {
      drawSpr(ctx, this.hydroOn && Math.floor(this.elapsed * 14) % 2 === 0 ? "gunHydroB" : "gunHydro",
        hx + this.face * 12, hy + 2, { anchor: "c", flip, scale: 2.6 });
    }
    {
      const gunSpr: Partial<Record<WeaponId, string>> = {
        stapler: "gunStapler", rifle: "gunChalkRifle",
        eraser: "gunEraser", lamp: "gunLampCannon",
      };
      const gs = gunSpr[this.weapon];
      if (gs) {
        drawSpr(ctx, gs as "gunStapler", hx + this.face * 14, hy + 2, {
          anchor: "c", flip, scale: this.weapon === "rifle" ? 2.4 : 2.6,
        });
      }
    }
    if (this.weapon === "melee") {
      const swing = this.meleeAnim > 0 ? (0.2 - this.meleeAnim) / 0.2 : 0;
      const wOff = swing > 0 ? Math.sin(swing * Math.PI) * 20 : 0;
      drawSpr(ctx, "gunCompass", hx + this.face * (10 + wOff), hy + 2 - wOff * 0.4, { anchor: "c", flip, scale: 3 });
    }
    if (this.weapon === "bomb" && this.stink === "ready") drawSpr(ctx, "bomb", hx + this.face * 10, hy, { anchor: "c", scale: 3 });

    drawSpr(ctx, frame, this.px, this.py, { flip });

    // ---- 换弹动画 ----
    if (this.reloadT > 0 && this.reloadDur > 0) {
      const k = 1 - this.reloadT / this.reloadDur;   // 0→1
      const gx = hx + this.face * 14;
      const gy = hy + 2;
      // 阶段1(0~0.35)：旧弹匣脱落
      if (k < 0.42) {
        const p = k / 0.42;
        ctx.save();
        ctx.globalAlpha = 1 - p;
        ctx.fillStyle = "#4d5564";
        ctx.fillRect(gx - 3, gy + 6 + p * 34, 7, 11);
        ctx.fillStyle = "#8c94a3";
        ctx.fillRect(gx - 2, gy + 7 + p * 34, 5, 3);
        ctx.restore();
        // 落地火星
        if (Math.random() < 0.3) {
          this.parts.push({
            x: gx, y: gy + 10 + p * 34, vx: rnd(-20, 20), vy: rnd(-10, 30),
            life: 0.3, max: 0.3, size: 2, color: "#8c94a3", grav: 200, add: false, drag: 1,
          });
        }
      }
      // 阶段2(0.45~0.9)：新弹匣从下方推入
      if (k >= 0.42) {
        const p = clamp((k - 0.42) / 0.45, 0, 1);
        const rise = (1 - p) * 30;
        ctx.fillStyle = "#c2a14a";
        ctx.fillRect(gx - 3, gy + 6 + rise, 7, 11);
        ctx.fillStyle = "#e8c15a";
        ctx.fillRect(gx - 2, gy + 7 + rise, 5, 3);
        if (p >= 1 && Math.floor(this.elapsed * 20) % 2 === 0) {
          // 上膛闪光
          ctx.fillStyle = "rgba(255,240,200,0.7)";
          ctx.fillRect(gx + this.face * 8, gy - 2, 4, 3);
        }
      }
      // 头顶进度环
      const bw = 34;
      ctx.fillStyle = "rgba(8,10,14,0.85)";
      ctx.fillRect(this.px - bw / 2 - 1, this.py - 92, bw + 2, 7);
      ctx.fillStyle = "#c2a14a";
      ctx.fillRect(this.px - bw / 2, this.py - 91, bw * k, 5);
      drawPixelText(ctx, "换弹", this.px, this.py - 108, {
        size: 9, color: "#c2a14a", scale: 2, center: true,
      });
    }

    // 哮喘吸入器
    if (this.asthmaLock > 0) {
      drawSpr(ctx, "inhaler", this.px + 10 * this.face, this.py - 52, { anchor: "c", scale: 3 });
      if (Math.random() < 0.3) {
        this.parts.push({
          x: this.px + rnd(-6, 6), y: this.py - 46, vx: rnd(-8, 8), vy: -20,
          life: 0.5, max: 0.5, size: 2, color: "#c9d1dc", grav: 0, add: false, drag: 1,
        });
      }
    }
    // 医疗引导读条特效
    if (this.healChannel > 0) {
      drawSpr(ctx, "medkit", this.px, this.py - 78 + Math.sin(this.elapsed * 8) * 3, { anchor: "c", scale: 3 });
    }
    ctx.globalAlpha = 1;
  }

  private renderEnemy(e: Enemy) {
    const ctx = this.ctx;
    const flip = e.face === -1;
    const wob = Math.sin(e.animT * 9) * 2;
    const white = e.hitFlash > 0.03;

    if (e.type === "chariot") { this.renderChariot(e, white); return; }

    const h = e.type === "boss" ? 66 : 58;
    this.shadow(e.x, e.y + 2, e.type === "boss" ? 40 : 30, 8);

    // 持械（前手）
    const hx = e.x + e.face * 12;
    const hy = e.y - 30;
    const thrust = e.swingAnim > 0 || e.windT > 0;
    if (e.type === "soldier" || e.type === "shield") {
      if (e.ranged) {
        // 粉笔投手：手里捏着粉笔头
        ctx.fillStyle = white ? "#ffffff" : "#f2efe4";
        ctx.fillRect(hx + e.face * 6 - 3, hy - 3 + (thrust ? -10 : 0), 6, 6);
      } else {
        // 拖把/扫把精灵本身朝左绘制，敌人朝左时无需翻转
        drawSpr(ctx, thrust ? "mopThrust" : "mopV", hx + e.face * (thrust ? 22 : 10), hy + (thrust ? 0 : 10), {
          anchor: "c", flip: !flip, scale: 2.6, white,
        });
      }
    }
    if (e.type === "boss") {
      drawSpr(ctx, "mopThrust", hx + e.face * 18, hy + 2, { anchor: "c", flip: !flip, scale: 3.2, white });
    }

    const frame = Math.floor(e.animT * 6) % 2 === 0;
    let sprName: keyof typeof SPR = frame ? "soldA" : "soldB";
    if (e.type === "boss") sprName = frame ? "bossA" : "bossB";
    const sc = e.type === "boss" ? 3.4 : 2.9;
    drawSpr(ctx, sprName, e.x, e.y + wob * 0.4, { flip, white, scale: sc });

    // 盾
    if ((e.type === "shield" || e.type === "boss") && e.shield !== -1) {
      const sx = e.x + e.face * 18;
      drawSpr(ctx, e.shield > 0 ? "shield" : "shieldBroken", sx, e.y - 24, {
        anchor: "c", flip: false, scale: 3, white,
      });
    } else if (e.shield === -1 && (e.type === "shield")) {
      drawSpr(ctx, "shieldBroken", e.x + e.face * 16, e.y - 26, { anchor: "c", scale: 3 });
    }

    this.renderEnemyFx(e, h);
  }

  private renderChariot(e: Enemy, white: boolean) {
    const ctx = this.ctx;
    this.shadow(e.x, e.y + 2, 90, 14);
    const flip = e.face === -1;
    const wheelFrame = Math.floor(e.animT * 7) % 2 === 0 ? "wheelA" : "wheelB";
    const bob = Math.sin(e.animT * 6) * 2;
    // 轮子
    drawSpr(ctx, wheelFrame, e.x - 22, e.y - 2, { anchor: "bc", scale: 3, white });
    drawSpr(ctx, wheelFrame, e.x + 24, e.y - 2, { anchor: "bc", scale: 3, white });
    // 推手（后面）
    const pushFrame = Math.floor(e.animT * 6) % 2 === 0 ? "soldA" : "soldB";
    drawSpr(ctx, pushFrame, e.x + 56, e.y + bob * 0.5, { flip, scale: 2.7, white, alpha: 0.95 });
    // 桶
    drawSpr(ctx, "bucket", e.x, e.y - 6 + bob * 0.4, { anchor: "bc", scale: 3, white });
    // 毒液滴落
    if (Math.random() < 0.1) {
      this.parts.push({
        x: e.x + rnd(-24, 24), y: e.y - 8, vx: 0, vy: 30,
        life: 0.5, max: 0.5, size: 3, color: "#7fae3f", grav: 200, add: false, drag: 1,
      });
    }
    // 双拖把长枪
    drawSpr(ctx, "mopLance", e.x + (flip ? 14 : -34), e.y - 40 + bob, { anchor: "tl", scale: 3, white });
    drawSpr(ctx, "mopLance", e.x + (flip ? 30 : -2), e.y - 30 + bob * 1.4, { anchor: "tl", scale: 2.6, white });
    // 挥舞手（站在桶后）
    const swingerY = e.y - 34 + bob * 0.6;
    const swingFrame = Math.floor(e.animT * 5) % 2 === 0 ? "soldA" : "soldB";
    drawSpr(ctx, swingFrame, e.x + 10, swingerY, { flip, scale: 2.9, white });
    // 挥拖把
    const hx = e.x + 10 + e.face * 14;
    if (e.windT > 0 || e.swingAnim > 0) {
      drawSpr(ctx, "mopThrust", hx + e.face * 20, swingerY - 32, { anchor: "c", flip: !flip, scale: 3.4, white });
      // 感叹号
      drawPixelText(ctx, "!", e.x + 10, swingerY - 92, { size: 14, color: "#ff5140", scale: 3, center: true });
    } else {
      drawSpr(ctx, "mopV", hx, swingerY - 26, { anchor: "c", flip: !flip, scale: 2.6, white });
    }
    this.renderEnemyFx(e, 96);
  }

  private renderEnemyFx(e: Enemy, h: number) {
    const ctx = this.ctx;
    // 血条
    if (e.hp < e.maxHp && e.hp > 0) {
      const w = e.type === "boss" ? 64 : e.type === "chariot" ? 60 : 30;
      const yy = e.y - h - 14;
      ctx.fillStyle = "#14171f";
      ctx.fillRect(e.x - w / 2 - 1, yy - 1, w + 2, 5);
      ctx.fillStyle = "#d53a26";
      ctx.fillRect(e.x - w / 2, yy, w * clamp(e.hp / e.maxHp, 0, 1), 3);
    }
    // 盾条
    if (e.shield > 0) {
      const w = 30;
      ctx.fillStyle = "#14171f";
      ctx.fillRect(e.x - w / 2 - 1, e.y - h - 8, w + 2, 4);
      ctx.fillStyle = "#9fadc0";
      ctx.fillRect(e.x - w / 2, e.y - h - 7, w * clamp(e.shield / (e.type === "boss" ? 90 : 52), 0, 1), 2);
    }
    // 致盲星星
    if (e.blindT > 0) {
      for (let i = 0; i < 3; i++) {
        const a = this.elapsed * 5 + (i * Math.PI * 2) / 3;
        ctx.fillStyle = "#ffe084";
        ctx.fillRect(e.x + Math.cos(a) * 14 - 2, e.y - h - 2 + Math.sin(a) * 5 - 2, 4, 4);
      }
    }
    // 气泡
    if (e.bubbleT > 0 && e.bubble) {
      drawPixelText(ctx, e.bubble, e.x, e.y - h - 34, {
        size: 10, color: "#14171f", scale: 2, center: true, bg: "rgba(243,234,210,0.92)",
      });
    }
    // 激光蓄热提示
    if (e.heatT > 0.3 && e.burnT <= 0) {
      drawPixelText(ctx, "冒烟…", e.x, e.y - h - 20, { size: 9, color: "#ff9426", scale: 2, center: true });
    }
  }

  /** 8 倍镜画面：黑色镜筒 + 分划板 + 呼吸晃动 */
  private renderScope() {
    const ctx = this.ctx;
    const k = this.ads;
    const ap = this.aimPoint();
    // 呼吸晃动（开镜越深越稳）
    const sway = (1 - k) * 6 + 1.5;
    const cx = ap.x + Math.sin(this.breath * 1.3) * sway;
    const cy = ap.y + Math.cos(this.breath * 0.9) * sway * 0.6;
    const R = 150 + (1 - k) * 260;

    ctx.save();
    // 镜筒外遮罩
    ctx.globalAlpha = k * 0.93;
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.arc(cx, cy, R, 0, Math.PI * 2, true);
    ctx.fillStyle = "#05070a";
    ctx.fill();
    // 镜片边缘渐晕
    const vg = ctx.createRadialGradient(cx, cy, R * 0.62, cx, cy, R);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, `rgba(5,7,10,${k * 0.92})`);
    ctx.fillStyle = vg;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    // 镜筒金属圈
    ctx.globalAlpha = k;
    ctx.strokeStyle = "#1b2026"; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(cx, cy, R + 2, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "#39414f"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, R - 2, 0, Math.PI * 2); ctx.stroke();

    // ---- 分划板 ----
    ctx.strokeStyle = `rgba(20,24,20,${k * 0.9})`;
    ctx.lineWidth = 1.6;
    // 十字主线（中心留空）
    ctx.beginPath();
    ctx.moveTo(cx - R + 8, cy); ctx.lineTo(cx - 16, cy);
    ctx.moveTo(cx + 16, cy); ctx.lineTo(cx + R - 8, cy);
    ctx.moveTo(cx, cy - R + 8); ctx.lineTo(cx, cy - 16);
    ctx.moveTo(cx, cy + 16); ctx.lineTo(cx, cy + R - 8);
    ctx.stroke();
    // 密位刻度
    ctx.lineWidth = 1.4;
    for (let i = 1; i <= 5; i++) {
      const d = i * 22;
      const len = i % 2 === 0 ? 7 : 4;
      ctx.beginPath();
      ctx.moveTo(cx - d, cy - len); ctx.lineTo(cx - d, cy + len);
      ctx.moveTo(cx + d, cy - len); ctx.lineTo(cx + d, cy + len);
      ctx.moveTo(cx - len, cy + d); ctx.lineTo(cx + len, cy + d);
      ctx.stroke();
    }
    // 中心红点
    ctx.fillStyle = `rgba(214,70,54,${k})`;
    ctx.fillRect(cx - 1.5, cy - 1.5, 3, 3);

    // 倍率与弹药
    if (k > 0.5) {
      drawPixelText(ctx, "8x", cx - R + 24, cy - 14, { size: 11, color: "#8fd6a0", scale: 2 });
      const ammo = this.ammoOf("rifle");
      drawPixelText(ctx, `${ammo}`, cx + R - 52, cy - 14, { size: 11, color: "#c2a14a", scale: 2 });
    }
    ctx.restore();
  }

  private renderCrosshair() {
    const ctx = this.ctx;
    const colors: Record<WeaponId, string> = { gas: "#ff9426", laser: "#ff5140", melee: "#ece7d8", hydro: "#49a0c4", stapler: "#d4788a", rifle: "#b9c4d6", eraser: "#c9a56a", lamp: "#e8c15a", bomb: "#7fae3f" };
    if (this.ads > 0.5) return;     // 开镜时由镜片分划板代替
    const c = colors[this.weapon];
    let x = Math.round(this.mx), y = Math.round(this.my);
    if (this.vAimOn) {
      const m = this.muzzle();
      const ang = this.aimAngle();
      x = Math.round(m.x + Math.cos(ang) * this.face * 170);
      y = Math.round(m.y + Math.sin(ang) * 170);
    }
    ctx.fillStyle = c;
    const gap = 5 + (this.weapon === "gas" && this.gasStreaming ? Math.sin(this.elapsed * 30) * 2 : 0);
    // 四向括号
    ctx.fillRect(x - 1, y - gap - 6, 2, 5);
    ctx.fillRect(x - 1, y + gap + 1, 2, 5);
    ctx.fillRect(x - gap - 6, y - 1, 5, 2);
    ctx.fillRect(x + gap + 1, y - 1, 5, 2);
    ctx.fillStyle = "#fff";
    ctx.fillRect(x - 1, y - 1, 2, 2);
    // 喷枪燃料不足提示
    if (this.weapon === "gas" && this.fuel < this.fuelMax * 0.09) {
      drawPixelText(ctx, "没油了!", x, y - 30, { size: 9, color: "#ff9426", scale: 2, center: true });
    }
    if (this.weapon === "hydro" && this.water <= 0) {
      drawPixelText(ctx, "没水了!", x, y - 30, { size: 9, color: "#49a0c4", scale: 2, center: true });
    }
    if (this.weapon === "laser" && this.bat <= 0) {
      drawPixelText(ctx, "没电了!", x, y - 30, { size: 9, color: "#ff5140", scale: 2, center: true });
    }
  }
}
