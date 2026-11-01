import { useEffect, useRef } from "react";
import PixelSprite from "./PixelSprite";
import type { Tone } from "../game/engine";

export interface ConsoleMsg { id: number; msg: string; tone: Tone; t: number }

const PHOSPHOR: Record<Tone, string> = {
  info: "#5de08a",   // 磷光绿
  good: "#8ef7a8",
  warn: "#e8c15a",
  bad: "#ff7a63",
};

function stamp(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * 老式 CRT 显示器 + 电报机终端
 * 位于战场画面右侧，不遮挡任何游戏内容
 */
export default function CrtConsole({
  messages,
  compact = false,
  online = true,
  keying = false,
}: {
  messages: ConsoleMsg[];
  compact?: boolean;
  online?: boolean;
  keying?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div className={`flex ${compact ? "w-full flex-row gap-2" : "h-full w-[304px] flex-col gap-2"}`}>
      {/* ====== 显示器 ====== */}
      <div
        className={`relative ${compact ? "flex-1" : ""}`}
        style={{
          background: "linear-gradient(180deg,#8b8574 0%,#6f6a5b 55%,#55513f 100%)",
          border: "3px solid #0d0f14",
          boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.12), 5px 5px 0 rgba(0,0,0,0.65)",
          padding: "10px 10px 6px",
        }}
      >
        {/* 顶部散热栅格 */}
        <div className="mb-1.5 flex items-center justify-between">
          <div className="flex gap-[3px]">
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className="block h-[7px] w-[3px] bg-[#3f3b2f]" />
            ))}
          </div>
          <span className="text-[9px] tracking-[0.25em] text-[#2e2b22]">CRT-85 型 战 地 终 端</span>
        </div>

        {/* 屏幕 */}
        <div
          className="relative overflow-hidden"
          style={{
            background: "radial-gradient(ellipse at 50% 45%, #0e2416 0%, #06130c 70%, #030806 100%)",
            border: "3px solid #141612",
            borderRadius: "14px / 20px",
            boxShadow: "inset 0 0 26px rgba(0,0,0,0.95), inset 0 0 60px rgba(60,255,140,0.05)",
            height: compact ? 112 : 318,
          }}
        >
          {/* 扫描线 */}
          <div
            className="pointer-events-none absolute inset-0 z-20"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0 2px, rgba(0,0,0,0.42) 2px 3px)",
            }}
          />
          {/* 荧光泛光 + 球面暗角 */}
          <div
            className="pointer-events-none absolute inset-0 z-20"
            style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(80,255,150,0.07) 0%, rgba(0,0,0,0.6) 100%)" }}
          />
          {/* 滚动刷新亮带 */}
          <div className="pointer-events-none absolute inset-x-0 z-20 h-10 opacity-[0.07] anim-crt-roll"
            style={{ background: "linear-gradient(180deg, transparent, #8fffb8, transparent)" }} />

          {/* 抬头 */}
          <div className="relative z-10 flex items-center justify-between px-2.5 pt-2 font-num text-[11px] tracking-[0.18em]"
            style={{ color: "#49d47c", textShadow: "0 0 6px rgba(73,212,124,0.8)" }}>
            <span>DE 85 · 前线战况</span>
            <span className={online ? "anim-blink" : "opacity-40"}>{online ? "● 线路通" : "○ 断线"}</span>
          </div>
          <div className="relative z-10 mx-2.5 mt-1 h-[2px] bg-[#1f6b3c]" />

          {/* 电文列表 */}
          <div
            ref={scrollRef}
            className="relative z-10 h-[calc(100%-44px)] space-y-[3px] overflow-y-auto px-2.5 py-1.5 font-num"
            style={{ scrollbarWidth: "none" }}
          >
            {messages.length === 0 && (
              <div className="text-[12px] tracking-[0.1em] text-[#2f8a52]">
                ...待机中... 等待前线电文
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className="anim-rise text-[13px] leading-[1.45]"
                style={{ color: PHOSPHOR[m.tone], textShadow: `0 0 6px ${PHOSPHOR[m.tone]}66` }}
              >
                <span className="opacity-55">[{stamp(m.t)}]</span> {m.msg}
              </div>
            ))}
            <div className="text-[13px]" style={{ color: "#49d47c" }}>
              <span className="opacity-55">&gt;</span>
              <span className="anim-blink">▌</span>
            </div>
          </div>
        </div>

        {/* 底部铭牌 + 旋钮 */}
        <div className="mt-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="block h-2.5 w-2.5 rounded-full"
              style={{ background: online ? "#6ee08a" : "#5a4a3a", boxShadow: online ? "0 0 7px #6ee08a" : "none" }} />
            <span className="text-[9px] tracking-[0.2em] text-[#2e2b22]">PWR</span>
          </div>
          <div className="flex gap-2">
            {[0, 1].map((i) => (
              <span key={i} className="block h-3 w-3 rounded-full border-2 border-[#3b372c] bg-[#5c5748]" />
            ))}
          </div>
        </div>
      </div>

      {/* ====== 连接线 ====== */}
      {!compact && (
        <div className="relative h-5">
          <svg viewBox="0 0 300 20" className="absolute inset-0 h-5 w-full" preserveAspectRatio="none">
            <path
              d="M40 0 C40 10, 60 4, 60 12 C60 18, 90 18, 120 14 C160 9, 200 18, 250 6"
              fill="none"
              stroke="#15181f"
              strokeWidth="5"
            />
            <path
              d="M40 0 C40 10, 60 4, 60 12 C60 18, 90 18, 120 14 C160 9, 200 18, 250 6"
              fill="none"
              stroke="#39414f"
              strokeWidth="2"
            />
          </svg>
        </div>
      )}

      {/* ====== 电报机 ====== */}
      <div
        className={`relative flex items-center gap-3 ${compact ? "w-[132px] shrink-0 flex-col justify-center" : ""}`}
        style={{
          background: "linear-gradient(180deg,#4a4336 0%,#332e25 100%)",
          border: "3px solid #0d0f14",
          boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.08), 5px 5px 0 rgba(0,0,0,0.6)",
          padding: "8px 10px",
        }}
      >
        <div className={`relative ${keying ? "anim-shake" : ""}`}>
          <PixelSprite name="telegraph" scale={compact ? 2 : 2.6} />
          {/* 电键火花 */}
          {keying && (
            <span
              className="absolute left-[18%] top-[14%] block h-1.5 w-1.5"
              style={{ background: "#ffe9a8", boxShadow: "0 0 8px #ffd23e" }}
            />
          )}
        </div>
        <div className={compact ? "text-center" : ""}>
          <div className="text-[10px] tracking-[0.25em] text-[#c2a14a]">总部电报机</div>
          <div className="mt-0.5 font-num text-[11px] leading-4 text-[#8a8370]">
            KEY · 滴滴答答
          </div>
          {!compact && (
            <div className="mt-1 flex gap-[3px]">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <span
                  key={i}
                  className="block h-[9px] bg-[#c2a14a]"
                  style={{ width: i % 3 === 1 ? 10 : 4, opacity: 0.35 + ((i * 7) % 5) * 0.13 }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
