import {
 describe, it, expect, vi, beforeEach,
} from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/agent/bus", () => ({
    agentBus: {
        publish: vi.fn(() => ({ delivered: 1 })),
        subscribersFor: vi.fn(() => 1),
    },
}));

import { auth } from "@/lib/auth";
import { agentBus } from "@/lib/agent/bus";

describe("POST /api/agent/publish", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns 401 when unauthenticated", async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(auth).mockResolvedValue(null as any);
        const req = new NextRequest("http://localhost/api/agent/publish", {
            method: "POST",
            body: JSON.stringify({ action: "ping", ts: 1 }),
        });
        const res = await POST(req);
        expect(res.status).toBe(401);
    });

    it("returns 400 for invalid JSON body", async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as any);
        const req = new NextRequest("http://localhost/api/agent/publish", {
            method: "POST",
            body: "not-json",
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it("returns 400 for unrecognized action", async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as any);
        const req = new NextRequest("http://localhost/api/agent/publish", {
            method: "POST",
            body: JSON.stringify({ action: "unknown_action" }),
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it("publishes valid ping action and returns delivery count", async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as any);
        const req = new NextRequest("http://localhost/api/agent/publish", {
            method: "POST",
            body: JSON.stringify({ action: "ping", ts: Date.now() }),
        });
        const res = await POST(req);
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ ok: true, delivered: 1, subscribers: 1 });
        expect(agentBus.publish).toHaveBeenCalledWith("user-1", expect.objectContaining({ action: "ping" }));
    });
});
