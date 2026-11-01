// ============================================================
// 武器改装系统：用班费为三件武器加装配件
// 改装在战役之间持久保存（localStorage）
// ============================================================

export type ModId =
  // GAS 喷枪
  | "jeepNozzle" | "highGas" | "triBarrel" | "giantTank" | "pilotLight"
  // 高能激光笔
  | "cell16850" | "focusLens" | "railMount" | "prismSplit" | "heatSink"
  // 三角圆规
  | "morningArms" | "longNeedle" | "longGrip" | "counterWeight" | "sparkTip"
  // 高压水枪「龙王」
  | "hpPump" | "wideCone" | "foamMix" | "iceCore" | "hydrantHose"
  // 钉书机机枪
  | "bigMag" | "heavyStaple" | "autoFeed" | "recoilPad" | "ricochet"
  // 粉笔狙击枪
  | "scope8x" | "apChalk" | "bipod" | "quickBolt" | "dustRound"
  // 黑板擦霰弹枪
  | "doubleBarrel" | "chokeTube" | "dustCloud" | "autoEject" | "slugShell"
  // 台灯激光炮
  | "overVolt" | "beamWide" | "capBank" | "mirrorArray" | "nightMode";

export type ModWeapon = "gas" | "laser" | "melee" | "hydro" | "stapler" | "rifle" | "eraser" | "lamp";

export interface ModDef {
  id: ModId;
  weapon: ModWeapon;
  name: string;
  price: number;
  desc: string;        // 面板说明
  effect: string;      // 数值摘要
  icon: string;        // emoji 占位（面板用，战斗内为手绘像素）
  requires?: ModId;    // 前置件
}

