import {
 describe, it, expect, vi, beforeEach,
} from "vitest";
import { GET } from "./route";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/agent/bus", () => ({
    agentBus: {
        subscribe: vi.fn(() => vi.fn()),
    },
}));

import { auth } from "@/lib/auth";

describe("GET /api/agent/stream", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns 401 when unauthenticated", async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(auth).mockResolvedValue(null as any);
        const res = await GET();
        expect(res.status).toBe(401);
    });

    it("returns SSE response with correct headers when authenticated", async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as any);
        const res = await GET();
        expect(res.status).toBe(200);
        expect(res.headers.get("Content-Type")).toBe("text/event-stream");
        expect(res.headers.get("Cache-Control")).toBe("no-cache, no-transform");
    });
});
