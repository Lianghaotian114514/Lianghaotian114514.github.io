// ============================================================
// 纯手工像素画模块：所有图像均由代码逐像素定义，绝不使用任何图片素材
// ============================================================

export const PIX = 3; // 全局像素缩放

// ---------- 调色板 ----------
const PAL: Record<string, string> = {
  k: "#15181f", // 描边黑
  h: "#25262e", // 头发
  s: "#f2c48d", // 皮肤
  S: "#d99a5b", // 皮肤阴影
  u: "#3a5f8c", // 武装大队校服蓝
  U: "#2b4a70", // 校服蓝暗
  w: "#ece7d8", // 白
  p: "#2d3644", // 裤子
  b: "#1a1e26", // 鞋
  r: "#d53a26", // 红
  R: "#8f2418", // 暗红
  y: "#f2b53d", // 黄
  Y: "#c0892a", // 暗黄
  c: "#57d6e6", // 青
  t: "#3f7a58", // 治安队绿
  T: "#2c5a40", // 治安队绿暗
  o: "#8a6238", // 木柄
  O: "#b9b09c", // 拖把头
  d: "#9fadc0", // 簸箕金属
  D: "#5d6b7e", // 金属暗
  i: "#8b97a6", // 金属中
  I: "#455061", // 金属深
  n: "#a06a3c", // 木板
  N: "#6e4826", // 木板暗
  g: "#7fae3f", // 臭水绿
  G: "#4f7226", // 臭水深绿
  j: "#c4e368", // 臭水亮绿
  x: "#c9d1dc", // 浅灰
  z: "#2a3350", // 队长帽藏青
  e: "#ffe084", // 暖光
};

type Rows = string[];

export interface Sprite {
  img: HTMLCanvasElement;
  flip: HTMLCanvasElement;
  white: HTMLCanvasElement;
  whiteFlip: HTMLCanvasElement;
  w: number;
  h: number;
}

function paint(rows: Rows, forceWhite: boolean): HTMLCanvasElement {
  const w = Math.max(...rows.map((r) => r.length));
  const h = rows.length;
  const cv = document.createElement("canvas");
  cv.width = Math.max(1, w);
  cv.height = Math.max(1, h);
  const ctx = cv.getContext("2d")!;
  rows.forEach((row, yy) => {
    for (let xx = 0; xx < row.length; xx++) {
      const ch = row[xx];
      if (ch === "." || ch === " ") continue;
      ctx.fillStyle = forceWhite ? "#ffffff" : PAL[ch] || "#ff00ff";
      ctx.fillRect(xx, yy, 1, 1);
    }
  });
  return cv;
}

function flipCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = src.width;
  cv.height = src.height;
  const ctx = cv.getContext("2d")!;
  ctx.translate(src.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(src, 0, 0);
  return cv;
}

function build(rows: Rows): Sprite {
  const img = paint(rows, false);
  const white = paint(rows, true);
  return {
    img,
    white,
    flip: flipCanvas(img),
    whiteFlip: flipCanvas(white),
    w: img.width,
    h: img.height,
  };
}

// ============================================================
// 精灵定义 —— 一律面向“右”，需要朝左时翻转
// ============================================================

// ---------- 干员：牢电工（工程/电工盔） ----------
const ELEC_A = build([
  ".....kkkkk......",
  "....kyyyyyk.....",
  "...kyyyccyyyk...",
  "...kyyyyyyyyk...",
  "...kkkkkkkkkk...",
  "....ksssssk.....",
  "....ksksksk.....",
  "....ksSsssk.....",
  ".....kkkkk......",
  "..kkUUUUUUkk....",
  ".kUUUUUUUUUUk...",
  ".kUkuuwwuuuUUk..",
  ".kUkuuuuuuuUUk..",
  "..k.kUUUUUk.k...",
  "....kUUUUUUk....",
  "....kkkkkkkk....",
  "....kpppppk.....",
  "....kp.k.pk.....",
  "....kp...pk.....",
  "....kpk.kpk.....",
  "....kbk.kbk.....",
  "....kbb.kbb.....",
]);

const ELEC_B = build([
  ".....kkkkk......",
  "....kyyyyyk.....",
  "...kyyyccyyyk...",
  "...kyyyyyyyyk...",
  "...kkkkkkkkkk...",
  "....ksssssk.....",
  "....ksksksk.....",
  "....ksSsssk.....",
  ".....kkkkk......",
  "..kkUUUUUUkk....",
  ".kUUUUUUUUUUk...",
  ".kUkuuwwuuuUUk..",
  ".kUkuuuuuuuUUk..",
  "..k.kUUUUUk.k...",
  "....kUUUUUUk....",
  "....kkkkkkkk....",
  "....kpppppk.....",
  ".....kpkp.......",
  ".....kp.kp......",
  "....kpk..kpk....",
  "....kbk...kbk...",
  "....kbb....kbb..",
]);

// ---------- 干员：樊某某（突击/红头带） ----------
const ASS_A = build([
  ".....kkkkk......",
  "....khhhhhhk....",
  "...khkhkhkhk....",
  "...krrrrrrk.....",
  "...ksssssssk....",
  "...kskssksk.....",
  "...kssSSSsk.....",
  "....kssssk......",
  "....krrrrk......",
  "...krrrrrrk.....",
  "..kkuuuuuukk....",
  ".kUuuuuuuuuUk...",
  ".kUuuwwwwuuUk...",
  ".kUuuuuuuuuUk...",
  "..k.uUUUUu.k....",
  "....kUUUUUk.....",
  "....kkkkkkk.....",
  "....kpppppk.....",
  "....kp.k.pk.....",
  "....kp...pk.....",
  "....kpk.kpk.....",
  "....kbk.kbk.....",
  "....kbb.kbb.....",
]);

const ASS_B = build([
  ".....kkkkk......",
  "....khhhhhhk....",
  "...khkhkhkhk....",
  "...krrrrrrk.....",
  "...ksssssssk....",
  "...kskssksk.....",
  "...kssSSSsk.....",
  "....kssssk......",
  "....krrrrk......",
  "...krrrrrrk.....",
  "..kkuuuuuukk....",
  ".kUuuuuuuuuUk...",
  ".kUuuwwwwuuUk...",
  ".kUuuuuuuuuUk...",
  "..k.uUUUUu.k....",
  "....kUUUUUk.....",
  "....kkkkkkk.....",
  "....kpppppk.....",
  ".....kpkp.......",
  ".....kp.kp......",
  "....kpk..kpk....",
  "....kbk...kbk...",
  "....kbb....kbb..",
]);

// ---------- 干员：李听远（医疗/白衣红十字） ----------
const MED_A = build([
  "....kkkkkkk.....",
  "...kwwwwwwwk....",
  "...kwkwwwkwk....",
  "...kwwkkkwwk....",
  "...kwwwwwwwk....",
  "....ksssssk.....",
  "....ksksksk.....",
  "....ksSsssk.....",
  ".....kkkkk......",
  "..kkwwwwwwwkk...",
  ".kwwwwwwwwwwwk..",
  ".kwkwkMMMkwwwk..",
  ".kwkwkMMMkwwwk..",
  "..k.kwwwwwk.k...",
  "....kwwwwwk.....",
  "....kwwwwwk.....",
  "....kkkkkkk.....",
  "....kpppppk.....",
  "....kp.k.pk.....",
  "....kp...pk.....",
  "....kpk.kpk.....",
  "....kbk.kbk.....",
  "....kbb.kbb.....",
]);

const MED_B = build([
  "....kkkkkkk.....",
  "...kwwwwwwwk....",
  "...kwkwwwkwk....",
  "...kwwkkkwwk....",
  "...kwwwwwwwk....",
  "....ksssssk.....",
  "....ksksksk.....",
  "....ksSsssk.....",
  ".....kkkkk......",
  "..kkwwwwwwwkk...",
  ".kwwwwwwwwwwwk..",
  ".kwkwkMMMkwwwk..",
  ".kwkwkMMMkwwwk..",
  "..k.kwwwwwk.k...",
  "....kwwwwwk.....",
  "....kwwwwwk.....",
  "....kkkkkkk.....",
  "....kpppppk.....",
  ".....kpkp.......",
  ".....kp.kp......",
  "....kpk..kpk....",
  "....kbk...kbk...",
  "....kbb....kbb..",
]);

// ---------- 敌兵：扫把枪队 ----------
const SOLD_A = build([
  "....kkkkk.....",
  "...khhhhhk....",
  "...khhhhhhk...",
  "...ksssssk....",
  "...kkssskk....",
  "...ksksksk....",
  "...kssSssk....",
  "....kkkkk.....",
  "..ktttttttk...",
  ".ktkwwwwwktk..",
  ".ktkwwwwwkTk..",
  ".kTktttttkTk..",
  "..k.tTTTTt.k...",
  "....kTTTTTk...",
  "....kkkkkkk...",
  "....kpppppk...",
  "....kp.k.pk...",
  "....kp...pk...",
  "....kpk.kpk...",
  "....kbk.kbk...",
]);

const SOLD_B = build([
  "....kkkkk.....",
  "...khhhhhk....",
  "...khhhhhhk...",
  "...ksssssk....",
  "...kksskk.....",
  "...ksksksk....",
  "...kssSssk....",
  "....kkkkk.....",
  "..ktttttttk...",
  ".ktkwwwwwktk..",
  ".ktkwwwwwkTk..",
  ".kTktttttkTk..",
  "..k.tTTTTt.k...",
  "....kTTTTTk...",
  "....kkkkkkk...",
  "....kpppppk...",
  ".....kpkp.....",
  ".....kp.kp....",
  "....kpk..kpk..",
  "....kbk...kbk.",
]);

// ---------- 敌BOSS：治安队长（藏青帽+对讲机手） ----------
const BOSS_A = build([
  "....kkkkkk..........",
  "...kzzzzzzk.........",
  "...krrrrrrk.........",
  "..kkzzzzzzkk........",
  "...ksssssssk........",
  "...kskssksk.........",
  "...ksSSSSsk.........",
  "....kssssk....kk....",
  "..kkkkkkkk...kIk....",
  ".kttttttttk..kIk....",
  "kttttttttttk.kIk....",
  "ktkrrrkttttk.kIk....",
  "ktkrrrktttTk..k.....",
  "kTkttttttTTk........",
  ".k.tTTTTTt.k........",
  "...kTTTTTTk.........",
  "...kkkkkkkk.........",
  "...kppppppk.........",
  "...kp.kk.pk.........",
  "...kp....pk.........",
  "...kpk..kpk.........",
  "...kbk..kbk.........",
]);

const BOSS_B = build([
  "....kkkkkk..........",
  "...kzzzzzzk.........",
  "...krrrrrrk.........",
  "..kkzzzzzzkk........",
  "...ksssssssk........",
  "...kskssksk.........",
  "...ksSSSSsk.........",
  "....kssssk....kk....",
  "..kkkkkkkk...kIk....",
  ".kttttttttk..kIk....",
  "kttttttttttk.kIk....",
  "ktkrrrkttttk.kIk....",
  "ktkrrrktttTk..k.....",
  "kTkttttttTTk........",
  ".k.tTTTTTt.k........",
  "...kTTTTTTk.........",
  "...kkkkkkkk.........",
  "...kppppppk.........",
  "....kpkpk...........",
  "....kp.kp...........",
  "...kpk..kpk.........",
  "...kbk...kbk........",
]);

// ---------- 手持武器（面向右） ----------
const GUN_GAS = build([
  "..kkkkkkkkk..........",
  ".kIIIIIIIIIk.........",
  "kIiiiiiiiiiIk.kkkk...",
  "kIrrrrrrrrrIkkiIIkkk.",
  ".krrrrrrrrrk....kIyYk",
  ".krrrrrrrrrk....kIIk.",
  "..kkkkkkkkk..kkk.....",
  "......kk...kk........",
]);

const GUN_LASER = build([
  "kkkkkkkkkkkkk....",
  "kxxxxxxxxxxxkre..",
  "kkkkkkkkkkkkk....",
  "...kk..kk........",
]);

