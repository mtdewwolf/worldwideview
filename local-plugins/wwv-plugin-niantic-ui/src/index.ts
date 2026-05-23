import type { WorldPlugin, PluginContext } from "@worldwideview/wwv-plugin-sdk";

const PLUGIN_ID = "niantic-ui";

function getReact() {
    return (globalThis as { __WWV_HOST__?: { React?: typeof import("react") } }).__WWV_HOST__?.React;
}

type UseStoreFn = <T>(selector: (state: {
    layers: Record<string, { enabled?: boolean }>;
    toggleLayer: (id: string) => void;
}) => T) => T;

function getUseStore(): UseStoreFn | undefined {
    return (globalThis as { __WWV_HOST__?: { useStore?: UseStoreFn } }).__WWV_HOST__?.useStore;
}

export default class NianticUiPlugin implements WorldPlugin {
    id = PLUGIN_ID;
    name = "Niantic Spatial";
    description = "Sidebar controls for Niantic VPS layers";
    category = "utility" as const;
    version = "1.0.0";

    async initialize(_context: PluginContext): Promise<void> {}

    destroy(): void {}

    getSidebarComponent() {
        const React = getReact();
        const useStore = getUseStore();
        if (!React || !useStore) return null;

        return function NianticSidebar() {
            const [enabled, setEnabled] = React.useState<boolean | null>(null);
            const layers = useStore((s) => s.layers);
            const toggleLayer = useStore((s) => s.toggleLayer);

            React.useEffect(() => {
                fetch("/api/niantic/status")
                    .then((r) => r.json())
                    .then((d: { enabled?: boolean }) => setEnabled(!!d.enabled))
                    .catch(() => setEnabled(false));
            }, []);

            if (enabled === false) {
                return React.createElement(
                    "div",
                    { className: "niantic-ui-panel", "data-testid": "niantic-ui-panel" },
                    React.createElement("p", null, "Niantic Spatial is not configured on this server."),
                );
            }

            const vpsOn = layers["niantic-vps"]?.enabled ?? false;
            const meshOn = layers["niantic-mesh"]?.enabled ?? false;

            return React.createElement(
                "div",
                { className: "niantic-ui-panel", "data-testid": "niantic-ui-panel" },
                React.createElement("h3", null, "Niantic Spatial"),
                React.createElement(
                    "label",
                    null,
                    React.createElement("input", {
                        type: "checkbox",
                        checked: vpsOn,
                        onChange: () => toggleLayer("niantic-vps"),
                    }),
                    " VPS Sites",
                ),
                React.createElement(
                    "label",
                    null,
                    React.createElement("input", {
                        type: "checkbox",
                        checked: meshOn,
                        onChange: () => toggleLayer("niantic-mesh"),
                    }),
                    " Site meshes",
                ),
                React.createElement(
                    "p",
                    { className: "niantic-ui-hint" },
                    "Select a site on the globe, then use Open in AR in the detail panel.",
                ),
            );
        };
    }
}
