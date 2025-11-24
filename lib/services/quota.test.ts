import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  consumeReportCredit,
  getRemainingCredits,
  writeReportAudit,
} from "@/lib/services/quota";

// Mock server utilities
vi.mock("@/lib/supabase/server", () => ({
  createServiceRoleClient: vi.fn(() => ({
    rpc: vi.fn(),
    from: vi.fn(),
  })),
}));

import { createServiceRoleClient } from "@/lib/supabase/server";

describe("lib/services/quota", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("consumeReportCredit", () => {
    it("should return test mode success without deducting", async () => {
      const result = await consumeReportCredit("user-123", true);

      expect(result.success).toBe(true);
      expect(result.mode).toBe("test");
      expect(result.remainingCredits).toBe(999);
    });

    it("should call RPC in production mode", async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: { remaining_credits: 5 },
        error: null,
      });

      vi.mocked(createServiceRoleClient).mockReturnValue({
        rpc: mockRpc,
      } as unknown as ReturnType<typeof createServiceRoleClient>);

      const result = await consumeReportCredit("user-123", false);

      expect(mockRpc).toHaveBeenCalledWith("fn_consume_report_credit", {
        p_user_id: "user-123",
      });
      expect(result.success).toBe(true);
      expect(result.remainingCredits).toBe(5);
      expect(result.mode).toBe("production");
    });

    it("should handle RPC error gracefully", async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Insufficient credits" },
      });

      vi.mocked(createServiceRoleClient).mockReturnValue({
        rpc: mockRpc,
      } as unknown as ReturnType<typeof createServiceRoleClient>);

      const result = await consumeReportCredit("user-123", false);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Insufficient credits");
      expect(result.mode).toBe("production");
    });

    it("should handle service exceptions", async () => {
      vi.mocked(createServiceRoleClient).mockImplementation(() => {
        throw new Error("Service unavailable");
      });

      const result = await consumeReportCredit("user-123", false);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Service unavailable");
    });
  });

  describe("getRemainingCredits", () => {
    it("should return remaining credits", async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() =>
            Promise.resolve({
              data: { remaining_credits: 10 },
              error: null,
            })
          ),
        })),
      }));

      vi.mocked(createServiceRoleClient).mockReturnValue({
        from: mockFrom,
      } as unknown as ReturnType<typeof createServiceRoleClient>);

      const remaining = await getRemainingCredits("user-123");

      expect(remaining).toBe(10);
    });

    it("should return 0 on query error", async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() =>
            Promise.resolve({
              data: null,
              error: { message: "Not found" },
            })
          ),
        })),
      }));

      vi.mocked(createServiceRoleClient).mockReturnValue({
        from: mockFrom,
      } as unknown as ReturnType<typeof createServiceRoleClient>);

      const remaining = await getRemainingCredits("user-123");

      expect(remaining).toBe(0);
    });

    it("should return 0 on exception", async () => {
      vi.mocked(createServiceRoleClient).mockImplementation(() => {
        throw new Error("Service error");
      });

      const remaining = await getRemainingCredits("user-123");

      expect(remaining).toBe(0);
    });
  });

  describe("writeReportAudit", () => {
    it("should insert audit log", async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      const mockFrom = vi.fn(() => ({
        insert: mockInsert,
      }));

      vi.mocked(createServiceRoleClient).mockReturnValue({
        from: mockFrom,
      } as unknown as ReturnType<typeof createServiceRoleClient>);

      await writeReportAudit("user-123", "AAPL", "production", "success");

      expect(mockFrom).toHaveBeenCalledWith("report_credit_events");
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-123",
          event_type: "report_generated",
        })
      );
    });

    it("should not throw on insertion error", async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        error: { message: "Insert failed" },
      });
      const mockFrom = vi.fn(() => ({
        insert: mockInsert,
      }));

      vi.mocked(createServiceRoleClient).mockReturnValue({
        from: mockFrom,
      } as unknown as ReturnType<typeof createServiceRoleClient>);

      // Should not throw
      await expect(
        writeReportAudit("user-123", "AAPL", "test", "success")
      ).resolves.toBeUndefined();
    });
  });
});