const GUN_COMPASS = build([
  "...kk...",
  "..kiik..",
  "..kiik..",
  "...kk...",
  "..k..k..",
  ".kI..Ik.",
  ".kI..Ik.",
  "kI....Ik",
  "k......k",
]);

const MOP_V = build([
  "...........oo.",
  "..........oo..",
  ".........oo...",
  "........oo....",
  ".......oo.....",
  "......oo......",
  ".....oo.......",
  "....oo........",
  "...oo.........",
  "..OOO.........",
  ".OOOOO........",
  "OOOOOOO.......",
  "OOOOOOOO......",
  ".OOOOOO.......",
]);

const MOP_THRUST = build([
  "OOOOooooooooooooooooooo.",
  "OOOOOOoooooooooooooooooo",
  "OOOOooooooooooooooooooo.",
  ".OOO....................",
]);

const MOP_LANCE = build([
  ".............oo....",
  "............oo.....",
  "...........oo......",
  "..........oo.......",
  ".........oo........",
  "........oo.........",
  ".......oo..........",
  "......oo...........",
  ".....oo............",
  "....oo.............",
  "...oo..............",
  "..oo...............",
  ".OOO...............",
  "OOOOO..............",
  "OOOOOgO............",
  "OOgOOOOO...........",
  ".OOOgOO............",
  "..gO Og............",
  "....g..............",
]);

// ---------- 簸箕盾 ----------
const SHIELD = build([
  "......oo......",
  "......oo......",
  "..kkkkkkkkkk..",
  ".kddddddddddk.",
  ".kdDDDDDDDDdk.",
  ".kdDDDDDDDDdk.",
  ".kdDDDDDDDDdk.",
  ".kdDDDDDDDDdk.",
  ".kdDDDDDDDDdk.",
  ".kddddddddddk.",
  ".kddddddddddk.",
  ".kkkkkkkkkkkk.",
]);

const SHIELD_BROKEN = build([
  "..kkkkkkk...",
  ".kdDDDDDDk..",
  ".kdddddddk..",
  "..kddddd....",
  "..kdDdd.....",
  "...kdk.d....",
  "...k.......",
]);

// ---------- 战车部件 ----------
const BUCKET = build([
  "kkkkkkkkkkkkkkkkkkkkkk",
  "kggggjgggggggjgggggggk",
  "kIIIIIIIIIIIIIIIIIIIIk",
  ".kiiiiiiiiiiiiiiiiiik.",
  ".kiiiIIiiiiiIIiiiiiik.",
  ".kiiiIIiiiiiIIiiiiiik.",
  "..kiiiiiiiiiiiiiiiik..",
  "..kiiiiiiiiiiiiiiik...",
  "...kkkkkkkkkkkkkkkk...",
  "......g.....g.........",
  ".......g.....g........",
]);

const WHEEL_A = build([
  "..kkkk..",
  ".kxxxxk.",
  "kxkxxkxk",
  "kxxxxxxk",
  "kxkxxkxk",
  ".kxxxxk.",
  "..kkkk..",
]);

const WHEEL_B = build([
  "..kkkk..",
  ".kxxxxk.",
  "kxxxkxxk",
  "kxxkkxxk",
  "kxxxkxxk",
  ".kxxxxk.",
  "..kkkk..",
]);

// ---------- 道具 ----------
const TELEGRAPH = build([
  "....k...........k...",
  "....k...........k...",
  ".kkkkkkkk.......k...",
  ".kyyyyyyyk..kkkkk...",
  ".kyYyyyyyk..kyyyk...",
  "kkkkkkkkkkkkkkkkkkk.",
  "knnnnnnnnnnnnnnnnNk.",
  "knNNNNNNNNNNNNNNNNNk",
  "kkkkkkkkkkkkkkkkkkk.",
]);

const CRATE = build([
  "kkkkkkkkkkkkkk",
  "knxxxnnnnxxxnk",
  "knxnxnnnnxnxnk",
  "knnxnnnnnnxnnk",
  "knnnnnnnnnnnnk",
  "kxxxnxnnnxnxxk",
  "knnnnnnnnnnnnk",
  "knnxnnnnnnxnnk",
  "knxnxnnnnxnxnk",
  "knxxxnnnnxxxnk",
  "kkkkkkkkkkkkkk",
]);

const PARACHUTE = build([
  ".....kkkkkkkkkkk......",
  "...kkrrrrrrrrrrrkk....",
  "..krrrrRRRrrRRRrrrk...",
  ".krrrRRRRRrrRRRRRrrk..",
  ".krrrrrrrrrrrrrrrrrk..",
  ".kkk..kkk...kkk..kkk..",
  "....k...k...k...k.....",
  "....k...k...k...k.....",
  ".....k..k...k..k......",
  "......kk.....kk.......",
  ".......k...k..........",
  "........kkk...........",
]);

const DESK = build([
  "kkkkkkkkkkkkkkkkkkkkkkkkkk",
  "knnnnnnnnnnnnnnnnnnnnnnnnk",
  "kNNNNNNNNNNNNNNNNNNNNNNNNk",
  "kkkkkkkkkkkkkkkkkkkkkkkkkk",
  "knknnnnnnnnnnnnnnnnnnnnknk",
  "knknnn 好好学习 nnnnnknk.".replace(" 好好学习 ", "nnnnnnnnnnnn"), // 备用纯像素
  "knknnnnnnnnnnnnnnnnnnnnknk",
  "knkkkkkkkkkkkkkkkkkkkkkknk",
  "knk....................knk",
  "knk....................knk",
  "knk....................knk",
  "knk....................knk",
  "kNk....................kNk",
  "kkk....................kkk",
]);

const BATTERY = build([
  "...kkkk...",
  "...kcck...",
  ".kkkkkkkk.",
  ".kIkkkkIk.",
  ".kIkkckIk.",
  ".kIkcckIk.",
  ".kIkc kkIk.".replace(" ", "k"),
  ".kIkcckIk.",
  ".kIkkkkIk.",
  ".kkkkkkkk.",
]);

const MEDKIT = build([
  "kkkkkkkkkk",
  "kwwkkkkwwk",
  "kwwwwwwwwk",
  "kwwwMMwwwk",
  "kwwMMMMwwk",
  "kwwMMMMwwk",
  "kwwwMMwwwk",
  "kwwwwwwwwk",
  "kkkkkkkkkk",
]);

const BOMB = build([
  "....kk....",
  "...kNNk...",
  "...kkkk...",
  "..kkggkk..",
  ".kggggggk.",
  "kggjggggjk",
  "kgGgggGggk",
  "kggggggggk",
  "kjggggggjk",
  ".kggggggk.",
  "..kkkkkk..",
]);

const INHALER = build([
  "..kkkkk...",
  "..kccck...",
  "..kkkkk...",
  ".kxxxxk...",
  ".kxxxxk...",
  ".kxxx xk..".replace(" ", "x"),
  ".kxxxxk...",
  ".kkkkkk...",
]);

// ---------- 隐翅虫（菜单动画用） ----------
const BEETLE_A = build([
  "..kk............",
  ".khhk...........",
  "..kk............",
  ".krrk...........",
  ".krrk...........",
  "..kk..kk..kk..k.",
  "..k...k...k...k.",
]);

const BEETLE_B = build([
  ".xx..xx.........",
  ".khhk...........",
  "..kk............",
  ".krrk...........",
  ".krrk...........",
  "..kk..kk..kk..k.",
  "..k...k...k...k.",
]);

// ---------- 昆虫组战旗（升旗过场：3 帧挥舞 + 下垂帧） ----------
const FLAG_DOWN = build([
  "ykkkkkkkkkkkkkkkkkk",
  "krRrrrrrrrrrrrrrrrk",
  "krrrrrrrrrrrrrrrrrk",
  "krrrkkrrrrrrrrrrrrk",
  "krrk..krrrrrrrrrrrk".replace(/ /g, "k"),
  "krrrkkkkrrrrrrrrrrk",
  "krrrk.kkrrrrrrrrrrk".replace(/ /g, "k"),
  "krrrrkrkkrrrrrrrrrk",
  "krrrrrkkk.krrrrrrrk".replace(/ /g, "k"),
  "krrrrrkkkkrrrrrrrrk",
  "krrrrrrkkkrrrrrrrrk",
  "krrrrrrrkkrrrrrrrrk",
  "krrrrrrrrrrrrrrrrrk",
  "krRrrrrrrrrrrrrrrrk",
  "ykkkkkkkkkkkkkkkkkk",
]);

const FLAG_A = build([
  "ykkkkkkkkkkkkkkkkkkkkk",
  "krrrrrrrrrrrrrrrrrrrrk",
  "krrRrrrrrrrrrrrrrRrrrk",
  "krrrkkrrrrrrrrrrrrrrRk",
  "krrk.kkrrrrrrrrrrrrrrk".replace(/ /g, "k"),
  "krrrkkkkrrrk.kkrrrrrrk".replace(/ /g, "k"),
  "krrRk.kkrrrkkkrrrrRrrk".replace(/ /g, "k"),
  "krrrrkrkkrr.kkk.rrrrrk".replace(/ /g, "k"),
  "krrrrrkkkk.rkkkrrrrrrk".replace(/ /g, "k"),
  "krrrrrkkkrrrkkkrrrrrrk",
  "krrRrrkkrrrrk.krrrRrrk".replace(/ /g, "k"),
  "krrrrrkrrrrrrkrrrrrrrk",
  "krrrrrrrrrrrrrrrrrrrrk",
  "krrRrrrrrrrrrrrrrRrrrk",
  "ykkkkkkkkkkkkkkkkkkkkk",
]);

const FLAG_B = build([
  "ykkkkkkkkkkkkkkkkkkkkk",
  "krrrRrrrrrrrrrrRrrrrrk",
  "krrrrrrrrrrrrrrrrrrrrk",
  "krrrkkrrrrrrrrrrrrRrrk",
  "krrk.kkrrrkrrrrrrrrrrk".replace(/ /g, "k"),
  "krrrkkkkrrrkkkrrrrrrrk".replace(/ /g, "k"),
  "krrrk.kkrrrk.kkrrrRrrk".replace(/ /g, "k"),
  "krrrrkrkkrrrkkk.rrrrrk".replace(/ /g, "k"),
  "krrrrrkkkkr.kkkrrrrrrk".replace(/ /g, "k"),
  "krrrrrkkkrrrkkkrrrrrrk",
  "krrrrrkk.rrrk.krrrrrrk".replace(/ /g, "k"),
  "krrrRrrrrrrrrrkrrrrrrk",
  "krrrrrrrrrrrrrrrrrRrrk",
  "krrrrrrrrrrrrrrrrrrrrk",
  "ykkkkkkkkkkkkkkkkkkkkk",
]);

// ---------- 废墟瓦砾堆 ×2 ----------
const RUBBLE_A = build([
  "........nnn.................",
  "......nnNNnn......dd........",
  "....nnNNddnnn...dDDd...nn...",
  "...nNddNnNNNnnnndDDDddnNNn..",
  "..nNdnnnNdDNNdndDDdDDnNnNNn.",
  ".nNNdNNnNddNnndNdDDdNnNdNNn.",
  "nNNNnNNNnNNNnNNnNNNnNNnNNNNn",
]);

const RUBBLE_B = build([
  "....dd......................",
  "...dDDd......nnn............",
  "..dDdddD....nNNNn....oo.....",
  "..dDDDDDd..nNddNNn..oOOo....",
  ".nNdDDdDNndNdddNNNndOoOOOd..",
  ".nNndDDdNNNdNNdNddNOoOOOOo..",
  "nNNNnNNNNNnNNnNNNnNNnNNNNNn.",
]);

