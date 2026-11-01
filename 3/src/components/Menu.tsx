import { useState } from "react";
import { pixelText } from "../game/sprites";
import { OPERATORS } from "../game/engine";
import type { OperatorMeta, EndStats } from "../game/engine";
import PixelSprite from "./PixelSprite";

// ---------- 干员选择 ----------
export function SelectScreen({
  onPick,
  onBack,
}: {
  onPick: (m: OperatorMeta) => void;
  onBack: () => void;
}) {
  const [hover, setHover] = useState<string | null>(null);
  return (
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <h2 className="anim-rise text-4xl tracking-[0.3em] text-[#e8e4d4] md:text-5xl"
        style={{ textShadow: "4px 4px 0 #0d0f16" }}>
        选择出击干员
      </h2>
      <p className="anim-rise mt-3 text-sm tracking-[0.3em] text-[#8fa3c8]">
        昆虫组三杰 · 只此一役
      </p>

      <div className="mt-9 grid w-full max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">
        {OPERATORS.map((m, i) => (
          <button
            key={m.id}
            className="px-box group relative flex flex-col items-center bg-[#171b26] p-6 text-left transition-transform hover:-translate-y-2"
            style={{ animationDelay: `${i * 0.08}s` }}
            onMouseEnter={() => setHover(m.id)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onPick(m)}
          >
            <div
              className="absolute left-0 top-0 h-full w-1.5"
              style={{ background: m.color }}
            />
            <div className="flex h-32 items-end justify-center">
              <PixelSprite name={m.sprA} alt={m.sprB} scale={5} animate={hover === m.id} />
            </div>
            <div className="mt-2 w-full border-t-2 border-dashed border-[#2c3242] pt-3 text-center">
              <div className="text-3xl tracking-widest" style={{ color: m.color }}>
                {m.name}
              </div>
              <div className="mt-1 text-xs tracking-[0.3em] text-[#8fa3c8]">{m.title}</div>
              <p className="mt-3 min-h-[3.2rem] text-[13px] leading-6 text-[#b9c0d4]">{m.desc}</p>
              <div className="mt-2 space-y-1">
                {m.traits.map((t) => (
                  <div key={t} className="bg-[#222839] px-2 py-1 text-xs text-[#d7dce9]">
                    {t}
                  </div>
                ))}
              </div>
              <div className="mt-3 border-2 border-dashed px-3 py-2 text-[13px] leading-6"
                style={{ borderColor: m.color, color: m.color }}>
                <div className="text-sm">技能 · {m.ability}</div>
                <div className="mt-1 text-[12px] leading-5 text-[#b9c0d4]">{m.abilityDesc}</div>
              </div>
              <div className="px-btn px-btn-amber mt-4 w-full py-2 text-lg tracking-[0.4em] group-hover:brightness-110">
                出 击
              </div>
            </div>
          </button>
        ))}
      </div>

      <button className="px-btn px-btn-dark mt-8 px-6 py-2 text-base tracking-[0.3em]" onClick={onBack}>
        ← 返回
      </button>
    </div>
  );
}