export const MODS: ModDef[] = [
  // ---------------- GAS 喷枪 ----------------
  {
    id: "jeepNozzle", weapon: "gas", name: "Jeep 喷头", price: 180,
    desc: "从报废吉普上拆下的粗口径喷嘴，火舌更宽更远，覆盖整条走廊。",
    effect: "火焰射程 +40% · 宽度 +55%", icon: "🔧",
  },
  {
    id: "highGas", weapon: "gas", name: "高能瓦斯", price: 240,
    desc: "化学部长特调的高热配方，燃温大幅提升，烧穿簸箕盾只需一瞬。",
    effect: "火焰伤害 +45% · 点燃更快", icon: "🔥",
  },
  {
    id: "triBarrel", weapon: "gas", name: "三枪管并联装置", price: 360,
    desc: "三根枪管并联共喷，爆燃一次等于三连爆，但耗气量显著上升。",
    effect: "爆燃三连发 · 范围 +30% · 耗气 +60%", icon: "⚙️", requires: "jeepNozzle",
  },
  {
    id: "giantTank", weapon: "gas", name: "巨型燃料瓶", price: 220,
    desc: "把整只液化气罐背在身上。沉，但一场仗烧不完。",
    effect: "燃气上限 100→220 · 移速 -8%", icon: "🛢️",
  },
  {
    id: "pilotLight", weapon: "gas", name: "常明点火器", price: 280,
    desc: "枪口常燃一簇长明火，省去预热，爆燃几乎没有间隔。",
    effect: "爆燃冷却 -45% · 击杀回气 +80%", icon: "🕯️",
  },

  // ---------------- 高能激光笔 ----------------
  {
    id: "cell16850", weapon: "laser", name: "16850 电池", price: 170,
    desc: "超规格锂电，输出电流翻倍，照射时间大幅延长。",
    effect: "电量上限 ×2 · 耗电 -25%", icon: "🔋",
  },
  {
    id: "focusLens", weapon: "laser", name: "聚焦镜片", price: 260,
    desc: "把光斑压到针尖大小，瞬间点燃可燃物，致盲也更快。",
    effect: "激光伤害 +55% · 点燃/致盲提速 60%", icon: "🔍",
  },
  {
    id: "railMount", weapon: "laser", name: "导轨", price: 300,
    desc: "皮卡汀尼导轨，把激光笔挂在 GAS 喷枪上——喷火的同时自动灼烧。",
    effect: "喷火时自动附加激光灼烧", icon: "🔗", requires: "cell16850",
  },
  {
    id: "prismSplit", weapon: "laser", name: "分光棱镜", price: 340,
    desc: "一束进、三束出。光斑同时锁定三名敌人，人海克星。",
    effect: "激光同时命中 3 个目标", icon: "🔺", requires: "focusLens",
  },
  {
    id: "heatSink", weapon: "laser", name: "散热鳍片", price: 190,
    desc: "铝制散热鳍片贴满笔身，长时间照射也不烫手。",
    effect: "耗电再 -30% · 空电恢复 +120%", icon: "❄️",
  },

  // ---------------- 三角圆规 ----------------
  {
    id: "morningArms", weapon: "melee", name: "晨光军工", price: 150,
    desc: "晨光文具厂的军工级合金圆规，硬度与配重俱佳。",
    effect: "近战伤害 +60%", icon: "✒️",
  },
  {
    id: "longNeedle", weapon: "melee", name: "加长针尖", price: 200,
    desc: "针尖加长到骇人的程度，可以越过簸箕盾直接扎到人。",
    effect: "攻击距离 +45% · 无视簸箕盾", icon: "📏",
  },
  {
    id: "longGrip", weapon: "melee", name: "加长握把", price: 180,
    desc: "缠满防滑胶带的加长握把，挥得更快更稳。",
    effect: "攻速 +40% · 击退 +50%", icon: "🪵",
  },
  {
    id: "counterWeight", weapon: "melee", name: "配重铅块", price: 210,
    desc: "握把尾端灌铅，一圆规抡过去能带倒一整排人。",
    effect: "挥击变横扫 · 同时命中多人", icon: "🏋️", requires: "longGrip",
  },
  {
    id: "sparkTip", weapon: "melee", name: "电火花针头", price: 320,
    desc: "针尖接上电瓶改装的放电模块，扎中即麻痹。",
    effect: "命中附带触电麻痹 · 伤害 +25%", icon: "⚡", requires: "morningArms",
  },

  // ---------------- 高压水枪「龙王」 ----------------
  {
    id: "hpPump", weapon: "hydro", name: "增压泵组", price: 200,
    desc: "从消防车上拆来的双级增压泵，水压高到能把人顶翻。",
    effect: "伤害 +50% · 击退 +80%", icon: "💧",
  },
  {
    id: "wideCone", weapon: "hydro", name: "广角扇喷嘴", price: 230,
    desc: "把水柱压成一面扇形水幕，专治人海冲锋。",
    effect: "扇形覆盖 · 同时击中一片", icon: "🌊",
  },
  {
    id: "foamMix", weapon: "hydro", name: "泡沫混合器", price: 270,
    desc: "混入洗洁精，地面变成溜冰场，敌人站都站不稳。",
    effect: "命中处留下泡沫滑地 · 大幅减速", icon: "🧴", requires: "hpPump",
  },
  {
    id: "iceCore", weapon: "hydro", name: "制冷芯", price: 340,
    desc: "出水瞬间降至冰点，打中即冻结，还能直接浇灭敌人身上的火。",
    effect: "命中冻结 1.6 秒 · 伤害 +25%", icon: "❄️", requires: "foamMix",
  },
  {
    id: "hydrantHose", weapon: "hydro", name: "消防栓接管", price: 180,
    desc: "直接接到走廊消防栓上，水量无限，就是拖着管子跑不快。",
    effect: "水量上限 ×2.5 · 自动回水 · 移速 -6%", icon: "🚰",
  },

  // ---------------- 钉书机机枪「订正者」 ----------------
  { id: "bigMag", weapon: "stapler", name: "加长弹匣", price: 160, icon: "📎",
    desc: "一整盒订书钉直接压进弹匣，火力持续性翻倍。", effect: "弹匣容量 ×2.2" },
  { id: "heavyStaple", weapon: "stapler", name: "重型钉", price: 230, icon: "🔩",
    desc: "加粗加硬的工业订书钉，打在簸箕盾上能直接钉穿。", effect: "伤害 +55% · 可穿盾" },
  { id: "autoFeed", weapon: "stapler", name: "自动供弹器", price: 280, icon: "⚙️",
    desc: "弹簧供弹改电机供弹，射速快到听不出间隔。", effect: "射速 +70%", requires: "bigMag" },
  { id: "recoilPad", weapon: "stapler", name: "防震托", price: 150, icon: "🧰",
    desc: "橡胶缓冲托，连射也不飘。", effect: "散布 -60%" },
  { id: "ricochet", weapon: "stapler", name: "跳弹涂层", price: 320, icon: "✨",
    desc: "钉子打在墙上会弹飞，专杀躲在后排的人。", effect: "命中后跳弹一次", requires: "heavyStaple" },

  // ---------------- 粉笔狙击枪「板书」 ----------------
  { id: "scope8x", weapon: "rifle", name: "8 倍瞄准镜", price: 240, icon: "🔭",
    desc: "从生物实验室顺来的镜头，走廊尽头的人也看得一清二楚。", effect: "射程 +80% · 暴击 +25%" },
  { id: "apChalk", weapon: "rifle", name: "穿甲粉笔", price: 300, icon: "🖊️",
    desc: "灌了石膏芯的硬质粉笔，一发贯穿一整排。", effect: "贯穿所有敌人", requires: "scope8x" },
  { id: "bipod", weapon: "rifle", name: "两脚架", price: 170, icon: "🔱",
    desc: "架稳了打，后坐力几乎为零。", effect: "静止时伤害 +50%" },
  { id: "quickBolt", weapon: "rifle", name: "快拉枪机", price: 220, icon: "🔧",
    desc: "改短的拉机柄，上膛快了一倍。", effect: "射速 +80%" },
  { id: "dustRound", weapon: "rifle", name: "粉尘弹", price: 290, icon: "💨",
    desc: "命中后炸开一团粉笔灰，附近的人全呛到。", effect: "命中产生范围粉尘", requires: "quickBolt" },

  // ---------------- 黑板擦霰弹枪「擦除」 ----------------
  { id: "doubleBarrel", weapon: "eraser", name: "双管改装", price: 260, icon: "🔫",
    desc: "两根管子一起响，近距离无人生还。", effect: "一次两发" },
  { id: "chokeTube", weapon: "eraser", name: "收束器", price: 180, icon: "🎯",
    desc: "把弹丸拢紧，中距离也能打中。", effect: "射程 +60% · 散布 -40%" },
  { id: "dustCloud", weapon: "eraser", name: "积灰仓", price: 210, icon: "🌫️",
    desc: "攒了一学期的粉笔灰，开枪即造成致盲烟幕。", effect: "命中附带致盲" },
  { id: "autoEject", weapon: "eraser", name: "自动退壳", price: 200, icon: "⏏️",
    desc: "打完自动弹壳上膛，不用手动拍。", effect: "射速 +65%", requires: "doubleBarrel" },
  { id: "slugShell", weapon: "eraser", name: "独头弹", price: 330, icon: "⚫",
    desc: "整块黑板擦当弹头打出去，一发把人砸飞。", effect: "改为单发重弹 · 伤害 ×2.4 · 巨大击退", requires: "chokeTube" },

  // ---------------- 台灯激光炮「晚自习」 ----------------
  { id: "overVolt", weapon: "lamp", name: "超压变压器", price: 280, icon: "⚡",
    desc: "220V 直接拉满，灯丝烧红也要打出去。", effect: "伤害 +70% · 耗电 +40%" },
  { id: "beamWide", weapon: "lamp", name: "广域灯罩", price: 240, icon: "🔆",
    desc: "拆掉聚光罩，变成一道横扫的光墙。", effect: "光束宽度 ×2.2" },
  { id: "capBank", weapon: "lamp", name: "电容组", price: 260, icon: "🔋",
    desc: "蓄满再放，一次齐射清空一条走廊。", effect: "蓄力齐射 · 伤害 ×3", requires: "overVolt" },
  { id: "mirrorArray", weapon: "lamp", name: "反射镜阵", price: 350, icon: "🪞",
    desc: "墙上贴满小镜子，光束会反弹到敌人背后。", effect: "光束反弹 2 次", requires: "beamWide" },
  { id: "nightMode", weapon: "lamp", name: "夜战模式", price: 190, icon: "🌙",
    desc: "降低亮度换取续航，顺便不容易被发现。", effect: "耗电 -45% · 冷却 -30%" },
];

