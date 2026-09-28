import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Zap, ChevronsRight } from "lucide-react";

/*  ! = 红色警告   ^ = 琥珀色注意   其余 = 磷绿  */
const LINES = [
  "八五生化部 BIOS v3.7.114 — POST 加电自检启动",
  "内存校验 ............... 64KB（其中 63KB 被气味占用） [OK]",
  "挂载 /dev/秘密 分区 .................. [OK]",
  "加载气味传感器阵列 .................... [OK]",
  "!警告：容器「美味饮料」压力异常，样本正在剧烈反抗",
  "^应急协议：已将该样本转移至传说中那个最深的抽屉",
  "网络链路 · 加密握手 1145141919810.bit .. [OK]",
  "入侵检测 IDS ...... 已启动（正在注视你）",
  "解密文书档案索引 ........ 3 份机要文书载入完毕",
  "载入人员宣传模块 ...... 唯一在编人员已就位",
  "^系统自检完毕。请全体人员——屏住呼吸。",
];

export default function BootSequence({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const ready = count >= LINES.length;

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((c) => {
        if (c >= LINES.length) {
          clearInterval(timer);
          return c;
        }
        return c + 1;
      });
    }, 170);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
  }, [count]);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(onDone, 1600);
    const key = () => onDone();
    window.addEventListener("keydown", key);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", key);
    };
  }, [ready, onDone]);

  const renderLine = (raw: string, i: number) => {
    const tone = raw.startsWith("!")
      ? "text-[#ff5555] text-glow-red"
      : raw.startsWith("^")
        ? "text-[#ffb319] text-glow-amber"
        : "text-[#6fe3a0]";
    const text = raw.replace(/^[!^]\s?/, "");
    return (
      <div key={i} className={`whitespace-pre-wrap break-all font-tech text-[11px] leading-relaxed sm:text-[13px] ${tone}`}>
        <span className="mr-2 text-[#1d5c35]">{String(i).padStart(2, "0")}</span>
        {text}
      </div>
    );
  };

  return (
    <motion.div
      className="relative z-10 flex h-full flex-col items-center justify-center overflow-y-auto px-4 py-10 crt-flicker"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      onClick={() => ready && onDone()}
    >
      <div className="w-full max-w-3xl border border-[#144523] bg-black/60 shadow-[0_0_60px_rgba(0,0,0,0.8)] backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-[#144523] px-4 py-2">
          <div className="flex items-center gap-2 font-tech text-[10px] tracking-[0.35em] text-[#3dff88]">
            <Zap size={13} className="pulse-soft" />
            BIO-85 // POWER-ON SELF TEST
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDone();
            }}
            className="flex items-center gap-1 border border-[#2f7a4a] px-2 py-0.5 font-tech text-[10px] tracking-widest text-[#6fe3a0] transition-colors hover:bg-[#3dff88] hover:text-black"
          >
            SKIP <ChevronsRight size={12} />
          </button>
        </div>

        <div ref={boxRef} className="h-[340px] space-y-1.5 overflow-y-auto px-4 py-4 sm:h-[380px] sm:px-6">
          {LINES.slice(0, count).map(renderLine)}
          {!ready && <span className="blink-hard inline-block h-3.5 w-2 bg-[#3dff88]" />}
          {ready && (
            <div className="pt-5 text-center">
              <span className="blink-hard font-tech text-xs tracking-[0.5em] text-[#ffb319] text-glow-amber">
                ▶ 按任意键进入安保验证 // PRESS ANY KEY
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-[#144523] px-4 py-1.5 font-tech text-[9px] tracking-[0.3em] text-[#2f7a4a]">
          MEM 64KB OK · SENSOR ARRAY OK · ODOR LEVEL&nbsp;
          <span className="text-[#ff5555]">CRITICAL</span>
        </div>
      </div>
    </motion.div>
  );
}
