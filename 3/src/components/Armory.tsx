import { useMemo, useState } from "react";
import {
  MODS, MOD_BY_ID, WEAPON_LABEL, computeStats, canInstall,
  loadMods, saveMods, loadBank, saveBank, isInfiniteFunds,
  weaponStats,
} from "../game/mods";
import type { ModDef, ModWeapon, ModSet } from "../game/mods";
import { sfx } from "../game/audio";
import PixelSprite from "./PixelSprite";

const WEAPON_ICON: Record<ModWeapon, string> = {
  gas: "gunGas", laser: "gunLaser", melee: "gunCompass", hydro: "gunHydro",
  stapler: "gunStapler", rifle: "gunChalkRifle", eraser: "gunEraser", lamp: "gunLampCannon",
};

/** 一条数值对比 */
function StatRow({ label, before, after, unit = "" }: { label: string; before: number; after: number; unit?: string }) {
  const changed = Math.abs(after - before) > 0.001;
  return (
    <div className="flex items-center justify-between py-0.5 text-[11px]">
      <span className="text-[#7a7461]">{label}</span>
      <span className="font-num flex items-center gap-1.5">
        <span className={changed ? "text-[#9a9079] line-through" : "text-[#4a4636]"}>
          {before}{unit}
        </span>
        {changed && (
          <>
            <span className="text-[#7a7461]">→</span>
            <span className={after > before ? "text-[#2c6e4b]" : "text-[#b33224]"}>{after}{unit}</span>
          </>
        )}
      </span>
    </div>
  );
}

