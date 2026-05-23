import {
    ShieldCheck, ShieldAlert, Shield,
} from "lucide-react";

export interface PluginRecord {
    pluginId: string;
    version: string;
    config: string;
    installedAt: string;
    enabled?: boolean;
}

export function TrustBadge({ trust }: { trust: string }) {
    if (trust === "built-in") {
        return (
          <span className="trust-badge trust-badge--builtin">
            <Shield size={9} />
            {' '}
            Built-in
          </span>
        );
    }
    if (trust === "verified") {
        return (
          <span className="trust-badge trust-badge--verified">
            <ShieldCheck size={9} />
            {' '}
            Verified
          </span>
        );
    }
    return (
      <span className="trust-badge trust-badge--unverified">
        <ShieldAlert size={9} />
        {' '}
        Unverified
      </span>
    );
}

export function getTrust(record: PluginRecord): string {
    if (record.version === "built-in") return "built-in";
    try {
        return JSON.parse(record.config).trust ?? "unverified";
    } catch {
        return "unverified";
    }
}

export function getIcon(record: PluginRecord, managedIcon?: string): string {
    if (managedIcon) return managedIcon;
    try {
        return JSON.parse(record.config).icon ?? "📦";
    } catch {
        return "📦";
    }
}

export function getName(record: PluginRecord, managedName?: string): string {
    if (managedName) return managedName;
    try {
        return JSON.parse(record.config).name ?? record.pluginId;
    } catch {
        return record.pluginId;
    }
}
