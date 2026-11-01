import { useEffect, useRef, useState } from "react";
import { SPR } from "../game/sprites";
import { loadBank, isInfiniteFunds, loadMods, MODS } from "../game/mods";
import PixelSprite from "./PixelSprite";
import { useStageFit } from "./useStageFit";

// ============================================================
// 主界面：战术指挥终端
// ============================================================

/** 隐翅虫在标题区游弋 */
function BeetleRadar() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    const W = 150, H = 150;
    cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d")!;
    let raf = 0, t = 0;
    const loop = () => {
      t += 0.016;
      ctx.clearRect(0, 0, W, H);
      ctx.imageSmoothingEnabled = false;
      const cx = W / 2, cy = H / 2;
      // 雷达同心圆
      ctx.strokeStyle = "rgba(93,224,138,0.22)";
      ctx.lineWidth = 1;
      for (let r = 18; r <= 68; r += 17) {
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(cx - 70, cy); ctx.lineTo(cx + 70, cy);
      ctx.moveTo(cx, cy - 70); ctx.lineTo(cx, cy + 70); ctx.stroke();
      // 扫描扇形
      const sweep = t * 1.5;
      const g = ctx.createConicGradient?.(sweep, cx, cy);
      if (g) {
        g.addColorStop(0, "rgba(93,224,138,0.3)");
        g.addColorStop(0.08, "rgba(93,224,138,0)");
        g.addColorStop(1, "rgba(93,224,138,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx, cy, 70, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = "rgba(142,247,168,0.5)";
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweep) * 70, cy + Math.sin(sweep) * 70);
      ctx.stroke();
      // 目标光点
      for (let i = 0; i < 4; i++) {
        const a = i * 1.7 + t * 0.3;
        const r = 26 + i * 11;
        const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
        const diff = ((sweep - a) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const fade = Math.max(0, 1 - diff / 2.2);
        ctx.fillStyle = `rgba(255,120,90,${0.25 + fade * 0.7})`;
        ctx.fillRect(px - 2, py - 2, 4, 4);
      }
      // 中央隐翅虫
      const wing = Math.floor(t * 14) % 2 === 0;
      const spr = SPR[wing ? "beetleB" : "beetleA"];
      const bx = cx + Math.sin(t * 0.9) * 26;
      const by = cy + Math.sin(t * 1.7) * 14;
      ctx.save();
      ctx.translate(bx | 0, by | 0);
      if (Math.cos(t * 0.9) < 0) ctx.scale(-1, 1);
      ctx.globalAlpha = 0.95;
      ctx.drawImage(spr.img, -spr.w, -spr.h, spr.w * 2, spr.h * 2);
      ctx.restore();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="[image-rendering:pixelated]" width={150} height={150} />;
}

/** 滚动电文条 */
function Ticker() {
  const lines = [
    "昆虫组武装大队 · 全域战备等级 II",
    "隐翅虫「小赤」仍在逃 · 悬赏未撤销",
    "七班治安队活动频繁 · 建议加强门禁",
    "军械库已开放改装权限",
    "总部提醒：电报费用依旧昂贵",
  ];
  return (
    <div className="relative overflow-hidden border-y-2 border-[#2c3242] bg-[#0b0f16] py-1.5">
      <div className="anim-marquee flex whitespace-nowrap">
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0">
            {lines.map((l, i) => (
              <span key={i} className="font-num mx-6 text-[11px] tracking-[0.2em] text-[#5de08a]">
                ◆ {l}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** 功能模块卡 */
function ModuleCard({
  code, title, sub, color, icon, onClick, disabled, badge, big,
}: {
  code: string; title: string; sub: string; color: string;
  icon: React.ReactNode; onClick?: () => void; disabled?: boolean;
  badge?: string; big?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`group relative flex w-full items-center gap-3 overflow-hidden border-2 px-3 text-left transition-all ${
        big ? "py-4" : "py-2.5"
      } ${disabled ? "cursor-not-allowed opacity-45" : "hover:-translate-y-[2px]"}`}
      style={{
        borderColor: disabled ? "#2c3242" : color,
        background: disabled
          ? "rgba(14,18,24,0.7)"
          : `linear-gradient(100deg, rgba(10,14,20,0.95) 55%, ${color}1f 100%)`,
        boxShadow: disabled ? "none" : `3px 3px 0 rgba(0,0,0,0.6)`,
      }}
    >
      {/* 左侧色条 */}
      <span className="absolute left-0 top-0 h-full w-1" style={{ background: disabled ? "#2c3242" : color }} />
      {/* 斜纹底 */}
      <span
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: "repeating-linear-gradient(45deg,#fff 0 1px,transparent 1px 6px)" }}
      />
      <span className="ml-1 grid shrink-0 place-items-center" style={{ width: big ? 38 : 30 }}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={`tracking-[0.3em] ${big ? "text-xl" : "text-base"}`} style={{ color: disabled ? "#5b6377" : color }}>
            {title}
          </span>
          {badge && (
            <span
              className="px-1.5 py-px text-[9px] tracking-[0.15em]"
              style={{ background: disabled ? "#2c3242" : color, color: disabled ? "#6d7690" : "#0a0d12" }}
            >
              {badge}
            </span>
          )}
        </span>
        <span className="mt-0.5 block truncate text-[11px] leading-4 text-[#8a93a8]">{sub}</span>
      </span>
      <span className="font-num shrink-0 text-[10px] tracking-widest text-[#4d5668]">{code}</span>
      {!disabled && (
        <span className="shrink-0 text-sm transition-transform group-hover:translate-x-1" style={{ color }}>
          ▶
        </span>
      )}
    </button>
  );
}

/** 情报行 */
function IntelRow({ k, v, color = "#c9d1dc" }: { k: string; v: string; color?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-dashed border-[#232a36] py-1">
      <span className="shrink-0 text-[10px] tracking-[0.2em] text-[#5b6377]">{k}</span>
      <span className="font-num truncate text-right text-[11px]" style={{ color }}>{v}</span>
    </div>
  );
}

export default function TitleScreen({
  onStart, onHelp, onCredits, onRevenge, onSecret, onCinema, onArmory, onReplayIntro,
  revengeUnlocked = false,
}: {
  onStart: () => void;
  onHelp: () => void;
  onReplayIntro?: () => void;
  onCredits?: () => void;
  onRevenge?: () => void;
  onSecret?: () => void;
  onCinema?: () => void;
  onArmory?: () => void;
  revengeUnlocked?: boolean;
}) {
  const [bank] = useState(() => loadBank());
  const [inf] = useState(() => isInfiniteFunds());
  const [modCount] = useState(() => loadMods().size);
  const [clock, setClock] = useState("");
  const fit = useStageFit({ sideW: 0, reserveH: 0 });

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`
      );
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative z-10 flex min-h-screen w-full flex-col px-3 py-3 md:px-5 lg:h-screen lg:overflow-hidden">
      {/* 顶部警示带 */}
      <div className="tape fixed left-0 top-0 z-20 h-2 w-full opacity-70" />
      <div className="tape fixed bottom-0 left-0 z-20 h-2 w-full opacity-70" />

      <div className="mx-auto flex w-full max-w-[1800px] flex-1 flex-col gap-2.5">
        {/* ===== 顶栏 ===== */}
        <header className="anim-rise flex flex-wrap items-center justify-between gap-2 border-2 border-[#2c3242] bg-[#0b0f16]/90 px-3 py-2">
          <div className="flex items-center gap-3">
            <span className="grid h-7 w-7 place-items-center bg-[#8d2a21] text-sm text-[#f0e4c8]">85</span>
            <span className="text-[11px] tracking-[0.35em] text-[#8fa3c8]">昆虫组武装大队 · 战术指挥终端</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] tracking-[0.25em]">
            <span className="flex items-center gap-1.5 text-[#5de08a]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#5de08a]" />线路通
            </span>
            <span className="text-[#6d7690]">2026.10</span>
            <span className="font-num text-[#c2a14a]">{clock}</span>
          </div>
        </header>

        {/* ===== 主体三栏 ===== */}
        <div className="grid min-h-0 flex-1 gap-2.5 lg:grid-cols-[minmax(230px,18%)_1fr_minmax(272px,22%)]">
          {/* --- 左：情报档案 --- */}
          <aside className="anim-rise order-2 flex min-h-0 flex-col gap-2.5 lg:order-1">
            <section className="border-2 border-[#2c3242] bg-[#0b0f16]/90 p-3">
              <h3 className="mb-2 flex items-center gap-2 text-[11px] tracking-[0.3em] text-[#c2a14a]">
                <span className="h-px flex-1 bg-[#2c3242]" />战况简报<span className="h-px flex-1 bg-[#2c3242]" />
              </h3>
              <IntelRow k="战区" v="教学楼五层 · 八五班" />
              <IntelRow k="当面之敌" v="七班治安队" color="#ff7a63" />
              <IntelRow k="战备等级" v="II · 临战" color="#c2a14a" />
              <IntelRow k="军械库" v={inf ? "∞ 班费" : `${bank} 班费`} color="#c2a14a" />
              <IntelRow k="已装配件" v={`${modCount} / ${MODS.length}`} color="#8fd6a0" />
              <IntelRow k="复仇档案" v={revengeUnlocked ? "已解密" : "封存中"} color={revengeUnlocked ? "#d4544a" : "#5b6377"} />
            </section>

            <section className="flex flex-1 flex-col justify-center border-2 border-[#2c3242] bg-[#0b0f16]/90 p-3">
              <h3 className="mb-2 text-[11px] tracking-[0.3em] text-[#c2a14a]">在编干员</h3>
              <div className="flex items-end justify-around">
                {(["elecA", "assA", "medA"] as const).map((n, i) => (
                  <div key={n} className="flex flex-col items-center gap-1">
                    <PixelSprite name={n} scale={2.1} />
                    <span className="text-[9px] tracking-widest" style={{ color: ["#c2a14a", "#d4544a", "#57d6e6"][i] }}>
                      {["牢电工", "樊某某", "李听远"][i]}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </aside>

          {/* --- 中：主标题 --- */}
          <main className="anim-rise order-1 flex min-h-0 flex-col items-center justify-center border-2 border-[#2c3242] bg-[#0b0f16]/85 px-4 py-4 lg:order-2">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-px w-10 bg-[#8d2a21]" />
              <span className="text-[10px] tracking-[0.5em] text-[#8d2a21]">TOP SECRET</span>
              <span className="h-px w-10 bg-[#8d2a21]" />
            </div>

            <h1 className="text-center leading-none">
              <span
                className="block text-[11vw] md:text-[clamp(44px,5.2vw,88px)]"
                style={{ WebkitTextStroke: "3px #05070a", textShadow: "6px 6px 0 #05070a" }}
              >
                <span className="text-[#c2a14a]">八五班</span>
                <span className="text-[#e8e4d4]">门线保卫战</span>
              </span>
            </h1>

            <div className="mt-3 flex items-center gap-3 text-xs tracking-[0.3em] md:text-sm">
              <span className="text-[#6f9fd8]">昆虫组武装大队</span>
              <span className="px-2 py-0.5 text-[#f0e4c8]" style={{ background: "#8d2a21" }}>VS</span>
              <span className="text-[#7fb08f]">七班治安队</span>
            </div>

            {!fit.phonePortrait && <div className="my-2"><BeetleRadar /></div>}
            {!fit.phonePortrait && (
              <p className="font-num -mt-2 text-[10px] tracking-[0.25em] text-[#4d5668]">
                雷达：肇事隐翅虫「小赤」· 信号微弱
              </p>
            )}

            {/* 主按钮 */}
            <button
              onClick={onStart}
              className="group relative mt-5 w-full max-w-sm overflow-hidden border-[3px] border-[#05070a] py-4 transition-transform hover:-translate-y-1 active:translate-y-0"
              style={{
                background: "linear-gradient(180deg,#b53a2e 0%,#8d2a21 100%)",
                boxShadow: "0 5px 0 #05070a, inset 0 2px 0 rgba(255,255,255,0.18)",
              }}
            >
              <span
                className="pointer-events-none absolute inset-0 opacity-20"
                style={{ backgroundImage: "repeating-linear-gradient(45deg,#000 0 2px,transparent 2px 8px)" }}
              />
              <span className="relative text-2xl tracking-[0.4em] text-[#f7ecd0]">▶ 开 始 行 动</span>
              <span className="relative mt-0.5 block text-[10px] tracking-[0.3em] text-[#f0cfae]">
                第一战役 · 门线保卫战
              </span>
            </button>
          </main>

          {/* --- 右：功能模块 --- */}
          <aside className="anim-rise order-3 flex min-h-0 flex-col gap-1.5">
            <div className="mb-px flex items-center gap-2 text-[11px] tracking-[0.3em] text-[#c2a14a]">
              <span className="h-px flex-1 bg-[#2c3242]" />指挥菜单<span className="h-px flex-1 bg-[#2c3242]" />
            </div>

            {onArmory && (
              <ModuleCard
                code="ARM-01" title="军 械 库" sub={`武器改装 · ${modCount}/${MODS.length} 件已装配`}
                color="#c2a14a" big
                icon={<PixelSprite name="gunGas" scale={1.5} />}
                onClick={onArmory}
                badge={inf ? "∞" : undefined}
              />
            )}

            <ModuleCard
              code="DOC-02" title="作战手册" sub="武器 / 敌情 / 操作说明"
              color="#6f9fd8"
              icon={<span className="text-xl">📕</span>}
              onClick={onHelp}
            />

            {onCinema && (
              <ModuleCard
                code="FLM-03" title="电影模式" sub="战史纪录片 · 32 镜头 · 4分31秒"
                color="#4a9b78"
                icon={<span className="text-xl">▣</span>}
                onClick={onCinema}
              />
            )}

            <ModuleCard
              code="OPS-04" title="复 仇" disabled={!revengeUnlocked}
              sub={revengeUnlocked ? "终章战役 · 五阶段作战" : "通关门线保卫战后解锁"}
              color="#d4544a"
              icon={<span className={`text-xl ${revengeUnlocked ? "anim-bob" : ""}`}>{revengeUnlocked ? "🔥" : "🔒"}</span>}
              onClick={onRevenge}
              badge={revengeUnlocked ? "已解锁" : "封存"}
              big
            />

            {onCredits && (
              <ModuleCard
                code="END-05" title="鸣谢名单" sub="全体制作人员"
                color="#8a93a8"
                icon={<span className="text-xl">🎖</span>}
                onClick={onCredits}
              />
            )}

            {onReplayIntro && (
              <ModuleCard
                code="INT-06" title="战前简报" sub="重看开场动画 · 组织渊源"
                color="#7a8ba8"
                icon={<span className="text-xl">🗂</span>}
                onClick={onReplayIntro}
              />
            )}

            {onSecret && (
              <button
                onClick={onSecret}
                className="mt-1 border-2 border-dashed border-[#2c3242] py-2 text-center transition-colors hover:border-[#c2a14a]"
              >
                <span className="font-num text-[10px] tracking-[0.3em] text-[#4d5668] hover:text-[#c2a14a]">
                  [ 接入密令终端 ]
                </span>
              </button>
            )}
          </aside>
        </div>

        {/* ===== 滚动电文 ===== */}
        <Ticker />

        <footer className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 pb-2 text-[10px] tracking-[0.2em] text-[#3d4452]">
          <span>WASD 移动</span><span>鼠标 瞄准/射击</span><span>1-5 换武器</span>
          <span>Q 技能</span><span>R 换弹</span><span>右键 开镜</span><span>G 投掷</span><span>E 电报机</span><span>Esc 暂停</span>
        </footer>
      </div>
    </div>
  );
}
