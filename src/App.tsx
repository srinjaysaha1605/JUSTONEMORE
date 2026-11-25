import { useCallback, useEffect, useState } from 'react';
import { ArcadeLobby } from './components/ArcadeLobby';
import { DiceLoader } from './components/DiceLoader';
import { HistoryScreen } from './components/HistoryScreen';
import { LandingScreen } from './components/LandingScreen';
import { ProfileModal } from './components/ProfileModal';
import { SettingsModal } from './components/SettingsModal';
import type { ScreenId } from './engine/types';
import { CoinFlipGame } from './games/CoinFlipGame';
import { CrashGame } from './games/CrashGame';
import { DiceGame } from './games/DiceGame';
import { KenoGame } from './games/KenoGame';
import { MinesGame } from './games/MinesGame';
import { PlinkoGame } from './games/PlinkoGame';
import { ShellShuffleGame } from './games/ShellShuffleGame';
import { SlotsGame } from './games/SlotsGame';
import { TowerGame } from './games/TowerGame';
import { WheelGame } from './games/WheelGame';
import { useArcadeStore } from './state/useArcadeStore';

function getInitialScreen(): ScreenId {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      return 'lobby';
    }
  }
  return 'landing';
}

export default function App() {
  const {
    state,
    toastQueue,
    placeBet,
    completeRound,
    claimDailyReward,
    claimBailout,
    cheatCoins,
    updateSettings,
    toggleSound,
    toggleTheme,
    toggleCrt,
    resetProgress,
  } = useArcadeStore();

  const [screen, setScreen] = useState<ScreenId>(() => getInitialScreen());
  const [pendingScreen, setPendingScreen] = useState<ScreenId | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const navigateWithDice = useCallback((next: ScreenId) => {
    setShowProfile(false);
    setShowSettings(false);
    setPendingScreen(next);
  }, []);

  const handleLoaderComplete = useCallback(() => {
    if (pendingScreen) {
      setScreen(pendingScreen);
      setPendingScreen(null);
    }
  }, [pendingScreen]);

  useEffect(() => {
    document.body.dataset.state =
      pendingScreen === null && screen === 'landing' ? 'title' : 'playing';
  }, [screen, pendingScreen]);

  const activeToast = toastQueue[0] ?? null;
  const { soundEnabled, scanlinesEnabled, flickerEnabled, theme } =
    state.settings;

  return (
    <div
      className={`min-h-screen w-full relative bg-[var(--bg-casing)] text-[var(--ink-primary)] ${
        flickerEnabled ? 'lcd-flicker' : ''
      }`}
    >
      {pendingScreen !== null ? (
        <DiceLoader key={pendingScreen} onComplete={handleLoaderComplete} />
      ) : (
        <>
          {screen === 'landing' && (
            <LandingScreen
              soundEnabled={soundEnabled}
              crtEnabled={scanlinesEnabled}
              theme={theme}
              onToggleSound={toggleSound}
              onToggleCrt={toggleCrt}
              onToggleTheme={toggleTheme}
              onEnterArcade={() => navigateWithDice('lobby')}
            />
          )}

          {screen === 'lobby' && (
            <ArcadeLobby
              state={state}
              onSelectGame={(id) => navigateWithDice(id)}
              onOpenHistory={() => navigateWithDice('history')}
              onOpenProfile={() => setShowProfile(true)}
              onOpenSettings={() => setShowSettings(true)}
              onToggleSound={toggleSound}
              onToggleCrt={toggleCrt}
              onToggleTheme={toggleTheme}
              onClaimDaily={claimDailyReward}
              onClaimBailout={claimBailout}
              onCheatCoins={cheatCoins}
            />
          )}

          {screen === 'history' && (
            <HistoryScreen
              history={state.history}
              balance={state.balance}
              soundEnabled={soundEnabled}
              crtEnabled={scanlinesEnabled}
              theme={theme}
              onToggleSound={toggleSound}
              onToggleCrt={toggleCrt}
              onToggleTheme={toggleTheme}
              onBack={() => navigateWithDice('lobby')}
              onCheatCoins={cheatCoins}
            />
          )}

          {screen === 'mines' && (
            <MinesGame
              balance={state.balance}
              soundEnabled={soundEnabled}
              crtEnabled={scanlinesEnabled}
              theme={theme}
              onToggleSound={toggleSound}
              onToggleCrt={toggleCrt}
              onToggleTheme={toggleTheme}
              onBack={() => navigateWithDice('lobby')}
              onPlaceBet={placeBet}
              onCompleteRound={completeRound}
              onClaimBailout={claimBailout}
              onCheatCoins={cheatCoins}
            />
          )}

          {screen === 'plinko' && (
            <PlinkoGame
              balance={state.balance}
              soundEnabled={soundEnabled}
              crtEnabled={scanlinesEnabled}
              theme={theme}
              onToggleSound={toggleSound}
              onToggleCrt={toggleCrt}
              onToggleTheme={toggleTheme}
              onBack={() => navigateWithDice('lobby')}
              onPlaceBet={placeBet}
              onCompleteRound={completeRound}
              onClaimBailout={claimBailout}
              onCheatCoins={cheatCoins}
            />
          )}

          {screen === 'slots' && (
            <SlotsGame
              balance={state.balance}
              soundEnabled={soundEnabled}
              crtEnabled={scanlinesEnabled}
              theme={theme}
              onToggleSound={toggleSound}
              onToggleCrt={toggleCrt}
              onToggleTheme={toggleTheme}
              onBack={() => navigateWithDice('lobby')}
              onPlaceBet={placeBet}
              onCompleteRound={completeRound}
              onClaimBailout={claimBailout}
              onCheatCoins={cheatCoins}
            />
          )}

          {screen === 'dice' && (
            <DiceGame
              balance={state.balance}
              soundEnabled={soundEnabled}
              crtEnabled={scanlinesEnabled}
              theme={theme}
              onToggleSound={toggleSound}
              onToggleCrt={toggleCrt}
              onToggleTheme={toggleTheme}
              onBack={() => navigateWithDice('lobby')}
              onPlaceBet={placeBet}
              onCompleteRound={completeRound}
              onClaimBailout={claimBailout}
              onCheatCoins={cheatCoins}
            />
          )}

          {screen === 'crash' && (
            <CrashGame
              balance={state.balance}
              soundEnabled={soundEnabled}
              crtEnabled={scanlinesEnabled}
              theme={theme}
              onToggleSound={toggleSound}
              onToggleCrt={toggleCrt}
              onToggleTheme={toggleTheme}
              onBack={() => navigateWithDice('lobby')}
              onPlaceBet={placeBet}
              onCompleteRound={completeRound}
              onClaimBailout={claimBailout}
              onCheatCoins={cheatCoins}
            />
          )}

          {screen === 'wheel' && (
            <WheelGame
              balance={state.balance}
              soundEnabled={soundEnabled}
              crtEnabled={scanlinesEnabled}
              theme={theme}
              onToggleSound={toggleSound}
              onToggleCrt={toggleCrt}
              onToggleTheme={toggleTheme}
              onBack={() => navigateWithDice('lobby')}
              onPlaceBet={placeBet}
              onCompleteRound={completeRound}
              onClaimBailout={claimBailout}
              onCheatCoins={cheatCoins}
            />
          )}

          {screen === 'tower' && (
            <TowerGame
              balance={state.balance}
              soundEnabled={soundEnabled}
              crtEnabled={scanlinesEnabled}
              theme={theme}
              onToggleSound={toggleSound}
              onToggleCrt={toggleCrt}
              onToggleTheme={toggleTheme}
              onBack={() => navigateWithDice('lobby')}
              onPlaceBet={placeBet}
              onCompleteRound={completeRound}
              onClaimBailout={claimBailout}
              onCheatCoins={cheatCoins}
            />
          )}

          {screen === 'coinflip' && (
            <CoinFlipGame
              balance={state.balance}
              soundEnabled={soundEnabled}
              crtEnabled={scanlinesEnabled}
              theme={theme}
              onToggleSound={toggleSound}
              onToggleCrt={toggleCrt}
              onToggleTheme={toggleTheme}
              onBack={() => navigateWithDice('lobby')}
              onPlaceBet={placeBet}
              onCompleteRound={completeRound}
              onClaimBailout={claimBailout}
              onCheatCoins={cheatCoins}
            />
          )}

          {screen === 'cups' && (
            <ShellShuffleGame
              balance={state.balance}
              soundEnabled={soundEnabled}
              crtEnabled={scanlinesEnabled}
              theme={theme}
              onToggleSound={toggleSound}
              onToggleCrt={toggleCrt}
              onToggleTheme={toggleTheme}
              onBack={() => navigateWithDice('lobby')}
              onPlaceBet={placeBet}
              onCompleteRound={completeRound}
              onClaimBailout={claimBailout}
              onCheatCoins={cheatCoins}
            />
          )}

          {screen === 'keno' && (
            <KenoGame
              balance={state.balance}
              soundEnabled={soundEnabled}
              crtEnabled={scanlinesEnabled}
              theme={theme}
              onToggleSound={toggleSound}
              onToggleCrt={toggleCrt}
              onToggleTheme={toggleTheme}
              onBack={() => navigateWithDice('lobby')}
              onPlaceBet={placeBet}
              onCompleteRound={completeRound}
              onClaimBailout={claimBailout}
              onCheatCoins={cheatCoins}
            />
          )}

          {showProfile && (
            <ProfileModal state={state} onClose={() => setShowProfile(false)} />
          )}

          {showSettings && (
            <SettingsModal
              settings={state.settings}
              onUpdate={updateSettings}
              onReset={resetProgress}
              onClose={() => setShowSettings(false)}
            />
          )}

          {/* Achievement Unlock Notification */}
          {activeToast && (
            <div
              role="status"
              className="fixed bottom-4 right-4 z-50 bg-[var(--accent)] text-[var(--accent-ink)] border-2 border-[var(--ink-primary)] px-4 py-3 shadow-[0_4px_0_var(--shadow-edge)] max-w-xs"
            >
              <div className="font-pixel text-[10px] tracking-wider">
                ACHIEVEMENT UNLOCKED
              </div>
              <div className="font-pixel text-xs sm:text-sm mt-0.5">
                {activeToast.title}
              </div>
            </div>
          )}
        </>
      )}

      {/* Subtle CRT/LCD Scanline Overlay */}
      {scanlinesEnabled && (
        <div aria-hidden="true" className="fixed inset-0 z-50 lcd-scanlines" />
      )}
    </div>
  );
}
