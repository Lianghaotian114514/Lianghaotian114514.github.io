import { motion } from "framer-motion";
import { Skull, Activity, FlaskConical, Fingerprint, ShieldAlert } from "lucide-react";
import { GlitchText, CornerFrame, Stamp, Divider } from "./Effects";

const STATS = [
  { label: "危险指数", value: 99, color: "#ff3b3b" },
  { label: "酿造天赋", value: 97, color: "#3dff88" },
  { label: "求生能力", value: 86, color: "#ffb319" },
  { label: "嘴硬程度", value: 100, color: "#ff3b3b" },
  { label: "安全意识", value: 4, color: "#ffb319" },
];

const CHRONICLES = [
  {
    era: "创部元年",
    text: "在连续被七个社团婉拒之后，牢某自立门户创立「八五生化部」，自封首席研究员。因无人竞争，任命即刻生效；部门人员编制自此定格为——1。",
  },
  {
    era: "「伏特加计划」",
    text: "与实验员樊某某于实验室对酌 75% 酒精，被班长李听远当场拿下。所交检讨经查重，与上学期旧稿重复率高达 87%，再创「自我抄袭」新纪录。",
  },
  {
    era: "「美味饮料」问世",
    text: "取化粪池三年陈酿上清液，佐以粪臭素精调，封装于冰红茶瓶中。荣获「班级最不欢迎奖」——全班全票通过，无一人弃权。",
  },
  {
    era: "「11·03」泄漏",
    text: "开屉亲验成品，正面受熏，险些将生命献给科学。脱离危险后留下名言：「它成熟了。」",
  },
  {
    era: "联合法庭审判",
    text: "远东国际军事法庭（本班）与海牙国际法庭（办公室）联合宣判：「以拖止臭」——独自执行教室清洁任务一周。目前已执行至不忍细数日。",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
};

function StatBar({ label, value, color, delay }: { label: string; value: number; color: string; delay: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 font-tech text-[10px] tracking-[0.25em] text-[#8fe6b3]">{label}</span>
      <div className="h-2 flex-1 border border-[#1d5c35] bg-black/70">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
          className="h-full"
          style={{ background: color, boxShadow: `0 0 12px ${color}` }}
        />
      </div>
      <span className="w-8 text-right font-tech text-xs" style={{ color }}>
        {String(value).padStart(3, "0")}
      </span>
    </div>
  );
}

export default function Personnel() {
  return (
    <div className="mx-auto max-w-6xl space-y-7">
      {/* 顶部警示条 */}
      <motion.div
        {...fadeUp}
        className="flex items-center justify-center gap-3 border border-[#ffb319]/60 bg-[#1a1204]/70 px-4 py-2.5 text-center"
      >
        <ShieldAlert size={14} className="shrink-0 text-[#ffb319]" />
        <p className="font-tech text-[10px] tracking-[0.3em] text-[#ffd97a] sm:text-[11px]">
          该人员已被列为八五生化部<span className="mx-1 text-[#ffb319] underline decoration-dotted underline-offset-4">重点宣传对象</span>（原因：确实找不到第二位）
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* ===== 肖像 ===== */}
        <motion.figure {...fadeUp} className="relative border border-[#1d5c35] bg-black">
          <CornerFrame />
          <div className="flex items-center justify-between border-b border-[#1d5c35] px-4 py-2">
            <span className="font-tech text-[9px] tracking-[0.4em] text-[#2f7a4a]">IDENTIFICATION · LB-001</span>
            <span className="flex items-center gap-1.5 font-tech text-[9px] tracking-widest text-[#ff8f8f]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff3b3b] pulse-soft" /> 人设运营中 LIVE
            </span>
          </div>

          <div className="relative overflow-hidden">
            <img
              src="/images/lao-diangong.jpg"
              alt="八五生化部首席研究员 牢电工 标准像"
              className="h-[420px] w-full object-cover sm:h-[520px] lg:h-[560px]"
              style={{ filter: "saturate(0.85) contrast(1.12) brightness(0.92)" }}
            />
            <div className="pointer-events-none absolute inset-0 fx-scanlines opacity-70" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30" />
            <div className="pointer-events-none absolute inset-0 bg-[#3dff88]/[0.06] mix-blend-overlay" />

            {/* 印章 */}
            <div className="pointer-events-none absolute right-4 top-6 rotate-[10deg]">
              <Stamp tone="amber" text="重点宣传对象" sub="SPECIAL FEATURE" />
            </div>
            <div className="pointer-events-none absolute bottom-16 left-5 -rotate-[8deg]">
              <Stamp text="仅此一位" sub="ONE & ONLY" />
            </div>

            <figcaption className="absolute bottom-0 left-0 w-full px-5 py-4">
              <p className="font-tech text-[9px] tracking-[0.3em] text-[#6fe3a0]">
                标准像 LB-001 · 拍摄于其埋头创作时（未获本人授权）
              </p>
              <p className="mt-0.5 font-tech text-[9px] tracking-[0.3em] text-[#2f7a4a]">
                拍摄者已接受心理疏导，恢复良好
              </p>
            </figcaption>
          </div>
        </motion.figure>

        {/* ===== 档案正文 ===== */}
        <motion.div {...fadeUp} transition={{ delay: 0.08 }} className="flex flex-col border border-[#1d5c35] bg-black/60">
          <div className="flex items-center justify-between border-b border-[#1d5c35] px-5 py-2">
            <span className="font-tech text-[9px] tracking-[0.4em] text-[#2f7a4a]">PERSONNEL FILE // NO.001 — SPECIAL FEATURE</span>
            <Fingerprint size={13} className="text-[#2f7a4a]" />
          </div>

          <div className="flex-1 px-5 py-6 sm:px-8">
            <p className="font-tech text-[10px] tracking-[0.45em] text-[#ffb319] text-glow-amber">八五生化部 · 首席（且唯一）研究员</p>
            <h1 className="mt-2 font-display text-5xl leading-none tracking-[0.12em] text-[#e6ffef] sm:text-7xl">
              <GlitchText text="牢电工" className="text-glow" />
            </h1>
            <p className="mt-3 font-tech text-xs tracking-[0.4em] text-[#4a8f63]">LAO·DIAN·GONG /// THE ELECTRICIAN</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {["气味工程师", "「美味饮料」之父", "远东×海牙双法庭认证被告", "电解与酿造双学位（自封）"].map((c) => (
                <span key={c} className="border border-[#1d5c35] bg-[#031007]/80 px-2.5 py-1 font-tech text-[10px] tracking-widest text-[#8fe6b3]">
                  {c}
                </span>
              ))}
            </div>

            {/* 语录 */}
            <blockquote className="mt-6 border-l-2 border-[#ffb319] bg-[#1a1204]/40 px-5 py-4">
              <p className="font-display text-lg leading-relaxed tracking-[0.1em] text-[#ffd97a] sm:text-xl">
                「我不是臭。我是香得——太超前了。」
              </p>
              <footer className="mt-1.5 font-tech text-[10px] tracking-[0.3em] text-[#8f7a4a]">—— 受审间隙接受本部门独家采访</footer>
            </blockquote>

            {/* 能力值 */}
            <div className="mt-7">
              <div className="mb-3 flex items-center gap-2 font-tech text-[10px] tracking-[0.4em] text-[#2f7a4a]">
                <Activity size={12} /> 能力参数 // CAPABILITY INDEX
              </div>
              <div className="space-y-3">
                {STATS.map((s, i) => (
                  <StatBar key={s.label} {...s} delay={i * 0.1} />
                ))}
              </div>
            </div>

            {/* 状态表 */}
            <div className="mt-7 grid grid-cols-1 gap-px border border-[#144523] bg-[#144523] font-tech text-[11px] sm:grid-cols-2">
              {[
                { k: "服役状态", v: "现役 · 正执行清洁任务", hot: false },
                { k: "通缉状态", v: "免通缉 · 改挂光荣榜", hot: false },
                { k: "直属上级", v: "李听远（兼血压受害者）", hot: false },
                { k: "危险等级", v: "☣☣☣☣☣ IMMINENT", hot: true },
              ].map((r) => (
                <div key={r.k} className="flex items-center justify-between gap-3 bg-black/80 px-4 py-2.5">
                  <span className="tracking-[0.2em] text-[#4a8f63]">{r.k}</span>
                  <span className={`tracking-widest ${r.hot ? "text-[#ff5555] text-glow-red" : "text-[#c9f5d8]"}`}>{r.v}</span>
                </div>
              ))}
            </div>

            <p className="mt-6 text-right font-display text-lg tracking-[0.3em] text-[#3dff88]/80" style={{ transform: "rotate(-1.5deg)" }}>
              签名：牢电工（画押）
            </p>
          </div>
        </motion.div>
      </div>

      {/* ===== 宣传标语 ===== */}
      <motion.div {...fadeUp} className="relative overflow-hidden border border-[#1d5c35] bg-[#02130a]/80 px-6 py-10 text-center sm:py-14">
        <div className="pointer-events-none absolute inset-0 fx-scanlines opacity-50" />
        <p className="font-tech text-[10px] tracking-[0.5em] text-[#2f7a4a]">DEPARTMENT SLOGAN // 部门口号</p>
        <p className="mt-4 font-display text-4xl leading-tight tracking-[0.1em] text-[#e6ffef] sm:text-6xl">
          <GlitchText text="一人一部，生化八五。" className="text-glow" />
        </p>
        <p className="mt-4 font-tech text-xs tracking-[0.5em] text-[#6fe3a0]">部在 · 人在 · 味散 · 人不散</p>
      </motion.div>

      {/* ===== 生平事迹 ===== */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
        <motion.div {...fadeUp} className="border border-[#1d5c35] bg-black/60">
          <div className="flex items-center gap-2 border-b border-[#1d5c35] px-5 py-2.5 font-tech text-[10px] tracking-[0.4em] text-[#2f7a4a]">
            <FlaskConical size={12} /> 人物大事记 // CHRONICLE OF DEEDS
          </div>
          <div className="relative ml-6 space-y-7 border-l border-[#1d5c35] px-6 py-6 sm:ml-8">
            {CHRONICLES.map((c, i) => (
              <motion.div key={c.era} {...fadeUp} transition={{ delay: i * 0.05 }} className="relative">
                <span className="absolute -left-[31px] top-1 h-2.5 w-2.5 rotate-45 border border-[#ffb319] bg-[#04150c] shadow-[0_0_8px_rgba(255,179,25,0.6)]" />
                <div className="flex items-center gap-2 font-display text-base tracking-[0.15em] text-[#ffb319] text-glow-amber">
                  {c.era}
                  <span className="h-px flex-1 bg-gradient-to-r from-[#5c471d] to-transparent" />
                </div>
                <p className="mt-2 text-sm leading-[1.9] text-[#b7e8c8]">{c.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 危险接触须知 */}
        <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="flex flex-col border border-[#5c1d1d] bg-[#140404]/70">
          <div className="flex items-center gap-2 border-b border-[#5c1d1d] px-5 py-2.5 font-tech text-[10px] tracking-[0.4em] text-[#ff8f8f]">
            <Skull size={12} /> 危险接触须知 // HANDLING
          </div>
          <ul className="flex-1 space-y-4 px-5 py-5 text-[13px] leading-[1.9] text-[#ffb3ac]">
            <li className="flex gap-2.5">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-[#ff3b3b]" />
              与该人员交涉时，请始终占据上风口站位，并保持一根拖把的安全距离。
            </li>
            <li className="flex gap-2.5">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-[#ff3b3b]" />
              切勿接受其递来的任何液体——无论颜色多么像冰红茶，无论他解释为「对照组」。
            </li>
            <li className="flex gap-2.5">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-[#ff3b3b]" />
              当其说出「它成熟了」四字时，请立即执行三排疏散预案，无需请示。
            </li>
            <li className="flex gap-2.5">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-[#ff3b3b]" />
              其抽屉已被列为一级禁区。好奇者请参考第 002 号档案幸存者证言。
            </li>
          </ul>
          <div className="border-t border-[#5c1d1d] px-5 py-3 font-tech text-[9px] tracking-[0.3em] text-[#8f4a4a]">
            须知由安全委员会（同学自封）制定
          </div>
        </motion.div>
      </div>

      <Divider>
        <span className="font-tech">PUBLICITY SECTION // 宣传部（编制：0，靠自觉）</span>
      </Divider>
    </div>
  );
}
