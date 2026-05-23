import {
 describe, it, expect, vi, beforeEach,
} from "vitest";
import { render, waitFor } from "@testing-library/react";
import { AppShell } from "../AppShell";

const initMock = vi.fn().mockResolvedValue(undefined);
const marketplaceSyncMock = vi.fn();

vi.mock("@/core/plugins/PluginManager", () => ({
    pluginManager: {
        init: (...args: unknown[]) => initMock(...args),
        destroy: vi.fn(),
    },
}));

vi.mock("@/core/plugins/PluginRegistry", () => ({
    pluginRegistry: {
        getAll: vi.fn(() => []),
    },
}));

vi.mock("@/core/plugins/hostGlobals", () => ({
    injectHostGlobals: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/core/hooks/useMarketplaceSync", () => ({
    useMarketplaceSync: (...args: unknown[]) => marketplaceSyncMock(...args),
}));

vi.mock("@/core/hooks/useBootSequence", () => ({
    useBootSequence: () => ({
        phase: "ready",
        startBoot: vi.fn(),
        cleanup: vi.fn(),
        headerReady: true,
        sidebarReady: true,
        timelineReady: true,
        controlsReady: true,
    }),
}));

vi.mock("@/core/hooks/useIsMobile", () => ({
    useIsMobile: () => false,
}));

vi.mock("@/core/state/store", () => ({
    useStore: (selector: (s: Record<string, unknown>) => unknown) => selector({
        setTheme: vi.fn(),
        activeBottomPanel: null,
    }),
}));

vi.mock("@/core/data/DataBus", () => ({
    dataBus: { on: vi.fn(() => vi.fn()) },
}));

vi.mock("@/core/globe/TimelineSync", () => ({ TimelineSync: () => null }));
vi.mock("@/components/layout/DataBusSubscriber", () => ({ DataBusSubscriber: () => null }));
vi.mock("@/components/layout/AgentBusSubscriber", () => ({ AgentBusSubscriber: () => null }));
vi.mock("@/components/layout/Header", () => ({ Header: () => null }));
vi.mock("@/components/panels/LayerPanel", () => ({ LayerPanel: () => null }));
vi.mock("@/components/panels/DataConfig", () => ({ DataConfigPanel: () => null }));
vi.mock("@/components/panels/CameraStatsPanel", () => ({ default: () => null }));
vi.mock("@/components/panels/EntityInfoCard", () => ({ EntityInfoCard: () => null }));
vi.mock("@/components/layout/BottomPanelManager", () => ({ BottomPanelManager: () => null }));
vi.mock("@/components/video/FloatingVideoManager", () => ({ FloatingVideoManager: () => null }));
vi.mock("@/components/common/BootOverlay", () => ({ BootOverlay: () => null }));
vi.mock("@/components/layout/PanelToggleArrows", () => ({ PanelToggleArrows: () => null }));
vi.mock("@/components/ui/ReloadToast", () => ({ default: () => null }));
vi.mock("@/components/ui/ErrorToast", () => ({ default: () => null }));
vi.mock("@/components/marketplace/UnverifiedPluginBatchDialog", () => ({ default: () => null }));
vi.mock("@/components/common/FeedbackDialog", () => ({ FeedbackDialog: () => null }));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("@/lib/logCatcher", () => ({ initLogCatcher: vi.fn() }));
vi.mock("@/core/edition", () => ({ isDemo: false }));

vi.mock("next/dynamic", () => ({
    default: () => () => null,
}));

describe("AppShell boot", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        marketplaceSyncMock.mockReturnValue({
            needsReload: false,
            pendingUnverified: [],
            approveSelected: vi.fn(),
            denyAll: vi.fn(),
        });
    });

    it("initializes pluginManager without pluginRegistry iteration", async () => {
        const { pluginRegistry } = await import("@/core/plugins/PluginRegistry");

        render(<AppShell />);

        await waitFor(() => {
            expect(initMock).toHaveBeenCalled();
        });
        expect(pluginRegistry.getAll).not.toHaveBeenCalled();
    });

    it("reaches app-ready when boot phase is ready", async () => {
        const { getByTestId } = render(<AppShell />);
        await waitFor(() => {
            expect(getByTestId("app-ready")).toBeTruthy();
        });
    });
});