// ---------- 精灵表 ----------
export const SPR: Record<string, Sprite> = {
  elecA: ELEC_A,
  elecB: ELEC_B,
  assA: ASS_A,
  assB: ASS_B,
  medA: MED_A,
  medB: MED_B,
  soldA: SOLD_A,
  soldB: SOLD_B,
  bossA: BOSS_A,
  bossB: BOSS_B,
  gunGas: GUN_GAS,
  gunLaser: GUN_LASER,
  gunCompass: GUN_COMPASS,
  mopV: MOP_V,
  mopThrust: MOP_THRUST,
  mopLance: MOP_LANCE,
  shield: SHIELD,
  shieldBroken: SHIELD_BROKEN,
  bucket: BUCKET,
  wheelA: WHEEL_A,
  wheelB: WHEEL_B,
  telegraph: TELEGRAPH,
  crate: CRATE,
  parachute: PARACHUTE,
  desk: DESK,
  battery: BATTERY,
  medkit: MEDKIT,
  bomb: BOMB,
  inhaler: INHALER,
  beetleA: BEETLE_A,
  beetleB: BEETLE_B,
  flagDown: FLAG_DOWN,
  flagA: FLAG_A,
  flagB: FLAG_B,
  rubbleA: RUBBLE_A,
  rubbleB: RUBBLE_B,
};

export interface DrawOpt {
  flip?: boolean;
  scale?: number;
  anchor?: "bc" | "tl" | "c";
  white?: boolean;
  alpha?: number;
}

export function drawSpr(
  ctx: CanvasRenderingContext2D,
  name: keyof typeof SPR,
  x: number,
  y: number,
  o: DrawOpt = {}
) {
  const s = SPR[name];
  if (!s) return;
  const sc = o.scale ?? PIX;
  const src = o.white ? (o.flip ? s.whiteFlip : s.white) : o.flip ? s.flip : s.img;
  const w = s.w * sc;
  const h = s.h * sc;
  let dx = x;
  let dy = y;
  const anchor = o.anchor ?? "bc";
  if (anchor === "bc") {
    dx = x - w / 2;
    dy = y - h;
  } else if (anchor === "c") {
    dx = x - w / 2;
    dy = y - h / 2;
  }
  ctx.save();
  if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, Math.round(dx), Math.round(dy), w, h);
  ctx.restore();
}

// ---------- 像素文字（先小画布绘制再放大，天然像素化） ----------
const textCache = new Map<string, HTMLCanvasElement>();

export function pixelText(
  text: string,
  opts: { size?: number; color?: string; scale?: number; bg?: string; pad?: number } = {}
): HTMLCanvasElement {
  const size = opts.size ?? 10;
  const color = opts.color ?? "#ffffff";
  const scale = opts.scale ?? 3;
  const pad = opts.pad ?? 2;
  const key = `${text}|${size}|${color}|${scale}|${opts.bg ?? ""}|${pad}`;
  const hit = textCache.get(key);
  if (hit) return hit;

  // 直接以最终尺寸渲染（不再「小图放大」），文字锐利不糊
  const fontPx = size * scale;
  const padPx = pad * scale;
  const font = `700 ${fontPx}px "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`;

  const tmp = document.createElement("canvas");
  const tctx = tmp.getContext("2d")!;
  tctx.font = font;
  const w = Math.ceil(tctx.measureText(text).width);

  const out = document.createElement("canvas");
  out.width = w + padPx * 2;
  out.height = Math.ceil(fontPx * 1.3) + padPx * 2;
  const ctx = out.getContext("2d")!;
  if (opts.bg) {
    ctx.fillStyle = opts.bg;
    ctx.fillRect(0, 0, out.width, out.height);
  }
  ctx.font = font;
  ctx.textBaseline = "top";
  // 描边增强可读性（战场背景复杂）
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(2, scale);
  ctx.strokeStyle = "rgba(5,7,10,0.85)";
  ctx.strokeText(text, padPx, padPx);
  ctx.fillStyle = color;
  ctx.fillText(text, padPx, padPx);

  if (textCache.size > 220) textCache.clear();
  textCache.set(key, out);
  return out;
}

export function drawPixelText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts: { size?: number; color?: string; scale?: number; bg?: string; center?: boolean } = {}
) {
  const cv = pixelText(text, opts);
  const dx = opts.center ? Math.round(x - cv.width / 2) : Math.round(x);
  const prev = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = true;     // 文字已按最终尺寸渲染，保持平滑
  ctx.drawImage(cv, dx, Math.round(y));
  ctx.imageSmoothingEnabled = prev;
  return cv;
}

// ============================================================
// 战场背景（960x540 一次性绘制）
// ============================================================

export const W = 960;
export const H = 540;
export const FLOOR_TOP = 336;
export const FLOOR_BOT = 522;
export const DOOR_FRONT = 118; // 大门前沿 x

export function buildBackground(): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;

  // ---- 走廊后墙 ----
  const wallGrad = ctx.createLinearGradient(0, 0, 0, FLOOR_TOP);
  wallGrad.addColorStop(0, "#d8c9a3");
  wallGrad.addColorStop(0.72, "#cdbb92");
  wallGrad.addColorStop(0.721, "#4f747e"); // 经典绿墙裙
  wallGrad.addColorStop(1, "#44666f");
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, W, FLOOR_TOP);

  // 墙面噪点砖纹
  for (let i = 0; i < 900; i++) {
    const x = Math.floor(Math.random() * W);
    const y = Math.floor(Math.random() * (FLOOR_TOP - 40));
    ctx.fillStyle = Math.random() > 0.5 ? "rgba(120,100,70,0.10)" : "rgba(255,250,230,0.10)";
    ctx.fillRect(x, y, 3, 3);
  }
  // 墙裙竖纹
  for (let x = 0; x < W; x += 24) {
    ctx.fillStyle = "rgba(20,30,34,0.16)";
    ctx.fillRect(x, FLOOR_TOP * 0.721, 3, FLOOR_TOP * 0.28);
  }
  // 踢脚线
  ctx.fillStyle = "#263238";
  ctx.fillRect(0, FLOOR_TOP - 8, W, 8);

  // ---- 黄昏窗户 ×3 ----
  for (let wI = 0; wI < 3; wI++) {
    const wx = 392 + wI * 172;
    const wy = 58;
    const ww = 132;
    const wh = 150;
    ctx.fillStyle = "#efe4c6";
    ctx.fillRect(wx - 8, wy - 8, ww + 16, wh + 16);
    const sky = ctx.createLinearGradient(0, wy, 0, wy + wh);
    sky.addColorStop(0, "#7a4b8f");
    sky.addColorStop(0.45, "#d96a4e");
    sky.addColorStop(0.8, "#f7b267");
    sky.addColorStop(1, "#ffe084");
    ctx.fillStyle = sky;
    ctx.fillRect(wx, wy, ww, wh);
    // 夕阳
    ctx.fillStyle = "#ffe9a8";
    ctx.fillRect(wx + 42, wy + 88, 30, 30);
    ctx.fillStyle = "#f7d488";
    ctx.fillRect(wx + 38, wy + 92, 38, 22);
    // 窗棂
    ctx.fillStyle = "#efe4c6";
    ctx.fillRect(wx + ww / 2 - 4, wy, 8, wh);
    ctx.fillRect(wx, wy + wh / 2 - 4, ww, 8);
    // 玻璃斜光
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    for (let s = 0; s < 3; s++) {
      ctx.fillRect(wx + 12 + s * 40, wy + 10 + s * 8, 8, 60);
    }
    // 光柱洒向地板
    ctx.fillStyle = "rgba(255,214,140,0.10)";
    ctx.beginPath();
    ctx.moveTo(wx, wy + wh);
    ctx.lineTo(wx + ww, wy + wh);
    ctx.lineTo(wx + ww + 46, H);
    ctx.lineTo(wx + 30, H);
    ctx.closePath();
    ctx.fill();
  }

  // ---- 标语横幅 ----
  ctx.fillStyle = "#a82e24";
  ctx.fillRect(360, 14, 436, 40);
  ctx.fillStyle = "#8f2418";
  ctx.fillRect(360, 46, 436, 8);
  ctx.fillStyle = "#d8c9a3";
  ctx.fillRect(356, 10, 8, 48);
  ctx.fillRect(796, 10, 8, 48);
  const banner = pixelText("团 结 紧 张 · 严 肃 活 泼", { size: 20, color: "#f7d94e", scale: 2 });
  ctx.drawImage(banner, Math.round(360 + (436 - banner.width) / 2), 18);

  // ---- 八五班大门（左侧） ----
  // 门框
  ctx.fillStyle = "#2c2f36";
  ctx.fillRect(0, 196, DOOR_FRONT + 6, H - 196 + 30);
  // 门板（双开铁门）
  const dg = ctx.createLinearGradient(0, 210, 0, 520);
  dg.addColorStop(0, "#4e6584");
  dg.addColorStop(1, "#3a4d68");
  ctx.fillStyle = dg;
  ctx.fillRect(10, 212, DOOR_FRONT - 14, 316);
  ctx.fillStyle = "#31415a";
  ctx.fillRect(56, 216, 5, 308); // 中缝
  for (const px of [18, 70]) {
    ctx.fillStyle = "#42556f";
    ctx.fillRect(px, 232, 30, 116);
    ctx.fillRect(px, 372, 30, 116);
    ctx.fillStyle = "#2c3a52";
    ctx.fillRect(px + 4, 236, 22, 108);
    ctx.fillRect(px + 4, 376, 22, 108);
  }
  // 门把手
  ctx.fillStyle = "#c9d1dc";
  ctx.fillRect(48, 356, 8, 20);
  ctx.fillRect(62, 356, 8, 20);
  // 班牌
  ctx.fillStyle = "#ece7d8";
  ctx.fillRect(16, 158, 88, 32);
  ctx.fillStyle = "#b5ad94";
  ctx.fillRect(16, 186, 88, 4);
  const plaque = pixelText("八五班", { size: 18, color: "#28407c", scale: 2 });
  ctx.drawImage(plaque, Math.round(60 - plaque.width / 2), 160);
  // 门神贴纸（值日表）
  ctx.fillStyle = "#e8e2ce";
  ctx.fillRect(126, 230, 52, 72);
  ctx.fillStyle = "#d53a26";
  ctx.fillRect(126, 230, 52, 14);
  const duty = pixelText("值日表", { size: 10, color: "#fff4e0", scale: 2 });
  ctx.drawImage(duty, 132, 231);
  ctx.fillStyle = "#7a7461";
  for (let r = 0; r < 4; r++) ctx.fillRect(132, 252 + r * 12, 40, 3);

  // ---- 右侧七班拱门（敌军入口） ----
  ctx.fillStyle = "#1a2030";
  ctx.fillRect(886, 240, 74, 290);
  ctx.fillStyle = "#10141f";
  ctx.fillRect(894, 252, 66, 278);
  ctx.fillStyle = "#2c3242";
  ctx.fillRect(880, 232, 86, 10);
  ctx.fillStyle = "#2c3242";
  ctx.fillRect(880, 232, 8, 298);
  const archSign = pixelText("七班 direction →", { size: 10, color: "#8fa3c8", scale: 2 });
  ctx.drawImage(pixelText("七班方向", { size: 10, color: "#8fa3c8", scale: 2 }), 892, 212);
  void archSign;

  // ---- 考场倒计时小黑板 ----
  ctx.fillStyle = "#22332e";
  ctx.fillRect(188, 60, 152, 96);
  ctx.fillStyle = "#d8c9a3";
  ctx.fillRect(184, 56, 160, 8);
  ctx.fillRect(184, 152, 160, 8);
  ctx.fillRect(184, 56, 8, 104);
  ctx.fillRect(336, 56, 8, 104);
  const bb1 = pixelText("距离放学还有", { size: 12, color: "#e8e4d4", scale: 2 });
  ctx.drawImage(bb1, 198, 70);
  const bb2 = pixelText("4 分 钟", { size: 18, color: "#f2b53d", scale: 2 });
  ctx.drawImage(bb2, 212, 100);
  const bb3 = pixelText("—— 守住大门 ——", { size: 10, color: "#9fd0a8", scale: 2 });
  ctx.drawImage(bb3, 206, 132);

  // ---- 地板（透视瓷砖） ----
  const fg = ctx.createLinearGradient(0, FLOOR_TOP, 0, H);
  fg.addColorStop(0, "#8d8474");
  fg.addColorStop(1, "#6b6357");
  ctx.fillStyle = fg;
  ctx.fillRect(0, FLOOR_TOP, W, H - FLOOR_TOP);
  const rows = [FLOOR_TOP, 356, 384, 420, 464, 514, H];
  for (let r = 0; r < rows.length - 1; r++) {
    const y0 = rows[r];
    const y1 = rows[r + 1];
    const tw = 56 + r * 14;
    const off = r % 2 === 0 ? 0 : tw / 2;
    for (let x = -tw; x < W + tw; x += tw) {
      ctx.fillStyle = r % 2 === 0 ? "rgba(255,246,220,0.05)" : "rgba(30,26,20,0.06)";
      ctx.fillRect(x + off, y0, tw - 2, y1 - y0 - 2);
    }
    ctx.fillStyle = "rgba(40,36,28,0.45)";
    ctx.fillRect(0, y1 - 2, W, 2);
  }
  // 纸屑杂物
  for (let i = 0; i < 26; i++) {
    const x = 140 + Math.random() * 760;
    const y = FLOOR_TOP + 10 + Math.random() * (H - FLOOR_TOP - 30);
    ctx.fillStyle = ["#e8e4d4", "#d8c9a3", "#b5ad94"][i % 3];
    ctx.fillRect(x, y, 5, 4);
  }
  // 粉笔头
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = "#f2efe4";
    ctx.fillRect(160 + Math.random() * 700, FLOOR_TOP + 20 + Math.random() * 160, 4, 2);
  }

  // ---- 天花板吊灯 ----
  for (const lx of [240, 560, 860]) {
    ctx.fillStyle = "#14171f";
    ctx.fillRect(lx - 2, 0, 4, 12);
    ctx.fillStyle = "#ece7d8";
    ctx.fillRect(lx - 34, 12, 68, 10);
    ctx.fillStyle = "#f7ecd0";
    ctx.fillRect(lx - 30, 20, 60, 6);
    const glow = ctx.createRadialGradient(lx, 60, 6, lx, 60, 150);
    glow.addColorStop(0, "rgba(255,240,200,0.14)");
    glow.addColorStop(1, "rgba(255,240,200,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(lx - 160, 0, 320, 260);
  }

  return cv;
}

