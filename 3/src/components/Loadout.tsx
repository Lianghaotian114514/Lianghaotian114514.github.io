import { useState } from "react";
import {
  WEAPON_LABEL, CARRYABLE, MAX_WEAPONS, THROWABLES,
  loadLoadout, saveLoadout, loadMods, MODS, weaponStats,
} from "../game/mods";
import type { ModWeapon, ThrowableId } from "../game/mods";
import { sfx } from "../game/audio";
import PixelSprite from "./PixelSprite";

const WEAPON_ICON: Record<ModWeapon, string> = {
  gas: "gunGas", laser: "gunLaser", melee: "gunCompass", hydro: "gunHydro",
  stapler: "gunStapler", rifle: "gunChalkRifle", eraser: "gunEraser", lamp: "gunLampCannon",
};

const WEAPON_BRIEF: Record<ModWeapon, string> = {
  gas: "短按爆燃 / 长按喷火 · 克制簸箕盾",
  laser: "远距灼烧 · 可引燃与致盲",
  melee: "保底近战 · 永不耗竭",
  hydro: "高压水柱 · 无视盾牌并浇灭火焰",
  stapler: "高射速连发 · 压制人海",
  rifle: "超远射程 · 单发高伤",
  eraser: "近距霰射 · 一片全清",
  lamp: "穿透光束 · 持续输出",
};