export const MOD_BY_ID = new Map(MODS.map((m) => [m.id, m]));

export const WEAPON_LABEL: Record<ModWeapon, { name: string; color: string }> = {
  gas: { name: "GAS 喷枪", color: "#ff9426" },
  laser: { name: "高能激光笔", color: "#ff5140" },
  melee: { name: "三角圆规", color: "#ece7d8" },
  hydro: { name: "高压水枪", color: "#49a0c4" },
  stapler: { name: "钉书机机枪", color: "#d4788a" },
  rifle: { name: "粉笔狙击枪", color: "#b9c4d6" },
  eraser: { name: "黑板擦霰弹枪", color: "#c9a56a" },
  lamp: { name: "台灯激光炮", color: "#e8c15a" },
};

// ---------------- 已装配集合 ----------------
export type ModSet = Set<ModId>;

const KEY = "b85_mods_v1";
const FUNDS_KEY = "b85_bank_v1";

export function loadMods(): ModSet {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr.filter((x) => MOD_BY_ID.has(x as ModId)) as ModId[]);
  } catch { return new Set(); }
}

export function saveMods(set: ModSet) {
  try { localStorage.setItem(KEY, JSON.stringify([...set])); } catch { /* noop */ }
}

/** 军械库余额（跨局保存的班费） */
const INF_KEY = "b85_infinite_funds";

