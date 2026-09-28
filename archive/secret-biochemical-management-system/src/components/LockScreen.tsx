import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radiation, Lock, Unlock, KeyRound, Fingerprint, ShieldAlert, CircleHelp } from "lucide-react";
import { PASSWORD } from "../data/documents";
import { CornerFrame, GlitchText } from "./Effects";

const ERRORS = [
  "口令错误。别想蒙混过关，你的心跳频率已被记录。",
  "口令错误 ×2。「化粪池卫队」已收到一级警报。",
  "口令错误 ×3。再按错一次，就把「美味饮料」寄到你家。",
];

const TRACES = [
  "[TRACE] 192.168.5.44 端口嗅探 — 已拦截",
  "[DENY ] 来自教务处的访问请求 — 已拒绝",
  "[SCAN ] 气味传感器阵列自检 …… 通过（勉强）",
  "[ALERT] 容器「美味饮料」压力波动 +0.03%",
  "[AUDIT] 你的每一次呼吸，均已被记录在案",
  "[INFO ] 李听远 正在注视着你",
];

/* 简易蜂鸣器（用户手势后可用） */
function beep(freq: number, dur: number, type: OscillatorType = "square", gain = 0.04) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
    setTimeout(() => ctx.close(), dur * 1000 + 120);
  } catch {
    /* 静默失败 */
  }
}