export default function Armory({ onClose }: { onClose: () => void }) {
  const [mods, setMods] = useState<ModSet>(() => loadMods());
  const [bank, setBank] = useState<number>(() => loadBank());
  const infinite = isInfiniteFunds();
  const [tab, setTab] = useState<ModWeapon>("gas");
  const [hover, setHover] = useState<ModDef | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const stats = useMemo(() => computeStats(mods), [mods]);
  const preview = useMemo(() => {
    if (!hover || mods.has(hover.id)) return stats;
    const next = new Set(mods);
    next.add(hover.id);
    return computeStats(next);
  }, [hover, mods, stats]);

  const install = (def: ModDef) => {
    const gate = canInstall(mods, def);
    if (!gate.ok) { sfx.deny(); setFlash(gate.reason ?? "无法装配"); setTimeout(() => setFlash(null), 1600); return; }
    if (!infinite && bank < def.price) { sfx.deny(); setFlash("班费不足"); setTimeout(() => setFlash(null), 1600); return; }
    const next = new Set(mods);
    next.add(def.id);
    const rest = infinite ? bank : bank - def.price;
    setMods(next); saveMods(next);
    setBank(rest); saveBank(rest);
    sfx.relay();
    setFlash(`已装配：${def.name}`);
    setTimeout(() => setFlash(null), 1900);
  };

  const resetAll = () => {
    // 拆解返还 70% 班费
    const refund = [...mods].reduce((s, id) => s + Math.round((MOD_BY_ID.get(id)?.price ?? 0) * 0.7), 0);
    const next: ModSet = new Set();
    setMods(next); saveMods(next);
    const rest = bank + refund;
    setBank(rest); saveBank(rest);
    sfx.click();
    setFlash(`已全部拆解，返还 ${refund} 班费`);
    setTimeout(() => setFlash(null), 2200);
  };

  const list = MODS.filter((m) => m.weapon === tab);
  const wl = WEAPON_LABEL[tab];

  return (
    <div className="fixed inset-0 z-[92] flex items-center justify-center bg-black/85 p-3">
      <div className="px-box-dark flex max-h-[92vh] w-full max-w-5xl flex-col p-4">
        {/* 抬头 */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#39414f] pb-3">
          <div>
            <h3 className="text-2xl tracking-[0.35em] text-[#c2a14a]">军 械 库 · 武 器 改 装</h3>
            <p className="mt-1 text-[11px] tracking-[0.2em] text-[#6d7690]">
              用历次战役攒下的班费加装配件 · 改装永久生效
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-box-dark flex items-center gap-2 px-3 py-2">
              <span className="h-3 w-3 bg-[#c2a14a]" style={{ clipPath: "polygon(50% 0,100% 50%,50% 100%,0 50%)" }} />
              <span className="text-[11px] tracking-widest text-[#8fa3c8]">军械库班费</span>
              <span className="font-num text-2xl leading-none text-[#c2a14a]">{infinite ? "∞" : bank}</span>
            </div>
            <button className="px-btn px-btn-red px-4 py-2 text-base tracking-[0.2em]" onClick={onClose}>关闭</button>
          </div>
        </div>

        {/* 武器页签 */}
        <div className="mt-3 grid grid-cols-4 gap-1.5 md:grid-cols-8">
          {(Object.keys(WEAPON_LABEL) as ModWeapon[]).map((w) => {
            const n = MODS.filter((m) => m.weapon === w && mods.has(m.id)).length;
            const total = MODS.filter((m) => m.weapon === w).length;
            const active = tab === w;
            return (
              <button
                key={w}
                onClick={() => { setTab(w); sfx.click(); }}
                className={`px-box-dark flex items-center gap-1.5 px-1.5 py-1.5 transition-transform ${active ? "-translate-y-1" : "opacity-60"}`}
                style={active ? { borderColor: WEAPON_LABEL[w].color } : undefined}
              >
                <PixelSprite name={WEAPON_ICON[w] as "gunGas"} scale={1.2} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] leading-tight tracking-[0.05em]" style={{ color: WEAPON_LABEL[w].color }}>
                    {WEAPON_LABEL[w].name}
                  </span>
                  <span className="font-num block text-[10px] text-[#8fa3c8]">{n}/{total}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 grid min-h-0 flex-1 gap-3 overflow-hidden md:grid-cols-[1.35fr_1fr]">
          {/* 配件列表 */}
          <div className="min-h-0 space-y-2 overflow-y-auto pr-1">
            {list.map((def) => {
              const owned = mods.has(def.id);
              const gate = canInstall(mods, def);
              const afford = bank >= def.price;
              const locked = !owned && !gate.ok;
              return (
                <div
                  key={def.id}
                  onMouseEnter={() => setHover(def)}
                  onMouseLeave={() => setHover(null)}
                  className={`px-box-dark flex items-start gap-3 p-3 transition-colors ${owned ? "bg-[#17231b]" : locked ? "opacity-60" : "bg-[#141822]"}`}
                  style={owned ? { borderColor: "#4a6b50" } : undefined}
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center bg-[#0e1218] text-2xl">{def.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base tracking-[0.1em]" style={{ color: wl.color }}>{def.name}</span>
                      {owned && <span className="bg-[#2c6e4b] px-1.5 py-0.5 text-[10px] tracking-wider text-[#e6ecd8]">已装配</span>}
                      {!owned && def.requires && (
                        <span className="bg-[#2c3242] px-1.5 py-0.5 text-[10px] tracking-wider text-[#8fa3c8]">
                          前置：{MOD_BY_ID.get(def.requires)!.name}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[12px] leading-5 text-[#9aa3b8]">{def.desc}</p>
                    <p className="mt-1 font-num text-[11px] tracking-wide text-[#8fd6a0]">{def.effect}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className={`font-num text-lg ${afford || owned ? "text-[#c2a14a]" : "text-[#8d5a52]"}`}>
                      {def.price}
                    </span>
                    <button
                      disabled={owned || locked || !afford}
                      onClick={() => install(def)}
                      className="px-btn px-btn-teal px-3 py-1 text-xs tracking-[0.15em]"
                    >
                      {owned ? "已装" : locked ? "锁定" : afford ? "装配" : "缺费"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 右侧：性能面板 */}
          <div className="min-h-0 overflow-y-auto">
            <div className="px-paper p-3 text-[#14171f]">
              <div className="flex items-center justify-between border-b-2 border-[#14171f] pb-2">
                <span className="text-sm tracking-[0.25em]">性 能 报 告</span>
                <PixelSprite name={WEAPON_ICON[tab] as "gunGas"} scale={1.3} />
              </div>
              <p className="mt-1.5 text-[10px] tracking-wide text-[#7a7461]">
                {hover && !mods.has(hover.id) ? `预览：装配「${hover.name}」后` : "当前配置"}
              </p>

              <div className="mt-2">
                {tab === "gas" && (
                  <>
                    <StatRow label="火焰射程" before={Math.round(250 * stats.flameRange)} after={Math.round(250 * preview.flameRange)} />
                    <StatRow label="火舌宽度" before={Math.round(100 * stats.flameWidth)} after={Math.round(100 * preview.flameWidth)} unit="%" />
                    <StatRow label="火焰伤害" before={Math.round(100 * stats.flameDmg)} after={Math.round(100 * preview.flameDmg)} unit="%" />
                    <StatRow label="爆燃发数" before={stats.burstCount} after={preview.burstCount} unit=" 发" />
                    <StatRow label="燃气上限" before={stats.fuelMax} after={preview.fuelMax} />
                    <StatRow label="耗气速率" before={Math.round(100 * stats.gasDrain)} after={Math.round(100 * preview.gasDrain)} unit="%" />
                    <StatRow label="爆燃冷却" before={Math.round(100 * stats.burstCd)} after={Math.round(100 * preview.burstCd)} unit="%" />
                    <StatRow label="击杀回气" before={Math.round(100 * stats.killRefund)} after={Math.round(100 * preview.killRefund)} unit="%" />
                    <StatRow label="移动速度" before={Math.round(100 * stats.moveMul)} after={Math.round(100 * preview.moveMul)} unit="%" />
                  </>
                )}
                {tab === "laser" && (
                  <>
                    <StatRow label="激光伤害" before={Math.round(100 * stats.laserDmg)} after={Math.round(100 * preview.laserDmg)} unit="%" />
                    <StatRow label="电量上限" before={stats.batMax} after={preview.batMax} />
                    <StatRow label="耗电速率" before={Math.round(100 * stats.batDrain)} after={Math.round(100 * preview.batDrain)} unit="%" />
                    <StatRow label="点燃/致盲" before={Math.round(100 * stats.laserFocus)} after={Math.round(100 * preview.laserFocus)} unit="%" />
                    <StatRow label="同时命中" before={stats.laserTargets} after={preview.laserTargets} unit=" 人" />
                    <StatRow label="空电恢复" before={Math.round(100 * stats.batRegen)} after={Math.round(100 * preview.batRegen)} unit="%" />
                    <div className="flex items-center justify-between py-0.5 text-[11px]">
                      <span className="text-[#7a7461]">导轨挂载</span>
                      <span className="font-num" style={{ color: preview.railMounted ? "#2c6e4b" : "#9a9079" }}>
                        {preview.railMounted ? "已挂载 · 喷火附带灼烧" : "未挂载"}
                      </span>
                    </div>
                  </>
                )}
                {["stapler", "rifle", "eraser", "lamp"].includes(tab) && (() => {
                  const a = weaponStats(tab, mods);
                  const b = weaponStats(tab, hover && !mods.has(hover.id) ? new Set([...mods, hover.id]) : mods);
                  return (
                    <>
                      <StatRow label="单发伤害" before={Math.round(a.dmg)} after={Math.round(b.dmg)} />
                      <StatRow label="射速" before={Math.round(100 / a.rate) / 10} after={Math.round(100 / b.rate) / 10} unit=" 发/秒" />
                      <StatRow label="射程" before={Math.round(a.range)} after={Math.round(b.range)} />
                      <StatRow label="弹药量" before={a.ammoMax} after={b.ammoMax} />
                      <StatRow label="散布" before={Math.round(a.spread * 100)} after={Math.round(b.spread * 100)} unit="%" />
                      <div className="mt-1 flex flex-wrap gap-1">
                        {b.special.map((sp) => (
                          <span key={sp} className="bg-[#2c6e4b] px-1.5 py-px text-[9px] tracking-wider text-[#e6ecd8]">
                            {({ pierce: "穿盾", ricochet: "跳弹", penetrate: "贯穿", dust: "粉尘",
                               bipod: "架枪加伤", blind: "致盲", slug: "独头弹", double: "双管",
                               charge: "蓄力齐射", bounce: "光束反弹" } as Record<string, string>)[sp] ?? sp}
                          </span>
                        ))}
                      </div>
                    </>
                  );
                })()}
                {tab === "hydro" && (
                  <>
                    <StatRow label="水柱伤害" before={Math.round(100 * stats.hydroDmg)} after={Math.round(100 * preview.hydroDmg)} unit="%" />
                    <StatRow label="击退强度" before={Math.round(100 * stats.hydroKnock)} after={Math.round(100 * preview.hydroKnock)} unit="%" />
                    <StatRow label="水量上限" before={stats.waterMax} after={preview.waterMax} />
                    <StatRow label="自动回水" before={stats.waterRegen || 3} after={preview.waterRegen || 3} unit="/s" />
                    {([
                      ["扇形覆盖", stats.hydroCone, preview.hydroCone],
                      ["泡沫滑地", stats.hydroFoam, preview.hydroFoam],
                      ["冻结效果", stats.hydroFreeze, preview.hydroFreeze],
                    ] as [string, boolean, boolean][]).map(([k, , after]) => (
                      <div key={k} className="flex items-center justify-between py-0.5 text-[11px]">
                        <span className="text-[#7a7461]">{k}</span>
                        <span className="font-num" style={{ color: after ? "#2c6e4b" : "#9a9079" }}>
                          {after ? "是" : "否"}
                        </span>
                      </div>
                    ))}
                  </>
                )}
                {tab === "melee" && (
                  <>
                    <StatRow label="近战伤害" before={Math.round(100 * stats.meleeDmg)} after={Math.round(100 * preview.meleeDmg)} unit="%" />
                    <StatRow label="攻击距离" before={Math.round(100 * stats.meleeReach)} after={Math.round(100 * preview.meleeReach)} unit="%" />
                    <StatRow label="攻击速度" before={Math.round(100 / stats.meleeRate)} after={Math.round(100 / preview.meleeRate)} unit="%" />
                    <StatRow label="击退强度" before={Math.round(100 * stats.meleeKnock)} after={Math.round(100 * preview.meleeKnock)} unit="%" />
                    <div className="flex items-center justify-between py-0.5 text-[11px]">
                      <span className="text-[#7a7461]">无视簸箕盾</span>
                      <span className="font-num" style={{ color: preview.meleePierce ? "#2c6e4b" : "#9a9079" }}>
                        {preview.meleePierce ? "是" : "否"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-0.5 text-[11px]">
                      <span className="text-[#7a7461]">横扫多人</span>
                      <span className="font-num" style={{ color: preview.meleeSweep ? "#2c6e4b" : "#9a9079" }}>
                        {preview.meleeSweep ? "是" : "否"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-0.5 text-[11px]">
                      <span className="text-[#7a7461]">触电麻痹</span>
                      <span className="font-num" style={{ color: preview.meleeShock ? "#2c6e4b" : "#9a9079" }}>
                        {preview.meleeShock ? "是" : "否"}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-3 border-t-2 border-dashed border-[#b5ad94] pt-2 text-[11px] leading-5 text-[#5c5747]">
                {infinite
                  ? "⚡ 密令生效中：班费无限，所有配件可随意装配。"
                  : "班费来源：每场战役结束后，剩余班费与战功奖金自动存入军械库。"}
              </div>
            </div>

            <button className="px-btn px-btn-dark mt-2 w-full py-2 text-xs tracking-[0.25em]" onClick={resetAll}>
              全部拆解（返还 70%）
            </button>
          </div>
        </div>

        {/* 提示条 */}
        {flash && (
          <div className="anim-pop mt-2 border-2 border-[#c2a14a] bg-[#1a1c14] px-3 py-1.5 text-center text-sm tracking-[0.2em] text-[#c2a14a]">
            {flash}
          </div>
        )}
      </div>
    </div>
  );
}