/** 彩蛋：无限班费 */
export function isInfiniteFunds(): boolean {
  try { return localStorage.getItem(INF_KEY) === "1"; } catch { return false; }
}
export function setInfiniteFunds(on: boolean) {
  try { localStorage.setItem(INF_KEY, on ? "1" : "0"); } catch { /* noop */ }
}

export const INF_BANK = 999999;

export function loadBank(): number {
  if (isInfiniteFunds()) return INF_BANK;
  try { return Math.max(0, parseInt(localStorage.getItem(FUNDS_KEY) || "0", 10) || 0); } catch { return 0; }
}
export function saveBank(v: number) {
  if (isInfiniteFunds()) return;        // 无限模式不扣费
  try { localStorage.setItem(FUNDS_KEY, String(Math.max(0, Math.floor(v)))); } catch { /* noop */ }
}
export function addBank(delta: number) {
  const v = loadBank() + Math.floor(delta);
  saveBank(v);
  return v;
}

// ============================================================
// 由已装配集合解算出战斗数值
// ============================================================
export interface ModStats {
  // GAS
  flameRange: number;      // 射程倍率
  flameWidth: number;      // 宽度倍率
  flameDmg: number;        // 火焰伤害倍率
  igniteSpeed: number;     // 点燃速度倍率
  burstCount: number;      // 爆燃发数
  burstRadius: number;     // 爆燃范围倍率
  burstCd: number;         // 爆燃冷却倍率
  killRefund: number;      // 击杀回气倍率
  gasDrain: number;        // 耗气倍率
  fuelMax: number;         // 燃气上限
  moveMul: number;         // 移速倍率
  // 激光
  batMax: number;
  batDrain: number;        // 耗电倍率
  laserDmg: number;
  laserFocus: number;      // 点燃/致盲提速倍率
  railMounted: boolean;    // 喷火附带激光
  laserTargets: number;    // 同时命中目标数
  batRegen: number;        // 空电恢复倍率
  // 近战
  meleeDmg: number;
  meleeReach: number;      // 距离倍率
  meleeRate: number;       // 攻速倍率（越小越快）
  meleeKnock: number;
  meleePierce: boolean;    // 无视盾
  meleeSweep: boolean;     // 横扫多人
  meleeShock: boolean;     // 触电麻痹
  // 高压水枪
  hydroDmg: number;
  hydroKnock: number;
  hydroCone: boolean;      // 扇形覆盖
  hydroFoam: boolean;      // 泡沫滑地
  hydroFreeze: boolean;    // 冻结
  waterMax: number;
  waterRegen: number;      // 自动回水
  hydroMove: number;       // 移速影响
}