export default function LockScreen({ onGranted }: { onGranted: () => void }) {
  const [value, setValue] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [phase, setPhase] = useState<"idle" | "denied" | "cooldown" | "granted">("idle");
  const [err, setErr] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [cool, setCool] = useState(0);
  const [traces, setTraces] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const pool = [...TRACES];
    const t = setInterval(() => {
      setTraces((prev) => {
        const next = [...prev, pool[Math.floor(Math.random() * pool.length)]];
        return next.slice(-4);
      });
    }, 2600);
    return () => clearInterval(t);
  }, []);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (phase === "cooldown" || phase === "granted") return;
    if (value.trim() === PASSWORD) {
      setPhase("granted");
      beep(880, 0.12, "sine");
      setTimeout(() => beep(1320, 0.22, "sine"), 130);
      const t = setTimeout(onGranted, 1750);
      return () => clearTimeout(t);
    }
    const n = attempts + 1;
    setAttempts(n);
    setErr(ERRORS[Math.min(n - 1, ERRORS.length - 1)]);
    setValue("");
    beep(110, 0.28, "sawtooth", 0.06);
    if (n >= ERRORS.length) {
      setPhase("cooldown");
      setCool(4);
      const tick = setInterval(() => {
        setCool((c) => {
          if (c <= 1) {
            clearInterval(tick);
            setPhase("idle");
            setAttempts(0);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } else {
      setPhase("denied");
      setTimeout(() => setPhase("idle"), 450);
    }
  };

  const flashRed = phase === "denied" || phase === "cooldown";
  const granted = phase === "granted";

  return (
    <motion.div
      className="relative z-10 flex h-full flex-col items-center justify-center overflow-y-auto px-4 py-10 crt-flicker"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.06, filter: "blur(6px)", transition: { duration: 0.5 } }}
    >
      {/* 顶部横幅 */}
      <div className="mb-6 flex items-center gap-3 font-tech text-[10px] tracking-[0.45em] text-[#ff5555] text-glow-red sm:text-xs">
        <ShieldAlert size={14} className="pulse-soft" />
        RESTRICTED AREA — 未经授权 · 禁止访问
        <ShieldAlert size={14} className="pulse-soft" />
      </div>

      <motion.div
        key={attempts}
        animate={flashRed && !granted ? { x: [0, -16, 16, -10, 10, -4, 0] } : { x: 0 }}
        transition={{ duration: 0.45 }}
        className={`relative w-full max-w-xl border bg-black/70 shadow-[0_0_80px_rgba(0,0,0,0.85)] backdrop-blur-sm transition-colors duration-300 ${
          granted ? "border-[#3dff88]" : flashRed ? "border-[#ff3b3b]" : "border-[#144523]"
        }`}
      >
        <CornerFrame />
        {/* 面板头 */}
        <div className="flex items-center justify-between border-b border-[#144523] px-5 py-2.5">
          <span className="font-tech text-[10px] tracking-[0.35em] text-[#3dff88]">
            BIO-85 // SECURE ACCESS TERMINAL
          </span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#ff3b3b] pulse-soft" />
            <span className="font-tech text-[9px] tracking-widest text-[#ff8f8f]">ARMED</span>
          </div>
        </div>

        <div className="px-5 py-7 text-center sm:px-10">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center">
            <Radiation
              size={68}
              strokeWidth={1.4}
              className={`animate-spin-slower ${granted ? "text-[#3dff88]" : flashRed ? "text-[#ff3b3b]" : "text-[#3dff88]"} text-glow`}
            />
          </div>

          <h1 className="font-display text-3xl tracking-[0.18em] text-[#c9f5d8] sm:text-4xl">
            <GlitchText text="八五生化部" className="text-glow" />
          </h1>
          <p className="mt-1 font-display text-lg tracking-[0.5em] text-[#3dff88] text-glow">机密文件管理系统</p>
          <p className="mt-3 font-tech text-[10px] tracking-[0.3em] text-[#4a8f63]">
            CLASS-85 BIOCHEM DEPT · CLASSIFIED ARCHIVE v3.7
          </p>
          <p className="font-tech text-[10px] tracking-[0.3em] text-[#ff5555]">密级：绝密 // TOP SECRET · NOFORN</p>

          {/* 密码表单 */}
          <form onSubmit={submit} className="mx-auto mt-7 max-w-sm">
            <div
              className={`flex items-center gap-3 border bg-[#031007] px-4 py-3 transition-colors ${
                granted ? "border-[#3dff88]" : flashRed ? "border-[#ff3b3b]" : "border-[#1d5c35] focus-within:border-[#3dff88]"
              }`}
            >
              <KeyRound size={16} className={flashRed ? "text-[#ff3b3b]" : "text-[#3dff88]"} />
              <span className="font-tech text-sm text-[#3dff88]">&gt;</span>
              <input
                ref={inputRef}
                type="password"
                value={value}
                disabled={granted || phase === "cooldown"}
                onChange={(e) => setValue(e.target.value.replace(/\s/g, ""))}
                placeholder="输入访问口令"
                className="w-full bg-transparent font-tech text-base tracking-[0.35em] text-[#d9ffe7] placeholder-[#2f5c40] disabled:opacity-40"
                autoComplete="off"
              />
              {granted ? <Unlock size={16} className="text-[#3dff88]" /> : <Lock size={16} className="text-[#2f7a4a]" />}
            </div>

            <button
              type="submit"
              disabled={granted || phase === "cooldown"}
              className={`mt-4 w-full border px-4 py-2.5 font-tech text-xs tracking-[0.5em] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
                granted
                  ? "border-[#3dff88] bg-[#3dff88] text-black"
                  : "border-[#3dff88]/70 text-[#3dff88] hover:bg-[#3dff88] hover:text-black hover:shadow-[0_0_30px_rgba(61,255,136,0.35)]"
              }`}
            >
              {granted ? "ACCESS GRANTED" : phase === "cooldown" ? `冷却中 ${cool}s` : "验 证 身 份 ///"}
            </button>
          </form>

          {/* 状态播报区 */}
          <div className="mt-5 min-h-[48px]">
            <AnimatePresence mode="wait">
              {granted ? (
                <motion.div key="ok" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
                  <p className="font-tech text-sm tracking-[0.3em] text-[#3dff88] text-glow">ACCESS GRANTED // 访问许可</p>
                  <p className="font-tech text-[10px] tracking-[0.25em] text-[#8fe6b3]">身份确认：生化部特别调查员（临时工）· 正在解密档案……</p>
                </motion.div>
              ) : phase === "cooldown" ? (
                <motion.div key="cool" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1.5">
                  <p className="font-tech text-xs tracking-widest text-[#ff5555] text-glow-red">系统冷却中……请深呼吸（建议憋着） {cool}s</p>
                  <div className="mx-auto h-1 max-w-xs border border-[#5c1d1d] bg-black">
                    <div className="h-full bg-[#ff3b3b] transition-all duration-1000" style={{ width: `${(cool / 4) * 100}%` }} />
                  </div>
                </motion.div>
              ) : err ? (
                <motion.p
                  key={attempts + "err"}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="font-tech text-xs tracking-widest text-[#ff5555] text-glow-red"
                >
                  {err}
                </motion.p>
              ) : (
                <motion.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-tech text-[11px] tracking-[0.25em] text-[#4a8f63]">
                  等待口令 // AWAITING PASSPHRASE<span className="blink-hard">▌</span>
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* 提示 */}
          <button onClick={() => setShowHint((v) => !v)} className="mt-2 inline-flex items-center gap-1.5 font-tech text-[10px] tracking-[0.25em] text-[#2f7a4a] transition-colors hover:text-[#6fe3a0]">
            <CircleHelp size={12} />
            {showHint ? "收起提示" : "忘记口令？（24岁，是调查员）"}
          </button>
          <AnimatePresence>
            {showHint && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-3 space-y-1 border border-dashed border-[#2f5c40] bg-[#031007] px-4 py-3 font-tech text-[11px] leading-relaxed text-[#ffd97a]">
                  <p>口令提示：你是一串数字，一串一个一个一个数字。</p>
                  <p className="tracking-[0.3em]">11 45 14 19 19 810 —— 好时代，来临罢。</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 底部追踪日志 */}
        <div className="border-t border-[#144523] px-4 py-2">
          <div className="flex items-center gap-2">
            <Fingerprint size={11} className="shrink-0 text-[#2f7a4a]" />
            <div className="w-full overflow-hidden font-tech text-[9px] leading-4 text-[#2f7a4a]">
              {traces.length === 0 ? (
                <div className="truncate">[BOOT] 入侵追踪模塊待命……</div>
              ) : (
                traces.map((t, i) => (
                  <div key={i} className={`truncate ${i === traces.length - 1 ? "text-[#6fe3a0]" : ""}`}>
                    {t}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <p className="mt-6 max-w-md text-center font-tech text-[9px] leading-relaxed tracking-[0.25em] text-[#275c3a]">
        警告：本终端的一切输入将被气味传感器重新校验。连续输错者，后果自负——你知道那个抽屉里有什么。
      </p>
    </motion.div>
  );
}
