"use client";

import type { LucideIcon } from "lucide-react";
import { THEMES, type ThemeId } from "./headerConstants";

interface ThemeDropdownProps {
    theme: ThemeId;
    themeOpen: boolean;
    themePos: { top: number; right: number };
    onSelect: (themeId: ThemeId) => void;
}

export function ThemeDropdown({
    theme, themeOpen, themePos, onSelect,
}: ThemeDropdownProps) {
    if (!themeOpen) return null;

    return (
      <div className="dropdown-menu" style={{ top: themePos.top, right: themePos.right - 2 }}>
        {THEMES.map((th) => {
            const Icon = th.icon as LucideIcon;
            return (
              <button
                type="button"
                key={th.id}
                className={`dropdown-option ${th.id === theme ? "active" : ""}`}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    justifyContent: "flex-start",
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    color: "inherit",
                    cursor: "pointer",
                }}
                onClick={() => onSelect(th.id)}
              >
                <Icon size={14} />
                {th.label}
              </button>
            );
        })}
      </div>
    );
}

export function ThemeIcon({ theme, size = 14 }: { theme: ThemeId; size?: number }) {
    const entry = THEMES.find((t) => t.id === theme);
    if (!entry) return null;
    const Icon = entry.icon as LucideIcon;
    return <Icon size={size} />;
}
