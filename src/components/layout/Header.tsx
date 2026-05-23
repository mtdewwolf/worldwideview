"use client";

/**
 * @file Header.tsx
 * @description Primary application header providing branding, search, region presets,
 * theme selection, and system-wide controls.
 */

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/core/state/store";
import { dataBus } from "@/core/data/DataBus";
import { pluginManager } from "@/core/plugins/PluginManager";
import { Key } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { isDemo, DEMO_ADMIN_ROLE } from "@/core/edition";
import Image from "next/image";
import { useIsMobile } from "@/core/hooks/useIsMobile";
import { SearchBar } from "./SearchBar";
import { ApiKeysModal } from "./ApiKeysModal";
import { ThemeDropdown, ThemeIcon } from "./ThemeDropdown";
import { REGIONS, TIME_WINDOWS, type ThemeId } from "./headerConstants";
import "./timeSelect.css";

export function Header() {
    const isMobile = useIsMobile();
    const timeWindow = useStore((s) => s.timeWindow);
    const setTimeWindow = useStore((s) => s.setTimeWindow);
    const theme = useStore((s) => s.theme);
    const setTheme = useStore((s) => s.setTheme);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isDemoAdmin, setIsDemoAdmin] = useState(false);
    const [showApiKeys, setShowApiKeys] = useState(false);
    const [timeOpen, setTimeOpen] = useState(false);
    const timeButtonRef = useRef<HTMLButtonElement>(null);
    const [timePos, setTimePos] = useState({ top: 0, right: 0 });
    const [themeOpen, setThemeOpen] = useState(false);
    const themeButtonRef = useRef<HTMLButtonElement>(null);
    const [themePos, setThemePos] = useState({ top: 0, right: 0 });

    useEffect(() => {
        if (!isDemo) return;
        fetch("/api/auth/session")
            .then((r) => r.json())
            .then((s) => setIsDemoAdmin(s?.user?.role === DEMO_ADMIN_ROLE))
            .catch(() => {});
    }, []);

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const handleWheel = (e: WheelEvent) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                el.scrollLeft += e.deltaY;
            }
        };
        el.addEventListener("wheel", handleWheel, { passive: false });
        return () => el.removeEventListener("wheel", handleWheel);
    }, []);

    const toggleThemeDropdown = () => {
        if (!themeOpen && themeButtonRef.current) {
            const rect = themeButtonRef.current.getBoundingClientRect();
            setThemePos({ top: rect.bottom + 8, right: window.innerWidth - (rect.right + 2) });
        }
        setThemeOpen((v) => !v);
    };

    const toggleTimeDropdown = () => {
        if (!timeOpen && timeButtonRef.current) {
            const rect = timeButtonRef.current.getBoundingClientRect();
            setTimePos({ top: rect.bottom + 8, right: window.innerWidth - (rect.right + 2) });
        }
        setTimeOpen((v) => !v);
    };

    const adminBadge = isDemoAdmin ? (
      <span className="alpha-badge" style={{ background: "var(--accent-orange, #f59e0b)" }}>ADMIN</span>
    ) : null;

    if (isMobile) {
        return (
          <>
            <header className="header header--mobile glass-panel">
              <div className="header__brand">
                <a
                  href="https://worldwideview.dev/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "inherit" }}
                >
                  <Image src="/logo/logo-icon.svg" alt="Logo" width={20} height={20} style={{ objectFit: "contain" }} />
                  <div className="header__logo header__logo--compact">WWV</div>
                </a>
                <span className="alpha-badge">ALPHA</span>
                {adminBadge}
              </div>
              <div className="header__search-center"><SearchBar /></div>
              <div className="header__actions" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <button
                    ref={themeButtonRef}
                    className="btn btn--glow"
                    type="button"
                    onClick={toggleThemeDropdown}
                    title="Theme Selection"
                    style={{ display: "flex", alignItems: "center", padding: "6px", background: "transparent", border: "none", color: "var(--text-secondary)", gap: "4px" }}
                  >
                    <ThemeIcon theme={theme as ThemeId} size={16} />
                    <svg width="10" height="10" viewBox="0 0 10 10" style={{ transform: themeOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease", opacity: 0.6 }}>
                      <path d="M1 3 L5 7 L9 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
                <div className="status-badge"><span className="status-badge__dot" />LIVE</div>
              </div>
            </header>
            <ThemeDropdown
              theme={theme as ThemeId}
              themeOpen={themeOpen}
              themePos={themePos}
              onSelect={(id) => { setTheme(id); setThemeOpen(false); }}
            />
          </>
        );
    }

    return (
      <>
        <header className="header glass-panel">
          <div className="header__brand">
            <a href="https://worldwideview.dev/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Image src="/logo/logo-icon.svg" alt="Logo" width={22} height={22} style={{ objectFit: "contain" }} />
                <div className="header__logo">WORLD WIDE VIEW</div>
                <span className="alpha-badge">ALPHA</span>
                {adminBadge}
              </div>
              <div className="header__subtitle">Geospatial Intelligence</div>
            </a>
            <div style={{ marginLeft: "var(--space-xl)" }}><SearchBar /></div>
          </div>
          <div className="header__controls">
            <div className="header__controls-scroll" ref={scrollContainerRef}>
              {REGIONS.map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    type="button"
                    key={r.id}
                    className="btn btn--glow"
                    onClick={() => {
                        dataBus.emit("cameraPreset", { presetId: r.id });
                        trackEvent("region-select", { region: r.id });
                    }}
                    title={r.label}
                    style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}
                  >
                    <Icon size={14} />
                    {r.label}
                  </button>
                );
              })}
              <div style={{ width: 1, height: 20, background: "var(--border-subtle)", flexShrink: 0 }} />
              <button type="button" className="btn btn--glow" onClick={() => setShowApiKeys(true)} title="API Keys" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Key size={14} />
              </button>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <button type="button" ref={themeButtonRef} className="btn btn--glow" onClick={toggleThemeDropdown} title="Theme Selection" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <ThemeIcon theme={theme as ThemeId} />
                  <svg width="10" height="10" viewBox="0 0 10 10" style={{ transform: themeOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease", opacity: 0.6 }}>
                    <path d="M1 3 L5 7 L9 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <div style={{ width: 1, height: 20, background: "var(--border-subtle)", flexShrink: 0 }} />
              <div style={{ position: "relative", flexShrink: 0 }}>
                <button ref={timeButtonRef} className="btn btn--glow" type="button" onClick={toggleTimeDropdown} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {timeWindow}
                  <svg width="10" height="10" viewBox="0 0 10 10" style={{ transform: timeOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease", opacity: 0.6 }}>
                    <path d="M1 3 L5 7 L9 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
            <div style={{ width: 1, height: 20, background: "var(--border-subtle)", flexShrink: 0 }} />
            <div className="header__actions">
              <div className="status-badge"><span className="status-badge__dot" />LIVE</div>
            </div>
          </div>
        </header>
        {timeOpen && (
          <div className="dropdown-menu" style={{ top: timePos.top, right: timePos.right - 2 }}>
            {TIME_WINDOWS.map((tw) => (
              <button
                type="button"
                key={tw}
                className={`dropdown-option ${tw === timeWindow ? "active" : ""}`}
                style={{ width: "100%", border: "none", background: "transparent", color: "inherit", cursor: "pointer" }}
                onClick={() => {
                  setTimeWindow(tw);
                  pluginManager.updateTimeRange(useStore.getState().timeRange);
                  trackEvent("time-window-change", { window: tw });
                  setTimeOpen(false);
                }}
              >
                {tw}
              </button>
            ))}
          </div>
        )}
        <ThemeDropdown
          theme={theme as ThemeId}
          themeOpen={themeOpen}
          themePos={themePos}
          onSelect={(id) => { setTheme(id); setThemeOpen(false); }}
        />
        {showApiKeys && <ApiKeysModal onClose={() => setShowApiKeys(false)} />}
      </>
    );
}