// ---------- 作战手册 ----------
export function HelpModal({ onClose }: { onClose: () => void }) {
  const weapons = [
    { icon: "gunGas" as const, name: "GAS 喷枪", hot: "①", desc: "短按爆燃、长按持续喷火。火焰克制簸箕盾（直接融化）。改装后可三管齐喷。", color: "#ff9426" },
    { icon: "gunLaser" as const, name: "高能激光笔", hot: "②", desc: "远距照射可引燃，瞄准眼睛可致盲。会被簸箕盾完全格挡，需先破盾。", color: "#ff5140" },
    { icon: "gunHydro" as const, name: "高压水枪「龙王」", hot: "③", desc: "无视簸箕盾直接冲翻，并能浇灭敌人身上的火。改装后可扇喷、泼泡沫、冻结。", color: "#49a0c4" },
    { icon: "gunStapler" as const, name: "钉书机机枪「订正者」", hot: "④", desc: "高射速连发压制人海，弹体为翻滚的订书钉，每发抛壳。改装后可穿盾、跳弹。", color: "#d4788a" },
    { icon: "gunChalkRifle" as const, name: "粉笔狙击枪「板书」", hot: "⑤", desc: "超远射程单发高伤。按住右键开 8 倍镜：散布几乎归零、伤害 +45%，但移速大降。", color: "#b9c4d6" },
    { icon: "gunEraser" as const, name: "黑板擦霰弹枪「擦除」", hot: "⑥", desc: "一次打出 9 片翻滚的粉笔头，近距离成片清场。装独头弹后改为整块黑板擦重击。", color: "#c9a56a" },
    { icon: "gunLampCannon" as const, name: "台灯激光炮「晚自习」", hot: "⑦", desc: "发射穿透性光弹，可贯穿整排敌人。改装后能蓄力齐射、光束反弹。", color: "#e8c15a" },
    { icon: "gunCompass" as const, name: "三角圆规（保底）", hot: "近战", desc: "永不耗竭的保底近战，不占编成位。改装后可横扫多人、附带触电麻痹。", color: "#ece7d8" },
    { icon: "bomb" as const, name: "臭水弹（超级武器）", hot: "特殊", desc: "电报订购 300 班费。发射成功 → 直接胜利；50% 概率原地自爆 → 直接失败。", color: "#7fae3f" },
  ];
  const enemies = [
    { icon: "soldA" as const, name: "扫把枪队", desc: "人海般的手持拖把士兵，数量压制；其中有粉笔投手远程骚扰，注意走位闪避白色弹丸。击杀 +8 班费。" },
    { icon: "shield" as const, name: "簸箕盾队", desc: "大簸箕盾牌可完全格挡激光笔；但遇喷枪火焰会迅速融化。击杀 +14 班费。" },
    { icon: "bucket" as const, name: "化学拖把战车", desc: "数月未洗的恶臭双拖把战车，一人推车一人挥击，还会抛射臭气罐。击杀 +35 班费。" },
    { icon: "bossA" as const, name: "治安队长（BOSS）", desc: "开战约 95 秒后亲自督战：540 血 + 90 点簸箕盾，手持对讲机不断免费叫增援。被击退后约 70 秒会卷土重来。击杀 +120 班费。" },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="px-box anim-pop max-h-[88vh] w-full max-w-3xl overflow-y-auto bg-[#171b26] p-6">
        <div className="flex items-center justify-between border-b-4 border-[#2c3242] pb-3">
          <h3 className="text-3xl tracking-[0.3em] text-[#f2b53d]">作 战 手 册</h3>
          <button className="px-btn px-btn-red px-4 py-1 text-lg" onClick={onClose}>关闭</button>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <h4 className="mb-2 text-xl text-[#8fa3c8]">▍武装大队军火库</h4>
            {weapons.map((w) => (
              <div key={w.name} className="mb-2 flex gap-3 bg-[#1e2432] p-3">
                <div className="flex w-16 shrink-0 items-center justify-center">
                  <PixelSprite name={w.icon} scale={3} />
                </div>
                <div>
                  <div className="text-base" style={{ color: w.color }}>
                    [{w.hot}] {w.name}
                  </div>
                  <div className="mt-0.5 text-[12px] leading-5 text-[#b9c0d4]">{w.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div>
            <h4 className="mb-2 text-xl text-[#8fa3c8]">▍七班治安队编制</h4>
            {enemies.map((w) => (
              <div key={w.name} className="mb-2 flex gap-3 bg-[#1e2432] p-3">
                <div className="flex w-16 shrink-0 items-center justify-center">
                  <PixelSprite name={w.icon} scale={2.4} />
                </div>
                <div>
                  <div className="text-base text-[#7fb08f]">{w.name}</div>
                  <div className="mt-0.5 text-[12px] leading-5 text-[#b9c0d4]">{w.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="bg-[#1e2432] p-3 text-[13px] leading-6 text-[#b9c0d4]">
            <span className="text-[#f2b53d]">▍弹匣制 & 后勤</span><br />
            按 <b className="text-white">E</b> 打开电报机订购<b>弹匣</b>：弹匣不会直接灌进武器，而是存入
            <b>武装带</b>（每款武器至多 <b className="text-white">3</b> 个，可叠加囤积）。
            打空后会<b className="text-white">自动换弹</b>，也可按 <b className="text-white">R</b> 手动换；
            换弹途中无法开火，切枪会中断并退还弹匣。<br />
            <span className="text-[#ff8f7a]">击杀敌人不再掉落弹药</span>，补给完全依赖电报订购——而敌方增援是对讲机秒送达。
          </div>
          <div className="bg-[#1e2432] p-3 text-[13px] leading-6 text-[#b9c0d4]">
            <span className="text-[#57d6e6]">▍操作一览</span><br />
            WASD/方向键 移动 · 鼠标瞄准 · 左键射击<br />
            <b className="text-white">1-5</b> 切换武器（按出战编成动态排列）· <b className="text-white">右键</b> 狙击开镜<br />
            <b className="text-white">R</b> 换弹 · <b className="text-white">G</b> 投掷 · <b className="text-white">Q</b> 干员技能 · <b className="text-white">E</b> 电报机 · <b className="text-white">Esc</b> 暂停<br />
            <span className="text-[#8fa3c8]">手机：自动识别横/竖屏。横屏为满屏沉浸（操作台悬浮），竖屏操作台置于画面下方；
            左摇杆移动、右摇杆瞄准并开火，另有换弹/投掷/技能键。</span>
          </div>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="border-2 border-dashed border-[#8fd6a0] bg-[#16231b] p-3 text-[13px] leading-6 text-[#b9c0d4]">
            <span className="text-[#8fd6a0]">▍出战编成</span><br />
            选完干员后进入编成界面：从 7 把主武器中<b className="text-white">至多携带 3 把</b>，
            并选择 <b className="text-white">1 种投掷物</b>（粉笔烟雾弹／胶水地雷／鞭炮串／臭袜子／矿泉水瓶）。
            三角圆规作为保底近战永久随身，不占编成位。
          </div>
          <div className="border-2 border-dashed border-[#c2a14a] bg-[#231f16] p-3 text-[13px] leading-6 text-[#b9c0d4]">
            <span className="text-[#c2a14a]">▍军械库改装</span><br />
            每场战役结束后，剩余班费与战功奖金会存入军械库。
            8 把武器<b className="text-white">各有 5 件改装配件</b>（共 40 件），部分配件有前置依赖，
            鼠标悬停即可预览改装前后的数值对比。
          </div>
        </div>

        <div className="mt-3 border-2 border-dashed border-[#c2a14a] bg-[#1b2030] p-3 text-[13px] leading-6 text-[#b9c0d4]">
          <span className="text-[#c2a14a]">▍战役编成（共两场）</span><br />
          <b className="text-[#e8e4d4]">第一战役 · 门线保卫战</b>：守住八五班大门，坚持到放学铃响（或用臭水弹豪赌一把）。<br />
          <b className="text-[#e8e4d4]">第二战役 · 放学后撤离</b>：
          ① <b>夺车</b>——清除车棚守卫，占领边三轮摩托；
          ② <b>突围</b>——换道躲避路障、压制追兵，开到公共厕所；
          ③ <b>固守</b>——冲进隔间，先按行动键<b>闩死门闩</b>，再按提示敲击电键发出摩斯电文
          <span className="font-num text-[#c2a14a]"> ··· ——— ···</span>，撑到总队驰援。<br />
          <b className="text-[#d4544a]">终章 · 复仇</b>（通关第一战役解锁）：
          ① <b>潜入</b>——按住 Shift 潜行，避开探照灯与巡逻视野锥，摸到配电箱按 F 拉闸；
          ② <b>黑暗走廊</b>——手电只照亮一圈，地面湿滑有惯性，躲开水洼与追兵；
          ③ <b>人海教学楼</b>——从人缝中挤出去，撞人会被卡住并消耗体力；
          ④ <b>夺车</b>——清掉护卫抢下厕所所长的三轮战车；
          ⑤ <b>临空轰炸</b>——驾 B85 投下李鑫隆研发的臭水空爆弹：飞机自动巡航，<b>用鼠标自由移动瞄准镜选定落点</b>，准星变绿即已锁定目标，点击投弹。8 发弹药覆盖 7 处目标。
        </div>
      </div>
    </div>
  );
}

// ---------- 结算 ----------
export function ResultScreen({
  stats,
  operator,
  onRestart,
  onMenu,
}: {
  stats: EndStats;
  operator: string;
  onRestart: () => void;
  onMenu: () => void;
}) {
  const reasonText: Record<EndStats["reason"], { t: string; s: string }> = {
    survive: { t: "放学铃响 · 大门守住了！", s: "治安队没能踏入八五班半步，隐翅虫「小赤」安全归笼。" },
    bomb: { t: "臭水弹 · 一发定乾坤！", s: "七班方向臭气熏天三日不散，治安队集体申请休战。" },
    down: { t: "干员倒在了家门口……", s: "没有火力掩护的大门终究是脆弱的。重整旗鼓再来！" },
    door: { t: "大门被拖把人海攻破……", s: "七班涌入教室，缴获全部隐翅虫观察笔记。奇耻大辱。" },
    boom: { t: "臭水弹原地自爆……", s: "50% 的命运齿轮碾了过来。整个楼道都是味儿，包括你自己。" },
  };
  const score = stats.kills * 10 + Math.round(stats.dmg / 40) + Math.round(stats.time / 10);
  const grade = !stats.win ? (score > 400 ? "B" : "C") : score > 750 ? "S" : score > 520 ? "A" : "B";
  const r = reasonText[stats.reason];
  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
      <div className="px-paper anim-pop w-full max-w-xl p-6 text-[#14171f]">
        <div className="flex items-center justify-between border-b-4 border-[#14171f] pb-3">
          <span className="text-lg tracking-[0.3em]">战 后 通 报</span>
          <span
            className="grid h-14 w-14 place-items-center border-4 text-3xl"
            style={{
              borderColor: stats.win ? "#3f8f6b" : "#d53a26",
              color: stats.win ? "#3f8f6b" : "#d53a26",
              transform: "rotate(8deg)",
            }}
          >
            {grade}
          </span>
        </div>
        <h3 className="mt-4 text-3xl leading-snug" style={{ color: stats.win ? "#2c6e4b" : "#b33224" }}>
          {stats.win ? "胜 利" : "战 败"} · {r.t}
        </h3>
        <p className="mt-2 text-[15px] leading-7 text-[#4a4636]">{r.s}</p>
        <div className="mt-5 grid grid-cols-2 gap-2 text-center md:grid-cols-4">
          {[
            { k: "出击干员", v: operator },
            { k: "击杀敌人", v: `${stats.kills}` },
            { k: "累计伤害", v: `${stats.dmg}` },
            { k: "坚持时间", v: `${Math.floor(stats.time / 60)}:${String(Math.floor(stats.time % 60)).padStart(2, "0")}` },
          ].map((it) => (
            <div key={it.k} className="border-2 border-[#14171f] bg-[#fffaf0] p-2">
              <div className="text-xs text-[#7a7461]">{it.k}</div>
              <div className="mt-1 text-lg">{it.v}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button className="px-btn px-btn-red px-8 py-3 text-xl tracking-[0.3em]" onClick={onRestart}>
            ↻ 再战一局
          </button>
          <button className="px-btn px-btn-dark px-8 py-3 text-xl tracking-[0.3em]" onClick={onMenu}>
            回到菜单
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- 顶部悬浮标题字（像素化预渲染测试用） ----------
export function usePixelTitle(text: string) {
  return pixelText(text, { size: 20, color: "#f2b53d", scale: 3 });
}

// ============================================================
// 战役总结算（两场战役合并战报）
// ============================================================
export function FinalReport({
  operator,
  m1,
  m2,
  onRetryM2,
  onMenu,
}: {
  operator: string;
  m1: EndStats | null;
  m2: { win: boolean; reason: string; kills: number; time: number };
  onRetryM2: () => void;
  onMenu: () => void;
}) {
  const totalKills = (m1?.kills ?? 0) + m2.kills;
  const score = totalKills * 10 + Math.round((m1?.dmg ?? 0) / 40) + (m2.win ? 300 : 0);
  const grade = !m2.win ? (score > 500 ? "B" : "C") : score > 900 ? "S" : score > 680 ? "A" : "B";
  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
      <div className="px-paper anim-pop w-full max-w-2xl p-6 text-[#14171f]">
        <div className="flex items-center justify-between border-b-4 border-[#14171f] pb-3">
          <div>
            <div className="text-lg tracking-[0.3em]">战 役 总 结</div>
            <div className="mt-0.5 text-[11px] tracking-[0.2em] text-[#7a7461]">2026.10 · 八五班保卫战役 全记录</div>
          </div>
          <span
            className="grid h-16 w-16 place-items-center border-4 text-4xl"
            style={{
              borderColor: m2.win ? "#2c6e4b" : "#b33224",
              color: m2.win ? "#2c6e4b" : "#b33224",
              transform: "rotate(8deg)",
            }}
          >
            {grade}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          <div className="border-2 border-[#14171f] bg-[#fffaf0] p-3">
            <div className="flex items-center justify-between">
              <span className="text-base">第一战役 · 门线保卫战</span>
              <span className="text-sm" style={{ color: m1?.win ? "#2c6e4b" : "#b33224" }}>
                {m1?.win ? "达成" : "未达成"}
              </span>
            </div>
            <div className="mt-1 text-[12px] leading-5 text-[#5c5747]">
              守门至放学铃响 · 击杀 {m1?.kills ?? 0} · 累计伤害 {m1?.dmg ?? 0}
            </div>
          </div>
          <div className="border-2 border-[#14171f] bg-[#fffaf0] p-3">
            <div className="flex items-center justify-between">
              <span className="text-base">第二战役 · 放学后撤离</span>
              <span className="text-sm" style={{ color: m2.win ? "#2c6e4b" : "#b33224" }}>
                {m2.win ? "达成" : "失败"}
              </span>
            </div>
            <div className="mt-1 text-[12px] leading-5 text-[#5c5747]">
              {m2.reason} · 击杀 {m2.kills} · 耗时 {Math.floor(m2.time / 60)}:{String(Math.floor(m2.time % 60)).padStart(2, "0")}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            { k: "出击干员", v: operator },
            { k: "总歼敌", v: `${totalKills}` },
            { k: "战役评分", v: `${score}` },
          ].map((it) => (
            <div key={it.k} className="border-2 border-[#14171f] bg-[#fffaf0] p-2">
              <div className="text-xs text-[#7a7461]">{it.k}</div>
              <div className="mt-1 text-lg">{it.v}</div>
            </div>
          ))}
        </div>

        <p className="mt-4 border-l-4 border-[#b33224] bg-[#f0e6cc] p-3 text-[13px] leading-6">
          {m2.win
            ? "总队回电：「坚守十分钟，我部即到。」—— 那天傍晚，昆虫组的车灯照亮了整条回家的路。隐翅虫「小赤」被重新装进标本盒，而八五班的门，一次也没有倒下。"
            : "撤离失败。摩托被扣，电报未能发出。但所有人都知道：只要铃声还会响，八五班的门就还会被守住。"}
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {!m2.win && (
            <button className="px-btn px-btn-red px-7 py-3 text-lg tracking-[0.3em]" onClick={onRetryM2}>
              ↻ 重打第二战役
            </button>
          )}
          <button className="px-btn px-btn-dark px-7 py-3 text-lg tracking-[0.3em]" onClick={onMenu}>
            回到菜单
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 复仇战役 · 战报
// ============================================================
export function RevengeReport({
  operator,
  stats,
  onRetry,
  onMenu,
}: {
  operator: string;
  stats: { win: boolean; reason: string; kills: number; time: number; targets: number };
  onRetry: () => void;
  onMenu: () => void;
}) {
  const grade = !stats.win ? "C" : stats.targets >= 7 ? "S" : stats.targets >= 5 ? "A" : "B";
  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
      <div className="px-paper anim-pop w-full max-w-xl p-6 text-[#14171f]">
        <div className="flex items-center justify-between border-b-4 border-[#14171f] pb-3">
          <div>
            <div className="text-lg tracking-[0.3em]">复 仇 战 报</div>
            <div className="mt-0.5 text-[11px] tracking-[0.2em] text-[#7a7461]">2026.10 下旬 · 代号「隐翅」</div>
          </div>
          <span
            className="grid h-16 w-16 place-items-center border-4 text-4xl"
            style={{
              borderColor: stats.win ? "#2c6e4b" : "#b33224",
              color: stats.win ? "#2c6e4b" : "#b33224",
              transform: "rotate(8deg)",
            }}
          >
            {grade}
          </span>
        </div>

        <h3 className="mt-4 text-2xl leading-snug" style={{ color: stats.win ? "#2c6e4b" : "#b33224" }}>
          {stats.win ? "复仇完成" : "行动失败"}
        </h3>
        <p className="mt-2 text-[14px] leading-7 text-[#4a4636]">{stats.reason}</p>

        <div className="mt-5 grid grid-cols-2 gap-2 text-center md:grid-cols-4">
          {[
            { k: "出击干员", v: operator },
            { k: "摧毁目标", v: `${stats.targets}/7` },
            { k: "战果计数", v: `${stats.kills}` },
            { k: "行动耗时", v: `${Math.floor(stats.time / 60)}:${String(Math.floor(stats.time % 60)).padStart(2, "0")}` },
          ].map((it) => (
            <div key={it.k} className="border-2 border-[#14171f] bg-[#fffaf0] p-2">
              <div className="text-xs text-[#7a7461]">{it.k}</div>
              <div className="mt-1 text-lg">{it.v}</div>
            </div>
          ))}
        </div>

        <p className="mt-4 border-l-4 border-[#8d2a21] bg-[#f0e6cc] p-3 text-[13px] leading-6">
          {stats.win
            ? "那天夜里，整个校区都是臭水的味道。樊某某站在操场中央，身后是望不到头的队列。他只说了一句：「现在，谁还想谈判？」"
            : "侦察支队没能把钥匙送到。百万雄兵仍在集结地待命——复仇，还要再等一个夜晚。"}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {!stats.win && (
            <button className="px-btn px-btn-red px-7 py-3 text-lg tracking-[0.3em]" onClick={onRetry}>
              ↻ 再次行动
            </button>
          )}
          <button className="px-btn px-btn-dark px-7 py-3 text-lg tracking-[0.3em]" onClick={onMenu}>
            回到菜单
          </button>
        </div>
      </div>
    </div>
  );
}
