import { useEffect, useRef, useState } from "react";

const CODE = "bawu";
/** 无限班费彩蛋：支持中文原文与拼音两种输入 */
const RICH_CN = "纪文川最帅";
const RICH_PY = "jiwenchuanzuishuai";

/**
 * 秘籍监听：在标题界面盲打 "bawu" 即可解锁复仇战役
 * 触发后弹出一张电报体公文做反馈
 */
export function useCheatCode(onUnlock: () => void, enabled = true, onRich?: () => void) {
  const [toast, setToast] = useState<string | null>(null);
  const buf = useRef("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cbRef = useRef(onUnlock);
  cbRef.current = onUnlock;
  const richRef = useRef(onRich);
  richRef.current = onRich;

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      // 忽略组合键与输入框
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      // 优先读取物理键位，中文输入法开启时依然能识别 B-A-W-U。
      const physical = /^Key[A-Z]$/.test(e.code) ? e.code.slice(3).toLowerCase() : "";
      const k = physical || e.key.toLowerCase();
      if (k.length !== 1 || !/[a-z]/.test(k)) return;
      buf.current = (buf.current + k).slice(-24);
      const fire = (msg: string, cb?: () => void) => {
        buf.current = "";
        cb?.();
        setToast(msg);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 3600);
      };
      if (buf.current.endsWith(RICH_PY)) {
        fire("班费无限！军械库已敞开", richRef.current);
      } else if (buf.current.endsWith(CODE)) {
        fire("八五！复仇战役已解锁", cbRef.current);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [enabled]);

  return toast;
}

/** 可点击的密令终端，兼容手机与中文输入法。 */
export function CheatTerminal({
  onUnlock,
  onRich,
  onClose,
}: {
  onUnlock: () => void;
  onRich?: () => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [msg, setMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 120);
    return () => {
      clearTimeout(timer);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const transmit = () => {
    const v = value.trim().toLowerCase();
    if (v === RICH_CN || v === RICH_PY) {
      setSuccess(true);
      setMsg("班费无限 / 军械库权限已提升");
      onRich?.();
      closeTimer.current = setTimeout(onClose, 1400);
      return;
    }
    if (v === CODE) {
      setSuccess(true);
      setMsg("密令核准 / 复仇档案正在解密……");
      onUnlock();
      closeTimer.current = setTimeout(onClose, 1250);
      return;
    }
    setError(true);
    setValue("");
    setTimeout(() => setError(false), 850);
  };

  return (
    <div className="fixed inset-0 z-[96] flex items-center justify-center bg-black/80 p-4" onMouseDown={onClose}>
      <div
        className={`px-box-dark w-full max-w-md p-4 ${error ? "anim-shake" : "anim-pop"}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-2 border-[#39414f] pb-2">
          <span className="text-sm tracking-[0.35em] text-[#c2a14a]">电 报 密 令 终 端</span>
          <button className="px-btn px-btn-dark px-2 py-0.5 text-xs" onClick={onClose}>关闭</button>
        </div>

        <div
          className="mt-3 border-4 border-[#1a211d] bg-[#06130c] p-4"
          style={{ boxShadow: "inset 0 0 28px rgba(0,0,0,0.95), 0 0 12px rgba(80,230,130,0.08)" }}
        >
          <div className="font-num text-xs tracking-[0.2em] text-[#3ba767]">CRT-85 / 总部加密线路</div>
          <div className="mt-2 font-num text-[13px] leading-6 text-[#5de08a]">
            &gt; 等待密令输入<br />
            &gt; 输入完成后拍发
          </div>
          <div className="mt-3 flex items-center gap-2 font-num text-xl text-[#8ef7a8]">
            <span>&gt;</span>
            <input
              ref={inputRef}
              value={value}
              maxLength={20}
              autoCapitalize="none"
              autoComplete="off"
              spellCheck={false}
              disabled={success}
              onChange={(e) => setValue(e.target.value.replace(/[^a-zA-Z\u4e00-\u9fa5]/g, ""))}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter") transmit();
              }}
              className="min-w-0 flex-1 border-0 bg-transparent font-num uppercase tracking-[0.45em] text-[#8ef7a8] outline-none caret-[#8ef7a8]"
              aria-label="输入四位电报密令"
            />
            <span className="anim-blink">_</span>
          </div>
          <div className={`mt-2 min-h-5 font-num text-xs ${error ? "text-[#ff7a63]" : "text-[#2f8a52]"}`}>
            {success
              ? msg
              : error ? "密令无效 / 线路拒绝接续" : "提示：班级代号 … 或者，谁最帅？"}
          </div>
        </div>

        <button
          className="px-btn px-btn-amber mt-3 w-full py-2.5 text-lg tracking-[0.35em]"
          onClick={transmit}
          disabled={success}
        >
          {success ? "密 令 核 准" : "拍 发 密 令"}
        </button>
      </div>
    </div>
  );
}

/** 秘籍成功的像素电报公文提示 */
export function CheatToast({ text }: { text: string }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[95] flex justify-center px-4">
      <div className="px-paper anim-pop w-full max-w-md p-4 text-[#14171f]">
        <div className="flex items-center justify-between border-b-2 border-[#14171f] pb-2">
          <span className="text-xs tracking-[0.35em] text-[#7a7461]">总 部 密 电</span>
          <span className="stamp px-2 py-0.5 text-[11px]">核 准</span>
        </div>
        <div className="mt-2.5 flex items-center gap-3">
          <span className="text-3xl">🔥</span>
          <div>
            <div className="font-num text-[13px] tracking-[0.1em] text-[#8d2a21]">
              — ··· &nbsp; B A W U &nbsp; ··· —
            </div>
            <div className="mt-1 text-lg tracking-[0.15em]">{text}</div>
            <div className="mt-0.5 text-[11px] tracking-[0.1em] text-[#7a7461]">
              返回标题即可从「复仇」入口出击
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
