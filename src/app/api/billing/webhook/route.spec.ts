import {
 describe, it, expect, vi, beforeEach,
} from "vitest";
import { POST } from "./route";

vi.mock("@/lib/stripe/client", () => ({
    stripe: {
        webhooks: {
            constructEvent: vi.fn(),
        },
    },
}));

import { stripe } from "@/lib/stripe/client";

describe("POST /api/billing/webhook", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    });

    it("returns 400 when stripe signature verification fails", async () => {
        vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
            throw new Error("Invalid signature");
        });

        const req = new Request("http://localhost/api/billing/webhook", {
            method: "POST",
            body: "{}",
            headers: { "stripe-signature": "bad-sig" },
        });

        const res = await POST(req);
        expect(res.status).toBe(400);
        expect(await res.text()).toContain("Webhook Error");
    });

    it("returns 200 on valid checkout.session.completed event", async () => {
        vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
            type: "checkout.session.completed",
            data: { object: {} },
        } as ReturnType<typeof stripe.webhooks.constructEvent>);

        const req = new Request("http://localhost/api/billing/webhook", {
            method: "POST",
            body: "{}",
            headers: { "stripe-signature": "valid-sig" },
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
    });
});