export function computeStats(mods: ModSet): ModStats {
  const has = (m: ModId) => mods.has(m);
  return {
    flameRange: has("jeepNozzle") ? 1.4 : 1,
    flameWidth: has("jeepNozzle") ? 1.55 : 1,
    flameDmg: has("highGas") ? 1.45 : 1,
    igniteSpeed: has("highGas") ? 1.8 : 1,
    burstCount: has("triBarrel") ? 3 : 1,
    burstRadius: has("triBarrel") ? 1.3 : 1,
    burstCd: has("pilotLight") ? 0.55 : 1,
    killRefund: has("pilotLight") ? 1.8 : 1,
    gasDrain: has("triBarrel") ? 1.6 : 1,
    fuelMax: has("giantTank") ? 220 : 100,
    moveMul: (has("giantTank") ? 0.92 : 1) * (has("hydrantHose") ? 0.94 : 1),

    batMax: has("cell16850") ? 200 : 100,
    batDrain: (has("cell16850") ? 0.75 : 1) * (has("heatSink") ? 0.7 : 1),
    laserDmg: has("focusLens") ? 1.55 : 1,
    laserFocus: has("focusLens") ? 1.6 : 1,
    railMounted: has("railMount"),
    laserTargets: has("prismSplit") ? 3 : 1,
    batRegen: has("heatSink") ? 2.2 : 1,

    meleeDmg: (has("morningArms") ? 1.6 : 1) * (has("sparkTip") ? 1.25 : 1),
    meleeReach: has("longNeedle") ? 1.45 : 1,
    meleeRate: has("longGrip") ? 0.6 : 1,
    meleeKnock: has("longGrip") ? 1.5 : 1,
    meleePierce: has("longNeedle"),
    meleeSweep: has("counterWeight"),
    meleeShock: has("sparkTip"),

    hydroDmg: (has("hpPump") ? 1.5 : 1) * (has("iceCore") ? 1.25 : 1),
    hydroKnock: has("hpPump") ? 1.8 : 1,
    hydroCone: has("wideCone"),
    hydroFoam: has("foamMix"),
    hydroFreeze: has("iceCore"),
    waterMax: has("hydrantHose") ? 250 : 100,
    waterRegen: has("hydrantHose") ? 9 : 0,
    hydroMove: has("hydrantHose") ? 0.94 : 1,
  };
}

/** 是否满足前置 */
export function canInstall(mods: ModSet, def: ModDef): { ok: boolean; reason?: string } {
  if (mods.has(def.id)) return { ok: false, reason: "已装配" };
  if (def.requires && !mods.has(def.requires)) {
    return { ok: false, reason: `需先装配「${MOD_BY_ID.get(def.requires)!.name}」` };
  }
  return { ok: true };
}

// ============================================================
// 投掷物（消耗品）：每次出战仅可携带一种
// ============================================================
export type ThrowableId = "smoke" | "glue" | "firecracker" | "sock" | "bottle";

export interface ThrowableDef {
  id: ThrowableId;
  name: string;
  spr: string;
  color: string;
  count: number;      // 每局携带数量
  cooldown: number;   // 投掷冷却（秒）
  desc: string;
  effect: string;
}

export const THROWABLES: ThrowableDef[] = [
  {
    id: "smoke", name: "粉笔烟雾弹", spr: "nadeSmoke", color: "#c9cfbe",
    count: 4, cooldown: 6,
    desc: "半盒粉笔灰压成的烟雾罐，炸开一团呛人的白雾。",
    effect: "范围致盲 5 秒 · 敌人原地乱走",
  },
  {
    id: "glue", name: "胶水地雷", spr: "nadeGlue", color: "#e8c95a",
    count: 3, cooldown: 8,
    desc: "一整瓶固体胶倒在地上，踩进去就别想出来。",
    effect: "留下黏着区 · 踩中者几乎无法移动",
  },
  {
    id: "firecracker", name: "鞭炮串", spr: "nadeFirecracker", color: "#d4544a",
    count: 3, cooldown: 7,
    desc: "过年剩下的一整串，点着扔出去噼里啪啦。",
    effect: "连续爆炸 2.5 秒 · 持续范围伤害",
  },
  {
    id: "sock", name: "臭袜子", spr: "nadeSock", color: "#7e8a63",
    count: 5, cooldown: 5,
    desc: "体育课后的终极兵器，杀伤力主要来自精神层面。",
    effect: "毒气云 · 持续掉血并降低敌人攻速",
  },
  {
    id: "bottle", name: "矿泉水瓶", spr: "nadeBottle", color: "#49a0c4",
    count: 6, cooldown: 3,
    desc: "半瓶水当流星锤抡出去，便宜好用管够。",
    effect: "直击单体高伤 · 击退并打断动作",
  },
];

