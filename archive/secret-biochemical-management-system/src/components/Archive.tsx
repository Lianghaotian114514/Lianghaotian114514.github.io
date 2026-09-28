import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radiation, LogOut, Flame, FlaskConical, Wind, Gavel, TriangleAlert, ScanLine } from "lucide-react";
import { DOCS, type DocFile, type Block } from "../data/documents";
import { RichText, CornerFrame, Stamp, Divider } from "./Effects";
import Personnel from "./Personnel";

type Tab = "personnel" | (string & {});

const DOC_ICONS: Record<string, typeof FlaskConical> = {
  doc1: FlaskConical,
  doc2: Wind,
  doc3: Gavel,
};

const TICKER = [
  "警告：本系统全部内容均属绝密，禁止截屏、誊抄、背诵或转发朋友圈",
  "违者处罚：罚扫生化部实验室（含那个抽屉）一周",
  "气味预警：今日风向西北，建议全员逆风撤离",
  "公益提示：75%酒精是消毒用品，不是社交饮品",
  "快讯：李听远同志血压目前稳定",
  "热烈祝贺：八五生化部在编人员数量再创新高（1人）",
  "公告：「美味饮料」已被列为班级一级违禁品，发现请立即屏息",
];

const LOG_POOL = [
  "[TRACE] 外部嗅探 192.168.5.44 — 已静默反制",
  "[AUDIT] 樊某某 试图访问证物柜 — 已记录",
  "[WARN ] 容器「美味饮料」残余物压力波动",
  "[SCAN ] 走廊气味浓度：可居住（临界）",
  "[DENY ] 教务处终端请求档案副本 — 已拒绝",
  "[INFO ] 李听远 已上线，正在巡视",
  "[SYNC ] 机要索引与「那个抽屉」完成同步",
];

function ThreatDots({ n, className = "" }: { n: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} aria-label={`威胁等级 ${n}/5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rotate-45 border ${i < n ? "border-[#ff3b3b] bg-[#ff3b3b] shadow-[0_0_6px_#ff3b3b]" : "border-[#275c3a]"}`}
        />
      ))}
    </span>
  );
}

/* 标题扰码揭示 */
function useScramble(text: string, run: boolean, key: string) {
  const [out, setOut] = useState(run ? "" : text);
  useEffect(() => {
    if (!run) {
      setOut(text);
      return;
    }
    const chars = "01▓░#/アカサタナ☣▚█";
    let frame = 0;
    const total = 26;
    const iv = setInterval(() => {
      frame++;
      const reveal = Math.floor((frame / total) * text.length);
      let s = text.slice(0, reveal);
      for (let i = reveal; i < text.length; i++) {
        s += text[i] === "（" || text[i] === "）" || text[i] === "、" ? text[i] : Math.random() > 0.4 ? chars[Math.floor(Math.random() * chars.length)] : text[i];
      }
      if (frame >= total) {
        s = text;
        clearInterval(iv);
      }
      setOut(s);
    }, 42);
    return () => clearInterval(iv);
  }, [key, run, text]);
  return out;
}

