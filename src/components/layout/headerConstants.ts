import {
 Globe, Sun, Moon, Monitor,
} from "lucide-react";

export const REGIONS = [
    { id: "global", label: "Global", icon: Globe },
    { id: "americas", label: "Americas", icon: Globe },
    { id: "europe", label: "Europe", icon: Globe },
    { id: "mena", label: "MENA", icon: Globe },
    { id: "asiaPacific", label: "Asia", icon: Globe },
    { id: "africa", label: "Africa", icon: Globe },
    { id: "oceania", label: "Oceania", icon: Globe },
    { id: "arctic", label: "Arctic", icon: Globe },
];

export const THEMES = [
    { id: "dark", label: "Dark", icon: Moon },
    { id: "black", label: "Black", icon: Moon },
    { id: "light", label: "Light", icon: Sun },
    { id: "legacy", label: "Legacy", icon: Monitor },
] as const;

export const TIME_WINDOWS = ["1h", "6h", "24h", "48h", "7d"] as const;

export type ThemeId = typeof THEMES[number]["id"];
