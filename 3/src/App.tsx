import { useCallback, useEffect, useState } from "react";
import { sfx } from "./game/audio";
import { OPERATORS } from "./game/engine";
import type { OperatorMeta, EndStats } from "./game/engine";
import type { M2End } from "./game/mission2";
import { SelectScreen, HelpModal, ResultScreen, FinalReport, RevengeReport } from "./components/Menu";
import TitleScreen from "./components/TitleScreen";
import {
  OpeningCutscene, Mission2Cutscene, FinaleCutscene, DeployCutscene, CreditsScreen,
  RevengeBriefCutscene, AvengeFinaleCutscene,
} from "./components/Cutscene";
import GameScreen from "./components/GameScreen";
import Mission2Screen from "./components/Mission2Screen";
import Mission3Screen from "./components/Mission3Screen";
import { useCheatCode, CheatTerminal, CheatToast } from "./components/CheatCode";
import CinemaMode from "./components/CinemaMode";
import Armory from "./components/Armory";
import LoadoutScreen from "./components/Loadout";
import BootIntro from "./components/BootIntro";
import { setInfiniteFunds } from "./game/mods";
import type { M3End } from "./game/mission3";

type Screen =
  | "boot" | "title" | "select" | "loadout" | "intro" | "deploy" | "game"
  | "m2brief" | "m2" | "finale" | "credits" | "final-report"
  | "revbrief" | "rev" | "revfinale" | "rev-report"
  | "cinema";