export const THROWABLE_BY_ID = new Map(THROWABLES.map((t) => [t.id, t]));

// ============================================================
// 出战编成：3 把武器 + 1 种投掷物
// ============================================================
export const MAX_WEAPONS = 3;

/** 可携带的武器（melee 为永久保底，不占编成位） */
export const CARRYABLE: ModWeapon[] = ["gas", "laser", "hydro", "stapler", "rifle", "eraser", "lamp"];

export interface Loadout {
  weapons: ModWeapon[];
  throwable: ThrowableId;
}

const LOADOUT_KEY = "b85_loadout_v1";

export function loadLoadout(): Loadout {
  try {
    const raw = localStorage.getItem(LOADOUT_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Loadout;
      const weapons = (p.weapons || []).filter((w) => CARRYABLE.includes(w)).slice(0, MAX_WEAPONS);
      const throwable = THROWABLE_BY_ID.has(p.throwable) ? p.throwable : "bottle";
      if (weapons.length > 0) return { weapons, throwable };
    }
  } catch { /* noop */ }
  return { weapons: ["gas", "laser", "hydro"], throwable: "bottle" };
}

export function saveLoadout(l: Loadout) {
  try { localStorage.setItem(LOADOUT_KEY, JSON.stringify(l)); } catch { /* noop */ }
}

// ---------------- 新武器战斗属性 ----------------
export interface WeaponStats {
  dmg: number; rate: number; range: number; spread: number;
  ammoMax: number; pierce: boolean; special: string[];
}

export function weaponStats(w: ModWeapon, mods: ModSet): WeaponStats {
  const has = (m: ModId) => mods.has(m);
  const sp: string[] = [];
  switch (w) {
    case "stapler": {
      if (has("heavyStaple")) sp.push("pierce");
      if (has("ricochet")) sp.push("ricochet");
      return {
        dmg: 7 * (has("heavyStaple") ? 1.55 : 1),
        rate: 0.1 * (has("autoFeed") ? 0.59 : 1),
        range: 330, spread: 0.16 * (has("recoilPad") ? 0.4 : 1),
        ammoMax: Math.round(120 * (has("bigMag") ? 2.2 : 1)),
        pierce: has("heavyStaple"), special: sp,
      };
    }
    case "rifle": {
      if (has("apChalk")) sp.push("penetrate");
      if (has("dustRound")) sp.push("dust");
      if (has("bipod")) sp.push("bipod");
      return {
        dmg: 54 * (has("scope8x") ? 1.25 : 1),
        rate: 1.15 * (has("quickBolt") ? 0.56 : 1),
        range: 520 * (has("scope8x") ? 1.8 : 1), spread: 0.012,
        ammoMax: 20, pierce: has("apChalk"), special: sp,
      };
    }
    case "eraser": {
      if (has("dustCloud")) sp.push("blind");
      if (has("slugShell")) sp.push("slug");
      return {
        dmg: has("slugShell") ? 34 * 2.4 : 11,
        rate: 0.72 * (has("autoEject") ? 0.6 : 1),
        range: 150 * (has("chokeTube") ? 1.6 : 1),
        spread: 0.42 * (has("chokeTube") ? 0.6 : 1) * (has("slugShell") ? 0.1 : 1),
        ammoMax: 40, pierce: false,
        special: sp.concat(has("doubleBarrel") ? ["double"] : []),
      };
    }
    case "lamp": {
      if (has("capBank")) sp.push("charge");
      if (has("mirrorArray")) sp.push("bounce");
      return {
        dmg: 20 * (has("overVolt") ? 1.7 : 1),
        rate: 0.26 * (has("nightMode") ? 0.7 : 1),
        range: 420, spread: 0,
        ammoMax: Math.round(100 * (has("nightMode") ? 1.45 : 1)),
        pierce: true, special: sp,
      };
    }
    default:
      return { dmg: 10, rate: 0.2, range: 300, spread: 0.1, ammoMax: 100, pierce: false, special: [] };
  }
}
