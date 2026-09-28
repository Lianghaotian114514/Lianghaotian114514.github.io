import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import MatrixRain from "./components/MatrixRain";
import { Overlays } from "./components/Effects";
import BootSequence from "./components/BootSequence";
import LockScreen from "./components/LockScreen";
import Archive from "./components/Archive";

type Stage = "boot" | "lock" | "main";

export default function App() {
  const [stage, setStage] = useState<Stage>("boot");

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#020503]">
      {/* 矩阵雨背景 */}
      <MatrixRain opacity={stage === "main" ? 0.14 : 0.4} />

      {/* 底部磷光 */}
      <div
        className="pointer-events-none fixed inset-0 z-[5]"
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% 110%, rgba(61,255,136,0.07), transparent 60%)",
        }}
        aria-hidden
      />

      <AnimatePresence mode="wait">
        {stage === "boot" && <BootSequence key="boot" onDone={() => setStage("lock")} />}
        {stage === "lock" && <LockScreen key="lock" onGranted={() => setStage("main")} />}
        {stage === "main" && <Archive key="main" onExit={() => setStage("lock")} />}
      </AnimatePresence>

      {/* CRT 特效覆盖层 */}
      <Overlays />
    </div>
  );
}