const randHex = () =>
  Array.from({ length: 8 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0").toUpperCase()).join(" ");

/* ================= 文件阅读器 ================= */
function DocView({ doc }: { doc: DocFile }) {
  const [decrypting, setDecrypting] = useState(true);
  const [prog, setProg] = useState(0);
  const [rows, setRows] = useState<string[]>([]);
  const title = useScramble(doc.title, !decrypting, doc.id);

  useEffect(() => {
    setDecrypting(true);
    setProg(0);
    setRows([]);
    const iv = setInterval(() => {
      setProg((p) => {
        const np = Math.min(100, p + 3 + Math.random() * 7);
        return np;
      });
      setRows((r) => [...r, `${randHex()}  ${randHex()}  ::  ${randHex()}`].slice(-12));
    }, 70);
    const done = setTimeout(() => setDecrypting(false), 1500);
    return () => {
      clearInterval(iv);
      clearTimeout(done);
    };
  }, [doc.id]);

  if (decrypting) {
    return (
      <div className="flex min-h-[70vh] flex-col border border-[#144523] bg-black/50">
        <div className="border-b border-[#144523] px-4 py-2 font-tech text-[10px] tracking-[0.35em] text-[#ffb319]">
          DECRYPTING SECURE BLOCK // {doc.code}
        </div>
        <div className="flex-1 space-y-1 overflow-hidden px-5 py-6 font-tech text-[10px] leading-relaxed text-[#1d5c35] sm:text-xs">
          {rows.map((r, i) => (
            <div key={i} className={i === rows.length - 1 ? "text-[#6fe3a0]" : ""}>
              {r}
            </div>
          ))}
          <span className="blink-hard inline-block h-3 w-2 bg-[#ffb319]" />
        </div>
        <div className="px-5 pb-6">
          <div className="flex items-center justify-between font-tech text-[10px] tracking-[0.3em] text-[#ffb319]">
            <span>正在剥离量子封蜡……</span>
            <span>{Math.floor(prog)}%</span>
          </div>
          <div className="mt-2 h-1.5 border border-[#5c471d] bg-black">
            <div className="h-full bg-gradient-to-r from-[#7a5a1d] to-[#ffb319] shadow-[0_0_12px_rgba(255,179,25,0.5)] transition-all duration-150" style={{ width: `${prog}%` }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="doc-frame relative overflow-hidden border border-[#1d5c35]"
    >
      {/* 印章 */}
      <div className="pointer-events-none absolute right-5 top-6 rotate-[9deg] sm:right-10">
        <Stamp text="已解密" sub="DECLASSIFIED · 阅后即焚" />
      </div>
      <div className="pointer-events-none absolute bottom-10 left-6 -rotate-[7deg] opacity-60">
        <Stamp tone="amber" text="限内部传阅" sub="INTERNAL ONLY" />
      </div>

      <div className="px-5 py-8 sm:px-10 sm:py-12">
        {/* 文头 */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-tech text-[10px] tracking-[0.25em]">
          <span className="border border-[#ff3b3b]/60 bg-[#ff3b3b]/10 px-2 py-0.5 text-[#ff8f8f]">{doc.level}</span>
          <span className="text-[#4a8f63]">发文字号：{doc.code}</span>
          <span className="text-[#4a8f63] flex items-center gap-2">
            <ScanLine size={11} /> 载体状态：已数字化
          </span>
        </div>

        <p className="mt-6 font-tech text-[10px] tracking-[0.4em] text-[#ffb319] text-glow-amber">{doc.sub}</p>
        <h1 className="mt-2 max-w-3xl font-display text-2xl leading-snug tracking-wide text-[#e6ffef] text-glow sm:text-[2rem]">
          {title}
        </h1>

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-[#144523] py-3 font-tech text-[11px] tracking-widest text-[#6fe3a0]">
          <span>签发日期：{doc.date}</span>
          <span className="flex items-center gap-2">
            威胁评级 <ThreatDots n={doc.threat} />
          </span>
          <span className="flex flex-wrap gap-1.5">
            {doc.tags.map((t) => (
              <span key={t} className="border border-[#1d5c35] px-1.5 py-px text-[10px] text-[#8fe6b3]">
                #{t}
              </span>
            ))}
          </span>
        </div>

        {/* 正文 */}
        <div className="mt-8">
          {doc.blocks.map((b, i) => (
            <BlockRender key={i} block={b} />
          ))}
        </div>

        <Divider>
          <span className="font-tech">END OF FILE // 文书完</span>
        </Divider>
        <p className="mt-4 text-center font-tech text-[9px] tracking-[0.3em] text-[#275c3a]">
          本份文书由八五生化部机要室数字化 · 翻录必究 · 追究方式：请你闻那个抽屉
        </p>
      </div>
    </motion.div>
  );
}

function BlockRender({ block }: { block: Block }) {
  switch (block.t) {
    case "h2":
      return (
        <h2 className="mb-4 mt-9 flex items-center gap-3 font-display text-lg tracking-[0.15em] text-[#3dff88] text-glow">
          <span className="h-4 w-1.5 bg-[#3dff88] shadow-[0_0_8px_#3dff88]" />
          {block.text}
        </h2>
      );
    case "p":
      return (
        <p className="mb-4 text-sm leading-[1.95] text-[#b7e8c8] [text-indent:2em]">
          <RichText text={block.text} />
        </p>
      );
    case "quote":
      return (
        <blockquote className="relative my-6 border border-[#5c471d] bg-[#1a1204]/60 px-5 py-5 sm:px-8">
          <span className="absolute -top-3 left-4 bg-[#050a06] px-2 font-display text-xl text-[#ffb319]">“</span>
          <div className="space-y-2 font-tech text-sm leading-loose text-[#ffd97a]">
            {block.text.split("／").map((line, i) => (
              <p key={i}>
                <RichText text={line} />
              </p>
            ))}
          </div>
          <footer className="mt-3 text-right font-tech text-[11px] tracking-[0.25em] text-[#8f7a4a]">—— {block.by}</footer>
        </blockquote>
      );
    case "timeline":
      return (
        <div className="relative my-5 ml-2 space-y-5 border-l border-[#1d5c35] pl-6">
          {block.items.map((it, i) => (
            <div key={i} className="relative">
              <span className="absolute -left-[31px] top-1.5 h-2.5 w-2.5 rotate-45 border border-[#3dff88] bg-[#04150c] shadow-[0_0_8px_rgba(61,255,136,0.6)]" />
              <div className="font-tech text-[11px] tracking-[0.2em] text-[#ffb319]">{it.time}</div>
              <p className="mt-1 text-sm leading-relaxed text-[#b7e8c8]">
                <RichText text={it.text} />
              </p>
            </div>
          ))}
        </div>
      );
    case "list":
      return (
        <div className="my-5 border border-[#144523] bg-[#031007]/70 px-5 py-4">
          <div className="mb-3 font-tech text-[10px] tracking-[0.4em] text-[#4a8f63]">▚ {block.title}</div>
          <ul className="space-y-2.5">
            {block.items.map((it, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-[#b7e8c8]">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-[#ff3b3b]" />
                <RichText text={it} />
              </li>
            ))}
          </ul>
        </div>
      );
    case "note":
      return (
        <div className="my-5 flex gap-3 border border-dashed border-[#5c471d] bg-[#141004]/50 px-4 py-3">
          <TriangleAlert size={15} className="mt-0.5 shrink-0 text-[#ffb319]" />
          <p className="font-tech text-xs leading-relaxed text-[#ffd97a]">
            <RichText text={block.text} />
          </p>
        </div>
      );
    case "sign":
      return (
        <div className="mt-10 flex items-end justify-between gap-6 font-tech text-xs leading-loose tracking-widest text-[#8fe6b3]">
          <div>
            {block.left.map((l, i) => (
              <p key={i}>{l}</p>
            ))}
          </div>
          <div className="text-right">
            {block.right.map((l, i) => (
              <p key={i}>{l}</p>
            ))}
          </div>
        </div>
      );
  }
}

/* ================= 主界面 ================= */
export default function Archive({ onExit }: { onExit: () => void }) {
  const [tab, setTab] = useState<Tab>("personnel");
  const [now, setNow] = useState(new Date());
  const [logs, setLogs] = useState<string[]>([LOG_POOL[6]]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    const l = setInterval(() => {
      setLogs((prev) => [...prev, LOG_POOL[Math.floor(Math.random() * LOG_POOL.length)]].slice(-5));
    }, 3400);
    return () => {
      clearInterval(t);
      clearInterval(l);
    };
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");
  const clock = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const docButtons = (mode: "side" | "chip") => (
    <>
      {/* 人员宣传（醒目） */}
      <button
        onClick={() => setTab("personnel")}
        className={`group relative w-full border text-left transition-all duration-200 ${
          mode === "side" ? "px-4 py-4" : "w-auto min-w-[220px] shrink-0 px-3 py-2.5"
        } ${
          tab === "personnel"
            ? "border-[#ffb319] bg-[#ffb319]/10 shadow-[0_0_24px_rgba(255,179,25,0.18)]"
            : "border-[#5c471d] bg-[#0d0a02]/60 hover:border-[#ffb319]/70"
        }`}
      >
        <CornerFrame className="opacity-60" />
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-tech text-[9px] tracking-[0.35em] text-[#ffb319]">
            <Flame size={11} className="pulse-soft" /> FEATURED · 人物宣传
          </span>
          <span className="blink-hard font-tech text-[8px] tracking-widest text-[#ff8f8f]">HOT</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`font-display tracking-[0.2em] ${tab === "personnel" ? "text-[#ffd97a] text-glow-amber" : "text-[#d9b96a]"} ${mode === "side" ? "text-2xl" : "text-lg"}`}>
            牢电工
          </span>
          <span className="font-tech text-[9px] tracking-widest text-[#8f7a4a]">LAO·DIAN·GONG</span>
        </div>
        {mode === "side" && (
          <p className="mt-1.5 font-tech text-[10px] leading-relaxed text-[#8f7a4a]">
            八五生化部 · 首席研究员（共1人）
            <br />
            部门门面的唯一承重墙。
          </p>
        )}
      </button>

      {DOCS.map((d) => {
        const Icon = DOC_ICONS[d.id] ?? FlaskConical;
        const active = tab === d.id;
        return (
          <button
            key={d.id}
            onClick={() => setTab(d.id)}
            className={`group w-full border text-left transition-all duration-200 ${
              mode === "side" ? "px-4 py-3.5" : "w-auto min-w-[230px] shrink-0 px-3 py-2.5"
            } ${
              active
                ? "border-[#3dff88] bg-[#3dff88]/10 shadow-[0_0_24px_rgba(61,255,136,0.15)]"
                : "border-[#144523] bg-black/50 hover:border-[#2f7a4a]"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`flex items-center gap-1.5 font-tech text-[9px] tracking-[0.25em] ${active ? "text-[#3dff88]" : "text-[#4a8f63]"}`}>
                <Icon size={11} /> {d.code}
              </span>
              <ThreatDots n={d.threat} />
            </div>
            <p className={`mt-2 line-clamp-2 text-[13px] leading-snug ${active ? "text-[#e6ffef]" : "text-[#9fd4b4] group-hover:text-[#c9f5d8]"}`}>
              {d.title}
            </p>
            {mode === "side" && <p className="mt-1.5 line-clamp-1 font-tech text-[10px] text-[#2f7a4a]">{d.brief}</p>}
          </button>
        );
      })}
    </>
  );

  return (
    <motion.div
      className="relative z-10 flex h-full flex-col bg-grid crt-flicker"
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* ===== 顶栏 ===== */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[#144523] bg-black/70 px-4 backdrop-blur-sm sm:gap-5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <Radiation size={22} className="animate-spin-slower text-[#3dff88] text-glow" />
          <div className="leading-tight">
            <div className="font-display text-sm tracking-[0.2em] text-[#e6ffef] sm:text-base">八五生化部 · 机密文件管理系统</div>
            <div className="font-tech text-[8px] tracking-[0.3em] text-[#2f7a4a]">BIO-85 CLASSIFIED ARCHIVE v3.7</div>
          </div>
        </div>

        <div className="mx-auto hidden items-center gap-2 border border-[#ff3b3b]/50 bg-[#ff3b3b]/10 px-3 py-1 md:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ff3b3b] pulse-soft" />
          <span className="font-tech text-[10px] tracking-[0.4em] text-[#ff8f8f] text-glow-red">绝密 // TOP SECRET</span>
        </div>

        <div className="ml-auto flex items-center gap-3 sm:gap-5">
          <span className="hidden font-tech text-[11px] tracking-[0.25em] text-[#6fe3a0] sm:block">{clock}</span>
          <span className="hidden border border-[#1d5c35] px-2 py-1 font-tech text-[9px] tracking-[0.25em] text-[#8fe6b3] lg:block">
            会话：调查员(临时工)
          </span>
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 border border-[#5c1d1d] px-2.5 py-1.5 font-tech text-[10px] tracking-[0.25em] text-[#ff8f8f] transition-colors hover:bg-[#ff3b3b] hover:text-black"
          >
            <LogOut size={12} /> 断开链接
          </button>
        </div>
      </header>

      {/* ===== 移动端档案条 ===== */}
      <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-[#144523] bg-black/60 px-3 py-2.5 md:hidden">
        {docButtons("chip")}
      </div>

      {/* ===== 主体 ===== */}
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[300px] shrink-0 flex-col border-r border-[#144523] bg-black/60 backdrop-blur-sm md:flex">
          <div className="border-b border-[#144523] px-4 py-2.5 font-tech text-[9px] tracking-[0.4em] text-[#2f7a4a]">
            ▚ 档案索引 // FILE INDEX
          </div>
          <div className="flex-1 space-y-2.5 overflow-y-auto px-3 py-3">{docButtons("side")}</div>
          <div className="border-t border-[#144523] px-4 py-3">
            <div className="mb-1.5 font-tech text-[9px] tracking-[0.35em] text-[#2f7a4a]">▚ ACCESS LOG</div>
            <div className="space-y-0.5 font-tech text-[9px] leading-4 text-[#275c3a]">
              {logs.map((l, i) => (
                <div key={i} className={`truncate ${i === logs.length - 1 ? "text-[#6fe3a0]" : ""}`}>
                  {l}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7">
          <AnimatePresence mode="wait">
            {tab === "personnel" ? (
              <motion.div key="p" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <Personnel />
              </motion.div>
            ) : (
              <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <DocView doc={DOCS.find((d) => d.id === tab)!} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* ===== 底部走马灯 ===== */}
      <footer className="flex h-9 shrink-0 items-center border-t border-[#144523] bg-black/80">
        <div className="flex h-full shrink-0 items-center gap-1.5 border-r border-[#144523] bg-[#ff3b3b]/10 px-3">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ff3b3b] pulse-soft" />
          <span className="font-tech text-[9px] tracking-[0.3em] text-[#ff8f8f]">ALERT</span>
        </div>
        <div className="marquee flex-1">
          <div className="marquee-track font-tech text-[10px] tracking-[0.2em] text-[#4a8f63]">
            {[...TICKER, ...TICKER].map((t, i) => (
              <span key={i} className="mx-6 flex items-center gap-6 whitespace-nowrap">
                {t}
                <span className="text-[#1d5c35]">☣</span>
              </span>
            ))}
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
