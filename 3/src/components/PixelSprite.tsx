import { useEffect, useRef } from "react";
import { SPR } from "../game/sprites";

export default function PixelSprite({
  name,
  scale = 4,
  animate = false,
  alt,
  className = "",
}: {
  name: keyof typeof SPR;
  scale?: number;
  animate?: boolean; // 交换 A/B 帧走路动画（仅限有 B 帧的角色）
  alt?: keyof typeof SPR;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!;
    const drawFrame = (n: keyof typeof SPR) => {
      const s = SPR[n];
      cv.width = s.w * scale;
      cv.height = s.h * scale;
      const ctx = cv.getContext("2d")!;
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(s.img, 0, 0, cv.width, cv.height);
    };
    drawFrame(name);
    if (animate && alt) {
      let turn = false;
      const t = setInterval(() => {
        turn = !turn;
        drawFrame(turn ? alt : name);
      }, 320);
      return () => clearInterval(t);
    }
  }, [name, alt, scale, animate]);

  return <canvas ref={ref} className={`[image-rendering:pixelated] ${className}`} />;
}
