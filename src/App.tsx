/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Palette,
  Globe2,
  Sparkles,
  Eye,
  EyeOff,
  Edit3,
  Clock,
  RotateCcw,
  Check,
  MessageSquare,
} from 'lucide-react';
import { AmbientBackground, THEMES, ThemeConfig } from './components/AmbientBackground';
import { GREETINGS_LIST, GreetingItem } from './data/greetings';
import { soundManager } from './utils/audio';
import { FeedbackModal } from './components/FeedbackModal';

export default function App() {
  // Active theme
  const [currentThemeKey, setCurrentThemeKey] = useState<string>('aurora');
  const currentTheme: ThemeConfig = THEMES[currentThemeKey] || THEMES.aurora;

  // Active greeting
  const [greetingIndex, setGreetingIndex] = useState<number>(0);
  const [customRecipient, setCustomRecipient] = useState<string>('');
  const [isEditingRecipient, setIsEditingRecipient] = useState<boolean>(false);
  const [tempRecipient, setTempRecipient] = useState<string>('');

  // Audio mute
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Kiosk / Zen Mode (hide all controls for pure display)
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [showControlsTemporary, setShowControlsTemporary] = useState<boolean>(false);
  const controlsTimeoutRef = useRef<number | null>(null);

  // Live Clock & Date
  const [showClock, setShowClock] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Interactive letter bounce / click count
  const [clickCount, setClickCount] = useState<number>(0);
  const [lastBurstCoords, setLastBurstCoords] = useState<{ x: number; y: number } | null>(null);

  // Menus & Modals
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState<boolean>(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState<boolean>(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState<boolean>(false);

  const activeGreeting: GreetingItem = GREETINGS_LIST[greetingIndex];

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);


  // Handle Fullscreen change events
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in inputs or modal is open
      if (isEditingRecipient || isFeedbackOpen) return;

      if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      } else if (e.key.toLowerCase() === 'z') {
        setIsZenMode((prev) => !prev);
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        triggerChimeAndSparkle();
      } else if (e.key.toLowerCase() === 't') {
        cycleTheme();
      } else if (e.key.toLowerCase() === 'l') {
        setGreetingIndex((prev) => (prev + 1) % GREETINGS_LIST.length);
      } else if (e.key.toLowerCase() === 'b') {
        setIsFeedbackOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditingRecipient, isFeedbackOpen, currentThemeKey]);

  // Mouse activity in Zen mode to temporarily reveal controls
  const handleMouseMove = useCallback(() => {
    if (!isZenMode) return;
    setShowControlsTemporary(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      setShowControlsTemporary(false);
    }, 2800);
  }, [isZenMode]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch {
      // Fullscreen might be blocked in some iframe contexts
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundManager.setMuted(nextMuted);
    if (!nextMuted) {
      soundManager.playWelcomeChime();
    }
  };

  const cycleTheme = () => {
    const keys = Object.keys(THEMES);
    const currIdx = keys.indexOf(currentThemeKey);
    const nextKey = keys[(currIdx + 1) % keys.length];
    setCurrentThemeKey(nextKey);
  };

  const triggerChimeAndSparkle = (e?: React.MouseEvent) => {
    soundManager.playWelcomeChime();
    setClickCount((prev) => prev + 1);
    if (e) {
      setLastBurstCoords({ x: e.clientX, y: e.clientY });
    }
  };

  const handleSaveRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomRecipient(tempRecipient.trim());
    setIsEditingRecipient(false);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.menu-container')) {
        setIsThemeMenuOpen(false);
        setIsLangMenuOpen(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const formattedDate = currentTime.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const controlsVisible = !isZenMode || showControlsTemporary;

  return (
    <main
      onMouseMove={handleMouseMove}
      className={`relative w-screen h-screen overflow-hidden flex flex-col justify-between select-none ${
        currentTheme.isDark ? 'text-white' : 'text-slate-900'
      }`}
    >
      {/* Dynamic 60fps Ambient Particle & Light Field */}
      <AmbientBackground theme={currentTheme} />

      {/* Top Header / Bar */}
      <header
        className={`relative z-20 w-full px-2.5 sm:px-6 py-2 sm:py-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1.5 sm:gap-3 transition-all duration-500 ${
          controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        {/* Top Bar on Mobile / Left on Desktop: Status badge & Live Clock */}
        <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2.5">
          {/* Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full backdrop-blur-md border text-[11px] sm:text-xs font-medium transition-all ${
              currentTheme.isDark
                ? 'bg-white/5 border-white/10 text-white/90 shadow-lg shadow-black/20'
                : 'bg-black/5 border-black/10 text-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="tracking-wide uppercase font-semibold text-[9px] sm:text-[10px]">Live</span>
            <span className="opacity-30">|</span>
            <span className="font-mono tabular-nums text-[10px] sm:text-xs">{activeGreeting.badge}</span>
          </div>

          {/* Live Clock & Date: Visible on BOTH Mobile & Desktop */}
          {showClock && (
            <div
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full sm:rounded-xl backdrop-blur-md border text-[11px] sm:text-xs transition-all ${
                currentTheme.isDark
                  ? 'bg-white/5 border-white/10 text-white/85'
                  : 'bg-black/5 border-black/10 text-slate-700'
              }`}
            >
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-60 shrink-0" />
              <span className="font-mono text-[10px] sm:text-sm font-semibold tracking-wider tabular-nums whitespace-nowrap">
                {formattedTime}
              </span>
              <span className="hidden sm:inline opacity-30">·</span>
              <span className="hidden md:inline text-[11px] opacity-70 tracking-wide whitespace-nowrap">
                {formattedDate}
              </span>
            </div>
          )}
        </div>

        {/* Right: Action Controls (All visible, neatly arranged with touch padding on mobile) */}
        <div className="flex items-center justify-between sm:justify-end gap-1 sm:gap-2 menu-container py-0.5">
          {/* Sound Toggle */}
          <button
            onClick={toggleMute}
            title={isMuted ? 'Unmute chime audio' : 'Mute audio chime'}
            aria-label="Toggle Sound"
            className={`p-2 sm:p-2.5 rounded-full backdrop-blur-md border transition-all touch-manipulation ${
              currentTheme.isDark
                ? 'bg-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/15'
                : 'bg-black/5 border-black/10 text-slate-700 hover:text-slate-900 hover:bg-black/10'
            }`}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>

          {/* Theme Selector Button & Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsThemeMenuOpen((prev) => !prev);
                setIsLangMenuOpen(false);
              }}
              title="Change Theme Palette"
              aria-label="Change Theme"
              className={`flex items-center gap-1 p-2 sm:px-3 sm:py-2 rounded-full backdrop-blur-md border text-xs font-medium transition-all touch-manipulation ${
                currentTheme.isDark
                  ? 'bg-white/5 border-white/10 text-white/90 hover:bg-white/15'
                  : 'bg-black/5 border-black/10 text-slate-800 hover:bg-black/10'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{currentTheme.name}</span>
            </button>

            {/* Theme Dropdown */}
            {isThemeMenuOpen && (
              <div
                className={`absolute right-0 top-full mt-2 w-48 py-2 rounded-2xl shadow-2xl backdrop-blur-xl border z-40 max-w-[calc(100vw-1.5rem)] transition-all ${
                  currentTheme.isDark
                    ? 'bg-slate-900/95 border-white/15 text-white shadow-black/60'
                    : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/60'
                }`}
              >
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Select Theme
                </div>
                {Object.values(THEMES).map((th) => (
                  <button
                    key={th.id}
                    onClick={() => {
                      setCurrentThemeKey(th.id);
                      setIsThemeMenuOpen(false);
                      soundManager.playPop();
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                      th.id === currentThemeKey
                        ? currentTheme.isDark
                          ? 'bg-white/15 font-semibold text-white'
                          : 'bg-slate-100 font-semibold text-slate-950'
                        : currentTheme.isDark
                        ? 'hover:bg-white/10 text-white/80'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{th.name}</span>
                    {th.id === currentThemeKey && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Language Selector Button & Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsLangMenuOpen((prev) => !prev);
                setIsThemeMenuOpen(false);
              }}
              title="Change Greeting Language"
              aria-label="Change Language"
              className={`flex items-center gap-1 p-2 sm:px-3 sm:py-2 rounded-full backdrop-blur-md border text-xs font-medium transition-all touch-manipulation ${
                currentTheme.isDark
                  ? 'bg-white/5 border-white/10 text-white/90 hover:bg-white/15'
                  : 'bg-black/5 border-black/10 text-slate-800 hover:bg-black/10'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{activeGreeting.language}</span>
            </button>

            {/* Language Dropdown */}
            {isLangMenuOpen && (
              <div
                className={`absolute right-0 top-full mt-2 w-52 sm:w-56 py-2 rounded-2xl shadow-2xl backdrop-blur-xl border max-h-80 overflow-y-auto no-scrollbar z-40 max-w-[calc(100vw-1.5rem)] transition-all ${
                  currentTheme.isDark
                    ? 'bg-slate-900/95 border-white/15 text-white shadow-black/60'
                    : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/60'
                }`}
              >
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Select Language
                </div>
                {GREETINGS_LIST.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setGreetingIndex(idx);
                      setIsLangMenuOpen(false);
                      soundManager.playWelcomeChime();
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                      idx === greetingIndex
                        ? currentTheme.isDark
                          ? 'bg-white/15 font-semibold text-white'
                          : 'bg-slate-100 font-semibold text-slate-950'
                        : currentTheme.isDark
                        ? 'hover:bg-white/10 text-white/80'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{item.nativeWord}</div>
                      <div className="text-[10px] opacity-60">{item.language}</div>
                    </div>
                    {idx === greetingIndex && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (F)'}
            aria-label="Toggle Fullscreen"
            className={`p-2 sm:p-2.5 rounded-full backdrop-blur-md border transition-all touch-manipulation ${
              currentTheme.isDark
                ? 'bg-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/15'
                : 'bg-black/5 border-black/10 text-slate-700 hover:text-slate-900 hover:bg-black/10'
            }`}
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Maximize className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>

          {/* Feedback Icon Button */}
          <button
            onClick={() => setIsFeedbackOpen(true)}
            title="फीडबैक / नोट्स भेजें (Send Feedback to Yaaro Ka Yaar)"
            aria-label="Send Feedback"
            className={`flex items-center gap-1 p-2 sm:px-3 sm:py-2 rounded-full backdrop-blur-md border text-xs font-semibold transition-all shadow-sm touch-manipulation ${
              currentTheme.isDark
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Feedback</span>
          </button>

          {/* Zen / Kiosk Mode Button */}
          <button
            onClick={() => setIsZenMode(true)}
            title="Clean Zen Mode (Hides UI for pure signage display - Press Z)"
            aria-label="Toggle Zen Mode"
            className={`p-2 sm:p-2.5 rounded-full backdrop-blur-md border transition-all touch-manipulation ${
              currentTheme.isDark
                ? 'bg-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/15'
                : 'bg-black/5 border-black/10 text-slate-700 hover:text-slate-900 hover:bg-black/10'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </header>

      {/* Main Full-Screen Centerpiece: The "WELCOME" Presentation */}
      <section
        onClick={triggerChimeAndSparkle}
        className="relative z-10 flex-1 flex flex-col items-center justify-center px-2.5 sm:px-8 text-center cursor-pointer select-none"
      >
        {/* Subtle decorative aura badge / recipient intro */}
        <div className="mb-2 sm:mb-4 flex items-center gap-2">
          {customRecipient ? (
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-medium backdrop-blur-md border transition-all ${currentTheme.badgeBg}`}
            >
              <span>Honoring</span>
              <span className="font-semibold">{customRecipient}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCustomRecipient('');
                }}
                className="hover:opacity-75 text-xs opacity-60 ml-1 p-0.5"
                title="Clear name"
              >
                ✕
              </button>
            </div>
          ) : (
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium tracking-widest uppercase backdrop-blur-md border transition-all ${currentTheme.badgeBg}`}
            >
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Full Screen Welcome Experience</span>
            </div>
          )}
        </div>

        {/* GIANT FULL-SCREEN "WELCOME" DISPLAY */}
        <div className="relative group max-w-full px-2">
          <h1
            className={`font-display font-extrabold tracking-tight leading-none text-transparent bg-clip-text animate-gradient-x select-none transition-all duration-700 ${currentTheme.textGradient}`}
            style={{
              fontSize: 'clamp(2.75rem, 14vw, 13rem)',
              textShadow: currentTheme.isDark
                ? '0 0 60px rgba(255,255,255,0.1), 0 20px 40px rgba(0,0,0,0.6)'
                : '0 10px 30px rgba(0,0,0,0.08)',
            }}
          >
            {activeGreeting.nativeWord}
          </h1>

          {/* Interactive touch hint overlay when hovered */}
          <div className="absolute -bottom-3 sm:-bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-75 transition-opacity text-[10px] sm:text-[11px] font-mono tracking-widest uppercase whitespace-nowrap">
            Tap anywhere for chime & sparkles
          </div>
        </div>

        {/* In-between "TO" text */}
        <div className="mt-2 sm:mt-4 mb-1 sm:mb-2 flex items-center justify-center gap-2 sm:gap-3 select-none">
          <div className="h-px w-6 sm:w-12 bg-current opacity-25" />
          <span
            className={`text-xs sm:text-base md:text-lg font-bold tracking-[0.25em] sm:tracking-[0.3em] uppercase opacity-85 transition-colors duration-500 ${currentTheme.subtextColor}`}
          >
            TO
          </span>
          <div className="h-px w-6 sm:w-12 bg-current opacity-25" />
        </div>

        {/* Note directly underneath: Yaaro Ka Yaar */}
        <div className="max-w-3xl mx-auto flex flex-col items-center px-2">
          <p
            className={`text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-wide transition-colors duration-500 ${currentTheme.subtextColor}`}
          >
            {customRecipient
              ? `${customRecipient} · Yaaro Ka Yaar`
              : activeGreeting.subphrase}
          </p>

          {activeGreeting.pronunciation && (
            <span className="mt-1 sm:mt-2 text-[10px] sm:text-sm font-mono opacity-60 tracking-wider">
              [{activeGreeting.pronunciation}]
            </span>
          )}
        </div>

        {/* Quick Language Chip Bar: Touch-scrollable on mobile so nothing is hidden and layout never breaks */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`mt-4 sm:mt-8 w-full max-w-full sm:max-w-3xl flex items-center justify-start sm:justify-center gap-1.5 sm:gap-2 px-2 overflow-x-auto sm:flex-wrap sm:overflow-visible no-scrollbar transition-all duration-500 ${
            controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          {GREETINGS_LIST.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => {
                setGreetingIndex(idx);
                soundManager.playWelcomeChime();
              }}
              className={`shrink-0 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs rounded-full transition-all duration-300 backdrop-blur-md border touch-manipulation ${
                idx === greetingIndex
                  ? currentTheme.isDark
                    ? 'bg-white/20 border-white/40 text-white font-semibold scale-105 shadow-md'
                    : 'bg-black/15 border-black/30 text-black font-semibold scale-105'
                  : currentTheme.isDark
                  ? 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                  : 'bg-black/5 border-black/10 text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.nativeWord} ({item.language})
            </button>
          ))}
        </div>
      </section>

      {/* Bottom Footer Bar */}
      <footer
        className={`relative z-20 w-full px-2.5 sm:px-6 py-2 sm:py-3.5 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 transition-all duration-500 ${
          controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {/* Left: Quick Personalize + Clock Toggle + Feedback (All visible on mobile!) */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2 w-full sm:w-auto">
          {isEditingRecipient ? (
            <form onSubmit={handleSaveRecipient} className="flex items-center gap-1.5">
              <input
                type="text"
                autoFocus
                value={tempRecipient}
                onChange={(e) => setTempRecipient(e.target.value)}
                placeholder="Enter name (e.g., Yaaro Ka Yaar)..."
                className={`px-2.5 py-1 text-xs rounded-lg backdrop-blur-md border outline-none transition-all w-36 sm:w-48 ${
                  currentTheme.isDark
                    ? 'bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-white/50'
                    : 'bg-black/5 border-black/20 text-slate-900 placeholder-slate-400 focus:border-black/50'
                }`}
              />
              <button
                type="submit"
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-xs"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditingRecipient(false)}
                className="px-2 py-1 text-xs opacity-70 hover:opacity-100"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => {
                setTempRecipient(customRecipient);
                setIsEditingRecipient(true);
              }}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium backdrop-blur-md border transition-all touch-manipulation ${
                currentTheme.isDark
                  ? 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10'
                  : 'bg-black/5 border-black/10 text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{customRecipient ? `Name: ${customRecipient}` : 'Add Name'}</span>
            </button>
          )}

          {/* Clock toggle: Fully visible on Mobile & Desktop */}
          <button
            onClick={() => setShowClock((prev) => !prev)}
            title="Toggle Clock display"
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium backdrop-blur-md border transition-all touch-manipulation ${
              showClock
                ? currentTheme.isDark
                  ? 'bg-white/15 border-white/25 text-white'
                  : 'bg-black/10 border-black/20 text-slate-900'
                : currentTheme.isDark
                ? 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                : 'bg-black/5 border-black/10 text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Clock</span>
          </button>

          {/* Feedback Notes Button: Fully visible on Mobile & Desktop */}
          <button
            onClick={() => setIsFeedbackOpen(true)}
            title="Send Feedback to Yaaro Ka Yaar"
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium backdrop-blur-md border transition-all touch-manipulation ${
              currentTheme.isDark
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Feedback</span>
          </button>
        </div>

        {/* Center: Helpful Keyboard Hints (Desktop only, as mobile uses touch) */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] opacity-60 font-mono">
          <span>[F] Fullscreen</span>
          <span>·</span>
          <span>[Space] Chime</span>
          <span>·</span>
          <span>[T] Theme</span>
          <span>·</span>
          <span>[L] Language</span>
          <span>·</span>
          <span>[B] Feedback</span>
          <span>·</span>
          <span>[Z] Zen</span>
        </div>

        {/* Right: Sound & Chime test trigger: Visible on Mobile & Desktop */}
        <div className="flex items-center gap-2">
          <button
            onClick={triggerChimeAndSparkle}
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-semibold backdrop-blur-md border shadow-lg transition-all touch-manipulation ${
              currentTheme.isDark
                ? 'bg-white/15 border-white/25 text-white hover:bg-white/25 hover:scale-105 active:scale-95 shadow-black/40'
                : 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-105 active:scale-95 shadow-slate-400/40'
            }`}
          >
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
            <span>Ring Chime</span>
          </button>
        </div>
      </footer>

      {/* Floating Zen Mode Restore Button (Appears when in Zen mode on hover or top right) */}
      {isZenMode && (
        <button
          onClick={() => setIsZenMode(false)}
          title="Exit Zen Mode (Show Controls)"
          className={`fixed top-4 right-4 z-40 p-3 rounded-full backdrop-blur-xl border shadow-xl transition-all ${
            controlsVisible ? 'opacity-100 scale-100' : 'opacity-20 hover:opacity-100 scale-90'
          } ${
            currentTheme.isDark
              ? 'bg-slate-900/80 border-white/20 text-white'
              : 'bg-white/80 border-slate-300 text-slate-800'
          }`}
        >
          <Eye className="w-4 h-4" />
        </button>
      )}

      {/* Interactive Feedback & Notes Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        theme={currentTheme}
        defaultRecipientName={customRecipient}
      />
    </main>
  );
}