export default function LoadoutScreen({
  onConfirm, onBack, onArmory,
}: {
  onConfirm: () => void;
  onBack: () => void;
  onArmory?: () => void;
}) {
  const [lo, setLo] = useState(() => loadLoadout());
  const [mods] = useState(() => loadMods());

  const toggleWeapon = (w: ModWeapon) => {
    const has = lo.weapons.includes(w);
    let next = lo.weapons.slice();
    if (has) {
      if (next.length <= 1) { sfx.deny(); return; }
      next = next.filter((x) => x !== w);
    } else {
      if (next.length >= MAX_WEAPONS) { sfx.deny(); return; }
      next.push(w);
    }
    sfx.click();
    const nl = { ...lo, weapons: next };
    setLo(nl); saveLoadout(nl);
  };

  const pickThrow = (t: ThrowableId) => {
    sfx.click();
    const nl = { ...lo, throwable: t };
    setLo(nl); saveLoadout(nl);
  };

  const modCount = (w: ModWeapon) => MODS.filter((m) => m.weapon === w && mods.has(m.id)).length;
  const thr = THROWABLES.find((t) => t.id === lo.throwable)!;

  return (
    <div className="relative z-10 min-h-screen px-3 py-4 md:px-6">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-3">
        {/* 抬头 */}
        <header className="flex flex-wrap items-center justify-between gap-2 border-2 border-[#2c3242] bg-[#0b0f16]/90 px-3 py-2">
          <div className="flex items-center gap-3">
            <span className="grid h-7 w-7 place-items-center bg-[#8d2a21] text-sm text-[#f0e4c8]">◈</span>
            <span className="text-[11px] tracking-[0.35em] text-[#8fa3c8]">出 征 编 成 · 装备配置</span>
          </div>
          <span className="font-num text-[11px] tracking-[0.2em] text-[#c2a14a]">
            武器 {lo.weapons.length}/{MAX_WEAPONS} · 投掷物 1/1
          </span>
        </header>

        <div className="grid gap-3 lg:grid-cols-[1fr_330px]">
          {/* 左：武器选择 */}
          <section className="border-2 border-[#2c3242] bg-[#0b0f16]/90 p-3">
            <h3 className="mb-2 flex items-center gap-2 text-[11px] tracking-[0.3em] text-[#c2a14a]">
              <span className="h-px flex-1 bg-[#2c3242]" />
              主武器（至多 {MAX_WEAPONS} 件）
              <span className="h-px flex-1 bg-[#2c3242]" />
            </h3>

            <div className="grid gap-2 sm:grid-cols-2">
              {CARRYABLE.map((w) => {
                const on = lo.weapons.includes(w);
                const idx = lo.weapons.indexOf(w);
                const color = WEAPON_LABEL[w].color;
                const full = !on && lo.weapons.length >= MAX_WEAPONS;
                const ws = weaponStats(w, mods);
                return (
                  <button
                    key={w}
                    onClick={() => toggleWeapon(w)}
                    disabled={full}
                    className={`relative flex items-center gap-3 border-2 p-2.5 text-left transition-all ${
                      on ? "-translate-y-[2px]" : full ? "opacity-35" : "opacity-80 hover:opacity-100"
                    }`}
                    style={{
                      borderColor: on ? color : "#2c3242",
                      background: on
                        ? `linear-gradient(100deg, rgba(10,14,20,0.95) 50%, ${color}26 100%)`
                        : "rgba(11,15,22,0.8)",
                      boxShadow: on ? "3px 3px 0 rgba(0,0,0,0.6)" : "none",
                    }}
                  >
                    {on && (
                      <span
                        className="absolute -left-[2px] -top-[2px] grid h-5 w-5 place-items-center text-[11px] font-bold"
                        style={{ background: color, color: "#0a0d12" }}
                      >
                        {idx + 1}
                      </span>
                    )}
                    <span className="ml-2 grid w-10 shrink-0 place-items-center">
                      <PixelSprite name={WEAPON_ICON[w] as "gunGas"} scale={1.5} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm tracking-[0.1em]" style={{ color: on ? color : "#8a93a8" }}>
                        {WEAPON_LABEL[w].name}
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] leading-4 text-[#6d7690]">
                        {WEAPON_BRIEF[w]}
                      </span>
                      <span className="font-num mt-0.5 block text-[10px] text-[#4d5668]">
                        配件 {modCount(w)}/5
                        {["stapler", "rifle", "eraser", "lamp"].includes(w) && ` · 弹药 ${ws.ammoMax}`}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-2 border-l-4 border-[#4d5668] bg-[#10141c] px-2 py-1.5 text-[10px] leading-4 text-[#6d7690]">
              三角圆规作为保底近战武器永久随身，不占用编成位。
            </p>
          </section>

          {/* 右：投掷物 + 出击 */}
          <aside className="flex flex-col gap-3">
            <section className="border-2 border-[#2c3242] bg-[#0b0f16]/90 p-3">
              <h3 className="mb-2 text-[11px] tracking-[0.3em] text-[#c2a14a]">投掷物（选 1 种）</h3>
              <div className="space-y-1.5">
                {THROWABLES.map((t) => {
                  const on = lo.throwable === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => pickThrow(t.id)}
                      className={`flex w-full items-center gap-2.5 border-2 p-2 text-left transition-all ${on ? "-translate-y-[2px]" : "opacity-70 hover:opacity-100"}`}
                      style={{
                        borderColor: on ? t.color : "#2c3242",
                        background: on ? `linear-gradient(100deg,rgba(10,14,20,.95) 55%,${t.color}26 100%)` : "rgba(11,15,22,.8)",
                      }}
                    >
                      <PixelSprite name={t.spr as "nadeSmoke"} scale={1.7} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] tracking-[0.08em]" style={{ color: on ? t.color : "#8a93a8" }}>
                          {t.name}
                        </span>
                        <span className="block truncate text-[10px] text-[#6d7690]">{t.effect}</span>
                      </span>
                      <span className="font-num shrink-0 text-[11px]" style={{ color: on ? t.color : "#4d5668" }}>
                        ×{t.count}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[10px] leading-4 text-[#6d7690]">
                {thr.desc} 战斗中按 <b className="text-[#c2a14a]">G</b> 投掷，冷却 {thr.cooldown}s。
              </p>
            </section>

            <div className="flex flex-col gap-2">
              {onArmory && (
                <button className="px-btn px-btn-amber py-2.5 text-base tracking-[0.3em]" onClick={onArmory}>
                  ⚒ 前往军械库改装
                </button>
              )}
              <button
                className="group relative overflow-hidden border-[3px] border-[#05070a] py-3.5 transition-transform hover:-translate-y-1"
                style={{
                  background: "linear-gradient(180deg,#b53a2e 0%,#8d2a21 100%)",
                  boxShadow: "0 5px 0 #05070a, inset 0 2px 0 rgba(255,255,255,.18)",
                }}
                onClick={() => { sfx.click(); onConfirm(); }}
              >
                <span className="relative text-xl tracking-[0.4em] text-[#f7ecd0]">▶ 确 认 出 击</span>
              </button>
              <button className="px-btn px-btn-dark py-2 text-sm tracking-[0.3em]" onClick={onBack}>
                ← 返回
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
