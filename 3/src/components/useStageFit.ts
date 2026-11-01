import { useEffect, useState } from "react";

export interface StageFit {
  /** 画布显示宽度(px) */
  w: number;
  /** 画布显示高度(px) */
  h: number;
  /** HUD 缩放系数（以 960 设计宽为基准） */
  scale: number;
  /** 是否竖屏 */
  portrait: boolean;
  /** 是否窄屏（隐藏侧栏） */
  narrow: boolean;
  /** 视口尺寸 */
  vw: number;
  vh: number;
  /** 是否触屏设备 */
  isTouch: boolean;
  /** 手机竖屏（需要提示旋转/紧凑布局） */
  phonePortrait: boolean;
  /** 手机横屏（全屏沉浸操作） */
  phoneLandscape: boolean;
  /** HUD 紧凑模式 */
  compact: boolean;
}

const DESIGN_W = 960;
const DESIGN_H = 540;

/**
 * 计算 16:9 画布在当前视口下的最大显示尺寸。
 * 侧栏宽度固定参与计算，避免画面因侧栏显隐而忽大忽小。
 */
export function useStageFit(opts: {
  sideW?: number;        // 右侧终端宽度
  reserveH?: number;     // 需要预留的竖直空间（操作台/提示条）
  touch?: boolean;
} = {}): StageFit {
  const { sideW = 304, reserveH = 56, touch = false } = opts;
  const [fit, setFit] = useState<StageFit>(() => calc());

  function calc(): StageFit {
    const vw = typeof window === "undefined" ? 1280 : window.innerWidth;
    const vh = typeof window === "undefined" ? 720 : window.innerHeight;
    const portrait = vh > vw;
    const isTouch = touch || (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
    // 手机判定：触屏 + 短边较小
    const shortSide = Math.min(vw, vh);
    const isPhone = isTouch && shortSide < 820;
    const phonePortrait = isPhone && portrait;
    const phoneLandscape = isPhone && !portrait;
    // 侧栏仅在足够宽时出现；阈值固定，避免临界抖动
    const narrow = vw < 1240;
    const gap = 12;
    // 手机横屏去掉内边距，追求满屏沉浸
    const pad = phoneLandscape ? 2 : 16;

    // 竖屏：摇杆操作台在画面下方；横屏：操作台悬浮于画面之上，不占额外高度
    const extraH = phonePortrait ? Math.min(250, vh * 0.34)
      : phoneLandscape ? 0
      : touch && portrait ? 210
      : reserveH;
    const availW = Math.max(240, vw - pad - (narrow ? 0 : sideW + gap));
    const availH = Math.max(160, vh - pad - extraH);

    // 以 16:9 取最大内接尺寸
    let w = availW;
    let h = (w * DESIGN_H) / DESIGN_W;
    if (h > availH) {
      h = availH;
      w = (h * DESIGN_W) / DESIGN_H;
    }
    // 取整，避免亚像素导致的像素画模糊
    w = Math.floor(w);
    h = Math.floor(h);
    return {
      w, h, scale: w / DESIGN_W, portrait, narrow, vw, vh,
      isTouch, phonePortrait, phoneLandscape,
      compact: w < 700,
    };
  }

  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setFit(calc()));
    };
    onResize();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sideW, reserveH, touch]);

  return fit;
}