export default function App() {
  const [screen, setScreen] = useState<Screen>(() => {
    // 开场动画仅在本次会话首次进入时播放
    try { return sessionStorage.getItem("b85_booted") === "1" ? "title" : "boot"; }
    catch { return "boot"; }
  });
  const [help, setHelp] = useState(false);
  const [credits, setCredits] = useState(false);
  const [secretOpen, setSecretOpen] = useState(false);
  const [armoryOpen, setArmoryOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [operator, setOperator] = useState<OperatorMeta>(OPERATORS[0]);
  const [m1Stats, setM1Stats] = useState<EndStats | null>(null);
  const [m2Stats, setM2Stats] = useState<M2End | null>(null);
  const [m3Stats, setM3Stats] = useState<M3End | null>(null);
  const [revengeUnlocked, setRevengeUnlocked] = useState<boolean>(() => {
    try { return localStorage.getItem("b85_revenge_unlocked") === "1"; } catch { return false; }
  });
  const unlockRevenge = useCallback(() => {
    setRevengeUnlocked(true);
    try { localStorage.setItem("b85_revenge_unlocked", "1"); } catch { /* noop */ }
  }, []);

  const triggerCheatUnlock = useCallback(() => {
    sfx.ensure();
    sfx.relay();
    unlockRevenge();
  }, [unlockRevenge]);

  // 彩蛋：无限班费
  const triggerRichCheat = useCallback(() => {
    sfx.ensure();
    sfx.relay();
    setInfiniteFunds(true);
  }, []);

  useEffect(() => {
    const kick = () => { sfx.ensure(); sfx.startBgm("prep"); };
    window.addEventListener("pointerdown", kick, { once: true });
    window.addEventListener("keydown", kick, { once: true });
    return () => {
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
    };
  }, []);

  // 彩蛋：盲打 bawu 解锁复仇战役
  const cheatToast = useCheatCode(
    triggerCheatUnlock,
    screen === "title" || screen === "select",
    triggerRichCheat,
  );

  const toggleMute = useCallback(() => {
    setMuted((m) => { sfx.setMuted(!m); return !m; });
  }, []);

  const pick = useCallback((m: OperatorMeta) => {
    setOperator(m);
    sfx.click();
    setScreen("loadout");
  }, []);

  const backToTitle = useCallback(() => {
    sfx.stopAllLoops();
    sfx.startBgm("prep");
    setM1Stats(null);
    setM2Stats(null);
    setM3Stats(null);
    setScreen("title");
  }, []);

  return (
    <div className="crt relative min-h-screen bg-[#07090d] text-[#dcd8c8]">
      <Grit />

      <button
        className="px-btn px-btn-dark fixed right-3 top-3 z-[90] px-3 py-1.5 text-sm tracking-[0.2em]"
        onClick={toggleMute}
      >
        {muted ? "✖ 静音" : "♪ 音响"}
      </button>

      {screen === "boot" && (
        <BootIntro
          onDone={() => {
            try { sessionStorage.setItem("b85_booted", "1"); } catch { /* noop */ }
            sfx.ensure();
            sfx.startBgm("prep");
            setScreen("title");
          }}
        />
      )}

      {screen === "title" && (
        <TitleScreen
          onStart={() => { sfx.click(); setScreen("select"); }}
          onHelp={() => { sfx.click(); setHelp(true); }}
          onCredits={() => { sfx.click(); setCredits(true); }}
          onSecret={() => { sfx.click(); setSecretOpen(true); }}
          onCinema={() => { sfx.click(); sfx.stopAllLoops(); setScreen("cinema"); }}
          onArmory={() => { sfx.click(); setArmoryOpen(true); }}
          onReplayIntro={() => { sfx.click(); sfx.stopAllLoops(); setScreen("boot"); }}
          revengeUnlocked={revengeUnlocked}
          onRevenge={() => { sfx.click(); setM3Stats(null); setScreen("revbrief"); }}
        />
      )}

      {screen === "select" && (
        <SelectScreen onPick={pick} onBack={() => { sfx.click(); setScreen("title"); }} />
      )}

      {screen === "loadout" && (
        <LoadoutScreen
          onConfirm={() => setScreen("intro")}
          onBack={() => setScreen("select")}
          onArmory={() => setArmoryOpen(true)}
        />
      )}

      {screen === "intro" && (
        <OpeningCutscene onDone={() => { sfx.click(); setScreen("deploy"); }} />
      )}

      {screen === "deploy" && (
        <DeployCutscene
          operator={operator.id}
          onDone={() => { sfx.click(); sfx.startBgm("battle"); setScreen("game"); }}
        />
      )}

      {screen === "game" && (
        <GameScreen
          key={operator.id}
          operator={operator}
          sfx={sfx}
          onQuit={backToTitle}
          onCampaignNext={(stats) => {
            setM1Stats(stats);
            unlockRevenge();
            sfx.stopAllLoops();
            setScreen("m2brief");
          }}
        />
      )}

      {screen === "m2brief" && (
        <Mission2Cutscene onDone={() => { sfx.click(); setScreen("m2"); }} />
      )}

      {screen === "m2" && (
        <Mission2Screen
          operator={operator}
          onFinish={(res) => {
            setM2Stats(res);
            sfx.stopAllLoops();
            sfx.stopBgm();
            setScreen(res.win ? "finale" : "final-report");
          }}
        />
      )}

      {screen === "finale" && (
        <FinaleCutscene onDone={() => setScreen("credits")} />
      )}

      {screen === "credits" && (
        <CreditsScreen onDone={() => { sfx.click(); setScreen("final-report"); }} />
      )}

      {screen === "cinema" && (
        <CinemaMode onExit={backToTitle} />
      )}

      {screen === "revbrief" && (
        <RevengeBriefCutscene onDone={() => { sfx.click(); setScreen("rev"); }} />
      )}

      {screen === "rev" && (
        <Mission3Screen
          operator={operator}
          onFinish={(res) => {
            setM3Stats(res);
            sfx.stopAllLoops();
            setScreen(res.win ? "revfinale" : "rev-report");
          }}
        />
      )}

      {screen === "revfinale" && (
        <AvengeFinaleCutscene onDone={() => setScreen("credits")} />
      )}

      {screen === "rev-report" && m3Stats && (
        <RevengeReport
          operator={operator.name}
          stats={m3Stats}
          onRetry={() => { sfx.click(); setScreen("rev"); }}
          onMenu={backToTitle}
        />
      )}

      {screen === "final-report" && m2Stats && (
        <FinalReport
          operator={operator.name}
          m1={m1Stats}
          m2={m2Stats}
          onRetryM2={() => { sfx.click(); setScreen("m2"); }}
          onMenu={backToTitle}
        />
      )}

      {/* 第一战役失败时由 GameScreen 内部结算，此处兜底 */}
      {screen === "final-report" && !m2Stats && m1Stats && (
        <ResultScreen stats={m1Stats} operator={operator.name} onRestart={() => setScreen("game")} onMenu={backToTitle} />
      )}

      {help && <HelpModal onClose={() => setHelp(false)} />}
      {armoryOpen && <Armory onClose={() => setArmoryOpen(false)} />}
      {credits && <CreditsScreen onDone={() => setCredits(false)} />}
      {secretOpen && (
        <CheatTerminal
          onUnlock={triggerCheatUnlock}
          onRich={triggerRichCheat}
          onClose={() => setSecretOpen(false)}
        />
      )}
      {cheatToast && <CheatToast text={cheatToast} />}
    </div>
  );
}

// 硬核颗粒背景
function Grit() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 3px), repeating-linear-gradient(-45deg, #fff 0 1px, transparent 1px 4px)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(60,66,80,0.22) 0%, rgba(7,9,13,0) 70%)" }}
      />
    </div>
  );
}