// ============================================================
// 过场背景：校舍外观 · 黄昏（480x270）
// ============================================================
export function buildSchoolExterior(): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = 480; cv.height = 270;
  const ctx = cv.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;

  // 黄昏天空
  const sky = ctx.createLinearGradient(0, 0, 0, 270);
  sky.addColorStop(0, "#2b2350");
  sky.addColorStop(0.45, "#7a3b63");
  sky.addColorStop(0.72, "#d9644a");
  sky.addColorStop(1, "#f2a45c");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 480, 270);

  // 早星
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(255,244,214,${0.25 + Math.random() * 0.5})`;
    ctx.fillRect(Math.random() * 480, Math.random() * 110, 2, 2);
  }
  // 落日
  ctx.fillStyle = "#ffe9a8";
  ctx.fillRect(372, 150, 44, 44);
  ctx.fillStyle = "#f7c96e";
  ctx.fillRect(366, 158, 56, 36);
  // 云带
  ctx.fillStyle = "rgba(43,35,80,0.5)";
  ctx.fillRect(40, 60, 150, 10);
  ctx.fillRect(66, 72, 200, 8);
  ctx.fillRect(250, 44, 130, 8);

  // 教学楼剪影（两栋）
  const building = (bx: number, bw: number, floors: number, topY: number) => {
    ctx.fillStyle = "#1c2030";
    ctx.fillRect(bx, topY, bw, 270 - topY);
    // 顶层旗杆轮廓
    ctx.fillRect(bx + bw - 24, topY - 18, 3, 18);
    // 窗户网格
    const cols = Math.floor(bw / 26);
    for (let f = 0; f < floors; f++) {
      for (let c = 0; c < cols; c++) {
        const wx = bx + 8 + c * 26;
        const wy = topY + 10 + f * 24;
        const lit = Math.random();
        ctx.fillStyle = lit > 0.62 ? "#ffcf7a" : lit > 0.4 ? "#8a5a48" : "#141824";
        ctx.fillRect(wx, wy, 16, 13);
        ctx.fillStyle = "rgba(20,24,36,0.55)";
        ctx.fillRect(wx + 7, wy, 2, 13);
      }
    }
  };
  building(30, 200, 6, 100);
  building(300, 150, 5, 124);

  // 五层事发窗口（高亮标记：七班）
  ctx.fillStyle = "#ff5c1f";
  ctx.fillRect(30 + 8 + 3 * 26, 100 + 10 + 1 * 24, 16, 13);
  ctx.fillStyle = "#ffd98a";
  ctx.fillRect(30 + 8 + 3 * 26 + 3, 100 + 10 + 1 * 24 + 3, 10, 8);

  // 操场地面 & 树影
  ctx.fillStyle = "#171b28";
  ctx.fillRect(0, 236, 480, 34);
  ctx.fillStyle = "#10141f";
  for (const tx of [240, 268, 452]) {
    ctx.fillRect(tx, 206, 8, 34);
    ctx.fillRect(tx - 14, 194, 36, 20);
    ctx.fillRect(tx - 8, 186, 24, 12);
  }

  return cv;
}

// ============================================================
// 过场背景：战后废墟走廊 · 破窗斜阳（480x270）
// ============================================================
export function buildRuins(): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = 480; cv.height = 270;
  const ctx = cv.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;

  // 残墙
  const wall = ctx.createLinearGradient(0, 0, 0, 190);
  wall.addColorStop(0, "#4a4438");
  wall.addColorStop(0.7, "#5c5442");
  wall.addColorStop(0.71, "#37474a");
  wall.addColorStop(1, "#2e3b3e");
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, 480, 190);
  // 熏黑
  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = `rgba(12,14,18,${0.08 + Math.random() * 0.2})`;
    ctx.fillRect(Math.random() * 480, Math.random() * 190, 4 + Math.random() * 8, 3 + Math.random() * 6);
  }
  // 裂缝
  ctx.strokeStyle = "rgba(16,18,24,0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, 0); ctx.lineTo(74, 60); ctx.lineTo(58, 130);
  ctx.moveTo(300, 20); ctx.lineTo(288, 90); ctx.lineTo(306, 150);
  ctx.stroke();

  // 破窗（右）—— 战场落日灌进来
  ctx.fillStyle = "#10141c";
  ctx.fillRect(330, 30, 140, 130);
  const dusk = ctx.createLinearGradient(0, 30, 0, 160);
  dusk.addColorStop(0, "#8f4b7a");
  dusk.addColorStop(0.55, "#e0704e");
  dusk.addColorStop(1, "#ffc46e");
  ctx.fillStyle = dusk;
  ctx.fillRect(338, 38, 124, 114);
  ctx.fillStyle = "#ffe9a8";
  ctx.fillRect(392, 96, 34, 34);
  // 破窗锯齿
  ctx.fillStyle = "#10141c";
  const jag = [[338, 38, 18, 10], [420, 38, 42, 8], [338, 140, 30, 12], [444, 100, 18, 52], [338, 38, 8, 44], [400, 152, 62, 8]];
  for (const [jx, jy, jw, jh] of jag) ctx.fillRect(jx, jy, jw, jh);
  // 垂落窗帘
  ctx.fillStyle = "#31415a";
  ctx.fillRect(330, 30, 10, 96);
  ctx.fillRect(462, 30, 8, 66);

  // 斜光束
  ctx.fillStyle = "rgba(255,206,130,0.16)";
  ctx.beginPath();
  ctx.moveTo(338, 152); ctx.lineTo(462, 152);
  ctx.lineTo(360, 270); ctx.lineTo(190, 270);
  ctx.closePath(); ctx.fill();

  // 倒塌的黑板
  ctx.fillStyle = "#22332e";
  ctx.fillRect(30, 120, 110, 60);
  ctx.fillStyle = "#d8c9a3";
  ctx.fillRect(30, 176, 110, 6);
  ctx.fillStyle = "rgba(232,228,212,0.5)";
  ctx.fillRect(44, 132, 60, 4);
  ctx.fillRect(44, 144, 40, 4);

  // 地板（破损瓷砖）
  const fg = ctx.createLinearGradient(0, 190, 0, 270);
  fg.addColorStop(0, "#6b6353");
  fg.addColorStop(1, "#4c463c");
  ctx.fillStyle = fg;
  ctx.fillRect(0, 190, 480, 80);
  ctx.fillStyle = "rgba(20,18,14,0.4)";
  for (let x = 0; x < 480; x += 34) ctx.fillRect(x, 190, 2, 80);
  ctx.fillRect(0, 210, 480, 2);
  ctx.fillRect(0, 240, 480, 3);
  // 裂痕与散页
  ctx.strokeStyle = "rgba(16,16,20,0.7)";
  ctx.beginPath();
  ctx.moveTo(120, 196); ctx.lineTo(150, 224); ctx.lineTo(140, 258);
  ctx.moveTo(360, 200); ctx.lineTo(330, 230); ctx.lineTo(348, 266);
  ctx.stroke();
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = ["#e8e4d4", "#b5ad94", "#8d8474"][i % 3];
    ctx.fillRect(Math.random() * 470, 196 + Math.random() * 70, 4, 3);
  }
  // 焦痕
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = "rgba(10,12,16,0.35)";
    ctx.beginPath();
    ctx.ellipse(60 + Math.random() * 380, 230 + Math.random() * 30, 26, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  return cv;
}

// ============================================================
// 第二战役素材：边三轮摩托 / 厕所隔间 / 街道
// ============================================================

// ---------- 画布型精灵工具（逐像素矩形绘制，仍是纯手工像素画） ----------
function spriteFromCanvas(cv: HTMLCanvasElement): Sprite {
  const white = document.createElement("canvas");
  white.width = cv.width; white.height = cv.height;
  const wc = white.getContext("2d")!;
  wc.imageSmoothingEnabled = false;
  wc.drawImage(cv, 0, 0);
  wc.globalCompositeOperation = "source-in";
  wc.fillStyle = "#ffffff";
  wc.fillRect(0, 0, cv.width, cv.height);
  return {
    img: cv, white,
    flip: flipCanvas(cv), whiteFlip: flipCanvas(white),
    w: cv.width, h: cv.height,
  };
}

/**
 * 边三轮摩托（侧视，朝右）：主车 + 右侧挎斗 + 三只轮子
 * frame 0/1 用于车轮辐条转动
 */
function buildSidecar(frame: number): HTMLCanvasElement {
  const Wd = 62, Ht = 32;
  const cv = document.createElement("canvas");
  cv.width = Wd; cv.height = Ht;
  const c = cv.getContext("2d")!;
  c.imageSmoothingEnabled = false;
  const R = (x: number, y: number, w: number, h: number, col: string) => {
    c.fillStyle = col; c.fillRect(x, y, w, h);
  };
  // 实心像素圆
  const disc = (cx: number, cy: number, r: number, col: string) => {
    c.fillStyle = col;
    for (let y = -r; y <= r; y++) {
      const w = Math.floor(Math.sqrt(Math.max(0, r * r - y * y)));
      c.fillRect(cx - w, cy + y, w * 2 + 1, 1);
    }
  };
  // 车轮（轮胎 + 轮毂 + 辐条）
  const wheel = (cx: number, cy: number, r: number) => {
    disc(cx, cy, r, "#101319");          // 轮胎
    disc(cx, cy, r - 2, "#20252e");      // 胎壁
    disc(cx, cy, r - 3, "#70798a");      // 轮毂
    disc(cx, cy, r - 5, "#aeb7c6");
    c.fillStyle = "#141820";
    const base = frame === 0 ? 0 : Math.PI / 4;
    for (let i = 0; i < 4; i++) {
      const a = base + (i * Math.PI) / 4;
      for (let t = -(r - 3); t <= r - 3; t++) {
        c.fillRect(Math.round(cx + Math.cos(a) * t), Math.round(cy + Math.sin(a) * t), 1, 1);
      }
    }
    disc(cx, cy, 1, "#e2e7ef");          // 轴心
  };

  const OLIVE = "#46563a", OLIVE_D = "#2f3b27", OLIVE_L = "#5b6e49";
  const STEEL = "#8c94a3", STEEL_D = "#4d5564", BLACK = "#121520";

  // ---- 后轮 / 前轮 ----
  wheel(13, 22, 8);
  wheel(49, 22, 8);

  // ---- 排气管 + 消音器（左下） ----
  R(6, 21, 22, 3, STEEL_D);
  R(6, 20, 18, 2, STEEL);
  R(3, 19, 6, 5, STEEL);
  R(3, 20, 5, 3, "#b9c1cd");

  // ---- 后挡泥板 ----
  R(5, 12, 17, 3, OLIVE_D);
  R(6, 11, 15, 2, OLIVE);
  // ---- 车架主梁 ----
  R(14, 15, 30, 4, OLIVE_D);
  R(16, 14, 26, 2, OLIVE);
  // ---- 发动机缸体 ----
  R(22, 17, 12, 7, BLACK);
  R(23, 18, 10, 5, "#2b313c");
  for (let i = 0; i < 4; i++) R(24, 18 + i, 8, 1, i % 2 ? "#39414f" : "#232934"); // 散热片
  R(26, 14, 6, 4, STEEL_D);
  // ---- 油箱 ----
  R(20, 9, 18, 7, OLIVE);
  R(21, 8, 16, 2, OLIVE_L);
  R(22, 10, 5, 2, "#8c9b6d");   // 高光
  R(20, 15, 18, 1, OLIVE_D);
  // 油箱上的五角星/编号（军车涂装）
  R(29, 11, 3, 3, "#c2a14a");
  R(30, 10, 1, 5, "#c2a14a");
  R(28, 12, 5, 1, "#c2a14a");
  // ---- 座垫 ----
  R(10, 10, 12, 4, "#1b1a18");
  R(11, 9, 10, 2, "#3a322a");
  R(12, 9, 7, 1, "#4d4136");
  // ---- 前叉 ----
  R(44, 10, 3, 13, STEEL_D);
  R(45, 10, 1, 13, STEEL);
  R(47, 12, 2, 10, STEEL_D);
  // ---- 车把 ----
  R(40, 5, 12, 2, BLACK);
  R(39, 4, 4, 2, "#8a8f99");
  R(50, 4, 4, 2, "#8a8f99");
  R(44, 6, 3, 5, STEEL_D);
  // ---- 前灯 ----
  disc(52, 11, 4, BLACK);
  disc(52, 11, 3, "#d9c173");
  disc(52, 11, 2, "#f7e6a4");
  R(51, 9, 2, 1, "#fff8d8");
  // 灯光锥
  c.fillStyle = "rgba(247,230,164,0.22)";
  c.beginPath(); c.moveTo(55, 8); c.lineTo(62, 4); c.lineTo(62, 19); c.lineTo(55, 15); c.closePath(); c.fill();

  // ============ 挎斗（前景，位于主车右侧外挂） ============
  // 支撑臂
  R(24, 21, 20, 2, STEEL_D);
  R(30, 19, 2, 4, STEEL_D);
  // 挎斗轮（挎斗自己的第三只轮子）
  wheel(30, 24, 7);
  // 斗身：船形，尾部左、鼻锥右
  R(22, 16, 22, 8, OLIVE_D);
  R(23, 15, 20, 2, OLIVE);
  R(24, 17, 19, 6, OLIVE);
  R(24, 17, 16, 1, OLIVE_L);
  // 鼻锥收窄
  R(43, 17, 3, 5, OLIVE_D);
  R(44, 18, 3, 3, OLIVE);
  R(46, 19, 2, 2, OLIVE_D);
  // 斗身底部阴影
  R(23, 23, 21, 2, "#1d2419");
  // 座舱开口
  R(26, 15, 13, 3, "#171c14");
  R(27, 16, 11, 2, "#232b1d");
  // 挎斗小风挡
  R(38, 11, 2, 5, STEEL_D);
  c.fillStyle = "rgba(190,214,226,0.45)";
  c.fillRect(33, 11, 6, 5);
  c.fillStyle = "#9fb3bf";
  c.fillRect(33, 10, 7, 1);
  // 斗身铆钉与编号
  c.fillStyle = "#2a3322";
  for (let i = 0; i < 6; i++) c.fillRect(25 + i * 3, 21, 1, 1);
  R(27, 19, 4, 1, "#c2a14a");
  // 挎斗挡泥板
  R(24, 18, 13, 1, OLIVE_D);

  return cv;
}

const MOTO_A = spriteFromCanvas(buildSidecar(0));
const MOTO_B = spriteFromCanvas(buildSidecar(1));

// 摩托（正后方视角，骑乘关卡用：三人在车上）
const MOTO_REAR = build([
  "......kkkk..........kkkkkk......",
  ".....kIIIIk........kIiiiiIk.....",
  "....kIiiiiIkkkkkkkkIiddddIk.....",
  "....kIddddIIIIIIIIIIddDDDdIk....",
  "...kIddDDDdddddddddddDDDDDdIk...",
  "...kIdDDDDDDDDDDDDDDDDDDDDDdIk..",
  "...kIdDDDkkkkkkkkkkkkkDDDDDdIk..",
  "...kIIdDDkIIIIIIIIIIIkDDDDdIIk..",
  "....kIIdDkIrrrrrrrrIkDDDdIIk....",
  ".....kkIIkIIIIIIIIIIkIIkk.......",
  "......kxxk..........kxxk........",
  ".....kxxxxk........kxxxxk.......",
  ".....kxkkxk........kxkkxk.......",
  ".....kxxxxk........kxxxxk.......",
  "......kxxk..........kxxk........",
]);

// 厕所隔间门（关闭 / 锁上）
const STALL_DOOR = build([
  "kkkkkkkkkkkkkkkkkkkk",
  "kddddddddddddddddddk",
  "kdDDDDDDDDDDDDDDDDdk",
  "kdDddddddddddddddDdk",
  "kdDdIIIIIIIIIIIIdDdk",
  "kdDdIIIIIIIIIIIIdDdk",
  "kdDdIIIIIIIIIIIIdDdk",
  "kdDdIIIIIIIIIIIIdDdk",
  "kdDddddddddddddddDdk",
  "kdDDDDDDDDDDDDDDDDdk",
  "kdDdIIIIIIIIIIIIdDdk",
  "kdDdIIIIIIIIIIIIdDdk",
  "kdDdIIIIIIIIIIIIdDdk",
  "kdDddddddddddddddDdk",
  "kdDDDDDDDDDDDDDDDDdk",
  "kddddddddddddddddddk",
  "kkkkkkkkkkkkkkkkkkkk",
]);

// 门闩（开 / 锁）
const LATCH_OPEN = build([
  "kkkkkkkk..",
  "kiiiiiik..",
  "kiIIIIik..",
  "kiiiiiik..",
  "kkkkkkkk..",
]);
const LATCH_LOCKED = build([
  "..kkkkkkkk",
  "..kiiiiiik",
  "..kiIIIIik",
  "..kiiiiiik",
  "..kkkkkkkk",
]);

export const SPR2 = { MOTO_A, MOTO_B, MOTO_REAR, STALL_DOOR, LATCH_OPEN, LATCH_LOCKED };
Object.assign(SPR, {
  motoA: MOTO_A, motoB: MOTO_B, motoRear: MOTO_REAR,
  stallDoor: STALL_DOOR, latchOpen: LATCH_OPEN, latchLocked: LATCH_LOCKED,
});

// ============================================================
// 第二战役背景
// ============================================================

/** 校门口停车棚 · 暮色（夺车阶段，960x540） */
export function buildYard(): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;

  // 夜幕天空
  const sky = ctx.createLinearGradient(0, 0, 0, 300);
  sky.addColorStop(0, "#161a2b");
  sky.addColorStop(0.5, "#2b2538");
  sky.addColorStop(1, "#5c3b37");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, 300);
  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = `rgba(226,222,200,${0.15 + Math.random() * 0.35})`;
    ctx.fillRect(Math.random() * W, Math.random() * 180, 2, 2);
  }
  // 远处教学楼剪影
  ctx.fillStyle = "#11141f";
  ctx.fillRect(0, 120, 300, 180);
  ctx.fillRect(620, 96, 340, 204);
  for (let f = 0; f < 5; f++) for (let c = 0; c < 9; c++) {
    const lit = Math.random();
    ctx.fillStyle = lit > 0.78 ? "#d9b068" : "#0b0e17";
    if (c < 6) ctx.fillRect(16 + c * 46, 140 + f * 32, 22, 16);
    ctx.fillRect(640 + c * 34, 116 + f * 34, 20, 15);
  }

  // 停车棚顶
  ctx.fillStyle = "#2a2f3c";
  ctx.fillRect(80, 170, 800, 22);
  ctx.fillStyle = "#1a1e29";
  ctx.fillRect(80, 192, 800, 8);
  for (const px of [110, 330, 560, 840]) {
    ctx.fillStyle = "#22273a";
    ctx.fillRect(px, 192, 12, 180);
    ctx.fillStyle = "#171b27";
    ctx.fillRect(px + 8, 192, 4, 180);
  }
  // 棚顶波纹
  for (let x = 80; x < 880; x += 16) {
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(x, 170, 6, 22);
  }

  // 围墙
  ctx.fillStyle = "#3a3a44";
  ctx.fillRect(0, 262, W, 44);
  ctx.fillStyle = "#2c2c36";
  for (let x = 0; x < W; x += 56) ctx.fillRect(x, 262, 3, 44);
  ctx.fillStyle = "#4a4a56";
  ctx.fillRect(0, 258, W, 6);
  // 铁丝网
  ctx.strokeStyle = "rgba(180,186,200,0.25)";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 18) {
    ctx.beginPath(); ctx.moveTo(x, 200); ctx.lineTo(x + 18, 262); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 18, 200); ctx.lineTo(x, 262); ctx.stroke();
  }

  // 柏油地面
  const fg = ctx.createLinearGradient(0, 306, 0, H);
  fg.addColorStop(0, "#32343c");
  fg.addColorStop(1, "#212329");
  ctx.fillStyle = fg;
  ctx.fillRect(0, 306, W, H - 306);
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.12)";
    ctx.fillRect(Math.random() * W, 306 + Math.random() * (H - 306), 3, 2);
  }
  // 车位线
  ctx.fillStyle = "rgba(226,214,160,0.35)";
  for (let i = 0; i < 7; i++) ctx.fillRect(90 + i * 128, 330, 5, 120);
  ctx.fillRect(60, 446, W - 120, 5);
  // 路灯冷光池
  for (const lx of [200, 560, 860]) {
    const gl = ctx.createRadialGradient(lx, 430, 10, lx, 430, 230);
    gl.addColorStop(0, "rgba(214,196,140,0.14)");
    gl.addColorStop(1, "rgba(214,196,140,0)");
    ctx.fillStyle = gl;
    ctx.fillRect(lx - 240, 300, 480, 240);
  }
  return cv;
}

/** 公共厕所内部 · 隔间视角（固守阶段，960x540） */
export function buildLavatory(): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;

  // 瓷砖墙
  ctx.fillStyle = "#6d7a74";
  ctx.fillRect(0, 0, W, 420);
  for (let y = 0; y < 420; y += 34) {
    for (let x = (y / 34) % 2 === 0 ? 0 : -24; x < W; x += 48) {
      ctx.fillStyle = `rgba(255,255,255,${0.04 + Math.random() * 0.05})`;
      ctx.fillRect(x + 2, y + 2, 44, 30);
      ctx.fillStyle = "rgba(20,26,24,0.28)";
      ctx.fillRect(x, y, 48, 2);
      ctx.fillRect(x, y, 2, 34);
    }
  }
  // 霉斑污渍
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = `rgba(48,58,44,${0.08 + Math.random() * 0.22})`;
    const sx = Math.random() * W, sy = Math.random() * 420;
    ctx.fillRect(sx, sy, 4 + Math.random() * 16, 3 + Math.random() * 10);
  }
  // 高窗（铁栅）
  ctx.fillStyle = "#1d2630";
  ctx.fillRect(610, 40, 190, 86);
  const wg = ctx.createLinearGradient(0, 46, 0, 120);
  wg.addColorStop(0, "#3b4a63");
  wg.addColorStop(1, "#8a6a52");
  ctx.fillStyle = wg;
  ctx.fillRect(618, 48, 174, 70);
  ctx.fillStyle = "#1d2630";
  for (let i = 0; i < 5; i++) ctx.fillRect(630 + i * 36, 48, 6, 70);
  ctx.fillRect(618, 80, 174, 5);

  // 吊灯（闪烁感：画静态灯体）
  ctx.fillStyle = "#15181f";
  ctx.fillRect(476, 0, 4, 40);
  ctx.fillStyle = "#c9cfbe";
  ctx.fillRect(448, 40, 60, 12);
  ctx.fillStyle = "#f0ecd0";
  ctx.fillRect(452, 52, 52, 5);

  // 地砖
  const fg = ctx.createLinearGradient(0, 420, 0, H);
  fg.addColorStop(0, "#565e58");
  fg.addColorStop(1, "#3c423e");
  ctx.fillStyle = fg;
  ctx.fillRect(0, 420, W, H - 420);
  for (let y = 420; y < H; y += 26) {
    for (let x = 0; x < W; x += 42) {
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      ctx.fillRect(x, y, 42, 2);
      ctx.fillRect(x, y, 2, 26);
    }
  }
  // 积水反光
  for (let i = 0; i < 7; i++) {
    const px = 80 + Math.random() * 800, py = 450 + Math.random() * 70;
    ctx.fillStyle = "rgba(170,196,200,0.12)";
    ctx.beginPath(); ctx.ellipse(px, py, 34, 9, 0, 0, Math.PI * 2); ctx.fill();
  }

  // 相邻隔间隔板（左右）
  for (const bx of [-10, 820]) {
    ctx.fillStyle = "#4b5a63";
    ctx.fillRect(bx, 150, 150, 300);
    ctx.fillStyle = "#3a4750";
    ctx.fillRect(bx, 150, 150, 10);
    ctx.fillRect(bx, 440, 150, 10);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    for (let i = 0; i < 5; i++) ctx.fillRect(bx + 14 + i * 28, 160, 3, 280);
  }
  // 蹲位（中央，象征性）
  ctx.fillStyle = "#b9c0b4";
  ctx.fillRect(400, 452, 160, 56);
  ctx.fillStyle = "#8d968c";
  ctx.fillRect(412, 462, 136, 38);
  ctx.fillStyle = "#30362f";
  ctx.fillRect(432, 470, 96, 24);
  // 水管
  ctx.fillStyle = "#7d8690";
  ctx.fillRect(884, 120, 12, 340);
  ctx.fillStyle = "#5e666f";
  ctx.fillRect(884, 220, 12, 10);
  ctx.fillRect(884, 350, 12, 10);
  return cv;
}

/** 暮色公路（骑乘阶段的可滚动条带，1920 宽循环） */
export function buildRoadStrip(): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = 1920; cv.height = 540;
  const ctx = cv.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  // 天空
  const sky = ctx.createLinearGradient(0, 0, 0, 250);
  sky.addColorStop(0, "#131627");
  sky.addColorStop(0.55, "#38283c");
  sky.addColorStop(1, "#8a4a39");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1920, 250);
  for (let i = 0; i < 140; i++) {
    ctx.fillStyle = `rgba(226,222,200,${0.12 + Math.random() * 0.3})`;
    ctx.fillRect(Math.random() * 1920, Math.random() * 150, 2, 2);
  }
  // 远山/建筑剪影（循环无缝：首尾同形）
  ctx.fillStyle = "#0f1220";
  for (let x = 0; x < 1920; x += 160) {
    const h = 60 + ((x / 160) % 4) * 26;
    ctx.fillRect(x, 250 - h, 150, h);
    for (let c = 0; c < 5; c++) for (let r = 0; r < Math.floor(h / 26); r++) {
      ctx.fillStyle = ((x / 160 + c + r) % 5 === 0) ? "#c99a52" : "#0b0e18";
      ctx.fillRect(x + 12 + c * 28, 250 - h + 12 + r * 24, 16, 13);
      ctx.fillStyle = "#0f1220";
    }
  }
  // 行道树
  for (let x = 40; x < 1920; x += 240) {
    ctx.fillStyle = "#0c0f18";
    ctx.fillRect(x, 190, 10, 70);
    ctx.fillRect(x - 24, 160, 58, 36);
    ctx.fillRect(x - 14, 142, 38, 22);
  }
  // 路面
  const road = ctx.createLinearGradient(0, 250, 0, 540);
  road.addColorStop(0, "#2b2d35");
  road.addColorStop(1, "#1b1d23");
  ctx.fillStyle = road;
  ctx.fillRect(0, 250, 1920, 290);
  // 路肩
  ctx.fillStyle = "#454a52";
  ctx.fillRect(0, 250, 1920, 10);
  ctx.fillStyle = "#3a3f47";
  ctx.fillRect(0, 524, 1920, 16);
  // 中线
  for (let x = 0; x < 1920; x += 120) {
    ctx.fillStyle = "rgba(230,218,160,0.5)";
    ctx.fillRect(x, 392, 64, 7);
  }
  // 噪点沥青
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.14)";
    ctx.fillRect(Math.random() * 1920, 258 + Math.random() * 270, 3, 2);
  }
  return cv;
}

// ============================================================
// 第三战役「复仇」素材
// ============================================================

/** 墙上电闸箱（开/合两态） */
function buildBreaker(on: boolean): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = 22; cv.height = 28;
  const c = cv.getContext("2d")!;
  const R = (x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  R(0, 0, 22, 28, "#15181f");
  R(1, 1, 20, 26, "#5a6150");
  R(2, 2, 18, 24, "#434a3b");
  R(3, 3, 16, 12, "#20251c");
  // 指示灯
  R(15, 5, 3, 3, on ? "#8fe06a" : "#8d2a21");
  // 闸刀
  c.strokeStyle = "#cfd6df"; c.lineWidth = 2;
  c.beginPath();
  c.moveTo(6, 13);
  if (on) c.lineTo(14, 7); else c.lineTo(14, 19);
  c.stroke();
  R(5, 12, 3, 3, "#8c94a3");
  R(13, on ? 6 : 18, 3, 3, "#8c94a3");
  // 下部铭牌
  R(3, 17, 16, 8, "#2b3126");
  R(5, 19, 12, 1, "#c2a14a");
  R(5, 21, 8, 1, "#c2a14a");
  // 警示闪电
  R(9, 4, 2, 4, "#e8c15a");
  R(11, 6, 2, 4, "#e8c15a");
  return cv;
}
const BREAKER_ON = spriteFromCanvas(buildBreaker(true));
const BREAKER_OFF = spriteFromCanvas(buildBreaker(false));

/** 厕所所长的三轮战车（正侧视，带货斗与拖把炮） */
function buildTrike(frame: number): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = 58; cv.height = 32;
  const c = cv.getContext("2d")!;
  const R = (x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const disc = (cx: number, cy: number, r: number, col: string) => {
    c.fillStyle = col;
    for (let y = -r; y <= r; y++) {
      const w = Math.floor(Math.sqrt(Math.max(0, r * r - y * y)));
      c.fillRect(cx - w, cy + y, w * 2 + 1, 1);
    }
  };
  const wheel = (cx: number, cy: number, r: number) => {
    disc(cx, cy, r, "#101319"); disc(cx, cy, r - 2, "#262b33"); disc(cx, cy, r - 4, "#798290");
    c.fillStyle = "#141820";
    const base = frame === 0 ? 0 : Math.PI / 4;
    for (let i = 0; i < 4; i++) {
      const a = base + (i * Math.PI) / 4;
      for (let t = -(r - 3); t <= r - 3; t++) c.fillRect(Math.round(cx + Math.cos(a) * t), Math.round(cy + Math.sin(a) * t), 1, 1);
    }
  };
  // 货斗（后部，装满拖把与水桶）
  R(2, 12, 28, 12, "#3f4a52");
  R(3, 11, 26, 2, "#59656e");
  R(3, 13, 26, 10, "#333c43");
  R(4, 22, 26, 2, "#1d242a");
  // 斗里的拖把与桶
  for (let i = 0; i < 4; i++) {
    c.strokeStyle = "#8a6238"; c.lineWidth = 1;
    c.beginPath(); c.moveTo(6 + i * 6, 12); c.lineTo(10 + i * 6, 2); c.stroke();
    R(8 + i * 6, 1, 4, 3, "#b9b09c");
  }
  R(20, 6, 8, 7, "#7e8a63"); R(21, 7, 6, 5, "#5d6a44");
  // 驾驶区
  R(30, 10, 14, 13, "#46563a");
  R(31, 9, 12, 2, "#5b6e49");
  R(33, 12, 8, 6, "#1d2618");
  // 车头
  R(44, 13, 9, 9, "#3b4a30");
  R(45, 12, 7, 2, "#54664a");
  disc(52, 16, 3, "#15181f"); disc(52, 16, 2, "#f0dc9a");
  // 车把
  R(42, 5, 2, 6, "#79828f");
  R(38, 4, 10, 2, "#151a20");
  // 轮子
  wheel(10, 25, 6); wheel(24, 25, 6); wheel(48, 24, 7);
  return cv;
}
const TRIKE_A = spriteFromCanvas(buildTrike(0));
const TRIKE_B = spriteFromCanvas(buildTrike(1));

/** B85 轰炸机（俯视；机头朝上 / 向北飞行） */
function buildBomber(): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = 64; cv.height = 58;
  const c = cv.getContext("2d")!;
  const R = (x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const OL = "#4a5340", OLD = "#2f3629", OLL = "#616b52", DK = "#1b1f18";

  // ---- 机鼻（尖锐，朝上收窄）----
  R(30, 0, 4, 3, OLL);
  R(29, 2, 6, 3, OL);
  R(28, 4, 8, 4, OL);
  // 领航舱玻璃
  R(29, 3, 6, 4, "#9fc4d6");
  R(30, 2, 4, 2, "#d6ecf5");
  R(30, 5, 4, 1, "#6d93a8");

  // ---- 机身（上窄下宽）----
  R(27, 8, 10, 34, OLD);
  R(28, 8, 8, 33, OL);
  R(29, 10, 6, 14, OLL);
  // 驾驶舱
  R(29, 9, 6, 4, "#8fb6cb");
  R(30, 10, 4, 2, "#cfe4ee");
  // 机背脊线
  R(31, 14, 2, 26, OLD);

  // ---- 主翼（后掠：翼根靠前、翼尖靠后）----
  for (let i = 0; i < 28; i++) {
    const y = 18 + Math.floor(i * 0.32);       // 向后掠
    const h = 8 - Math.floor(i * 0.12);
    R(26 - i, y, 2, h, i % 9 === 0 ? OLD : OL);
    R(36 + i, y, 2, h, i % 9 === 0 ? OLD : OL);
  }
  // 翼前缘高亮
  for (let i = 0; i < 28; i++) {
    R(26 - i, 18 + Math.floor(i * 0.32), 2, 1, OLL);
    R(36 + i, 18 + Math.floor(i * 0.32), 2, 1, OLL);
  }
  // 翼尖
  R(0, 27, 3, 4, OLD);
  R(61, 27, 3, 4, OLD);

  // ---- 四台发动机（短舱朝前，螺旋桨在机头侧）----
  for (const ex of [14, 22, 42, 50]) {
    const ny = 19 + Math.abs(ex - 32) * 0.14;
    R(ex - 3, ny, 6, 13, OLD);
    R(ex - 2, ny + 1, 4, 10, "#394130");
    R(ex - 2, ny + 9, 4, 3, DK);
    // 螺旋桨（朝机头方向，上方）
    R(ex - 1, ny - 4, 2, 4, DK);
    c.fillStyle = "rgba(205,215,195,0.3)";
    c.fillRect(ex - 8, ny - 6, 16, 2);
    c.fillRect(ex - 1, ny - 11, 2, 11);
  }

  // ---- 尾翼（在下方）----
  // 平尾
  R(18, 45, 28, 5, OLD);
  R(20, 45, 24, 3, OL);
  R(20, 45, 24, 1, OLL);
  // 垂尾
  R(29, 48, 6, 9, OLD);
  R(30, 49, 4, 7, OL);
  R(31, 50, 2, 5, OLL);

  // ---- 识别涂装 ----
  R(27, 30, 10, 2, "#8d2a21");
  R(27, 34, 10, 1, "#c2a14a");
  R(30, 37, 4, 4, "#c2a14a");   // 机身星徽
  R(31, 36, 2, 6, "#c2a14a");
  // 弹舱（打开）
  R(30, 25, 4, 6, "#0f1310");
  R(31, 26, 2, 4, "#1d2618");
  return cv;
}
/** B85 轰炸机（侧视巡航，机头朝右）—— 过场专用 */
function buildBomberSide(prop: number): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = 80; cv.height = 30;
  const c = cv.getContext("2d")!;
  const R = (x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const OL = "#4a5340", OLD = "#2f3629", OLL = "#616b52", DK = "#1b1f18";

  // ---- 机身（细长流线，机头在右）----
  R(10, 11, 56, 8, OLD);
  R(11, 10, 54, 8, OL);
  R(13, 11, 46, 3, OLL);           // 上缘高光
  R(12, 17, 50, 2, "#242a1f");     // 下缘阴影
  // 机头圆锥
  R(66, 12, 4, 6, OL);
  R(69, 13, 3, 4, OLL);
  R(71, 14, 2, 2, "#8a9478");
  // 领航玻璃罩（机鼻下方）
  R(64, 14, 6, 4, "#9fc4d6");
  R(66, 15, 3, 2, "#d6ecf5");
  // 驾驶舱
  R(54, 8, 9, 4, "#8fb6cb");
  R(55, 7, 7, 2, OLD);
  R(56, 9, 4, 2, "#d6ecf5");

  // ---- 主翼（侧视：从机身中部向左后伸出一道厚翼）----
  R(20, 13, 30, 4, OLD);
  R(22, 13, 26, 2, OL);
  R(24, 12, 18, 1, OLL);
  // 翼根整流
  R(34, 11, 12, 7, OL);

  // ---- 发动机短舱 ×2（侧视可见）+ 旋转螺旋桨 ----
  for (const ex of [30, 44]) {
    R(ex, 14, 11, 6, OLD);
    R(ex + 1, 15, 9, 4, "#394130");
    R(ex + 1, 18, 9, 1, DK);
    // 桨毂与桨盘（机头侧）
    R(ex + 11, 15, 2, 4, DK);
    const spin = prop === 0 ? 0.26 : 0.12;
    c.fillStyle = `rgba(205,215,195,${spin})`;
    c.fillRect(ex + 12, 9, 2, 16);
    c.fillStyle = `rgba(230,238,220,${prop === 0 ? 0.5 : 0.22})`;
    c.fillRect(ex + 12, prop === 0 ? 10 : 13, 2, prop === 0 ? 6 : 10);
  }

  // ---- 尾翼（左端）----
  R(4, 4, 5, 9, OLD);              // 垂尾
  R(5, 5, 3, 8, OL);
  R(5, 6, 2, 4, OLL);
  R(2, 12, 14, 3, OLD);            // 平尾
  R(3, 12, 12, 2, OL);
  R(8, 11, 6, 1, OLL);

  // ---- 起落架收起的鼓包 / 弹舱 ----
  R(32, 19, 14, 2, OLD);
  R(34, 20, 10, 2, "#171b14");

  // ---- 涂装 ----
  R(24, 13, 2, 5, "#8d2a21");
  R(27, 13, 1, 5, "#c2a14a");
  R(16, 12, 4, 4, "#c2a14a");      // 尾部星徽
  R(17, 11, 2, 6, "#c2a14a");
  return cv;
}
const BOMBER_SIDE_A = spriteFromCanvas(buildBomberSide(0));
const BOMBER_SIDE_B = spriteFromCanvas(buildBomberSide(1));

const BOMBER = spriteFromCanvas(buildBomber());

/** 空爆弹（俯视下坠，带尾翼） */
function buildAirBomb(): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = 12; cv.height = 18;
  const c = cv.getContext("2d")!;
  const R = (x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  R(4, 0, 4, 3, "#4f7226");
  R(3, 2, 6, 10, "#6f9e36");
  R(4, 3, 4, 8, "#8fc44a");
  R(5, 4, 1, 5, "#c4e368");
  R(2, 11, 8, 3, "#3c5a1e");
  // 尾翼
  R(1, 13, 2, 5, "#2f481a");
  R(9, 13, 2, 5, "#2f481a");
  R(5, 13, 2, 5, "#2f481a");
  R(4, 6, 4, 1, "#c2a14a");
  return cv;
}
const AIRBOMB = spriteFromCanvas(buildAirBomb());

Object.assign(SPR, {
  breakerOn: BREAKER_ON, breakerOff: BREAKER_OFF,
  trikeA: TRIKE_A, trikeB: TRIKE_B,
  bomber: BOMBER, bomberSideA: BOMBER_SIDE_A, bomberSideB: BOMBER_SIDE_B, airbomb: AIRBOMB,
});

/** 夜间校园外墙（潜入阶段） */
export function buildNightSchool(): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const c = cv.getContext("2d")!;
  c.imageSmoothingEnabled = false;
  const sky = c.createLinearGradient(0, 0, 0, 300);
  sky.addColorStop(0, "#05070e"); sky.addColorStop(0.6, "#0b1020"); sky.addColorStop(1, "#141b2a");
  c.fillStyle = sky; c.fillRect(0, 0, W, 320);
  for (let i = 0; i < 110; i++) {
    c.fillStyle = `rgba(210,220,236,${0.1 + Math.random() * 0.4})`;
    c.fillRect(Math.random() * W, Math.random() * 200, 2, 2);
  }
  // 月亮
  c.fillStyle = "#dfe6f2"; c.fillRect(760, 54, 40, 40);
  c.fillStyle = "#0b1020"; c.fillRect(748, 46, 34, 34);
  c.fillStyle = "rgba(190,206,236,0.08)";
  c.beginPath(); c.arc(782, 76, 90, 0, Math.PI * 2); c.fill();
  // 教学楼主体
  c.fillStyle = "#0e1118"; c.fillRect(0, 120, W, 230);
  c.fillStyle = "#141924"; c.fillRect(40, 140, W - 80, 200);
  for (let f = 0; f < 4; f++) for (let w2 = 0; w2 < 14; w2++) {
    const wx = 60 + w2 * 62, wy = 156 + f * 46;
    const lit = (f === 1 && w2 > 8) || Math.random() > 0.88;
    c.fillStyle = lit ? "#3b4a2a" : "#090c12";
    c.fillRect(wx, wy, 38, 30);
    c.fillStyle = "#1b2130"; c.fillRect(wx + 17, wy, 3, 30);
  }
  // 一层：厕所亮灯（目标区）
  c.fillStyle = "#2a3a28"; c.fillRect(620, 250, 180, 70);
  c.fillStyle = "#d8c27a"; c.fillRect(632, 262, 46, 34);
  c.fillStyle = "#c9b268"; c.fillRect(694, 262, 46, 34);
  c.fillStyle = "#1b2130"; c.fillRect(652, 262, 3, 34); c.fillRect(714, 262, 3, 34);
  // 地面
  const g = c.createLinearGradient(0, 350, 0, H);
  g.addColorStop(0, "#161a16"); g.addColorStop(1, "#0b0d0c");
  c.fillStyle = g; c.fillRect(0, 350, W, H - 350);
  for (let i = 0; i < 600; i++) {
    c.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.022)" : "rgba(0,0,0,0.15)";
    c.fillRect(Math.random() * W, 350 + Math.random() * 190, 3, 2);
  }
  // 灌木掩体
  for (const bx of [120, 330, 560, 820]) {
    c.fillStyle = "#101a10"; c.fillRect(bx - 40, 400, 80, 30);
    c.fillStyle = "#172615"; c.fillRect(bx - 34, 392, 68, 18);
  }
  return cv;
}

/** 黑暗厕所走廊（停电逃生） */
export function buildDarkCorridor(): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = 1920; cv.height = H;
  const c = cv.getContext("2d")!;
  c.imageSmoothingEnabled = false;
  c.fillStyle = "#070a09"; c.fillRect(0, 0, 1920, H);
  // 瓷砖墙（极暗）
  for (let y = 0; y < 380; y += 34) {
    for (let x = (y / 34) % 2 === 0 ? 0 : -24; x < 1920; x += 48) {
      c.fillStyle = `rgba(80,96,88,${0.05 + Math.random() * 0.05})`;
      c.fillRect(x + 2, y + 2, 44, 30);
      c.fillStyle = "rgba(0,0,0,0.5)"; c.fillRect(x, y, 48, 2); c.fillRect(x, y, 2, 34);
    }
  }
  // 隔间门排
  for (let x = 60; x < 1920; x += 230) {
    c.fillStyle = "#12191a"; c.fillRect(x, 150, 120, 230);
    c.fillStyle = "#0b1011"; c.fillRect(x + 8, 158, 104, 214);
    c.fillStyle = "#1b2426"; c.fillRect(x + 100, 262, 8, 12);
  }
  // 地面（湿滑反光）
  c.fillStyle = "#0c100e"; c.fillRect(0, 380, 1920, H - 380);
  for (let i = 0; i < 40; i++) {
    const px = Math.random() * 1920, py = 400 + Math.random() * 120;
    c.fillStyle = "rgba(120,170,160,0.07)";
    c.beginPath(); c.ellipse(px, py, 40 + Math.random() * 40, 8, 0, 0, Math.PI * 2); c.fill();
  }
  c.fillStyle = "rgba(0,0,0,0.4)";
  for (let x = 0; x < 1920; x += 56) c.fillRect(x, 380, 2, H - 380);
  return cv;
}

/** 拥挤教学楼走廊 */
export function buildCrowdHall(): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = 1920; cv.height = H;
  const c = cv.getContext("2d")!;
  c.imageSmoothingEnabled = false;
  const w = c.createLinearGradient(0, 0, 0, 360);
  w.addColorStop(0, "#3b3a30"); w.addColorStop(0.72, "#4a4838");
  w.addColorStop(0.73, "#33474a"); w.addColorStop(1, "#2a3c3f");
  c.fillStyle = w; c.fillRect(0, 0, 1920, 360);
  // 教室门与窗
  for (let x = 40; x < 1920; x += 260) {
    c.fillStyle = "#2a2318"; c.fillRect(x, 150, 90, 210);
    c.fillStyle = "#3a3122"; c.fillRect(x + 6, 158, 78, 196);
    c.fillStyle = "#c2a14a"; c.fillRect(x + 72, 258, 8, 6);
    c.fillStyle = "#6b7a52"; c.fillRect(x + 20, 176, 50, 36);
    c.fillStyle = "#e8e4d4"; c.fillRect(x + 150, 130, 70, 22);
  }
  // 吊灯
  for (let x = 120; x < 1920; x += 300) {
    c.fillStyle = "#15181f"; c.fillRect(x, 0, 3, 26);
    c.fillStyle = "#d8d2b8"; c.fillRect(x - 26, 26, 56, 9);
    const gl = c.createRadialGradient(x, 60, 6, x, 60, 160);
    gl.addColorStop(0, "rgba(255,240,200,0.12)"); gl.addColorStop(1, "rgba(255,240,200,0)");
    c.fillStyle = gl; c.fillRect(x - 170, 0, 340, 300);
  }
  // 地面
  const g = c.createLinearGradient(0, 360, 0, H);
  g.addColorStop(0, "#6b6453"); g.addColorStop(1, "#4a443a");
  c.fillStyle = g; c.fillRect(0, 360, 1920, H - 360);
  for (let x = 0; x < 1920; x += 48) { c.fillStyle = "rgba(0,0,0,0.14)"; c.fillRect(x, 360, 2, H - 360); }
  for (let y = 360; y < H; y += 34) { c.fillStyle = "rgba(0,0,0,0.12)"; c.fillRect(0, y, 1920, 2); }
  return cv;
}

/** 高空俯视校园（轰炸阶段） */
export function buildAerialSchool(): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = 1400;
  const c = cv.getContext("2d")!;
  c.imageSmoothingEnabled = false;
  // 夜色地表
  c.fillStyle = "#0d1410"; c.fillRect(0, 0, W, 1400);
  for (let i = 0; i < 2600; i++) {
    c.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.016)" : "rgba(0,0,0,0.2)";
    c.fillRect(Math.random() * W, Math.random() * 1400, 3, 3);
  }
  // 田径场（椭圆跑道）
  c.strokeStyle = "#6b4a32"; c.lineWidth = 16;
  c.beginPath(); c.ellipse(480, 1080, 250, 130, 0, 0, Math.PI * 2); c.stroke();
  c.fillStyle = "#1e3320"; c.beginPath(); c.ellipse(480, 1080, 236, 116, 0, 0, Math.PI * 2); c.fill();
  // 建筑群（俯视矩形 + 屋顶细节）
  const blds: [number, number, number, number][] = [
    [120, 140, 720, 110], [120, 330, 300, 150], [540, 330, 300, 150],
    [150, 580, 660, 120], [120, 780, 260, 140], [600, 780, 260, 140],
  ];
  for (const [x, y, bw, bh] of blds) {
    c.fillStyle = "#0a0d0b"; c.fillRect(x + 6, y + 6, bw, bh);
    c.fillStyle = "#2b3038"; c.fillRect(x, y, bw, bh);
    c.fillStyle = "#363c46"; c.fillRect(x + 4, y + 4, bw - 8, bh - 8);
    for (let i = 0; i < Math.floor(bw / 40); i++) {
      c.fillStyle = "#232831"; c.fillRect(x + 12 + i * 40, y + 10, 24, bh - 20);
    }
    c.fillStyle = "#4a515c"; c.fillRect(x, y, bw, 4);
  }
  // 道路
  c.fillStyle = "#1b1f1c";
  c.fillRect(0, 290, W, 28); c.fillRect(0, 530, W, 28); c.fillRect(0, 740, W, 28); c.fillRect(0, 950, W, 28);
  c.fillRect(440, 0, 28, 1400);
  c.fillStyle = "rgba(220,210,160,0.2)";
  for (let x = 0; x < W; x += 56) { c.fillRect(x, 302, 26, 3); c.fillRect(x, 542, 26, 3); c.fillRect(x, 752, 26, 3); }
  for (let y = 0; y < 1400; y += 56) c.fillRect(452, y, 3, 26);
  return cv;
}

// ============================================================
// 第四武器：高压水枪「龙王」（消防栓改装）
// ============================================================
function buildHydroGun(frame: number): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = 30; cv.height = 14;
  const c = cv.getContext("2d")!;
  const R = (x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const BLUE = "#2f6f93", BLUE_D = "#1b4a66", BLUE_L = "#49a0c4";
  const STEEL = "#8c94a3", STEEL_D = "#4d5564";
  // 后部压力罐
  R(0, 3, 10, 8, BLUE_D);
  R(1, 4, 8, 6, BLUE);
  R(2, 5, 5, 2, BLUE_L);
  R(0, 2, 10, 1, STEEL_D);
  // 压力表（随帧跳动）
  R(3, 1, 4, 3, STEEL);
  R(4, 2, 2, 1, frame === 0 ? "#8fd6a0" : "#ffe084");
  // 枪身
  R(10, 5, 12, 5, STEEL_D);
  R(10, 5, 12, 2, STEEL);
  R(11, 7, 9, 2, BLUE);
  // 喷嘴
  R(22, 4, 5, 7, STEEL_D);
  R(23, 5, 4, 5, STEEL);
  R(27, 6, 3, 3, BLUE_L);
  // 水花
  if (frame === 1) {
    R(28, 5, 2, 1, "#9fe0f5");
    R(29, 8, 1, 2, "#9fe0f5");
  }
  // 握把与扳机
  R(13, 10, 3, 4, "#1b1f28");
  R(16, 10, 2, 2, STEEL_D);
  // 背带
  R(4, 10, 2, 4, "#2a2318");
  return cv;
}
const HYDRO_A = spriteFromCanvas(buildHydroGun(0));
const HYDRO_B = spriteFromCanvas(buildHydroGun(1));

Object.assign(SPR, { gunHydro: HYDRO_A, gunHydroB: HYDRO_B });

// ============================================================
// 新增武器与投掷物精灵
// ============================================================
const RECT = (c: CanvasRenderingContext2D) =>
  (x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(x, y, w, h); };

/** 钉书机机枪「订正者」 */
function buildStapler(): HTMLCanvasElement {
  const cv = document.createElement("canvas"); cv.width = 30; cv.height = 14;
  const c = cv.getContext("2d")!; const R = RECT(c);
  R(2, 4, 22, 6, "#5a2d33"); R(3, 5, 20, 3, "#8a4450"); R(4, 5, 10, 1, "#b06a74");
  R(24, 5, 5, 4, "#8c94a3"); R(28, 6, 2, 2, "#cfd6df");          // 枪口
  R(6, 2, 14, 3, "#4d5564"); R(7, 2, 12, 1, "#8c94a3");           // 弹匣盖
  for (let i = 0; i < 5; i++) R(8 + i * 2, 3, 1, 1, "#e2e7ef");   // 钉子
  R(10, 10, 4, 4, "#1b1f28"); R(14, 10, 2, 2, "#4d5564");         // 握把
  R(0, 5, 3, 5, "#4d5564");
  return cv;
}
/** 粉笔狙击枪「板书」 */
function buildChalkRifle(): HTMLCanvasElement {
  const cv = document.createElement("canvas"); cv.width = 36; cv.height = 14;
  const c = cv.getContext("2d")!; const R = RECT(c);
  R(0, 6, 14, 4, "#6b4a2a"); R(1, 6, 12, 2, "#8a6238");           // 木质枪托
  R(14, 5, 16, 5, "#2b3140"); R(15, 5, 14, 2, "#49536b");         // 机匣
  R(30, 6, 6, 3, "#8c94a3"); R(35, 7, 1, 1, "#f2efe4");           // 长枪管
  R(18, 1, 10, 4, "#1b1f28"); R(19, 2, 8, 2, "#9fc4d6");          // 瞄准镜
  R(17, 3, 2, 2, "#4d5564"); R(27, 3, 2, 2, "#4d5564");
  R(20, 10, 3, 4, "#1b1f28");                                      // 握把
  R(24, 9, 6, 2, "#f2efe4");                                       // 粉笔弹
  return cv;
}
/** 黑板擦霰弹枪「擦除」 */
function buildEraserGun(): HTMLCanvasElement {
  const cv = document.createElement("canvas"); cv.width = 30; cv.height = 15;
  const c = cv.getContext("2d")!; const R = RECT(c);
  R(2, 5, 12, 7, "#3a3a44"); R(3, 6, 10, 4, "#55555f");
  R(14, 4, 12, 8, "#8a6238"); R(15, 5, 10, 3, "#a87f4a");         // 木制擦身
  R(15, 8, 10, 3, "#d8d2b8");                                      // 绒面
  for (let i = 0; i < 4; i++) R(16 + i * 3, 9, 2, 1, "#f2efe4");
  R(26, 6, 4, 4, "#4d5564"); R(29, 7, 1, 2, "#cfd6df");
  R(8, 12, 4, 3, "#1b1f28");
  R(0, 6, 3, 5, "#2b3140");
  return cv;
}
/** 台灯激光炮「晚自习」 */
function buildLampCannon(): HTMLCanvasElement {
  const cv = document.createElement("canvas"); cv.width = 32; cv.height = 18;
  const c = cv.getContext("2d")!; const R = RECT(c);
  R(0, 10, 10, 6, "#2b3140"); R(1, 11, 8, 3, "#49536b");          // 底座
  R(4, 4, 3, 8, "#8c94a3");                                        // 灯杆
  R(8, 1, 14, 9, "#c9b24a"); R(9, 2, 12, 6, "#e8c15a");           // 灯罩
  R(21, 3, 4, 5, "#fff2a8");                                       // 灯泡
  R(25, 4, 6, 3, "#ffd23e"); R(30, 5, 2, 1, "#fff6c8");           // 射束口
  R(10, 12, 8, 3, "#1b1f28"); R(12, 15, 4, 3, "#4d5564");
  return cv;
}
/** 投掷物：粉笔烟雾弹 */
function buildSmokeNade(): HTMLCanvasElement {
  const cv = document.createElement("canvas"); cv.width = 10; cv.height = 14;
  const c = cv.getContext("2d")!; const R = RECT(c);
  R(3, 0, 4, 2, "#8c94a3"); R(4, 1, 2, 2, "#4d5564");
  R(2, 2, 6, 10, "#c9cfbe"); R(3, 3, 4, 8, "#e8ead8");
  R(3, 5, 4, 1, "#8c94a3"); R(3, 8, 4, 1, "#8c94a3");
  R(4, 3, 1, 4, "#ffffff");
  return cv;
}
/** 投掷物：胶水地雷 */
function buildGlueMine(): HTMLCanvasElement {
  const cv = document.createElement("canvas"); cv.width = 12; cv.height = 12;
  const c = cv.getContext("2d")!; const R = RECT(c);
  R(2, 2, 8, 8, "#c8a93a"); R(3, 3, 6, 6, "#e8c95a");
  R(4, 1, 4, 2, "#8a6238"); R(5, 0, 2, 2, "#a87f4a");
  R(4, 5, 4, 2, "#fff2a8");
  R(1, 9, 10, 2, "#8a7a2a");
  return cv;
}
/** 投掷物：鞭炮串 */
function buildFirecracker(): HTMLCanvasElement {
  const cv = document.createElement("canvas"); cv.width = 12; cv.height = 16;
  const c = cv.getContext("2d")!; const R = RECT(c);
  for (let i = 0; i < 4; i++) { R(2 + (i % 2) * 4, 3 + i * 3, 4, 3, "#b5362a"); R(3 + (i % 2) * 4, 4 + i * 3, 2, 1, "#d4544a"); }
  R(5, 0, 1, 4, "#8a6238"); R(4, 0, 3, 1, "#ffd23e");
  return cv;
}
/** 投掷物：臭袜子 */
function buildStinkSock(): HTMLCanvasElement {
  const cv = document.createElement("canvas"); cv.width = 14; cv.height = 12;
  const c = cv.getContext("2d")!; const R = RECT(c);
  R(2, 2, 8, 5, "#7e8a63"); R(3, 3, 6, 3, "#9aa87a");
  R(2, 7, 5, 4, "#6b7555"); R(7, 8, 5, 3, "#7e8a63");
  R(3, 0, 6, 2, "#5d6a44");
  R(10, 1, 2, 2, "#9fae72"); R(12, 3, 1, 1, "#9fae72");
  return cv;
}
/** 投掷物：矿泉水瓶 */
function buildWaterBottle(): HTMLCanvasElement {
  const cv = document.createElement("canvas"); cv.width = 10; cv.height = 16;
  const c = cv.getContext("2d")!; const R = RECT(c);
  R(4, 0, 2, 2, "#49a0c4"); R(3, 2, 4, 2, "#2f6f93");
  R(2, 4, 6, 10, "#9fe0f5"); R(3, 5, 4, 8, "#c9f4ff");
  R(3, 7, 4, 5, "#6fc8e8");
  R(2, 13, 6, 2, "#49a0c4");
  return cv;
}

Object.assign(SPR, {
  gunStapler: spriteFromCanvas(buildStapler()),
  gunChalkRifle: spriteFromCanvas(buildChalkRifle()),
  gunEraser: spriteFromCanvas(buildEraserGun()),
  gunLampCannon: spriteFromCanvas(buildLampCannon()),
  nadeSmoke: spriteFromCanvas(buildSmokeNade()),
  nadeGlue: spriteFromCanvas(buildGlueMine()),
  nadeFirecracker: spriteFromCanvas(buildFirecracker()),
  nadeSock: spriteFromCanvas(buildStinkSock()),
  nadeBottle: spriteFromCanvas(buildWaterBottle()),
});
