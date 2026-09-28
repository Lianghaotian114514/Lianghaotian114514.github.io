import { useEffect, useRef } from "react";

const GLYPHS = "アイウエオカキクケコサシスセソ1145141919810☣⚠机密生化八五010101川味美";

export default function MatrixRain({ opacity = 0.5 }: { opacity?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const fontSize = 15;
    let cols = Math.ceil(w / fontSize);
    let drops = Array.from({ length: cols }, () => Math.random() * -60);

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      cols = Math.ceil(w / fontSize);
      drops = Array.from({ length: cols }, () => Math.random() * -60);
    };
    window.addEventListener("resize", onResize);

    let raf = 0;
    let last = 0;
    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (t - last < 42) return;
      last = t;
      ctx.fillStyle = "rgba(2, 5, 3, 0.15)";
      ctx.fillRect(0, 0, w, h);
      ctx.font = `${fontSize}px "Share Tech Mono", monospace`;
      for (let i = 0; i < cols; i++) {
        const ch = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        const head = Math.random() > 0.975;
        ctx.fillStyle = head ? "#b6ffd2" : Math.random() > 0.94 ? "#ff3b3b" : "#1c7a42";
        ctx.fillText(ch, x, y);
        if (y > h + Math.random() * 4000) drops[i] = 0;
        drops[i]++;
      }
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="fixed inset-0 z-0 h-full w-full transition-opacity duration-1000"
      style={{ opacity }}
      aria-hidden
    />
  );
}
